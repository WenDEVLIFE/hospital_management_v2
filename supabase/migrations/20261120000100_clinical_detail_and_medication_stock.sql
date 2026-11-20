-- Historical and newly recorded observations start unverified. Existing vitals
-- writers can continue to omit this field.
alter table public.vital_signs
  add column verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified'));

-- A user recording an observation cannot also assert that it was verified.
alter policy vital_signs_insert_authorized on public.vital_signs
with check (
  public.has_permission('vital_signs.record')
  and public.can_access_patient(patient_id)
  and recorded_by = auth.uid()
  and verification_status = 'unverified'
);

-- Link the medication catalogue to inventory by stable IDs. Stock balances
-- stay in inventory_batches, where dispensing and inventory adjustments
-- already serialize changes and write the stock transaction ledger.
create table public.medication_stock (
  medication_id uuid primary key references public.medications(id) on delete cascade,
  inventory_item_id uuid not null unique references public.inventory_items(id) on delete restrict
);

insert into public.medication_stock (medication_id, inventory_item_id)
select medication.id, item.id
from public.medications as medication
join public.inventory_items as item on item.item_code = medication.medication_code;

alter table public.medication_stock enable row level security;
revoke all on public.medication_stock from anon, authenticated;
grant select on public.medication_stock to authenticated;
grant select, insert, update, delete on public.medication_stock to service_role;

create policy medication_stock_select on public.medication_stock
for select to authenticated
using (public.has_permission('pharmacy.view'));

create view public.medication_stock_balances
with (security_invoker = true) as
select
  medication.id,
  medication.medication_code,
  medication.generic_name,
  medication.brand_name,
  medication.strength,
  medication.dosage_form,
  medication.unit,
  coalesce(sum(batch.quantity_remaining), 0) as quantity_on_hand,
  item.reorder_level,
  min(batch.expiration_date) filter (where batch.quantity_remaining > 0) as nearest_expiration
from public.medication_stock as stock
join public.medications as medication on medication.id = stock.medication_id
join public.inventory_items as item on item.id = stock.inventory_item_id
left join public.inventory_batches as batch on batch.item_id = item.id
where medication.is_active and item.is_active
group by medication.id, item.id;

revoke all on public.medication_stock_balances from anon, authenticated;
grant select on public.medication_stock_balances to authenticated, service_role;

create or replace function public.dispense_prescription(
  p_prescription_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status public.prescription_status;
  v_item record;
  v_batch record;
  v_dispensed numeric;
  v_remaining numeric;
  v_needed numeric;
  v_take numeric;
  v_medication_code text;
  v_inventory_item_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('prescription.dispense') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status
  into v_status
  from public.prescriptions
  where id = p_prescription_id
  for update;

  if not found then
    raise exception 'Prescription not found' using errcode = '22023';
  end if;

  if v_status = 'dispensed' then
    raise exception 'Prescription is already dispensed'
      using errcode = '22023';
  end if;

  if v_status = 'cancelled' then
    raise exception 'Prescription is cancelled' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.prescription_items
    where prescription_id = p_prescription_id
  ) then
    raise exception 'Prescription has no items' using errcode = '22023';
  end if;

  for v_item in
    select id, medication_id, quantity
    from public.prescription_items
    where prescription_id = p_prescription_id
    order by created_at
  loop
    select coalesce(sum(quantity_dispensed), 0)
    into v_dispensed
    from public.medication_dispenses
    where prescription_item_id = v_item.id;

    v_remaining := v_item.quantity - v_dispensed;

    if v_remaining <= 0 then
      continue;
    end if;

    select medication_code
    into v_medication_code
    from public.medications
    where id = v_item.medication_id;

    if v_medication_code is null then
      raise exception 'Medication not found' using errcode = '22023';
    end if;

    select item.id
    into v_inventory_item_id
    from public.medication_stock as stock
    join public.inventory_items as item on item.id = stock.inventory_item_id
    where stock.medication_id = v_item.medication_id
      and item.is_active;

    if v_inventory_item_id is null then
      raise exception 'Medication stock is not configured for %',
        v_medication_code using errcode = '22023';
    end if;

    v_needed := v_remaining;

    for v_batch in
      select id, quantity_remaining
      from public.inventory_batches
      where item_id = v_inventory_item_id
        and quantity_remaining > 0
      order by expiration_date nulls last, received_at
      for update
    loop
      exit when v_needed <= 0;

      v_take := least(v_batch.quantity_remaining, v_needed);

      update public.inventory_batches
      set quantity_remaining = quantity_remaining - v_take
      where id = v_batch.id;

      insert into public.stock_transactions (
        item_id,
        batch_id,
        transaction_type,
        quantity,
        reference_type,
        reference_id,
        reason,
        performed_by
      )
      values (
        v_inventory_item_id,
        v_batch.id,
        'dispensing',
        v_take,
        'prescription',
        p_prescription_id,
        'Prescription dispensing',
        v_actor
      );

      v_needed := v_needed - v_take;
    end loop;

    if v_needed > 0 then
      raise exception 'Insufficient stock for medication %',
        v_medication_code using errcode = '22023';
    end if;

    insert into public.medication_dispenses (
      prescription_item_id,
      quantity_dispensed,
      dispensed_by,
      notes
    )
    values (
      v_item.id,
      v_remaining,
      v_actor,
      'Dispensed via dispense_prescription'
    );
  end loop;

  update public.prescriptions
  set status = 'dispensed',
      updated_by = v_actor
  where id = p_prescription_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'prescription.dispense',
    'prescription',
    p_prescription_id,
    'Dispensed a prescription.',
    '{"source":"dispense_prescription"}'::jsonb
  );

  return p_prescription_id;
end;
$$;

revoke all on function public.dispense_prescription(uuid) from public;

grant execute on function public.dispense_prescription(uuid)
  to authenticated, service_role;

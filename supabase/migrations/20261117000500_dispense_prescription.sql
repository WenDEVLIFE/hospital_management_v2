-- ============================================================================
-- SPMC HMS — dispense prescription
-- Migration 028. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Dispenses every remaining prescription item, deducts medication stock from
-- inventory batches FIFO, records stock transactions, and audits atomically.

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
  v_patient_id uuid;
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

  select status, patient_id
  into v_status, v_patient_id
  from public.prescriptions
  where id = p_prescription_id
  for update;

  if not found then
    raise exception 'Prescription not found' using errcode = '22023';
  end if;

  if not public.can_access_patient(v_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
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

    select id
    into v_inventory_item_id
    from public.inventory_items
    where item_code = v_medication_code;

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

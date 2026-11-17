-- ============================================================================
-- SPMC HMS — invoice, patient record, and nursing writes
-- Migration 033. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Create an invoice with itemized charges
-- ----------------------------------------------------------------------------
create or replace function public.create_invoice(
  p_patient_id uuid,
  p_items jsonb,
  p_discount_amount numeric default 0,
  p_encounter_id uuid default null,
  p_admission_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_item jsonb;
  v_description text;
  v_quantity numeric;
  v_unit_price numeric;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2);
  v_total numeric(12,2);
  v_invoice_id uuid;
  v_invoice_number text;
  v_count integer := 0;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('billing.invoice.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one charge line' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_description := btrim(coalesce(v_item->>'description', ''));
    v_quantity := coalesce((v_item->>'quantity')::numeric, 0);
    v_unit_price := coalesce((v_item->>'unit_price')::numeric, -1);

    if v_description = '' then
      raise exception 'Every charge line needs a description'
        using errcode = '22023';
    end if;

    if v_quantity <= 0 then
      raise exception 'Charge quantities must be greater than zero'
        using errcode = '22023';
    end if;

    if v_unit_price < 0 then
      raise exception 'Unit prices cannot be negative' using errcode = '22023';
    end if;

    v_subtotal := v_subtotal + round(v_quantity * v_unit_price, 2);
    v_count := v_count + 1;
  end loop;

  v_discount := round(coalesce(p_discount_amount, 0), 2);

  if v_discount < 0 then
    raise exception 'Discount cannot be negative' using errcode = '22023';
  end if;

  if v_discount > v_subtotal then
    raise exception 'Discount cannot exceed the subtotal' using errcode = '22023';
  end if;

  v_total := v_subtotal - v_discount;
  v_invoice_number := public.generate_reference_number('INV');

  insert into public.invoices (
    invoice_number,
    patient_id,
    admission_id,
    encounter_id,
    subtotal,
    discount_amount,
    total_amount,
    amount_paid,
    balance,
    status,
    created_by
  )
  values (
    v_invoice_number,
    p_patient_id,
    p_admission_id,
    p_encounter_id,
    v_subtotal,
    v_discount,
    v_total,
    0,
    v_total,
    'unpaid'::public.invoice_status,
    v_actor
  )
  returning id into v_invoice_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_description := btrim(coalesce(v_item->>'description', ''));
    v_quantity := (v_item->>'quantity')::numeric;
    v_unit_price := round((v_item->>'unit_price')::numeric, 2);

    insert into public.invoice_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      line_total
    )
    values (
      v_invoice_id,
      v_description,
      v_quantity,
      v_unit_price,
      round(v_quantity * v_unit_price, 2)
    );
  end loop;

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
    'billing.invoice.create',
    'invoice',
    v_invoice_id,
    'Created a patient invoice.',
    jsonb_build_object(
      'source', 'create_invoice',
      'invoice_number', v_invoice_number,
      'line_count', v_count,
      'subtotal', v_subtotal,
      'discount', v_discount,
      'total', v_total
    )
  );

  return v_invoice_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Update a patient record (including registration status)
-- ----------------------------------------------------------------------------
create or replace function public.update_patient(
  p_patient_id uuid,
  p_patch jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_patient public.patients%rowtype;
  v_status text;
  v_first_name text;
  v_last_name text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('patient.update') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select *
  into v_patient
  from public.patients
  where id = p_patient_id
  for update;

  if not found then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  v_status := nullif(btrim(coalesce(p_patch->>'registration_status', '')), '');

  if v_status is not null then
    if v_status not in ('active', 'inactive', 'archived') then
      raise exception 'Unsupported registration status'
        using errcode = '22023';
    end if;

    if v_status = 'archived'
      and not public.has_permission('patient.archive') then
      raise exception 'Insufficient permission' using errcode = '42501';
    end if;
  end if;

  v_first_name := case
    when p_patch ? 'first_name'
      then nullif(btrim(p_patch->>'first_name'), '')
    else v_patient.first_name
  end;

  v_last_name := case
    when p_patch ? 'last_name'
      then nullif(btrim(p_patch->>'last_name'), '')
    else v_patient.last_name
  end;

  if v_first_name is null or v_last_name is null then
    raise exception 'First name and last name are required'
      using errcode = '22023';
  end if;

  update public.patients
  set
    first_name = v_first_name,
    last_name = v_last_name,
    middle_name = case
      when p_patch ? 'middle_name'
        then nullif(btrim(p_patch->>'middle_name'), '')
      else middle_name
    end,
    suffix = case
      when p_patch ? 'suffix'
        then nullif(btrim(p_patch->>'suffix'), '')
      else suffix
    end,
    date_of_birth = case
      when p_patch ? 'date_of_birth'
        then nullif(btrim(p_patch->>'date_of_birth'), '')::date
      else date_of_birth
    end,
    sex = case
      when p_patch ? 'sex'
        then nullif(btrim(p_patch->>'sex'), '')
      else sex
    end,
    civil_status = case
      when p_patch ? 'civil_status'
        then nullif(btrim(p_patch->>'civil_status'), '')
      else civil_status
    end,
    nationality = case
      when p_patch ? 'nationality'
        then nullif(btrim(p_patch->>'nationality'), '')
      else nationality
    end,
    contact_number = case
      when p_patch ? 'contact_number'
        then nullif(btrim(p_patch->>'contact_number'), '')
      else contact_number
    end,
    email = case
      when p_patch ? 'email'
        then nullif(btrim(p_patch->>'email'), '')
      else email
    end,
    address_line = case
      when p_patch ? 'address_line'
        then nullif(btrim(p_patch->>'address_line'), '')
      else address_line
    end,
    barangay = case
      when p_patch ? 'barangay'
        then nullif(btrim(p_patch->>'barangay'), '')
      else barangay
    end,
    city = case
      when p_patch ? 'city'
        then nullif(btrim(p_patch->>'city'), '')
      else city
    end,
    province = case
      when p_patch ? 'province'
        then nullif(btrim(p_patch->>'province'), '')
      else province
    end,
    postal_code = case
      when p_patch ? 'postal_code'
        then nullif(btrim(p_patch->>'postal_code'), '')
      else postal_code
    end,
    registration_status = coalesce(
      v_status::public.patient_registration_status,
      registration_status
    ),
    updated_by = v_actor
  where id = p_patient_id;

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
    case
      when v_status = 'archived' then 'patient.archive'
      else 'patient.update'
    end,
    'patient',
    p_patient_id,
    case
      when v_status = 'archived' then 'Archived a patient record.'
      else 'Updated a patient record.'
    end,
    jsonb_build_object(
      'source', 'update_patient',
      'fields', (
        select coalesce(jsonb_agg(key), '[]'::jsonb)
        from jsonb_object_keys(p_patch) as key
      )
    )
  );

  return p_patient_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Record a patient allergy
-- ----------------------------------------------------------------------------
create or replace function public.record_patient_allergy(
  p_patient_id uuid,
  p_allergen text,
  p_reaction text default null,
  p_severity text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_allergen text := btrim(coalesce(p_allergen, ''));
  v_severity text := nullif(btrim(coalesce(p_severity, '')), '');
  v_allergy_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('medical_record.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not public.can_access_patient(p_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_allergen = '' then
    raise exception 'An allergen is required' using errcode = '22023';
  end if;

  if v_severity is not null
    and v_severity not in ('mild', 'moderate', 'severe', 'life_threatening') then
    raise exception 'Unsupported allergy severity' using errcode = '22023';
  end if;

  insert into public.patient_allergies (
    patient_id,
    allergen,
    reaction,
    severity,
    notes,
    recorded_by
  )
  values (
    p_patient_id,
    v_allergen,
    nullif(btrim(coalesce(p_reaction, '')), ''),
    v_severity,
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_allergy_id;

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
    'medical_record.allergy.create',
    'patient_allergy',
    v_allergy_id,
    'Recorded a patient allergy.',
    jsonb_build_object('source', 'record_patient_allergy', 'patient_id', p_patient_id)
  );

  return v_allergy_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Record vital signs
-- ----------------------------------------------------------------------------
create or replace function public.record_vital_signs(
  p_patient_id uuid,
  p_encounter_id uuid,
  p_systolic_bp numeric default null,
  p_diastolic_bp numeric default null,
  p_heart_rate numeric default null,
  p_respiratory_rate numeric default null,
  p_temperature numeric default null,
  p_oxygen_saturation numeric default null,
  p_weight_kg numeric default null,
  p_height_cm numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_vitals_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('vital_signs.record') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not public.can_access_patient(p_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.encounters
    where id = p_encounter_id
      and patient_id = p_patient_id
  ) then
    raise exception 'Encounter not found for this patient'
      using errcode = '22023';
  end if;

  if coalesce(
    p_systolic_bp,
    p_diastolic_bp,
    p_heart_rate,
    p_respiratory_rate,
    p_temperature,
    p_oxygen_saturation,
    p_weight_kg,
    p_height_cm
  ) is null then
    raise exception 'Record at least one measurement' using errcode = '22023';
  end if;

  if p_systolic_bp is not null and p_systolic_bp <= 0
    or p_diastolic_bp is not null and p_diastolic_bp <= 0
    or p_heart_rate is not null and p_heart_rate <= 0
    or p_respiratory_rate is not null and p_respiratory_rate <= 0
    or p_temperature is not null and p_temperature <= 0
    or p_oxygen_saturation is not null and p_oxygen_saturation <= 0
    or p_weight_kg is not null and p_weight_kg <= 0
    or p_height_cm is not null and p_height_cm <= 0 then
    raise exception 'Measurements must be greater than zero'
      using errcode = '22023';
  end if;

  insert into public.vital_signs (
    patient_id,
    encounter_id,
    systolic_bp,
    diastolic_bp,
    heart_rate,
    respiratory_rate,
    temperature,
    oxygen_saturation,
    weight_kg,
    height_cm,
    recorded_by
  )
  values (
    p_patient_id,
    p_encounter_id,
    p_systolic_bp,
    p_diastolic_bp,
    p_heart_rate,
    p_respiratory_rate,
    p_temperature,
    p_oxygen_saturation,
    p_weight_kg,
    p_height_cm,
    v_actor
  )
  returning id into v_vitals_id;

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
    'vital_signs.record',
    'vital_sign',
    v_vitals_id,
    'Recorded patient vital signs.',
    jsonb_build_object('source', 'record_vital_signs', 'patient_id', p_patient_id)
  );

  return v_vitals_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Add a nursing note
-- ----------------------------------------------------------------------------
create or replace function public.add_nursing_note(
  p_patient_id uuid,
  p_encounter_id uuid,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_note text := btrim(coalesce(p_note, ''));
  v_note_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('nursing.notes.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not public.can_access_patient(p_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_note = '' then
    raise exception 'A nursing note is required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.encounters
    where id = p_encounter_id
      and patient_id = p_patient_id
  ) then
    raise exception 'Encounter not found for this patient'
      using errcode = '22023';
  end if;

  insert into public.nursing_notes (
    patient_id,
    encounter_id,
    note,
    recorded_by
  )
  values (
    p_patient_id,
    p_encounter_id,
    v_note,
    v_actor
  )
  returning id into v_note_id;

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
    'nursing.notes.create',
    'nursing_note',
    v_note_id,
    'Added a nursing note.',
    jsonb_build_object('source', 'add_nursing_note', 'patient_id', p_patient_id)
  );

  return v_note_id;
end;
$$;

revoke all on function public.create_invoice(uuid, jsonb, numeric, uuid, uuid)
  from public;
revoke all on function public.update_patient(uuid, jsonb) from public;
revoke all on function public.record_patient_allergy(uuid, text, text, text, text)
  from public;
revoke all on function public.record_vital_signs(
  uuid, uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric
) from public;
revoke all on function public.add_nursing_note(uuid, uuid, text) from public;

grant execute on function public.create_invoice(uuid, jsonb, numeric, uuid, uuid)
  to authenticated, service_role;
grant execute on function public.update_patient(uuid, jsonb)
  to authenticated, service_role;
grant execute on function public.record_patient_allergy(uuid, text, text, text, text)
  to authenticated, service_role;
grant execute on function public.record_vital_signs(
  uuid, uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric
) to authenticated, service_role;
grant execute on function public.add_nursing_note(uuid, uuid, text)
  to authenticated, service_role;

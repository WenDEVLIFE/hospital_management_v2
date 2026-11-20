-- ============================================================================
-- SPMC HMS — transactional prescription creation
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Creates a prescription, its medication items, and an audit entry in one
-- transaction. SECURITY DEFINER because audit_logs has no authenticated insert
-- policy; the function checks auth.uid(), prescription.create, and patient
-- access explicitly before writing.

create or replace function public.create_prescription(
  p_patient_id uuid,
  p_encounter_id uuid,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_prescription_id uuid;
  v_number text;
  v_item jsonb;
  v_medication_id uuid;
  v_dosage text;
  v_frequency text;
  v_duration integer;
  v_quantity numeric;
  v_instructions text;
  v_count integer := 0;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('prescription.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_patient_id is null or p_encounter_id is null then
    raise exception 'Patient and encounter are required' using errcode = '22023';
  end if;

  if not public.can_access_patient(p_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.encounters e
    where e.id = p_encounter_id
      and e.patient_id = p_patient_id
      and e.clinical_status in ('open', 'in_progress')
  ) then
    raise exception 'Select an active encounter for this patient'
      using errcode = '22023';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one medication is required'
      using errcode = '22023';
  end if;

  if char_length(coalesce(p_notes, '')) > 1000 then
    raise exception 'Notes must be 1000 characters or fewer'
      using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) > 20 then
    raise exception 'A prescription cannot exceed 20 medications'
      using errcode = '22023';
  end if;

  v_number := public.generate_reference_number('RX');

  insert into public.prescriptions (
    prescription_number,
    patient_id,
    encounter_id,
    prescribed_by,
    updated_by,
    notes
  )
  values (
    v_number,
    p_patient_id,
    p_encounter_id,
    v_actor,
    v_actor,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_prescription_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_dosage := btrim(coalesce(v_item ->> 'dosage', ''));
    v_frequency := btrim(coalesce(v_item ->> 'frequency', ''));
    v_instructions := nullif(
      btrim(coalesce(v_item ->> 'instructions', '')),
      ''
    );

    if v_dosage = '' or v_frequency = '' then
      raise exception 'Dosage and frequency are required for every medication'
        using errcode = '22023';
    end if;

    if char_length(v_dosage) > 120 or char_length(v_frequency) > 120 then
      raise exception 'Dosage and frequency must be 120 characters or fewer'
        using errcode = '22023';
    end if;

    if char_length(coalesce(v_instructions, '')) > 500 then
      raise exception 'Instructions must be 500 characters or fewer'
        using errcode = '22023';
    end if;

    if coalesce(v_item ->> 'quantity', '') !~ '^[0-9]+(\.[0-9]+)?$' then
      raise exception 'Quantity must be a positive number'
        using errcode = '22023';
    end if;

    v_quantity := (v_item ->> 'quantity')::numeric;

    if v_quantity <= 0 then
      raise exception 'Quantity must be greater than zero'
        using errcode = '22023';
    end if;

    if v_quantity > 100000 then
      raise exception 'Quantity is too large'
        using errcode = '22023';
    end if;

    v_duration := null;

    if nullif(btrim(coalesce(v_item ->> 'duration_days', '')), '') is not null then
      if (v_item ->> 'duration_days') !~ '^[0-9]+$' then
        raise exception 'Duration must be a whole number of days'
          using errcode = '22023';
      end if;

      v_duration := (v_item ->> 'duration_days')::integer;

      if v_duration <= 0 or v_duration > 3650 then
        raise exception 'Duration must be between 1 and 3650 days'
          using errcode = '22023';
      end if;
    end if;

    select m.id
    into v_medication_id
    from public.medications m
    where m.id::text = v_item ->> 'medication_id'
      and m.is_active;

    if v_medication_id is null then
      raise exception 'Select a valid active medication'
        using errcode = '22023';
    end if;

    insert into public.prescription_items (
      prescription_id,
      medication_id,
      dosage,
      frequency,
      duration_days,
      quantity,
      instructions
    )
    values (
      v_prescription_id,
      v_medication_id,
      v_dosage,
      v_frequency,
      v_duration,
      v_quantity,
      v_instructions
    );

    v_count := v_count + 1;
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
    'prescription.create',
    'prescription',
    v_prescription_id,
    'Issued a prescription.',
    jsonb_build_object(
      'source', 'create_prescription',
      'encounter_id', p_encounter_id,
      'item_count', v_count
    )
  );

  return v_prescription_id;
end;
$$;

revoke all on function public.create_prescription(uuid, uuid, text, jsonb) from public;
grant execute on function public.create_prescription(uuid, uuid, text, jsonb)
  to authenticated, service_role;

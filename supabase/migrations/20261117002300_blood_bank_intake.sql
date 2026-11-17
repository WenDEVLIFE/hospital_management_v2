-- ============================================================================
-- SPMC HMS — blood bank intake
-- Migration 046. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Donor registration, blood requests and unit screening complete the chain
-- that record_blood_donation / crossmatch_blood_unit / issue_blood_unit use.

create or replace function public.register_blood_donor(
  p_full_name text,
  p_date_of_birth date,
  p_sex text,
  p_blood_type text,
  p_contact_number text default null,
  p_address text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_donor_id uuid;
  v_donor_number text;
  v_name text := btrim(coalesce(p_full_name, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('blood_bank.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_name = '' then
    raise exception 'Donor name is required' using errcode = '22023';
  end if;

  if p_date_of_birth is null or p_date_of_birth >= current_date then
    raise exception 'Enter a valid date of birth' using errcode = '22023';
  end if;

  if p_blood_type not in ('A+','A-','B+','B-','AB+','AB-','O+','O-') then
    raise exception 'Unsupported blood type' using errcode = '22023';
  end if;

  v_donor_number := public.generate_reference_number('BD');

  insert into public.blood_donors (
    donor_number, full_name, date_of_birth, sex, blood_type,
    contact_number, address, created_by
  )
  values (
    v_donor_number,
    v_name,
    p_date_of_birth,
    coalesce(nullif(btrim(p_sex), ''), 'Unspecified'),
    p_blood_type,
    nullif(btrim(coalesce(p_contact_number, '')), ''),
    nullif(btrim(coalesce(p_address, '')), ''),
    v_actor
  )
  returning id into v_donor_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'blood_bank.donor.register',
    'blood_donor',
    v_donor_id,
    'Registered a blood donor.',
    jsonb_build_object(
      'source', 'register_blood_donor',
      'donor_number', v_donor_number,
      'blood_type', p_blood_type
    )
  );

  return v_donor_id;
end;
$$;

create or replace function public.create_blood_request(
  p_patient_id uuid,
  p_blood_type text,
  p_component text,
  p_units_requested integer,
  p_priority text default 'routine',
  p_required_by timestamp with time zone default null,
  p_department_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_request_id uuid;
  v_request_number text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('blood_bank.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if p_blood_type not in ('A+','A-','B+','B-','AB+','AB-','O+','O-') then
    raise exception 'Unsupported blood type' using errcode = '22023';
  end if;

  if p_component not in (
    'whole_blood', 'packed_rbc', 'plasma', 'platelets', 'cryoprecipitate'
  ) then
    raise exception 'Unsupported blood component' using errcode = '22023';
  end if;

  if p_units_requested is null or p_units_requested < 1
    or p_units_requested > 10 then
    raise exception 'Units requested must be between 1 and 10'
      using errcode = '22023';
  end if;

  if p_priority not in ('routine', 'urgent', 'emergency') then
    raise exception 'Unsupported request priority' using errcode = '22023';
  end if;

  v_request_number := public.generate_reference_number('BR');

  insert into public.blood_requests (
    request_number, patient_id, blood_type, component,
    units_requested, priority, department_id, required_by, notes, created_by
  )
  values (
    v_request_number,
    p_patient_id,
    p_blood_type,
    p_component,
    p_units_requested,
    p_priority,
    p_department_id,
    coalesce(p_required_by, now() + interval '4 hours'),
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_request_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'blood_bank.request.create',
    'blood_request',
    v_request_id,
    'Created a blood request.',
    jsonb_build_object(
      'source', 'create_blood_request',
      'request_number', v_request_number,
      'units_requested', p_units_requested,
      'priority', p_priority
    )
  );

  return v_request_id;
end;
$$;

create or replace function public.screen_blood_unit(
  p_unit_id uuid,
  p_result text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_unit public.blood_units%rowtype;
  v_screening_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('blood_bank.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_result not in ('pending', 'negative', 'positive') then
    raise exception 'Unsupported screening result' using errcode = '22023';
  end if;

  select * into v_unit
  from public.blood_units
  where id = p_unit_id
  for update;

  if not found then
    raise exception 'Blood unit not found' using errcode = '22023';
  end if;

  if v_unit.status in ('issued', 'discarded') then
    raise exception 'This unit is already closed' using errcode = '22023';
  end if;

  insert into public.blood_screenings (
    unit_id, test_name, result, tested_at, tested_by, notes
  )
  values (
    p_unit_id,
    'Infectious disease panel',
    p_result,
    now(),
    v_actor,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_screening_id;

  update public.blood_units
  set screening_status = case
        when p_result = 'positive' then 'failed'
        when p_result = 'negative' then 'passed'
        else 'pending'
      end,
      status = case
        when p_result = 'positive' then 'discarded'::text
        else status
      end,
      updated_at = now()
  where id = p_unit_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'blood_bank.unit.screen',
    'blood_unit',
    p_unit_id,
    'Recorded a blood unit screening.',
    jsonb_build_object(
      'source', 'screen_blood_unit',
      'result', p_result
    )
  );

  return v_screening_id;
end;
$$;

revoke all on function public.register_blood_donor(
  text, date, text, text, text, text
) from public;
revoke all on function public.create_blood_request(
  uuid, text, text, integer, text, timestamptz, uuid, text
) from public;
revoke all on function public.screen_blood_unit(uuid, text, text) from public;

grant execute on function public.register_blood_donor(
  text, date, text, text, text, text
) to authenticated, service_role;
grant execute on function public.create_blood_request(
  uuid, text, text, integer, text, timestamptz, uuid, text
) to authenticated, service_role;
grant execute on function public.screen_blood_unit(uuid, text, text)
  to authenticated, service_role;

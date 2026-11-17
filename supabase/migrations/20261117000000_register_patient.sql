-- ============================================================================
-- SPMC HMS — transactional patient registration
-- Migration 023. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Creates a patient, its primary emergency contact, and an audit entry in one
-- transaction. The function is SECURITY DEFINER because audit_logs has no
-- authenticated insert policy; it therefore checks auth.uid() and
-- patient.create explicitly before writing.

create or replace function public.register_patient(
  p_first_name text,
  p_middle_name text,
  p_last_name text,
  p_suffix text,
  p_date_of_birth date,
  p_sex text,
  p_civil_status text,
  p_nationality text,
  p_contact_number text,
  p_email text,
  p_address_line text,
  p_barangay text,
  p_city text,
  p_province text,
  p_postal_code text,
  p_emergency_full_name text,
  p_emergency_relationship text,
  p_emergency_contact_number text,
  p_emergency_is_primary boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_patient_id uuid;
  v_mrn text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('patient.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if coalesce(btrim(p_first_name), '') = ''
     or coalesce(btrim(p_last_name), '') = '' then
    raise exception 'First and last name are required'
      using errcode = '22023';
  end if;

  if p_date_of_birth is null then
    raise exception 'Date of birth is required'
      using errcode = '22023';
  end if;

  if coalesce(btrim(p_sex), '') not in ('Male', 'Female') then
    raise exception 'Sex is required' using errcode = '22023';
  end if;

  if coalesce(btrim(p_emergency_full_name), '') = ''
     or coalesce(btrim(p_emergency_contact_number), '') = '' then
    raise exception 'Emergency contact name and number are required'
      using errcode = '22023';
  end if;

  v_mrn := public.generate_reference_number('MRN');

  insert into public.patients (
    medical_record_number,
    first_name,
    middle_name,
    last_name,
    suffix,
    date_of_birth,
    sex,
    civil_status,
    nationality,
    contact_number,
    email,
    address_line,
    barangay,
    city,
    province,
    postal_code,
    registration_status,
    created_by
  )
  values (
    v_mrn,
    btrim(p_first_name),
    nullif(btrim(p_middle_name), ''),
    btrim(p_last_name),
    nullif(btrim(p_suffix), ''),
    p_date_of_birth,
    btrim(p_sex),
    nullif(btrim(p_civil_status), ''),
    nullif(btrim(p_nationality), ''),
    nullif(btrim(p_contact_number), ''),
    nullif(btrim(p_email), ''),
    nullif(btrim(p_address_line), ''),
    nullif(btrim(p_barangay), ''),
    nullif(btrim(p_city), ''),
    nullif(btrim(p_province), ''),
    nullif(btrim(p_postal_code), ''),
    'active',
    v_actor
  )
  returning id into v_patient_id;

  insert into public.emergency_contacts (
    patient_id,
    full_name,
    relationship,
    contact_number,
    is_primary,
    created_by
  )
  values (
    v_patient_id,
    btrim(p_emergency_full_name),
    nullif(btrim(p_emergency_relationship), ''),
    btrim(p_emergency_contact_number),
    coalesce(p_emergency_is_primary, false),
    v_actor
  );

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
    'patient.create',
    'patient',
    v_patient_id,
    'Registered a new patient.',
    '{"source":"register_patient"}'::jsonb
  );

  return v_patient_id;
end;
$$;

revoke all on function public.register_patient(
  text, text, text, text, date, text, text, text, text, text,
  text, text, text, text, text, text, text, text, boolean
) from public;

grant execute on function public.register_patient(
  text, text, text, text, date, text, text, text, text, text,
  text, text, text, text, text, text, text, text, boolean
) to authenticated, service_role;

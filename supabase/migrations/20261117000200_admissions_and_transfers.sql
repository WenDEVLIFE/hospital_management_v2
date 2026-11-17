-- ============================================================================
-- SPMC HMS — transactional admissions, transfers, and discharges
-- Migration 025. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- All three functions lock the affected admission/bed rows, enforce their
-- permission, keep bed assignments consistent, and write an audit entry.

create or replace function public.create_admission(
  p_patient_id uuid,
  p_department_id uuid,
  p_attending_physician_id uuid,
  p_bed_id uuid,
  p_admission_type text,
  p_admission_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_admission_id uuid;
  v_admission_number text;
  v_bed_status public.bed_status;
  v_bed_department uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('admission.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_patient_id is null
     or not exists (
       select 1
       from public.patients
       where id = p_patient_id
         and registration_status = 'active'
     ) then
    raise exception 'Active patient not found' using errcode = '22023';
  end if;

  if p_department_id is null
     or not exists (
       select 1
       from public.departments
       where id = p_department_id
         and is_active
     ) then
    raise exception 'Active department not found' using errcode = '22023';
  end if;

  if p_attending_physician_id is not null
     and not exists (
       select 1 from public.physicians where id = p_attending_physician_id
     ) then
    raise exception 'Physician not found' using errcode = '22023';
  end if;

  select b.status, r.department_id
  into v_bed_status, v_bed_department
  from public.beds b
  join public.rooms r on r.id = b.room_id
  where b.id = p_bed_id
  for update of b;

  if not found then
    raise exception 'Bed not found' using errcode = '22023';
  end if;

  if v_bed_status <> 'available' then
    raise exception 'Bed is not available' using errcode = '22023';
  end if;

  if v_bed_department <> p_department_id then
    raise exception 'Bed does not belong to the selected department'
      using errcode = '22023';
  end if;

  v_admission_number := public.generate_reference_number('ADM');

  insert into public.admissions (
    admission_number,
    patient_id,
    attending_physician_id,
    department_id,
    admission_type,
    status,
    admission_notes,
    admitted_by
  )
  values (
    v_admission_number,
    p_patient_id,
    p_attending_physician_id,
    p_department_id,
    coalesce(nullif(btrim(p_admission_type), ''), 'Elective'),
    'admitted',
    nullif(btrim(p_admission_notes), ''),
    v_actor
  )
  returning id into v_admission_id;

  insert into public.admission_bed_assignments (
    admission_id,
    bed_id,
    assigned_by
  )
  values (
    v_admission_id,
    p_bed_id,
    v_actor
  );

  update public.beds
  set status = 'occupied'
  where id = p_bed_id;

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
    'admission.create',
    'admission',
    v_admission_id,
    'Admitted a patient.',
    '{"source":"create_admission"}'::jsonb
  );

  return v_admission_id;
end;
$$;

create or replace function public.transfer_patient(
  p_admission_id uuid,
  p_to_bed_id uuid,
  p_transfer_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status public.admission_status;
  v_department_id uuid;
  v_from_bed_id uuid;
  v_to_status public.bed_status;
  v_to_department uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('admission.transfer') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status, department_id
  into v_status, v_department_id
  from public.admissions
  where id = p_admission_id
  for update;

  if not found then
    raise exception 'Admission not found' using errcode = '22023';
  end if;

  if v_status <> 'admitted' then
    raise exception 'Only admitted patients can be transferred'
      using errcode = '22023';
  end if;

  select bed_id
  into v_from_bed_id
  from public.admission_bed_assignments
  where admission_id = p_admission_id
    and released_at is null
  order by assigned_at desc
  limit 1
  for update;

  if v_from_bed_id is null then
    raise exception 'Active bed assignment not found' using errcode = '22023';
  end if;

  if p_to_bed_id = v_from_bed_id then
    raise exception 'Patient is already in the selected bed'
      using errcode = '22023';
  end if;

  perform 1 from public.beds where id = v_from_bed_id for update;

  select b.status, r.department_id
  into v_to_status, v_to_department
  from public.beds b
  join public.rooms r on r.id = b.room_id
  where b.id = p_to_bed_id
  for update of b;

  if not found then
    raise exception 'Bed not found' using errcode = '22023';
  end if;

  if v_to_status <> 'available' then
    raise exception 'Bed is not available' using errcode = '22023';
  end if;

  if v_to_department <> v_department_id then
    raise exception 'Bed does not belong to the admission department'
      using errcode = '22023';
  end if;

  update public.admission_bed_assignments
  set released_at = now()
  where admission_id = p_admission_id
    and released_at is null;

  update public.beds
  set status = 'available'
  where id = v_from_bed_id;

  insert into public.admission_bed_assignments (
    admission_id,
    bed_id,
    assigned_by
  )
  values (
    p_admission_id,
    p_to_bed_id,
    v_actor
  );

  update public.beds
  set status = 'occupied'
  where id = p_to_bed_id;

  insert into public.patient_transfers (
    admission_id,
    from_bed_id,
    to_bed_id,
    transfer_reason,
    transferred_by
  )
  values (
    p_admission_id,
    v_from_bed_id,
    p_to_bed_id,
    nullif(btrim(p_transfer_reason), ''),
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
    'admission.transfer',
    'admission',
    p_admission_id,
    'Transferred a patient between beds.',
    '{"source":"transfer_patient"}'::jsonb
  );

  return p_admission_id;
end;
$$;

create or replace function public.discharge_patient(
  p_admission_id uuid,
  p_discharge_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status public.admission_status;
  v_bed_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('admission.discharge') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status
  into v_status
  from public.admissions
  where id = p_admission_id
  for update;

  if not found then
    raise exception 'Admission not found' using errcode = '22023';
  end if;

  if v_status <> 'admitted' then
    raise exception 'Only admitted patients can be discharged'
      using errcode = '22023';
  end if;

  select bed_id
  into v_bed_id
  from public.admission_bed_assignments
  where admission_id = p_admission_id
    and released_at is null
  order by assigned_at desc
  limit 1
  for update;

  if v_bed_id is not null then
    update public.admission_bed_assignments
    set released_at = now()
    where admission_id = p_admission_id
      and released_at is null;

    update public.beds
    set status = 'available'
    where id = v_bed_id;
  end if;

  update public.admissions
  set status = 'discharged',
      discharge_date = now(),
      discharge_notes = nullif(btrim(p_discharge_notes), ''),
      discharged_by = v_actor
  where id = p_admission_id;

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
    'admission.discharge',
    'admission',
    p_admission_id,
    'Discharged a patient.',
    '{"source":"discharge_patient"}'::jsonb
  );

  return p_admission_id;
end;
$$;

revoke all on function public.create_admission(
  uuid, uuid, uuid, uuid, text, text
) from public;

grant execute on function public.create_admission(
  uuid, uuid, uuid, uuid, text, text
) to authenticated, service_role;

revoke all on function public.transfer_patient(
  uuid, uuid, text
) from public;

grant execute on function public.transfer_patient(
  uuid, uuid, text
) to authenticated, service_role;

revoke all on function public.discharge_patient(
  uuid, text
) from public;

grant execute on function public.discharge_patient(
  uuid, text
) to authenticated, service_role;

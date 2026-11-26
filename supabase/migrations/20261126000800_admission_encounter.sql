-- ============================================================================
-- SPMC HMS — create an inpatient encounter with every admission
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Nursing charting (vitals, assessments, notes) requires an encounter. The
-- admission flow previously created none, so admitted patients could not be
-- charted. Create an encounter on admission and backfill existing admissions.

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

  insert into public.encounters (
    encounter_number,
    patient_id,
    admission_id,
    physician_id,
    department_id,
    encounter_type,
    clinical_status,
    created_by
  )
  values (
    public.generate_reference_number('ENC'),
    p_patient_id,
    v_admission_id,
    p_attending_physician_id,
    p_department_id,
    'inpatient',
    'open',
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
    'admission.create',
    'admission',
    v_admission_id,
    'Admitted a patient.',
    '{"source":"create_admission"}'::jsonb
  );

  return v_admission_id;
end;
$$;

-- Backfill: every currently admitted patient without an encounter gets one so
-- nurses can begin charting immediately after this migration.
insert into public.encounters (
  encounter_number,
  patient_id,
  admission_id,
  physician_id,
  department_id,
  encounter_type,
  clinical_status,
  started_at,
  created_by
)
select
  public.generate_reference_number('ENC'),
  a.patient_id,
  a.id,
  a.attending_physician_id,
  a.department_id,
  'inpatient',
  'open',
  a.admission_date,
  a.admitted_by
from public.admissions a
where a.status = 'admitted'
  and not exists (
    select 1 from public.encounters e where e.admission_id = a.id
  );

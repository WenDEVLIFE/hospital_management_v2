-- ============================================================================
-- SPMC HMS — emergency department
-- Migration 035. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Emergency visits sit on top of an encounter so vitals, notes, diagnoses and
-- orders keep using the shared clinical tables.

create type public.emergency_triage_level as enum (
  'critical',
  'emergent',
  'urgent',
  'less_urgent',
  'non_urgent'
);

create type public.emergency_visit_status as enum (
  'waiting',
  'triage',
  'in_treatment',
  'observation',
  'admitted',
  'transferred',
  'discharged'
);

create type public.emergency_arrival_mode as enum (
  'walk_in',
  'ambulance',
  'referral'
);

create type public.emergency_disposition as enum (
  'admit',
  'transfer',
  'discharge'
);

create table if not exists public.emergency_visits (
  id uuid primary key default gen_random_uuid(),

  visit_number text not null unique,

  encounter_id uuid not null unique
    references public.encounters(id) on delete restrict,
  patient_id uuid not null
    references public.patients(id) on delete restrict,

  arrival_at timestamptz not null default now(),
  arrival_mode public.emergency_arrival_mode not null default 'walk_in',

  triage_level public.emergency_triage_level not null default 'urgent',
  triage_note text,
  triaged_at timestamptz,

  chief_complaint text not null,

  status public.emergency_visit_status not null default 'waiting',

  attending_physician_id uuid
    references public.physicians(id) on delete restrict,
  triage_nurse_id uuid
    references public.staff_profiles(id) on delete restrict,

  treatment_area text,

  disposition public.emergency_disposition,
  disposition_at timestamptz,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_emergency_visits_status
  on public.emergency_visits(status, arrival_at desc);
create index if not exists idx_emergency_visits_patient
  on public.emergency_visits(patient_id, arrival_at desc);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('emergency.view', 'View emergency visits and triage board.'),
  ('emergency.create', 'Register and triage emergency patients.'),
  ('emergency.update', 'Update emergency visit status and disposition.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('emergency.view', 'emergency.create', 'emergency.update')
where r.slug in ('hospital_admin', 'physician', 'nurse')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('emergency.view', 'emergency.create')
where r.slug = 'receptionist'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.emergency_visits enable row level security;

drop policy if exists "emergency_visits_select_authorized"
  on public.emergency_visits;
create policy "emergency_visits_select_authorized"
on public.emergency_visits
for select
to authenticated
using (public.has_permission('emergency.view'));

drop policy if exists "emergency_visits_insert_authorized"
  on public.emergency_visits;
create policy "emergency_visits_insert_authorized"
on public.emergency_visits
for insert
to authenticated
with check (
  public.has_permission('emergency.create')
  and created_by = auth.uid()
);

drop policy if exists "emergency_visits_update_authorized"
  on public.emergency_visits;
create policy "emergency_visits_update_authorized"
on public.emergency_visits
for update
to authenticated
using (public.has_permission('emergency.update'))
with check (public.has_permission('emergency.update'));

-- ----------------------------------------------------------------------------
-- Start triage: create the emergency encounter and visit together
-- ----------------------------------------------------------------------------
create or replace function public.start_emergency_visit(
  p_patient_id uuid,
  p_chief_complaint text,
  p_triage_level text,
  p_arrival_mode text default 'walk_in',
  p_triage_note text default null,
  p_attending_physician_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_encounter_id uuid;
  v_visit_id uuid;
  v_department_id uuid;
  v_staff_id uuid;
  v_complaint text := btrim(coalesce(p_chief_complaint, ''));
  v_encounter_number text;
  v_visit_number text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('emergency.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if v_complaint = '' then
    raise exception 'A chief complaint is required' using errcode = '22023';
  end if;

  if p_triage_level not in (
    'critical', 'emergent', 'urgent', 'less_urgent', 'non_urgent'
  ) then
    raise exception 'Unsupported triage level' using errcode = '22023';
  end if;

  if p_arrival_mode not in ('walk_in', 'ambulance', 'referral') then
    raise exception 'Unsupported arrival mode' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.emergency_visits
    where patient_id = p_patient_id
      and status not in ('discharged', 'transferred')
  ) then
    raise exception 'This patient already has an active emergency visit'
      using errcode = '22023';
  end if;

  select id
  into v_department_id
  from public.departments
  where code = 'ER';

  if v_department_id is null then
    raise exception 'Emergency department is not configured'
      using errcode = '22023';
  end if;

  select id
  into v_staff_id
  from public.staff_profiles
  where user_id = v_actor;

  v_encounter_number := public.generate_reference_number('ENC');
  v_visit_number := public.generate_reference_number('ER');

  insert into public.encounters (
    encounter_number,
    patient_id,
    physician_id,
    department_id,
    encounter_type,
    chief_complaint,
    clinical_status,
    created_by
  )
  values (
    v_encounter_number,
    p_patient_id,
    p_attending_physician_id,
    v_department_id,
    'Emergency visit',
    v_complaint,
    'in_progress',
    v_actor
  )
  returning id into v_encounter_id;

  insert into public.emergency_visits (
    visit_number,
    encounter_id,
    patient_id,
    arrival_mode,
    triage_level,
    triage_note,
    triaged_at,
    chief_complaint,
    status,
    attending_physician_id,
    triage_nurse_id,
    created_by
  )
  values (
    v_visit_number,
    v_encounter_id,
    p_patient_id,
    p_arrival_mode::public.emergency_arrival_mode,
    p_triage_level::public.emergency_triage_level,
    nullif(btrim(coalesce(p_triage_note, '')), ''),
    now(),
    v_complaint,
    'triage'::public.emergency_visit_status,
    p_attending_physician_id,
    v_staff_id,
    v_actor
  )
  returning id into v_visit_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'emergency.visit.start',
    'emergency_visit',
    v_visit_id,
    'Started emergency triage.',
    jsonb_build_object(
      'source', 'start_emergency_visit',
      'visit_number', v_visit_number,
      'triage_level', p_triage_level,
      'arrival_mode', p_arrival_mode
    )
  );

  return v_visit_id;
end;
$$;

revoke all on function public.start_emergency_visit(
  uuid, text, text, text, text, uuid
) from public;

grant execute on function public.start_emergency_visit(
  uuid, text, text, text, text, uuid
) to authenticated, service_role;

-- ============================================================================
-- SPMC HMS — surgery and operating theatres
-- Migration 036. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

create type public.surgery_status as enum (
  'requested',
  'scheduled',
  'pre_op',
  'in_progress',
  'recovery',
  'completed',
  'cancelled'
);

create type public.surgery_priority as enum (
  'elective',
  'urgent',
  'emergency'
);

create type public.operating_room_status as enum (
  'available',
  'in_use',
  'cleaning',
  'maintenance'
);

create type public.anesthesia_type as enum (
  'general',
  'regional',
  'local',
  'sedation'
);

create table if not exists public.operating_rooms (
  id uuid primary key default gen_random_uuid(),

  room_name text not null unique,
  department_id uuid not null
    references public.departments(id) on delete restrict,

  status public.operating_room_status not null default 'available',
  notes text,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.surgery_cases (
  id uuid primary key default gen_random_uuid(),

  case_number text not null unique,

  patient_id uuid not null references public.patients(id) on delete restrict,
  room_id uuid not null
    references public.operating_rooms(id) on delete restrict,

  procedure_code text not null,
  procedure_name text not null,

  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  actual_start timestamptz,
  actual_end timestamptz,

  status public.surgery_status not null default 'requested',
  priority public.surgery_priority not null default 'elective',

  surgeon_id uuid not null references public.physicians(id) on delete restrict,
  anesthesiologist_id uuid
    references public.physicians(id) on delete restrict,
  scrub_nurse_id uuid
    references public.staff_profiles(id) on delete restrict,
  circulating_nurse_id uuid
    references public.staff_profiles(id) on delete restrict,

  anesthesia_type public.anesthesia_type,

  pre_op_completed boolean not null default false,
  consent_signed boolean not null default false,
  safety_checklist_completed boolean not null default false,

  notes text,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (scheduled_end > scheduled_start)
);

create index if not exists idx_surgery_cases_room_time
  on public.surgery_cases(room_id, scheduled_start);
create index if not exists idx_surgery_cases_status
  on public.surgery_cases(status, scheduled_start);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('surgery.view', 'View surgical cases and theatre board.'),
  ('surgery.create', 'Register operating rooms and schedule cases.'),
  ('surgery.update', 'Update surgical case status and theatre state.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('surgery.view', 'surgery.create', 'surgery.update')
where r.slug in ('hospital_admin', 'physician', 'nurse')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.operating_rooms enable row level security;
alter table public.surgery_cases enable row level security;

drop policy if exists "operating_rooms_select_authorized"
  on public.operating_rooms;
create policy "operating_rooms_select_authorized"
on public.operating_rooms
for select
to authenticated
using (public.has_permission('surgery.view'));

drop policy if exists "surgery_cases_select_authorized"
  on public.surgery_cases;
create policy "surgery_cases_select_authorized"
on public.surgery_cases
for select
to authenticated
using (public.has_permission('surgery.view'));

drop policy if exists "surgery_cases_insert_authorized"
  on public.surgery_cases;
create policy "surgery_cases_insert_authorized"
on public.surgery_cases
for insert
to authenticated
with check (
  public.has_permission('surgery.create')
  and created_by = auth.uid()
);

drop policy if exists "surgery_cases_update_authorized"
  on public.surgery_cases;
create policy "surgery_cases_update_authorized"
on public.surgery_cases
for update
to authenticated
using (public.has_permission('surgery.update'))
with check (public.has_permission('surgery.update'));

-- ----------------------------------------------------------------------------
-- Register an operating room
-- ----------------------------------------------------------------------------
create or replace function public.register_operating_room(
  p_room_name text,
  p_department_id uuid,
  p_status text default 'available',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_room_name text := btrim(coalesce(p_room_name, ''));
  v_room_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('surgery.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_room_name = '' then
    raise exception 'A room name is required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.departments where id = p_department_id
  ) then
    raise exception 'Department not found' using errcode = '22023';
  end if;

  if p_status not in ('available', 'in_use', 'cleaning', 'maintenance') then
    raise exception 'Unsupported operating room status'
      using errcode = '22023';
  end if;

  insert into public.operating_rooms (
    room_name, department_id, status, notes, created_by
  )
  values (
    v_room_name,
    p_department_id,
    p_status::public.operating_room_status,
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_room_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'surgery.room.register',
    'operating_room',
    v_room_id,
    'Registered an operating room.',
    jsonb_build_object('source', 'register_operating_room', 'room_name', v_room_name)
  );

  return v_room_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Schedule a surgical case
-- ----------------------------------------------------------------------------
create or replace function public.schedule_surgery_case(
  p_patient_id uuid,
  p_room_id uuid,
  p_procedure_code text,
  p_procedure_name text,
  p_scheduled_start timestamptz,
  p_scheduled_end timestamptz,
  p_priority text,
  p_surgeon_id uuid,
  p_anesthesia_type text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_case_id uuid;
  v_case_number text;
  v_procedure_code text := upper(btrim(coalesce(p_procedure_code, '')));
  v_procedure_name text := btrim(coalesce(p_procedure_name, ''));
  v_room_status public.operating_room_status;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('surgery.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if v_procedure_code = '' or v_procedure_name = '' then
    raise exception 'Procedure code and name are required'
      using errcode = '22023';
  end if;

  if p_scheduled_start is null
    or p_scheduled_end is null
    or p_scheduled_end <= p_scheduled_start then
    raise exception 'The case end time must be after the start time'
      using errcode = '22023';
  end if;

  if p_priority not in ('elective', 'urgent', 'emergency') then
    raise exception 'Unsupported surgery priority' using errcode = '22023';
  end if;

  if p_anesthesia_type is not null
    and p_anesthesia_type not in ('general', 'regional', 'local', 'sedation') then
    raise exception 'Unsupported anesthesia type' using errcode = '22023';
  end if;

  select status
  into v_room_status
  from public.operating_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Operating room not found' using errcode = '22023';
  end if;

  if v_room_status = 'maintenance' then
    raise exception 'The operating room is under maintenance'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.surgery_cases
    where room_id = p_room_id
      and status not in ('cancelled', 'completed')
      and tstzrange(scheduled_start, scheduled_end, '[)')
        && tstzrange(p_scheduled_start, p_scheduled_end, '[)')
  ) then
    raise exception 'The operating room is already booked for that slot'
      using errcode = '23P01';
  end if;

  v_case_number := public.generate_reference_number('SUR');

  insert into public.surgery_cases (
    case_number,
    patient_id,
    room_id,
    procedure_code,
    procedure_name,
    scheduled_start,
    scheduled_end,
    status,
    priority,
    surgeon_id,
    anesthesia_type,
    notes,
    created_by
  )
  values (
    v_case_number,
    p_patient_id,
    p_room_id,
    v_procedure_code,
    v_procedure_name,
    p_scheduled_start,
    p_scheduled_end,
    'scheduled'::public.surgery_status,
    p_priority::public.surgery_priority,
    p_surgeon_id,
    p_anesthesia_type::public.anesthesia_type,
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_case_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'surgery.case.schedule',
    'surgery_case',
    v_case_id,
    'Scheduled a surgical case.',
    jsonb_build_object(
      'source', 'schedule_surgery_case',
      'case_number', v_case_number,
      'priority', p_priority,
      'room_id', p_room_id
    )
  );

  return v_case_id;
end;
$$;

revoke all on function public.register_operating_room(
  text, uuid, text, text
) from public;
revoke all on function public.schedule_surgery_case(
  uuid, uuid, text, text, timestamptz, timestamptz, text, uuid, text, text
) from public;

grant execute on function public.register_operating_room(
  text, uuid, text, text
) to authenticated, service_role;
grant execute on function public.schedule_surgery_case(
  uuid, uuid, text, text, timestamptz, timestamptz, text, uuid, text, text
) to authenticated, service_role;

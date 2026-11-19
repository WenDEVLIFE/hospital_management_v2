-- ============================================================================
-- SPMC HMS — housekeeping
-- Migration 20261119000400. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Cleaning requests move through requested → assigned → in_progress →
-- completed → verified. Completion requires a disinfection record, because a
-- room cannot be released without one.

create table if not exists public.housekeeping_staff (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  role text not null default 'Housekeeper',
  status text not null default 'on_duty'
    check (status in ('on_duty', 'off_duty', 'on_break')),
  contact_number text,
  current_assignment text,
  completed_today integer not null default 0 check (completed_today >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cleaning_requests (
  id uuid primary key default gen_random_uuid(),

  request_number text not null unique,

  location_type text not null
    check (location_type in ('room', 'bed', 'common_area', 'isolation_room')),
  location_label text not null,
  department_id uuid references public.departments(id) on delete restrict,

  request_type text not null
    check (request_type in ('routine', 'discharge', 'terminal', 'spill', 'isolation')),
  priority text not null default 'routine'
    check (priority in ('routine', 'urgent', 'emergency')),
  status text not null default 'requested'
    check (status in ('requested', 'assigned', 'in_progress', 'completed', 'verified', 'cancelled')),

  requested_at timestamptz not null default now(),
  due_at timestamptz not null default now() + interval '2 hours',
  scheduled_for timestamptz not null default now(),

  assigned_staff_id uuid
    references public.housekeeping_staff(id) on delete restrict,
  started_at timestamptz,
  completed_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete restrict,

  disinfection_used text,
  notes text,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.disinfection_records (
  id uuid primary key default gen_random_uuid(),

  request_id uuid not null unique
    references public.cleaning_requests(id) on delete cascade,

  method text not null,
  chemical text not null,
  contact_time_minutes integer not null check (contact_time_minutes > 0),

  performed_by uuid not null references public.profiles(id) on delete restrict,
  performed_at timestamptz not null default now(),
  notes text
);

create index if not exists idx_cleaning_requests_status
  on public.cleaning_requests(status, due_at);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('housekeeping.view', 'View cleaning requests and housekeeping staff.'),
  ('housekeeping.manage', 'Create, assign and close cleaning requests.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('housekeeping.view', 'housekeeping.manage')
where r.slug in ('hospital_admin', 'nurse')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'housekeeping.view'
where r.slug = 'physician'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'housekeeping_staff',
    'cleaning_requests',
    'disinfection_records'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''housekeeping.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Create a cleaning request
-- ----------------------------------------------------------------------------
create or replace function public.create_cleaning_request(
  p_location_type text,
  p_location_label text,
  p_request_type text,
  p_priority text default 'routine',
  p_due_at timestamp with time zone default null,
  p_notes text default null,
  p_department_id uuid default null
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
  v_label text := btrim(coalesce(p_location_label, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('housekeeping.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_location_type not in ('room', 'bed', 'common_area', 'isolation_room') then
    raise exception 'Unsupported location type' using errcode = '22023';
  end if;

  if p_request_type not in ('routine', 'discharge', 'terminal', 'spill', 'isolation') then
    raise exception 'Unsupported cleaning request type' using errcode = '22023';
  end if;

  if p_priority not in ('routine', 'urgent', 'emergency') then
    raise exception 'Unsupported priority' using errcode = '22023';
  end if;

  if v_label = '' then
    raise exception 'A location is required' using errcode = '22023';
  end if;

  v_request_number := public.generate_reference_number('CLN');

  insert into public.cleaning_requests (
    request_number, location_type, location_label, department_id,
    request_type, priority, due_at, notes, created_by
  )
  values (
    v_request_number,
    p_location_type,
    v_label,
    p_department_id,
    p_request_type,
    p_priority,
    coalesce(p_due_at, now() + interval '2 hours'),
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_request_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'housekeeping.request.create',
    'cleaning_request',
    v_request_id,
    'Created a cleaning request.',
    jsonb_build_object(
      'source', 'create_cleaning_request',
      'request_number', v_request_number,
      'request_type', p_request_type,
      'priority', p_priority
    )
  );

  return v_request_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Advance a cleaning request
-- ----------------------------------------------------------------------------
create or replace function public.advance_cleaning_request(
  p_request_id uuid,
  p_action text,
  p_staff_id uuid default null,
  p_method text default null,
  p_chemical text default null,
  p_contact_minutes integer default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.cleaning_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('housekeeping.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_request
  from public.cleaning_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Cleaning request not found' using errcode = '22023';
  end if;

  if v_request.status in ('verified', 'cancelled') then
    raise exception 'This request is already closed' using errcode = '22023';
  end if;

  if p_action = 'assign' then
    if p_staff_id is null
      or not exists (select 1 from public.housekeeping_staff where id = p_staff_id) then
      raise exception 'Select a housekeeping staff member' using errcode = '22023';
    end if;

    update public.cleaning_requests
    set assigned_staff_id = p_staff_id,
        status = 'assigned',
        updated_by = v_actor
    where id = p_request_id;

  elsif p_action = 'start' then
    if v_request.assigned_staff_id is null then
      raise exception 'Assign the request before starting it' using errcode = '22023';
    end if;

    update public.cleaning_requests
    set status = 'in_progress',
        started_at = coalesce(started_at, now()),
        updated_by = v_actor
    where id = p_request_id;

  elsif p_action = 'complete' then
    if btrim(coalesce(p_method, '')) = ''
      or btrim(coalesce(p_chemical, '')) = ''
      or p_contact_minutes is null
      or p_contact_minutes <= 0 then
      raise exception 'A disinfection method, chemical and contact time are required'
        using errcode = '22023';
    end if;

    insert into public.disinfection_records (
      request_id, method, chemical, contact_time_minutes, performed_by, notes
    )
    values (
      p_request_id,
      btrim(p_method),
      btrim(p_chemical),
      p_contact_minutes,
      v_actor,
      nullif(btrim(coalesce(p_notes, '')), '')
    )
    on conflict (request_id) do update
    set method = excluded.method,
        chemical = excluded.chemical,
        contact_time_minutes = excluded.contact_time_minutes,
        performed_by = excluded.performed_by,
        notes = excluded.notes;

    update public.cleaning_requests
    set status = 'completed',
        completed_at = now(),
        disinfection_used = btrim(p_chemical),
        updated_by = v_actor
    where id = p_request_id;

    update public.housekeeping_staff
    set completed_today = completed_today + 1,
        current_assignment = null,
        updated_at = now()
    where id = v_request.assigned_staff_id;

  elsif p_action = 'verify' then
    if v_request.status <> 'completed' then
      raise exception 'Only completed requests can be verified' using errcode = '22023';
    end if;

    update public.cleaning_requests
    set status = 'verified',
        verified_at = now(),
        verified_by = v_actor,
        updated_by = v_actor
    where id = p_request_id;

  elsif p_action = 'cancel' then
    update public.cleaning_requests
    set status = 'cancelled',
        updated_by = v_actor
    where id = p_request_id;

  else
    raise exception 'Unsupported cleaning action' using errcode = '22023';
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'housekeeping.request.' || p_action,
    'cleaning_request',
    p_request_id,
    'Updated a cleaning request.',
    jsonb_build_object('source', 'advance_cleaning_request', 'action', p_action)
  );

  return p_request_id;
end;
$$;

revoke all on function public.create_cleaning_request(
  text, text, text, text, timestamptz, text, uuid
) from public;
revoke all on function public.advance_cleaning_request(
  uuid, text, uuid, text, text, integer, text
) from public;

grant execute on function public.create_cleaning_request(
  text, text, text, text, timestamptz, text, uuid
) to authenticated, service_role;
grant execute on function public.advance_cleaning_request(
  uuid, text, uuid, text, text, integer, text
) to authenticated, service_role;

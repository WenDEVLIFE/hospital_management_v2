-- ============================================================================
-- SPMC HMS — ambulance fleet and dispatch
-- Migration 20261119000600. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Fleet register, transport requests, maintenance history and fuel records.
-- Dispatch is transactional: a vehicle can only be assigned when available, and
-- the vehicle status follows the trip lifecycle.

create table if not exists public.ambulance_vehicles (
  id uuid primary key default gen_random_uuid(),

  vehicle_number text not null unique,
  plate_number text not null unique,

  type text not null
    check (type in ('basic_life_support', 'advanced_life_support', 'patient_transport', 'mobile_icu')),
  status text not null default 'available'
    check (status in ('available', 'dispatched', 'on_trip', 'maintenance', 'out_of_service')),

  driver_name text,
  crew_names text[] not null default '{}',
  location text not null default 'Station',

  fuel_level numeric(5,2) not null default 100
    check (fuel_level >= 0 and fuel_level <= 100),
  odometer_km numeric(10,2) not null default 0 check (odometer_km >= 0),

  last_service_date date,
  next_service_due date,
  notes text,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ambulance_trips (
  id uuid primary key default gen_random_uuid(),

  trip_number text not null unique,
  patient_id uuid not null references public.patients(id) on delete restrict,
  vehicle_id uuid references public.ambulance_vehicles(id) on delete restrict,

  status text not null default 'requested'
    check (status in ('requested', 'assigned', 'en_route', 'on_scene', 'transporting', 'completed', 'cancelled')),
  priority text not null default 'routine'
    check (priority in ('routine', 'urgent', 'emergency')),

  pickup_location text not null,
  destination text not null,

  requested_at timestamptz not null default now(),
  dispatched_at timestamptz,
  arrived_pickup_at timestamptz,
  departed_pickup_at timestamptz,
  arrived_destination_at timestamptz,
  completed_at timestamptz,

  crew_names text[] not null default '{}',
  notes text,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ambulance_maintenance (
  id uuid primary key default gen_random_uuid(),

  vehicle_id uuid not null
    references public.ambulance_vehicles(id) on delete cascade,

  maintenance_type text not null,
  performed_at timestamptz not null default now(),
  performed_by uuid references public.profiles(id) on delete restrict,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  notes text,
  next_due_date date,

  created_at timestamptz not null default now()
);

create table if not exists public.ambulance_fuel_records (
  id uuid primary key default gen_random_uuid(),

  vehicle_id uuid not null
    references public.ambulance_vehicles(id) on delete cascade,

  fueled_at timestamptz not null default now(),
  liters numeric(8,2) not null check (liters > 0),
  cost numeric(12,2) not null default 0 check (cost >= 0),
  odometer_km numeric(10,2) not null default 0 check (odometer_km >= 0),
  recorded_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now()
);

create index if not exists idx_ambulance_trips_status
  on public.ambulance_trips(status, requested_at desc);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('ambulance.view', 'View the fleet, dispatch requests and vehicle records.'),
  ('ambulance.manage', 'Register vehicles and dispatch ambulances.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('ambulance.view', 'ambulance.manage')
where r.slug = 'hospital_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('ambulance.view', 'ambulance.manage')
where r.slug in ('nurse', 'receptionist')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'ambulance.view'
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
    'ambulance_vehicles',
    'ambulance_trips',
    'ambulance_maintenance',
    'ambulance_fuel_records'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''ambulance.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Register a vehicle
-- ----------------------------------------------------------------------------
create or replace function public.register_ambulance_vehicle(
  p_vehicle_number text,
  p_plate_number text,
  p_type text,
  p_location text default 'Station',
  p_next_service_due date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_vehicle_id uuid;
  v_number text := upper(btrim(coalesce(p_vehicle_number, '')));
  v_plate text := upper(btrim(coalesce(p_plate_number, '')));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('ambulance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_number = '' or v_plate = '' then
    raise exception 'Vehicle number and plate number are required'
      using errcode = '22023';
  end if;

  if p_type not in ('basic_life_support', 'advanced_life_support', 'patient_transport', 'mobile_icu') then
    raise exception 'Unsupported ambulance type' using errcode = '22023';
  end if;

  insert into public.ambulance_vehicles (
    vehicle_number, plate_number, type, location, next_service_due, created_by
  )
  values (
    v_number, v_plate, p_type,
    coalesce(nullif(btrim(p_location), ''), 'Station'),
    p_next_service_due, v_actor
  )
  returning id into v_vehicle_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'ambulance.vehicle.register', 'ambulance_vehicle', v_vehicle_id,
    'Registered an ambulance.',
    jsonb_build_object('source', 'register_ambulance_vehicle', 'vehicle_number', v_number)
  );

  return v_vehicle_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Create a dispatch request
-- ----------------------------------------------------------------------------
create or replace function public.create_ambulance_trip(
  p_patient_id uuid,
  p_pickup_location text,
  p_destination text,
  p_priority text default 'routine',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_trip_id uuid;
  v_trip_number text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('ambulance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if btrim(coalesce(p_pickup_location, '')) = ''
    or btrim(coalesce(p_destination, '')) = '' then
    raise exception 'Pickup and destination are required' using errcode = '22023';
  end if;

  if p_priority not in ('routine', 'urgent', 'emergency') then
    raise exception 'Unsupported dispatch priority' using errcode = '22023';
  end if;

  v_trip_number := public.generate_reference_number('AMB');

  insert into public.ambulance_trips (
    trip_number, patient_id, priority, pickup_location, destination, notes, created_by
  )
  values (
    v_trip_number, p_patient_id, p_priority,
    btrim(p_pickup_location), btrim(p_destination),
    nullif(btrim(coalesce(p_notes, '')), ''), v_actor
  )
  returning id into v_trip_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'ambulance.trip.create', 'ambulance_trip', v_trip_id,
    'Requested an ambulance dispatch.',
    jsonb_build_object('source', 'create_ambulance_trip', 'trip_number', v_trip_number, 'priority', p_priority)
  );

  return v_trip_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Assign a vehicle and advance the trip
-- ----------------------------------------------------------------------------
create or replace function public.advance_ambulance_trip(
  p_trip_id uuid,
  p_action text,
  p_vehicle_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_trip public.ambulance_trips%rowtype;
  v_vehicle public.ambulance_vehicles%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('ambulance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_trip
  from public.ambulance_trips
  where id = p_trip_id
  for update;

  if not found then
    raise exception 'Dispatch request not found' using errcode = '22023';
  end if;

  if v_trip.status in ('completed', 'cancelled') then
    raise exception 'This dispatch is already closed' using errcode = '22023';
  end if;

  if p_action = 'assign' then
    if p_vehicle_id is null then
      raise exception 'Select an ambulance' using errcode = '22023';
    end if;

    select * into v_vehicle
    from public.ambulance_vehicles
    where id = p_vehicle_id
    for update;

    if not found then
      raise exception 'Ambulance not found' using errcode = '22023';
    end if;

    if v_vehicle.status <> 'available' then
      raise exception 'This ambulance is not available' using errcode = '22023';
    end if;

    update public.ambulance_trips
    set vehicle_id = p_vehicle_id,
        status = 'assigned',
        dispatched_at = now(),
        updated_by = v_actor
    where id = p_trip_id;

    update public.ambulance_vehicles
    set status = 'dispatched',
        driver_name = coalesce(driver_name, 'Assigned driver'),
        updated_by = v_actor
    where id = p_vehicle_id;

  elsif p_action = 'en_route' then
    if v_trip.vehicle_id is null then
      raise exception 'Assign an ambulance first' using errcode = '22023';
    end if;

    update public.ambulance_trips
    set status = 'en_route',
        updated_by = v_actor
    where id = p_trip_id;

  elsif p_action = 'on_scene' then
    update public.ambulance_trips
    set status = 'on_scene',
        arrived_pickup_at = now(),
        updated_by = v_actor
    where id = p_trip_id;

  elsif p_action = 'transporting' then
    update public.ambulance_trips
    set status = 'transporting',
        departed_pickup_at = now(),
        updated_by = v_actor
    where id = p_trip_id;

    update public.ambulance_vehicles
    set status = 'on_trip',
        updated_by = v_actor
    where id = v_trip.vehicle_id;

  elsif p_action = 'complete' then
    update public.ambulance_trips
    set status = 'completed',
        arrived_destination_at = now(),
        completed_at = now(),
        updated_by = v_actor
    where id = p_trip_id;

    update public.ambulance_vehicles
    set status = 'available',
        location = v_trip.destination,
        updated_by = v_actor
    where id = v_trip.vehicle_id;

  elsif p_action = 'cancel' then
    update public.ambulance_trips
    set status = 'cancelled',
        updated_by = v_actor
    where id = p_trip_id;

    if v_trip.vehicle_id is not null then
      update public.ambulance_vehicles
      set status = 'available',
          updated_by = v_actor
      where id = v_trip.vehicle_id;
    end if;

  else
    raise exception 'Unsupported dispatch action' using errcode = '22023';
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'ambulance.trip.' || p_action, 'ambulance_trip', p_trip_id,
    'Updated an ambulance dispatch.',
    jsonb_build_object('source', 'advance_ambulance_trip', 'action', p_action)
  );

  return p_trip_id;
end;
$$;

revoke all on function public.register_ambulance_vehicle(
  text, text, text, text, date
) from public;
revoke all on function public.create_ambulance_trip(
  uuid, text, text, text, text
) from public;
revoke all on function public.advance_ambulance_trip(uuid, text, uuid)
  from public;

grant execute on function public.register_ambulance_vehicle(
  text, text, text, text, date
) to authenticated, service_role;
grant execute on function public.create_ambulance_trip(
  uuid, text, text, text, text
) to authenticated, service_role;
grant execute on function public.advance_ambulance_trip(uuid, text, uuid)
  to authenticated, service_role;

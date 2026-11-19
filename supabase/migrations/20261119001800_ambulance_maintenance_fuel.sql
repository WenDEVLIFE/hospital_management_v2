-- ============================================================================
-- SPMC HMS — ambulance maintenance and fuel
-- Migration 20261119001800. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- ambulance_maintenance and ambulance_fuel_records existed with read access
-- only. Fleet records could be displayed but never written, so the maintenance
-- tab was a dead end and the odometer never moved. These RPCs add the writes.

create or replace function public.record_ambulance_maintenance(
  p_vehicle_id uuid,
  p_maintenance_type text,
  p_performed_at timestamptz default now(),
  p_cost numeric default 0,
  p_notes text default null,
  p_next_due_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_type text := btrim(coalesce(p_maintenance_type, ''));
  v_performed timestamptz := coalesce(p_performed_at, now());
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('ambulance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_type = '' then
    raise exception 'Enter the maintenance type' using errcode = '22023';
  end if;

  if coalesce(p_cost, 0) < 0 then
    raise exception 'Cost cannot be negative' using errcode = '22023';
  end if;

  if p_next_due_date is not null and p_next_due_date < v_performed::date then
    raise exception 'The next service date cannot be before the service date'
      using errcode = '22023';
  end if;

  if not exists (select 1 from public.ambulance_vehicles where id = p_vehicle_id) then
    raise exception 'Ambulance not found' using errcode = '22023';
  end if;

  insert into public.ambulance_maintenance (
    vehicle_id, maintenance_type, performed_at, performed_by,
    cost, notes, next_due_date
  )
  values (
    p_vehicle_id,
    v_type,
    v_performed,
    v_actor,
    coalesce(p_cost, 0),
    nullif(btrim(coalesce(p_notes, '')), ''),
    p_next_due_date
  )
  returning id into v_id;

  update public.ambulance_vehicles
  set last_service_date = v_performed::date,
      next_service_due = coalesce(p_next_due_date, next_service_due),
      updated_by = v_actor,
      updated_at = now()
  where id = p_vehicle_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'ambulance.maintenance.record', 'ambulance_vehicle', p_vehicle_id,
    'Recorded ambulance maintenance.',
    jsonb_build_object(
      'source', 'record_ambulance_maintenance',
      'maintenance_type', v_type,
      'cost', coalesce(p_cost, 0),
      'next_due_date', p_next_due_date
    )
  );

  return v_id;
end;
$$;

create or replace function public.record_ambulance_fuel(
  p_vehicle_id uuid,
  p_liters numeric,
  p_cost numeric default 0,
  p_odometer_km numeric default null,
  p_fuel_level numeric default null,
  p_fueled_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_vehicle public.ambulance_vehicles%rowtype;
  v_odometer numeric;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('ambulance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_vehicle
  from public.ambulance_vehicles
  where id = p_vehicle_id
  for update;

  if not found then
    raise exception 'Ambulance not found' using errcode = '22023';
  end if;

  if p_liters is null or p_liters <= 0 then
    raise exception 'Enter the liters purchased' using errcode = '22023';
  end if;

  if coalesce(p_cost, 0) < 0 then
    raise exception 'Cost cannot be negative' using errcode = '22023';
  end if;

  v_odometer := coalesce(p_odometer_km, v_vehicle.odometer_km);

  if v_odometer < v_vehicle.odometer_km then
    raise exception 'The odometer cannot go backwards from % km', v_vehicle.odometer_km
      using errcode = '22023';
  end if;

  if p_fuel_level is not null and (p_fuel_level < 0 or p_fuel_level > 100) then
    raise exception 'The fuel level must be between 0 and 100' using errcode = '22023';
  end if;

  insert into public.ambulance_fuel_records (
    vehicle_id, fueled_at, liters, cost, odometer_km, recorded_by
  )
  values (
    p_vehicle_id,
    coalesce(p_fueled_at, now()),
    p_liters,
    coalesce(p_cost, 0),
    v_odometer,
    v_actor
  )
  returning id into v_id;

  update public.ambulance_vehicles
  set odometer_km = v_odometer,
      fuel_level = coalesce(p_fuel_level, fuel_level),
      updated_by = v_actor,
      updated_at = now()
  where id = p_vehicle_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'ambulance.fuel.record', 'ambulance_vehicle', p_vehicle_id,
    'Recorded ambulance fuel purchase.',
    jsonb_build_object(
      'source', 'record_ambulance_fuel',
      'liters', p_liters,
      'cost', coalesce(p_cost, 0),
      'odometer_km', v_odometer,
      'fuel_level', p_fuel_level
    )
  );

  return v_id;
end;
$$;

revoke all on function public.record_ambulance_maintenance(
  uuid, text, timestamptz, numeric, text, date
) from public;
grant execute on function public.record_ambulance_maintenance(
  uuid, text, timestamptz, numeric, text, date
) to authenticated, service_role;

revoke all on function public.record_ambulance_fuel(
  uuid, numeric, numeric, numeric, numeric, timestamptz
) from public;
grant execute on function public.record_ambulance_fuel(
  uuid, numeric, numeric, numeric, numeric, timestamptz
) to authenticated, service_role;

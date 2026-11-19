-- ============================================================================
-- SPMC HMS — equipment and maintenance
-- Migration 20261119001100. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Asset register, work orders, preventive schedules, calibrations and history.
-- Completing a work order writes history and returns the asset to service;
-- recording a calibration moves the next calibration due date.

create table if not exists public.equipment_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.medical_equipment (
  id uuid primary key default gen_random_uuid(),

  asset_number text not null unique,
  name text not null,
  category_id uuid references public.equipment_categories(id) on delete restrict,

  manufacturer text not null default '',
  model text not null default '',
  serial_number text not null unique,

  department_id uuid references public.departments(id) on delete restrict,
  location text not null default '',

  status text not null default 'available'
    check (status in ('available', 'in_use', 'maintenance', 'out_of_service', 'retired')),

  purchase_date date,
  warranty_expiry date,
  next_maintenance_due date,
  next_calibration_due date,

  notes text,
  is_active boolean not null default true,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment_work_orders (
  id uuid primary key default gen_random_uuid(),

  work_order_number text not null unique,
  equipment_id uuid not null
    references public.medical_equipment(id) on delete restrict,

  issue_description text not null,
  priority text not null default 'routine'
    check (priority in ('routine', 'urgent', 'emergency')),
  status text not null default 'requested'
    check (status in ('requested', 'scheduled', 'in_progress', 'on_hold', 'completed', 'cancelled')),

  requested_by uuid not null references public.profiles(id) on delete restrict,
  assigned_technician_id uuid references public.profiles(id) on delete restrict,

  requested_at timestamptz not null default now(),
  scheduled_for timestamptz,
  completed_at timestamptz,

  resolution_notes text,
  parts_used text,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment_maintenance_schedules (
  id uuid primary key default gen_random_uuid(),

  equipment_id uuid not null
    references public.medical_equipment(id) on delete cascade,

  maintenance_type text not null
    check (maintenance_type in ('preventive', 'calibration', 'inspection', 'repair')),
  interval_days integer not null check (interval_days > 0),
  due_date date not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'overdue')),

  created_at timestamptz not null default now()
);

create table if not exists public.equipment_calibrations (
  id uuid primary key default gen_random_uuid(),

  equipment_id uuid not null
    references public.medical_equipment(id) on delete cascade,

  calibration_type text not null,
  performed_at timestamptz not null default now(),
  performed_by uuid references public.profiles(id) on delete restrict,
  result text not null
    check (result in ('passed', 'failed', 'adjusted')),
  next_due_date date,
  certificate_number text not null,
  notes text
);

create table if not exists public.equipment_maintenance_history (
  id uuid primary key default gen_random_uuid(),

  equipment_id uuid not null
    references public.medical_equipment(id) on delete cascade,

  event_type text not null
    check (event_type in ('preventive', 'calibration', 'inspection', 'repair')),
  performed_at timestamptz not null default now(),
  performed_by uuid references public.profiles(id) on delete restrict,
  summary text not null,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  notes text
);

create index if not exists idx_equipment_status
  on public.medical_equipment(status, next_maintenance_due);
create index if not exists idx_work_orders_status
  on public.equipment_work_orders(status, priority);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('equipment.view', 'View the asset register, work orders and calibrations.'),
  ('equipment.manage', 'Register equipment and manage maintenance.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('equipment.view', 'equipment.manage')
where r.slug = 'hospital_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'equipment.view'
where r.slug in ('physician', 'nurse', 'inventory_staff')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'equipment_categories',
    'medical_equipment',
    'equipment_work_orders',
    'equipment_maintenance_schedules',
    'equipment_calibrations',
    'equipment_maintenance_history'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''equipment.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Register equipment
-- ----------------------------------------------------------------------------
create or replace function public.register_equipment(
  p_asset_number text,
  p_name text,
  p_serial_number text,
  p_category_id uuid default null,
  p_department_id uuid default null,
  p_manufacturer text default null,
  p_model text default null,
  p_location text default null,
  p_next_maintenance_due date default null,
  p_next_calibration_due date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_asset text := upper(btrim(coalesce(p_asset_number, '')));
  v_serial text := btrim(coalesce(p_serial_number, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('equipment.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_asset = '' or btrim(coalesce(p_name, '')) = '' or v_serial = '' then
    raise exception 'Asset number, name and serial number are required'
      using errcode = '22023';
  end if;

  insert into public.medical_equipment (
    asset_number, name, category_id, department_id,
    manufacturer, model, serial_number, location,
    next_maintenance_due, next_calibration_due, created_by
  )
  values (
    v_asset,
    btrim(p_name),
    p_category_id,
    p_department_id,
    coalesce(nullif(btrim(coalesce(p_manufacturer, '')), ''), 'Unspecified'),
    coalesce(nullif(btrim(coalesce(p_model, '')), ''), 'Unspecified'),
    v_serial,
    coalesce(nullif(btrim(coalesce(p_location, '')), ''), 'Biomedical store'),
    p_next_maintenance_due,
    p_next_calibration_due,
    v_actor
  )
  returning id into v_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'equipment.register', 'medical_equipment', v_id,
    'Registered medical equipment.',
    jsonb_build_object('source', 'register_equipment', 'asset_number', v_asset)
  );

  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Create a work order
-- ----------------------------------------------------------------------------
create or replace function public.create_equipment_work_order(
  p_equipment_id uuid,
  p_issue_description text,
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
  v_id uuid;
  v_number text;
  v_status text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('equipment.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status into v_status
  from public.medical_equipment
  where id = p_equipment_id;

  if not found then
    raise exception 'Equipment not found' using errcode = '22023';
  end if;

  if v_status = 'retired' then
    raise exception 'Retired equipment cannot receive work orders' using errcode = '22023';
  end if;

  if btrim(coalesce(p_issue_description, '')) = '' then
    raise exception 'Describe the issue' using errcode = '22023';
  end if;

  if p_priority not in ('routine', 'urgent', 'emergency') then
    raise exception 'Unsupported priority' using errcode = '22023';
  end if;

  v_number := public.generate_reference_number('WO');

  insert into public.equipment_work_orders (
    work_order_number, equipment_id, issue_description, priority, notes, requested_by
  )
  values (
    v_number, p_equipment_id, btrim(p_issue_description), p_priority,
    nullif(btrim(coalesce(p_notes, '')), ''), v_actor
  )
  returning id into v_id;

  if v_status = 'available' then
    update public.medical_equipment
    set status = 'maintenance', updated_by = v_actor
    where id = p_equipment_id;
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'equipment.work_order.create', 'equipment_work_order', v_id,
    'Raised an equipment work order.',
    jsonb_build_object('source', 'create_equipment_work_order', 'work_order', v_number, 'priority', p_priority)
  );

  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Complete a work order
-- ----------------------------------------------------------------------------
create or replace function public.complete_equipment_work_order(
  p_work_order_id uuid,
  p_resolution_notes text,
  p_parts_used text default null,
  p_cost numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.equipment_work_orders%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('equipment.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_order
  from public.equipment_work_orders
  where id = p_work_order_id
  for update;

  if not found then
    raise exception 'Work order not found' using errcode = '22023';
  end if;

  if v_order.status = 'completed' then
    raise exception 'This work order is already completed' using errcode = '22023';
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'This work order is cancelled' using errcode = '22023';
  end if;

  if btrim(coalesce(p_resolution_notes, '')) = '' then
    raise exception 'Record the resolution before completing' using errcode = '22023';
  end if;

  update public.equipment_work_orders
  set status = 'completed',
      completed_at = now(),
      resolution_notes = btrim(p_resolution_notes),
      parts_used = nullif(btrim(coalesce(p_parts_used, '')), ''),
      cost = coalesce(p_cost, 0),
      updated_at = now()
  where id = p_work_order_id;

  update public.medical_equipment
  set status = 'available',
      updated_by = v_actor
  where id = v_order.equipment_id
    and status = 'maintenance';

  insert into public.equipment_maintenance_history (
    equipment_id, event_type, performed_by, summary, cost, notes
  )
  values (
    v_order.equipment_id,
    'repair',
    v_actor,
    'Work order ' || v_order.work_order_number || ' completed.',
    coalesce(p_cost, 0),
    btrim(p_resolution_notes)
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'equipment.work_order.complete', 'equipment_work_order', p_work_order_id,
    'Completed an equipment work order.',
    jsonb_build_object('source', 'complete_equipment_work_order', 'cost', coalesce(p_cost, 0))
  );

  return p_work_order_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Record a calibration
-- ----------------------------------------------------------------------------
create or replace function public.record_equipment_calibration(
  p_equipment_id uuid,
  p_calibration_type text,
  p_result text,
  p_certificate_number text,
  p_next_due_date date default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('equipment.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.medical_equipment where id = p_equipment_id) then
    raise exception 'Equipment not found' using errcode = '22023';
  end if;

  if p_result not in ('passed', 'failed', 'adjusted') then
    raise exception 'Unsupported calibration result' using errcode = '22023';
  end if;

  if btrim(coalesce(p_certificate_number, '')) = '' then
    raise exception 'A certificate number is required' using errcode = '22023';
  end if;

  insert into public.equipment_calibrations (
    equipment_id, calibration_type, performed_by, result,
    next_due_date, certificate_number, notes
  )
  values (
    p_equipment_id,
    coalesce(nullif(btrim(p_calibration_type), ''), 'Routine calibration'),
    v_actor,
    p_result,
    p_next_due_date,
    btrim(p_certificate_number),
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_id;

  update public.medical_equipment
  set next_calibration_due = coalesce(p_next_due_date, next_calibration_due),
      status = case when p_result = 'failed' then 'out_of_service'::text else status end,
      updated_by = v_actor
  where id = p_equipment_id;

  insert into public.equipment_maintenance_history (
    equipment_id, event_type, performed_by, summary, notes
  )
  values (
    p_equipment_id, 'calibration', v_actor,
    'Calibration ' || p_result || ' (' || btrim(p_certificate_number) || ').',
    nullif(btrim(coalesce(p_notes, '')), '')
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'equipment.calibration.record', 'equipment_calibration', v_id,
    'Recorded an equipment calibration.',
    jsonb_build_object('source', 'record_equipment_calibration', 'result', p_result)
  );

  return v_id;
end;
$$;

revoke all on function public.register_equipment(
  text, text, text, uuid, uuid, text, text, text, date, date
) from public;
revoke all on function public.create_equipment_work_order(
  uuid, text, text, text
) from public;
revoke all on function public.complete_equipment_work_order(
  uuid, text, text, numeric
) from public;
revoke all on function public.record_equipment_calibration(
  uuid, text, text, text, date, text
) from public;

grant execute on function public.register_equipment(
  text, text, text, uuid, uuid, text, text, text, date, date
) to authenticated, service_role;
grant execute on function public.create_equipment_work_order(
  uuid, text, text, text
) to authenticated, service_role;
grant execute on function public.complete_equipment_work_order(
  uuid, text, text, numeric
) to authenticated, service_role;
grant execute on function public.record_equipment_calibration(
  uuid, text, text, text, date, text
) to authenticated, service_role;

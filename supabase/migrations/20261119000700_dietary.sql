-- ============================================================================
-- SPMC HMS — dietary
-- Migration 20261119000700. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Diet catalogue, per-patient dietary assessments and the meal tray queue.
-- Creating an assessment also generates today's meal orders from its schedule,
-- and allergens are copied onto each tray so the kitchen sees them.

create table if not exists public.diet_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.therapeutic_diets (
  id uuid primary key default gen_random_uuid(),

  category_id uuid not null
    references public.diet_categories(id) on delete restrict,

  name text not null,
  indication text not null default '',
  restrictions text not null default '',
  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  unique (category_id, name)
);

create table if not exists public.dietary_orders (
  id uuid primary key default gen_random_uuid(),

  order_number text not null unique,
  patient_id uuid not null references public.patients(id) on delete restrict,

  category_id uuid not null
    references public.diet_categories(id) on delete restrict,
  therapeutic_diet_id uuid not null
    references public.therapeutic_diets(id) on delete restrict,

  allergies text[] not null default '{}',
  restrictions text[] not null default '{}',
  assessment_notes text,

  meal_schedule text[] not null default '{breakfast,lunch,dinner}',

  status text not null default 'active'
    check (status in ('active', 'discontinued', 'pending')),

  ordered_by uuid not null references public.profiles(id) on delete restrict,
  assessed_at timestamptz not null default now(),

  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_orders (
  id uuid primary key default gen_random_uuid(),

  meal_number text not null unique,

  dietary_order_id uuid not null
    references public.dietary_orders(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,

  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  scheduled_for timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'preparing', 'ready', 'delivered', 'cancelled')),

  allergens text[] not null default '{}',
  notes text,

  prepared_by uuid references public.profiles(id) on delete restrict,
  delivered_at timestamptz,
  delivered_by uuid references public.profiles(id) on delete restrict,

  ward text not null default '',
  room text not null default '',
  bed text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (dietary_order_id, meal_type, scheduled_for)
);

create index if not exists idx_meal_orders_schedule
  on public.meal_orders(scheduled_for, status);
create index if not exists idx_dietary_orders_patient
  on public.dietary_orders(patient_id, status);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('dietary.view', 'View dietary assessments and the meal queue.'),
  ('dietary.manage', 'Record dietary assessments and advance meal orders.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('dietary.view', 'dietary.manage')
where r.slug in ('hospital_admin', 'nurse')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'dietary.view'
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
    'diet_categories',
    'therapeutic_diets',
    'dietary_orders',
    'meal_orders'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''dietary.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Record a dietary assessment and its meal orders
-- ----------------------------------------------------------------------------
create or replace function public.create_dietary_order(
  p_patient_id uuid,
  p_therapeutic_diet_id uuid,
  p_allergies text[] default '{}',
  p_restrictions text[] default '{}',
  p_meal_schedule text[] default '{breakfast,lunch,dinner}',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_diet public.therapeutic_diets%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_schedule text[];
  v_meal text;
  v_meal_at timestamptz;
  v_slot integer := 0;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('dietary.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  select * into v_diet
  from public.therapeutic_diets
  where id = p_therapeutic_diet_id;

  if not found then
    raise exception 'Therapeutic diet not found' using errcode = '22023';
  end if;

  if not v_diet.is_active then
    raise exception 'This therapeutic diet is inactive' using errcode = '22023';
  end if;

  v_schedule := coalesce(nullif(p_meal_schedule, '{}'), array['breakfast', 'lunch', 'dinner']);

  foreach v_meal in array v_schedule loop
    if v_meal not in ('breakfast', 'lunch', 'dinner', 'snack') then
      raise exception 'Unsupported meal type: %', v_meal using errcode = '22023';
    end if;
  end loop;

  v_order_number := public.generate_reference_number('DIET');

  insert into public.dietary_orders (
    order_number, patient_id, category_id, therapeutic_diet_id,
    allergies, restrictions, assessment_notes, meal_schedule,
    status, ordered_by
  )
  values (
    v_order_number,
    p_patient_id,
    v_diet.category_id,
    p_therapeutic_diet_id,
    coalesce(p_allergies, '{}'),
    coalesce(p_restrictions, '{}'),
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_schedule,
    'active',
    v_actor
  )
  returning id into v_order_id;

  foreach v_meal in array v_schedule loop
    v_meal_at := date_trunc('day', now()) + (
      case v_meal
        when 'breakfast' then interval '7 hours'
        when 'lunch' then interval '12 hours'
        when 'dinner' then interval '18 hours'
        else interval '15 hours'
      end
    );

    if v_meal_at < now() then
      v_meal_at := v_meal_at + interval '1 day';
    end if;

    v_slot := v_slot + 1;

    insert into public.meal_orders (
      meal_number, dietary_order_id, patient_id, meal_type,
      scheduled_for, status, allergens, ward, room, bed
    )
    values (
      public.generate_reference_number('MEAL'),
      v_order_id,
      p_patient_id,
      v_meal,
      v_meal_at,
      'scheduled',
      coalesce(p_allergies, '{}'),
      '',
      '',
      ''
    )
    on conflict (dietary_order_id, meal_type, scheduled_for) do nothing;
  end loop;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'dietary.order.create',
    'dietary_order',
    v_order_id,
    'Recorded a dietary assessment.',
    jsonb_build_object(
      'source', 'create_dietary_order',
      'order_number', v_order_number,
      'meals', v_schedule
    )
  );

  return v_order_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Advance a meal order
-- ----------------------------------------------------------------------------
create or replace function public.advance_meal_order(
  p_meal_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_meal public.meal_orders%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('dietary.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_status not in ('preparing', 'ready', 'delivered', 'cancelled') then
    raise exception 'Unsupported meal status' using errcode = '22023';
  end if;

  select * into v_meal
  from public.meal_orders
  where id = p_meal_id
  for update;

  if not found then
    raise exception 'Meal order not found' using errcode = '22023';
  end if;

  if v_meal.status = 'delivered' then
    raise exception 'This meal has already been delivered' using errcode = '22023';
  end if;

  update public.meal_orders
  set status = p_status,
      prepared_by = case
        when p_status in ('preparing', 'ready') then v_actor
        else prepared_by
      end,
      delivered_at = case when p_status = 'delivered' then now() else delivered_at end,
      delivered_by = case when p_status = 'delivered' then v_actor else delivered_by end,
      updated_at = now()
  where id = p_meal_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'dietary.meal.' || p_status,
    'meal_order',
    p_meal_id,
    'Updated a meal order.',
    jsonb_build_object('source', 'advance_meal_order', 'status', p_status)
  );

  return p_meal_id;
end;
$$;

revoke all on function public.create_dietary_order(
  uuid, uuid, text[], text[], text[], text
) from public;
revoke all on function public.advance_meal_order(uuid, text) from public;

grant execute on function public.create_dietary_order(
  uuid, uuid, text[], text[], text[], text
) to authenticated, service_role;
grant execute on function public.advance_meal_order(uuid, text)
  to authenticated, service_role;

-- ============================================================================
-- SPMC HMS — database functions
-- Migration 017 of 22. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

-- 16.1 Automatic updated_at / updated_by maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();

  -- Tables with accountability columns pass 'updated_by' as a trigger argument,
  -- so this function never touches a column that does not exist. Preserve the
  -- previous value when no authenticated user is present (migrations, seeds,
  -- and privileged maintenance jobs).
  if tg_nargs > 0 and tg_argv[0] = 'updated_by' then
    new.updated_by = coalesce(auth.uid(), new.updated_by);
  end if;

  return new;
end;
$$;

-- 16.2 Profile bootstrap on Supabase Auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 16.3 RBAC helpers used by Row Level Security policies
create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.slug = p_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.has_role('super_admin')
    or public.has_role('hospital_admin');
$$;

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp
        on rp.role_id = ur.role_id
      join public.permissions p
        on p.id = rp.permission_id
      where ur.user_id = auth.uid()
        and p.slug = p_permission
    );
$$;

create or replace function public.can_access_patient(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_admin()
    or (
      public.has_permission('patient.view')
      and exists (
        select 1
        from public.patient_care_assignments pca
        join public.staff_profiles sp
          on sp.id = pca.staff_id
        where pca.patient_id = p_patient_id
          and sp.user_id = auth.uid()
          and pca.ended_at is null
      )
    );
$$;

-- 16.4 Controlled reference number generation
-- Produces PREFIX-YYYY-NNNN values (for example MRN-2026-0001). The counter is
-- stored per prefix and incremented atomically, so registration and order
-- creation cannot produce duplicate identifiers.
create or replace function public.generate_reference_number(p_prefix text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prefix text;
  v_next bigint;
  v_year text;
begin
  v_prefix := upper(btrim(coalesce(p_prefix, '')));

  if v_prefix !~ '^[A-Z0-9]{2,8}$' then
    raise exception 'Invalid reference prefix: %', p_prefix
      using errcode = '22023';
  end if;

  insert into public.reference_sequences as seq (prefix, last_value)
  values (v_prefix, 1)
  on conflict (prefix) do update
    set last_value = seq.last_value + 1,
        updated_at = now()
  returning last_value into v_next;

  v_year := to_char(now() at time zone 'Asia/Manila', 'YYYY');

  return format('%s-%s-%s', v_prefix, v_year, lpad(v_next::text, 4, '0'));
end;
$$;

revoke all on function public.generate_reference_number(text) from public;
grant execute on function public.generate_reference_number(text)
  to authenticated, service_role;

-- 17.1 updated_at trigger on every mutable table
do $$
declare
  t text;
  v_has_updated_by boolean;
begin
  foreach t in array array[
    'public.profiles',
    'public.departments',
    'public.staff_profiles',
    'public.physicians',
    'public.rooms',
    'public.beds',
    'public.patients',
    'public.emergency_contacts',
    'public.patient_allergies',
    'public.appointments',
    'public.admissions',
    'public.encounters',
    'public.clinical_notes',
    'public.laboratory_tests',
    'public.laboratory_orders',
    'public.laboratory_results',
    'public.radiology_orders',
    'public.radiology_reports',
    'public.medications',
    'public.prescriptions',
    'public.inventory_categories',
    'public.inventory_items',
    'public.invoices'
  ]
  loop
    select exists (
      select 1
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = split_part(t, '.', 2)
        and a.attname = 'updated_by'
        and a.attnum > 0
        and not a.attisdropped
    )
    into v_has_updated_by;

    execute format('drop trigger if exists set_updated_at on %s', t);
    execute format(
      'create trigger set_updated_at before update on %s
         for each row execute function public.set_updated_at(%s)',
      t,
      case
        when v_has_updated_by then quote_literal('updated_by')
        else ''
      end
    );
  end loop;
end;
$$;

-- 17.2 Auth user -> application profile
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

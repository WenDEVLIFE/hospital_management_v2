-- ============================================================================
-- SPMC Hospital Management System — Schema Hardening Migration
-- ============================================================================
-- Apply this to a database that was created by the pre-hardening
-- supabase/schema.sql. It upgrades the existing tables in place:
--
--   [x] status text + check -> PostgreSQL enum types
--   [x] created_by / updated_by accountability columns
--   [x] generate_reference_number() + reference_sequences
--   [x] explicit on-delete rule on every public foreign key
--
-- The script is idempotent and safe to re-run.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> paste this file -> Run
--   or: npx supabase db execute --file supabase/upgrade/20261112000000_schema_hardening.sql
--
-- DO NOT run this on an empty database. For a fresh database, run
-- supabase/schema.sql instead.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------
-- CREATE TYPE has no IF NOT EXISTS, so each type is guarded independently.

do $$
begin
  begin
    create type public.bed_status as enum (
      'available', 'occupied', 'maintenance', 'reserved'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.patient_registration_status as enum (
      'active', 'inactive', 'archived'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.appointment_status as enum (
      'scheduled', 'confirmed', 'waiting', 'in_consultation',
      'completed', 'cancelled', 'no_show'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.admission_status as enum (
      'admitted', 'transferred', 'discharged', 'cancelled'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.encounter_status as enum (
      'open', 'in_progress', 'completed', 'cancelled'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.clinical_note_status as enum (
      'draft', 'finalized', 'amended'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.laboratory_priority as enum (
      'routine', 'urgent', 'stat'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.laboratory_order_status as enum (
      'pending', 'collection', 'processing', 'completed', 'cancelled'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.laboratory_specimen_status as enum (
      'pending', 'collected', 'rejected'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.laboratory_verification_status as enum (
      'pending', 'verified', 'rejected'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.radiology_order_status as enum (
      'pending', 'scheduled', 'in_progress', 'completed', 'cancelled'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.radiology_report_status as enum (
      'draft', 'verified', 'amended'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.prescription_status as enum (
      'pending', 'partially_dispensed', 'dispensed', 'cancelled'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.stock_transaction_type as enum (
      'stock_in', 'stock_out', 'adjustment', 'transfer', 'dispensing'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.invoice_status as enum (
      'unpaid', 'partially_paid', 'paid', 'cancelled', 'refunded'
    );
  exception when duplicate_object then null;
  end;

  begin
    create type public.payment_status as enum (
      'pending', 'completed', 'failed', 'refunded', 'cancelled'
    );
  exception when duplicate_object then null;
  end;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. CONVERT STATE COLUMNS TO ENUMS
-- ----------------------------------------------------------------------------
-- Reporting views project several of these columns. PostgreSQL refuses to
-- ALTER COLUMN TYPE while a view depends on the column, so drop the affected
-- views first and recreate them after the conversion.

drop view if exists public.v_bed_availability;
drop view if exists public.v_patient_summary;
drop view if exists public.v_appointment_summary;
drop view if exists public.v_admission_census;
drop view if exists public.v_laboratory_summary;
drop view if exists public.v_pharmacy_summary;
drop view if exists public.v_billing_summary;
drop view if exists public.v_inventory_summary;

-- For each column: drop the old check constraint, drop the text default, cast
-- through text, then restore the original default. Columns that are already
-- the target enum are skipped, which keeps the migration re-runnable.

do $$
declare
  r record;
  v_check record;
begin
  for r in
    select *
    from (values
      ('beds',                  'status',              'bed_status',                   'available'),
      ('patients',              'registration_status', 'patient_registration_status',  'active'),
      ('appointments',          'status',              'appointment_status',           'scheduled'),
      ('admissions',            'status',              'admission_status',             'admitted'),
      ('encounters',            'clinical_status',     'encounter_status',             'open'),
      ('clinical_notes',        'status',              'clinical_note_status',         'draft'),
      ('laboratory_orders',     'priority',            'laboratory_priority',          'routine'),
      ('laboratory_orders',     'status',              'laboratory_order_status',      'pending'),
      ('laboratory_specimens',  'collection_status',   'laboratory_specimen_status',   'pending'),
      ('laboratory_results',    'verification_status', 'laboratory_verification_status','pending'),
      ('radiology_orders',      'status',              'radiology_order_status',       'pending'),
      ('radiology_reports',     'report_status',       'radiology_report_status',      'draft'),
      ('prescriptions',         'status',              'prescription_status',          'pending'),
      ('stock_transactions',    'transaction_type',    'stock_transaction_type',       null::text),
      ('invoices',              'status',              'invoice_status',               'unpaid'),
      ('payments',              'payment_status',      'payment_status',               'completed')
    ) as v(tbl, col, typ, dflt)
  loop
    if exists (
      select 1
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = r.tbl
        and c.column_name = r.col
        and c.udt_name::text <> r.typ
    ) then
      -- Drop any single-column check constraint that covers this column. The
      -- old schema used default names, but this avoids depending on them.
      for v_check in
        select con.conname
        from pg_constraint con
        join pg_attribute a
          on a.attrelid = con.conrelid
         and a.attnum = any (con.conkey)
        where con.conrelid = format('public.%I', r.tbl)::regclass
          and con.contype = 'c'
          and a.attname = r.col
      loop
        execute format(
          'alter table public.%I drop constraint %I',
          r.tbl, v_check.conname
        );
      end loop;

      execute format(
        'alter table public.%I alter column %I drop default',
        r.tbl, r.col
      );

      execute format(
        'alter table public.%I alter column %I type public.%I using %I::text::public.%I',
        r.tbl, r.col, r.typ, r.col, r.typ
      );

      if r.dflt is not null then
        execute format(
          'alter table public.%I alter column %I set default %L',
          r.tbl, r.col, r.dflt
        );
      end if;
    end if;
  end loop;
end;
$$;

-- Recreate the reporting views against the new enum column types.
create or replace view public.v_bed_availability
with (security_invoker = true)
as
select
  b.id as bed_id,
  b.bed_number,
  b.status,
  r.room_number,
  d.name as department_name
from public.beds b
join public.rooms r on r.id = b.room_id
join public.departments d on d.id = r.department_id;

create or replace view public.v_patient_summary
with (security_invoker = true)
as
select
  p.id,
  p.medical_record_number,
  p.first_name,
  p.middle_name,
  p.last_name,
  p.date_of_birth,
  p.sex,
  p.registration_status,
  p.registration_date
from public.patients p;

create or replace view public.v_appointment_summary
with (security_invoker = true)
as
select
  a.id,
  a.appointment_number,
  a.patient_id,
  a.scheduled_at,
  a.duration_minutes,
  a.status,
  d.name as department_name,
  sp.first_name || ' ' || sp.last_name as physician_name
from public.appointments a
join public.departments d on d.id = a.department_id
left join public.physicians ph on ph.id = a.physician_id
left join public.staff_profiles sp on sp.id = ph.staff_id;

create or replace view public.v_admission_census
with (security_invoker = true)
as
select
  ad.id,
  ad.admission_number,
  ad.patient_id,
  ad.status,
  ad.admission_date,
  ad.discharge_date,
  d.name as department_name
from public.admissions ad
join public.departments d on d.id = ad.department_id;

create or replace view public.v_laboratory_summary
with (security_invoker = true)
as
select
  lo.id,
  lo.order_number,
  lo.patient_id,
  lo.status,
  lo.priority,
  lo.ordered_at,
  count(loi.id) as item_count
from public.laboratory_orders lo
left join public.laboratory_order_items loi on loi.order_id = lo.id
group by lo.id;

create or replace view public.v_pharmacy_summary
with (security_invoker = true)
as
select
  pr.id,
  pr.prescription_number,
  pr.patient_id,
  pr.status,
  pr.prescription_date,
  count(pi.id) as item_count
from public.prescriptions pr
left join public.prescription_items pi on pi.prescription_id = pr.id
group by pr.id;

create or replace view public.v_billing_summary
with (security_invoker = true)
as
select
  i.id,
  i.invoice_number,
  i.patient_id,
  i.status,
  i.invoice_date,
  i.total_amount,
  i.amount_paid,
  i.balance
from public.invoices i;

create or replace view public.v_inventory_summary
with (security_invoker = true)
as
select
  ii.id,
  ii.item_code,
  ii.name,
  ii.unit,
  ii.reorder_level,
  c.name as category_name,
  coalesce(sum(ib.quantity_remaining), 0) as quantity_on_hand
from public.inventory_items ii
left join public.inventory_categories c on c.id = ii.category_id
left join public.inventory_batches ib on ib.item_id = ii.id
group by ii.id, c.name;

-- ----------------------------------------------------------------------------
-- 3. ACCOUNTABILITY COLUMNS
-- ----------------------------------------------------------------------------
-- Nullable so existing rows and seed data remain valid. RLS / transactional
-- functions are responsible for supplying the actor on new writes.

alter table public.departments
  add column if not exists created_by uuid references public.profiles(id) on delete restrict,
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.staff_profiles
  add column if not exists created_by uuid references public.profiles(id) on delete restrict,
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.physicians
  add column if not exists created_by uuid references public.profiles(id) on delete restrict,
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.staff_department_assignments
  add column if not exists created_by uuid references public.profiles(id) on delete restrict;

alter table public.rooms
  add column if not exists created_by uuid references public.profiles(id) on delete restrict,
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.beds
  add column if not exists created_by uuid references public.profiles(id) on delete restrict,
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.patients
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.emergency_contacts
  add column if not exists created_by uuid references public.profiles(id) on delete restrict,
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.patient_allergies
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.appointments
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.admissions
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.encounters
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.clinical_notes
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.laboratory_tests
  add column if not exists created_by uuid references public.profiles(id) on delete restrict,
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.laboratory_orders
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.laboratory_results
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.radiology_orders
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.radiology_reports
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.medications
  add column if not exists created_by uuid references public.profiles(id) on delete restrict,
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.prescriptions
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.inventory_categories
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references public.profiles(id) on delete restrict,
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.inventory_items
  add column if not exists created_by uuid references public.profiles(id) on delete restrict,
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

alter table public.inventory_batches
  add column if not exists created_by uuid references public.profiles(id) on delete restrict;

alter table public.invoices
  add column if not exists updated_by uuid references public.profiles(id) on delete restrict;

-- ----------------------------------------------------------------------------
-- 4. REFERENCE NUMBER SEQUENCES
-- ----------------------------------------------------------------------------

create table if not exists public.reference_sequences (
  prefix text primary key,

  last_value bigint not null default 0
    check (last_value >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. FUNCTIONS
-- ----------------------------------------------------------------------------

-- 5.1 Automatic updated_at / updated_by maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();

  if tg_nargs > 0 and tg_argv[0] = 'updated_by' then
    new.updated_by = coalesce(auth.uid(), new.updated_by);
  end if;

  return new;
end;
$$;

-- 5.2 Controlled reference number generation
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

-- ----------------------------------------------------------------------------
-- 6. UPDATED_AT TRIGGERS
-- ----------------------------------------------------------------------------
-- The function receives 'updated_by' only on tables that actually carry the
-- column, so it never references a missing field.

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

-- ----------------------------------------------------------------------------
-- 7. EXPLICIT FOREIGN KEY DELETE RULES
-- ----------------------------------------------------------------------------
-- Rebuild every public -> public foreign key so the rule is explicit.
-- Cascade is limited to auth identity, role join rows, staff assignment
-- history, and notifications. Everything else is RESTRICT.

do $$
declare
  c record;
  v_child_cols text;
  v_child_cols_raw text;
  v_parent_cols text;
  v_rule text;
begin
  for c in
    select
      con.conname,
      con.conrelid,
      con.confrelid,
      con.conkey,
      con.confkey
    from pg_constraint con
    join pg_namespace n on n.oid = con.connamespace
    join pg_class parent_rel on parent_rel.oid = con.confrelid
    join pg_namespace parent_ns on parent_ns.oid = parent_rel.relnamespace
    where con.contype = 'f'
      and n.nspname = 'public'
      and parent_ns.nspname = 'public'
  loop
    select
      string_agg(quote_ident(a.attname), ', ' order by u.ord),
      string_agg(a.attname, ',' order by u.ord)
    into v_child_cols, v_child_cols_raw
    from unnest(c.conkey) with ordinality as u(attnum, ord)
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = u.attnum;

    select string_agg(quote_ident(a.attname), ', ' order by u.ord)
    into v_parent_cols
    from unnest(c.confkey) with ordinality as u(attnum, ord)
    join pg_attribute a
      on a.attrelid = c.confrelid
     and a.attnum = u.attnum;

    v_rule := case
      when c.conrelid = 'public.role_permissions'::regclass then 'cascade'
      when c.conrelid = 'public.user_roles'::regclass
        and v_child_cols_raw <> 'granted_by' then 'cascade'
      when c.conrelid = 'public.staff_profiles'::regclass
        and v_child_cols_raw = 'user_id' then 'cascade'
      when c.conrelid = 'public.staff_department_assignments'::regclass
        and v_child_cols_raw = 'staff_id' then 'cascade'
      when c.conrelid = 'public.notifications'::regclass
        and v_child_cols_raw = 'user_id' then 'cascade'
      else 'restrict'
    end;

    execute format(
      'alter table %s drop constraint %I',
      c.conrelid::regclass,
      c.conname
    );

    execute format(
      'alter table %s add constraint %I foreign key (%s) references %s (%s) on delete %s',
      c.conrelid::regclass,
      c.conname,
      v_child_cols,
      c.confrelid::regclass,
      v_parent_cols,
      v_rule
    );
  end loop;
end;
$$;

-- ============================================================================
-- END
-- ============================================================================

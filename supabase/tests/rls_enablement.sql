-- ============================================================================
-- RLS enablement verification
-- ============================================================================
-- Run against a migrated database:
--   npx supabase db execute --file supabase/tests/rls_enablement.sql
-- or paste this file into the Supabase SQL Editor.
--
-- The script is read-only except for the final DO block, which raises an
-- exception if any public table is missing RLS.
-- ============================================================================

-- 1. Per-table status
select
  t.schemaname,
  t.tablename,
  t.rowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_tables t
join pg_class c
  on c.relname = t.tablename
 and c.relnamespace = (
   select oid
   from pg_namespace
   where nspname = t.schemaname
 )
where t.schemaname = 'public'
order by t.tablename;

-- 2. Tables with RLS disabled (expect zero rows)
select tablename
from pg_tables
where schemaname = 'public'
  and rowsecurity = false
order by tablename;

-- 3. Policy coverage (every table except reference_sequences)
select
  t.tablename,
  count(p.policyname) as policy_count
from pg_tables t
left join pg_policies p
  on p.schemaname = t.schemaname
 and p.tablename = t.tablename
where t.schemaname = 'public'
group by t.tablename
order by t.tablename;

-- 4. reference_sequences must have no direct policies
select count(*) as reference_sequence_policies
from pg_policies
where schemaname = 'public'
  and tablename = 'reference_sequences';

-- 5. Anonymous access checks (expect false)
select
  has_table_privilege('anon', 'public.patients', 'select') as anon_can_read_patients,
  has_table_privilege('anon', 'public.audit_logs', 'select') as anon_can_read_audit_logs,
  has_table_privilege('anon', 'public.reference_sequences', 'select') as anon_can_read_sequences;

-- 6. Hard failure when any public table lacks RLS
do $$
declare
  v_missing integer;
begin
  select count(*) into v_missing
  from pg_tables
  where schemaname = 'public'
    and rowsecurity = false;

  if v_missing > 0 then
    raise exception 'RLS is disabled on % public table(s)', v_missing
      using errcode = '42501';
  end if;

  raise notice 'RLS enablement check passed: every public table has RLS enabled.';
end;
$$;

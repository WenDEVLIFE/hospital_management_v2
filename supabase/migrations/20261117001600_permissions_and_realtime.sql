-- ============================================================================
-- SPMC HMS — permissions for the UI and realtime publication
-- Migration 039. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Effective permissions for the signed-in user
-- ----------------------------------------------------------------------------
create or replace function public.current_permissions()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct p.slug order by p.slug), array[]::text[])
  from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions p on p.id = rp.permission_id
  where ur.user_id = auth.uid();
$$;

revoke all on function public.current_permissions() from public;
grant execute on function public.current_permissions()
  to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Realtime
-- ----------------------------------------------------------------------------
-- Operational tables that benefit from live updates without exposing clinical
-- note content. Row visibility still comes from RLS on each table.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'appointments',
    'admissions',
    'beds',
    'emergency_visits',
    'surgery_cases',
    'laboratory_orders',
    'laboratory_results',
    'prescriptions',
    'notifications'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        v_table
      );
    end if;
  end loop;
end;
$$;

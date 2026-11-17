-- ============================================================================
-- SPMC HMS — realtime publication completion
-- Migration 042. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Migration 039 published the operational tables that existed at the time.
-- Payments and stock movements complete the SUPABASE.MD §25 list.

do $$
declare
  v_table text;
begin
  foreach v_table in array array['payments', 'stock_transactions']
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

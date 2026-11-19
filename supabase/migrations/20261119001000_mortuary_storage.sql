-- ============================================================================
-- SPMC HMS — mortuary storage units (reference infrastructure)
-- Migration 20261119001000. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- A mortuary cannot admit a body without a storage unit, so the physical units
-- ship with the schema rather than the demo seed.

insert into public.mortuary_storage_units (id, unit_number, location, status)
values
  ('f1000000-0000-4000-8000-000000000001', 'MU-01', 'Mortuary cold room', 'available'),
  ('f1000000-0000-4000-8000-000000000002', 'MU-02', 'Mortuary cold room', 'available'),
  ('f1000000-0000-4000-8000-000000000003', 'MU-03', 'Mortuary cold room', 'available'),
  ('f1000000-0000-4000-8000-000000000004', 'MU-04', 'Mortuary annex', 'available')
on conflict (id) do nothing;

-- ============================================================================
-- SPMC HMS — equipment categories (reference data)
-- Migration 20261119001200. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

insert into public.equipment_categories (id, name, description)
values
  ('e1000000-0000-4000-8000-000000000001', 'Imaging', 'Radiology and ultrasound equipment.'),
  ('e1000000-0000-4000-8000-000000000002', 'Monitoring', 'Vital signs and patient monitors.'),
  ('e1000000-0000-4000-8000-000000000003', 'Life support', 'Ventilators, defibrillators and infusion pumps.'),
  ('e1000000-0000-4000-8000-000000000004', 'Laboratory', 'Analysers and laboratory instruments.'),
  ('e1000000-0000-4000-8000-000000000005', 'Surgical', 'Operating theatre equipment.')
on conflict (id) do nothing;

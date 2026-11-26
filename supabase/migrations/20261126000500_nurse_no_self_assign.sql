-- ============================================================================
-- SPMC HMS — nurses cannot self-assign patients
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Assigning a patient is a clinical allocation made by a physician or an
-- administrator. Nurses receive assignments; they do not assign themselves.

delete from public.role_permissions rp
using public.roles r, public.permissions p
where rp.role_id = r.id
  and rp.permission_id = p.id
  and r.slug = 'nurse'
  and p.slug = 'nursing.assign';

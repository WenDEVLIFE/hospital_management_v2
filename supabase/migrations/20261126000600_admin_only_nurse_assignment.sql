-- ============================================================================
-- SPMC HMS — only administrators assign nurses to patients
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Patient-to-nurse allocation is an administrative decision. Nurses and
-- physicians do not receive nursing.assign; administrators pass through
-- is_admin().

delete from public.role_permissions rp
using public.roles r, public.permissions p
where rp.role_id = r.id
  and rp.permission_id = p.id
  and r.slug in ('nurse', 'physician')
  and p.slug = 'nursing.assign';

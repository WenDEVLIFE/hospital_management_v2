-- ============================================================================
-- SPMC HMS — nurse least-privilege cleanup
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- The nurse role is clinical-only. Remove non-nursing module grants so the
-- sidebar and route guard stay focused on ward work. Admin retains every
-- permission through is_admin().

delete from public.role_permissions rp
using public.roles r, public.permissions p
where rp.role_id = r.id
  and rp.permission_id = p.id
  and r.slug = 'nurse'
  and p.slug = any (array[
    'hr.view',
    'reports.view',
    'ambulance.view',
    'dietary.view',
    'housekeeping.view',
    'equipment.view',
    'mortuary.view',
    'insurance.view',
    'bed.view',
    'surgery.create',
    'surgery.update'
  ]);

-- ============================================================================
-- SPMC HMS — module view permissions
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Every sidebar entry now maps to a permission so the navigation can be
-- filtered per role. These slugs cover modules that previously had no gate.

insert into public.permissions (slug)
select slug
from unnest(array[
  'blood_bank.view',
  'insurance.view',
  'department.view',
  'ambulance.view',
  'dietary.view',
  'housekeeping.view',
  'equipment.view',
  'mortuary.view',
  'notification.view',
  'reports.view',
  'settings.view'
]) as slug
on conflict (slug) do nothing;

-- Administrators receive every new module permission. is_admin() already
-- bypasses checks; explicit rows keep the matrix inspectable.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'blood_bank.view', 'insurance.view', 'department.view', 'ambulance.view',
  'dietary.view', 'housekeeping.view', 'equipment.view', 'mortuary.view',
  'notification.view', 'reports.view', 'settings.view'
])
where r.slug in ('super_admin', 'hospital_admin')
on conflict do nothing;

-- Receptionist: front-desk insurance intake and ambulance dispatch.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'insurance.view', 'ambulance.view', 'notification.view', 'reports.view'
])
where r.slug = 'receptionist'
on conflict do nothing;

-- Physician: transfusion, transport, diet orders, and death documentation.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'blood_bank.view', 'ambulance.view', 'dietary.view', 'mortuary.view',
  'notification.view', 'reports.view'
])
where r.slug = 'physician'
on conflict do nothing;

-- Nurse: ward operations across transfusion, transport, diet, housekeeping,
-- equipment, mortuary, and notifications.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'blood_bank.view', 'ambulance.view', 'dietary.view', 'housekeeping.view',
  'equipment.view', 'mortuary.view', 'notification.view', 'reports.view'
])
where r.slug = 'nurse'
on conflict do nothing;

-- Laboratory staff: blood bank worklists.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'blood_bank.view', 'notification.view', 'reports.view'
])
where r.slug = 'laboratory_staff'
on conflict do nothing;

-- Radiology staff.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'notification.view', 'reports.view'
])
where r.slug = 'radiology_staff'
on conflict do nothing;

-- Pharmacist.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'notification.view', 'reports.view'
])
where r.slug = 'pharmacist'
on conflict do nothing;

-- Billing staff: insurance and PhilHealth claims.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'insurance.view', 'notification.view', 'reports.view'
])
where r.slug = 'billing_staff'
on conflict do nothing;

-- Inventory staff: equipment and maintenance items.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'equipment.view', 'notification.view', 'reports.view'
])
where r.slug = 'inventory_staff'
on conflict do nothing;

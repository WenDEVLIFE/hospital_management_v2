-- ============================================================================
-- SPMC Hospital Management System — demo seed
-- ============================================================================
-- Creates synthetic staff, patients, clinical, pharmacy, inventory, billing,
-- notification, and audit rows, plus 12 Supabase Auth users.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> paste this file -> Run
--   or: psql "$DATABASE_URL" -f supabase/seed.sql
--
-- DEMO LOGIN (all seeded users share the same password)
--   Password: SpmcDemo!2026
--   superadmin@spmc.test   super_admin
--   admin@spmc.test        hospital_admin
--   reception@spmc.test    receptionist
--   physician@spmc.test    physician
--   physician2@spmc.test   physician
--   nurse@spmc.test        nurse
--   nurse2@spmc.test       nurse
--   lab@spmc.test          laboratory_staff
--   radiology@spmc.test    radiology_staff
--   pharmacy@spmc.test     pharmacist
--   billing@spmc.test      billing_staff
--   inventory@spmc.test    inventory_staff
--
-- SAFETY
--   * Synthetic data only. No real patient information.
--   * Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING.
--   * Requires the schema and reference seed to be applied first.
--   * If @spmc.test users already exist under different ids, remove them first.
--   * Never run this against a production project.
-- ============================================================================

begin;

-- ============================================================================
-- 0. REFERENCE DATA
-- ============================================================================
-- Repeated from the reference seed so this file is self-contained and safe to
-- re-run on a project that already has the schema.

insert into public.departments (code, name)
values
  ('ER', 'Emergency Department'),
  ('OPD', 'Outpatient Department'),
  ('IPD', 'Inpatient Department'),
  ('LAB', 'Laboratory'),
  ('RAD', 'Radiology'),
  ('PHARM', 'Pharmacy'),
  ('BILL', 'Billing'),
  ('ADMIN', 'Administration')
on conflict (code) do nothing;

insert into public.roles (slug, name)
values
  ('super_admin', 'Super Administrator'),
  ('hospital_admin', 'Hospital Administrator'),
  ('receptionist', 'Receptionist'),
  ('physician', 'Physician / Doctor'),
  ('nurse', 'Nurse'),
  ('laboratory_staff', 'Laboratory Staff'),
  ('radiology_staff', 'Radiology Staff'),
  ('pharmacist', 'Pharmacist'),
  ('billing_staff', 'Billing Staff'),
  ('inventory_staff', 'Inventory Staff')
on conflict (slug) do nothing;

insert into public.permissions (slug)
select slug
from unnest(array[
  'system.admin',
  'system.settings.manage',
  'user.view',
  'user.create',
  'user.update',
  'user.deactivate',
  'role.manage',
  'audit.view',
  'patient.view',
  'patient.create',
  'patient.update',
  'patient.archive',
  'patient.search',
  'patient.export',
  'appointment.view',
  'appointment.create',
  'appointment.update',
  'appointment.cancel',
  'appointment.manage_schedule',
  'admission.view',
  'admission.create',
  'admission.update',
  'admission.transfer',
  'admission.discharge',
  'bed.view',
  'bed.manage',
  'medical_record.view',
  'medical_record.create',
  'medical_record.update',
  'medical_record.finalize',
  'medical_record.amend',
  'diagnosis.view',
  'diagnosis.create',
  'diagnosis.update',
  'vital_signs.view',
  'vital_signs.record',
  'nursing.view',
  'nursing.assessment.create',
  'nursing.notes.create',
  'nursing.notes.view',
  'laboratory.view',
  'laboratory.order.view',
  'laboratory.order.create',
  'laboratory.specimen.manage',
  'laboratory.result.create',
  'laboratory.result.verify',
  'radiology.view',
  'radiology.order.manage',
  'radiology.report.create',
  'radiology.report.verify',
  'pharmacy.view',
  'prescription.view',
  'prescription.create',
  'prescription.dispense',
  'medication.manage',
  'billing.view',
  'billing.invoice.create',
  'billing.invoice.update',
  'billing.payment.create',
  'billing.refund',
  'billing.report.view',
  'inventory.view',
  'inventory.item.manage',
  'inventory.stock.in',
  'inventory.stock.out',
  'inventory.stock.adjust',
  'inventory.report.view',
  'reports.patient.view',
  'reports.admission.view',
  'reports.appointment.view',
  'reports.financial.view',
  'reports.inventory.view',
  'reports.laboratory.view'
]) as slug
on conflict (slug) do nothing;

insert into public.laboratory_tests (
  test_code, test_name, category, description, specimen_type
)
values
  ('CBC',   'Complete Blood Count', 'Hematology',          'Complete blood count with differential.',        'Whole blood'),
  ('UA',    'Urinalysis',           'Clinical Microscopy', 'Macroscopic and microscopic urine examination.', 'Urine'),
  ('FEC',   'Fecalysis',            'Clinical Microscopy', 'Fecal examination for parasites and occult blood.', 'Stool'),
  ('CHEM',  'Blood Chemistry',      'Clinical Chemistry',  'Serum chemistry panel.',                         'Serum'),
  ('LIPID', 'Lipid Profile',        'Clinical Chemistry',  'Total cholesterol, HDL, LDL, and triglycerides.', 'Serum'),
  ('FBS',   'Blood Glucose',        'Clinical Chemistry',  'Fasting or random blood glucose.',               'Blood'),
  ('PT',    'Pregnancy Test',       'Clinical Microscopy', 'Urine hCG pregnancy test.',                      'Urine'),
  ('HBA1C', 'Hemoglobin A1c',       'Clinical Chemistry',  'Glycated hemoglobin.',                           'Whole blood')
on conflict (test_code) do nothing;

insert into public.medications (
  medication_code, generic_name, brand_name, strength, dosage_form, unit
)
values
  ('MED-0001', 'Paracetamol',     'Biogesic',    '500 mg',    'Tablet',  'tablet'),
  ('MED-0002', 'Amoxicillin',     'Amoxil',      '500 mg',    'Capsule', 'capsule'),
  ('MED-0003', 'Losartan',        'Cozaar',      '50 mg',     'Tablet',  'tablet'),
  ('MED-0004', 'Metformin',       'Glucophage',  '500 mg',    'Tablet',  'tablet'),
  ('MED-0005', 'Salbutamol',      'Ventolin',    '2.5 mg',    'Nebule',  'nebule'),
  ('MED-0006', 'Omeprazole',      'Losec',       '20 mg',     'Capsule', 'capsule'),
  ('MED-0007', 'Cetirizine',      'Zyrtec',      '10 mg',     'Tablet',  'tablet'),
  ('MED-0008', 'Amlodipine',      'Norvasc',     '5 mg',      'Tablet',  'tablet'),
  ('MED-0009', 'Ceftriaxone',     'Rocephin',    '1 g',       'Vial',    'vial'),
  ('MED-0010', 'Insulin (Human)', 'Humulin',     '100 IU/mL', 'Vial',    'vial'),
  ('MED-0011', 'Ibuprofen',       'Advil',       '200 mg',    'Tablet',  'tablet'),
  ('MED-0012', 'Tranexamic Acid', 'Cyklokapron', '500 mg',    'Tablet',  'tablet')
on conflict (medication_code) do nothing;

insert into public.inventory_categories (name, description)
values
  ('Medical Supplies',    'General medical consumables.'),
  ('Surgical Supplies',   'Operating and procedure supplies.'),
  ('Laboratory Supplies', 'Laboratory collection and testing supplies.'),
  ('PPE',                 'Personal protective equipment.'),
  ('Housekeeping',        'Cleaning and housekeeping supplies.'),
  ('Pharmacy',            'Medication stock.')
on conflict (name) do nothing;

-- Guard: reference data must exist after the inserts above.
do $$
begin
  if not exists (select 1 from public.roles)
     or not exists (select 1 from public.permissions)
     or not exists (select 1 from public.departments) then
    raise exception 'Reference data missing. Apply the schema first.';
  end if;
end;
$$;

-- ============================================================================
-- 1. AUTH USERS
-- ============================================================================
-- Direct auth.users inserts are the supported way to seed demo accounts when a
-- service-role key is not available. The on_auth_user_created trigger creates
-- the matching public.profiles row.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-000000000001',
    'authenticated', 'authenticated',
    'superadmin@spmc.test',
    crypt('SpmcDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Super Admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-000000000002',
    'authenticated', 'authenticated',
    'admin@spmc.test',
    crypt('SpmcDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Hospital Admin"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-000000000003',
    'authenticated', 'authenticated',
    'reception@spmc.test',
    crypt('SpmcDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Receptionist"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-000000000004',
    'authenticated', 'authenticated',
    'physician@spmc.test',
    crypt('SpmcDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Physician One"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-000000000005',
    'authenticated', 'authenticated',
    'physician2@spmc.test',
    crypt('SpmcDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Physician Two"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-000000000006',
    'authenticated', 'authenticated',
    'nurse@spmc.test',
    crypt('SpmcDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Nurse One"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-000000000007',
    'authenticated', 'authenticated',
    'nurse2@spmc.test',
    crypt('SpmcDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Nurse Two"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-000000000008',
    'authenticated', 'authenticated',
    'lab@spmc.test',
    crypt('SpmcDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Lab Staff"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-000000000009',
    'authenticated', 'authenticated',
    'radiology@spmc.test',
    crypt('SpmcDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Radiology Staff"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-00000000000a',
    'authenticated', 'authenticated',
    'pharmacy@spmc.test',
    crypt('SpmcDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Pharmacist"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-00000000000b',
    'authenticated', 'authenticated',
    'billing@spmc.test',
    crypt('SpmcDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Billing Staff"}'::jsonb,
    now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-00000000000c',
    'authenticated', 'authenticated',
    'inventory@spmc.test',
    crypt('SpmcDemo!2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test Inventory Staff"}'::jsonb,
    now(), now()
  )
on conflict do nothing;

-- GoTrue scans these token columns into non-nullable Go strings. Direct SQL
-- inserts leave them NULL, which makes sign-in fail with
-- "Database error querying schema". Normalize them to empty strings.
update auth.users
set confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change_token_new = coalesce(email_change_token_new, ''),
    email_change_token_current = coalesce(email_change_token_current, ''),
    email_change = coalesce(email_change, ''),
    phone_change = coalesce(phone_change, ''),
    phone_change_token = coalesce(phone_change_token, ''),
    reauthentication_token = coalesce(reauthentication_token, ''),
    raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb),
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
where email in (
  'superadmin@spmc.test',
  'admin@spmc.test',
  'reception@spmc.test',
  'physician@spmc.test',
  'physician2@spmc.test',
  'nurse@spmc.test',
  'nurse2@spmc.test',
  'lab@spmc.test',
  'radiology@spmc.test',
  'pharmacy@spmc.test',
  'billing@spmc.test',
  'inventory@spmc.test'
);

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  u.id::text,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(), now(), now()
from auth.users u
where u.email in (
  'superadmin@spmc.test',
  'admin@spmc.test',
  'reception@spmc.test',
  'physician@spmc.test',
  'physician2@spmc.test',
  'nurse@spmc.test',
  'nurse2@spmc.test',
  'lab@spmc.test',
  'radiology@spmc.test',
  'pharmacy@spmc.test',
  'billing@spmc.test',
  'inventory@spmc.test'
)
on conflict do nothing;

-- Ensure profiles exist even when the auth users already existed.
insert into public.profiles (id, email, full_name, contact_number, is_active)
select v.id, v.email, v.full_name, v.contact_number, v.is_active
from (values
  ('11111111-1111-4111-8111-000000000001'::uuid, 'superadmin@spmc.test', 'Test Super Admin', '+639170000001', true),
  ('11111111-1111-4111-8111-000000000002'::uuid, 'admin@spmc.test', 'Test Hospital Admin', '+639170000002', true),
  ('11111111-1111-4111-8111-000000000003'::uuid, 'reception@spmc.test', 'Test Receptionist', '+639170000003', true),
  ('11111111-1111-4111-8111-000000000004'::uuid, 'physician@spmc.test', 'Test Physician One', '+639170000004', true),
  ('11111111-1111-4111-8111-000000000005'::uuid, 'physician2@spmc.test', 'Test Physician Two', '+639170000005', true),
  ('11111111-1111-4111-8111-000000000006'::uuid, 'nurse@spmc.test', 'Test Nurse One', '+639170000006', true),
  ('11111111-1111-4111-8111-000000000007'::uuid, 'nurse2@spmc.test', 'Test Nurse Two', '+639170000007', true),
  ('11111111-1111-4111-8111-000000000008'::uuid, 'lab@spmc.test', 'Test Lab Staff', '+639170000008', true),
  ('11111111-1111-4111-8111-000000000009'::uuid, 'radiology@spmc.test', 'Test Radiology Staff', '+639170000009', true),
  ('11111111-1111-4111-8111-00000000000a'::uuid, 'pharmacy@spmc.test', 'Test Pharmacist', '+639170000010', true),
  ('11111111-1111-4111-8111-00000000000b'::uuid, 'billing@spmc.test', 'Test Billing Staff', '+639170000011', true),
  ('11111111-1111-4111-8111-00000000000c'::uuid, 'inventory@spmc.test', 'Test Inventory Staff', '+639170000012', true)
) as v(id, email, full_name, contact_number, is_active)
join auth.users u on u.id = v.id
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    contact_number = excluded.contact_number,
    is_active = excluded.is_active;

-- ============================================================================
-- 2. ROLES AND PERMISSIONS
-- ============================================================================
-- The role -> permission matrix is PROVISIONAL. SUPABASE.MD section 22.2
-- requires hospital stakeholder approval before it is treated as policy.

insert into public.user_roles (user_id, role_id, granted_by)
select v.user_id, r.id, '11111111-1111-4111-8111-000000000001'::uuid
from (values
  ('11111111-1111-4111-8111-000000000001'::uuid, 'super_admin'),
  ('11111111-1111-4111-8111-000000000002'::uuid, 'hospital_admin'),
  ('11111111-1111-4111-8111-000000000003'::uuid, 'receptionist'),
  ('11111111-1111-4111-8111-000000000004'::uuid, 'physician'),
  ('11111111-1111-4111-8111-000000000005'::uuid, 'physician'),
  ('11111111-1111-4111-8111-000000000006'::uuid, 'nurse'),
  ('11111111-1111-4111-8111-000000000007'::uuid, 'nurse'),
  ('11111111-1111-4111-8111-000000000008'::uuid, 'laboratory_staff'),
  ('11111111-1111-4111-8111-000000000009'::uuid, 'radiology_staff'),
  ('11111111-1111-4111-8111-00000000000a'::uuid, 'pharmacist'),
  ('11111111-1111-4111-8111-00000000000b'::uuid, 'billing_staff'),
  ('11111111-1111-4111-8111-00000000000c'::uuid, 'inventory_staff')
) as v(user_id, role_slug)
join public.roles r on r.slug = v.role_slug
join public.profiles p on p.id = v.user_id
on conflict do nothing;

-- Administrators receive every permission (is_admin() already bypasses, but
-- explicit rows keep the matrix inspectable).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug in ('super_admin', 'hospital_admin')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.create', 'patient.update', 'patient.search',
  'appointment.view', 'appointment.create', 'appointment.update',
  'appointment.cancel', 'appointment.manage_schedule',
  'admission.view', 'admission.create', 'bed.view',
  'reports.patient.view', 'reports.appointment.view'
])
where r.slug = 'receptionist'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.search', 'patient.export',
  'appointment.view', 'appointment.update',
  'admission.view', 'admission.update', 'admission.discharge', 'bed.view',
  'medical_record.view', 'medical_record.create', 'medical_record.update',
  'medical_record.finalize', 'medical_record.amend',
  'diagnosis.view', 'diagnosis.create', 'diagnosis.update',
  'vital_signs.view', 'vital_signs.record',
  'nursing.view', 'nursing.notes.view',
  'laboratory.view', 'laboratory.order.view', 'laboratory.order.create',
  'radiology.view', 'radiology.order.manage',
  'prescription.view', 'prescription.create',
  'reports.patient.view', 'reports.admission.view', 'reports.laboratory.view'
])
where r.slug = 'physician'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.search',
  'appointment.view', 'admission.view', 'bed.view',
  'medical_record.view', 'diagnosis.view',
  'vital_signs.view', 'vital_signs.record',
  'nursing.view', 'nursing.assessment.create',
  'nursing.notes.create', 'nursing.notes.view',
  'laboratory.view', 'laboratory.order.view',
  'radiology.view', 'prescription.view',
  'reports.patient.view'
])
where r.slug = 'nurse'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.search', 'medical_record.view',
  'laboratory.view', 'laboratory.order.view', 'laboratory.specimen.manage',
  'laboratory.result.create', 'laboratory.result.verify',
  'reports.laboratory.view'
])
where r.slug = 'laboratory_staff'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.search', 'medical_record.view',
  'radiology.view', 'radiology.order.manage',
  'radiology.report.create', 'radiology.report.verify',
  'reports.patient.view'
])
where r.slug = 'radiology_staff'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.search',
  'pharmacy.view', 'prescription.view', 'prescription.dispense',
  'medication.manage', 'inventory.view', 'reports.inventory.view'
])
where r.slug = 'pharmacist'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.search',
  'billing.view', 'billing.invoice.create', 'billing.invoice.update',
  'billing.payment.create', 'billing.refund', 'billing.report.view',
  'reports.financial.view', 'reports.patient.view'
])
where r.slug = 'billing_staff'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'inventory.view', 'inventory.item.manage', 'inventory.stock.in',
  'inventory.stock.out', 'inventory.stock.adjust', 'inventory.report.view',
  'reports.inventory.view'
])
where r.slug = 'inventory_staff'
on conflict do nothing;

-- ============================================================================
-- 3. STAFF
-- ============================================================================

insert into public.staff_profiles (
  id, user_id, staff_number, first_name, middle_name, last_name,
  department_id, employment_type, professional_license_number, is_active,
  created_by
)
values
  ('22222222-2222-4222-8222-000000000001', '11111111-1111-4111-8111-000000000001',
   'SPMC-2026-0001', 'Test', null, 'Super Admin',
   (select id from public.departments where code = 'ADMIN'), 'Regular', null, true,
   '11111111-1111-4111-8111-000000000001'),
  ('22222222-2222-4222-8222-000000000002', '11111111-1111-4111-8111-000000000002',
   'SPMC-2026-0002', 'Test', null, 'Hospital Admin',
   (select id from public.departments where code = 'ADMIN'), 'Regular', null, true,
   '11111111-1111-4111-8111-000000000001'),
  ('22222222-2222-4222-8222-000000000003', '11111111-1111-4111-8111-000000000003',
   'SPMC-2026-0003', 'Test', null, 'Receptionist',
   (select id from public.departments where code = 'OPD'), 'Regular', null, true,
   '11111111-1111-4111-8111-000000000002'),
  ('22222222-2222-4222-8222-000000000004', '11111111-1111-4111-8111-000000000004',
   'SPMC-2026-0004', 'Test', null, 'Physician One',
   (select id from public.departments where code = 'OPD'), 'Regular', 'PRC-100001', true,
   '11111111-1111-4111-8111-000000000002'),
  ('22222222-2222-4222-8222-000000000005', '11111111-1111-4111-8111-000000000005',
   'SPMC-2026-0005', 'Test', null, 'Physician Two',
   (select id from public.departments where code = 'ER'), 'Regular', 'PRC-100002', true,
   '11111111-1111-4111-8111-000000000002'),
  ('22222222-2222-4222-8222-000000000006', '11111111-1111-4111-8111-000000000006',
   'SPMC-2026-0006', 'Test', null, 'Nurse One',
   (select id from public.departments where code = 'IPD'), 'Regular', 'PRC-200001', true,
   '11111111-1111-4111-8111-000000000002'),
  ('22222222-2222-4222-8222-000000000007', '11111111-1111-4111-8111-000000000007',
   'SPMC-2026-0007', 'Test', null, 'Nurse Two',
   (select id from public.departments where code = 'ER'), 'Regular', 'PRC-200002', true,
   '11111111-1111-4111-8111-000000000002'),
  ('22222222-2222-4222-8222-000000000008', '11111111-1111-4111-8111-000000000008',
   'SPMC-2026-0008', 'Test', null, 'Lab Staff',
   (select id from public.departments where code = 'LAB'), 'Regular', 'PRC-300001', true,
   '11111111-1111-4111-8111-000000000002'),
  ('22222222-2222-4222-8222-000000000009', '11111111-1111-4111-8111-000000000009',
   'SPMC-2026-0009', 'Test', null, 'Radiology Staff',
   (select id from public.departments where code = 'RAD'), 'Regular', 'PRC-400001', true,
   '11111111-1111-4111-8111-000000000002'),
  ('22222222-2222-4222-8222-00000000000a', '11111111-1111-4111-8111-00000000000a',
   'SPMC-2026-0010', 'Test', null, 'Pharmacist',
   (select id from public.departments where code = 'PHARM'), 'Regular', 'PRC-500001', true,
   '11111111-1111-4111-8111-000000000002'),
  ('22222222-2222-4222-8222-00000000000b', '11111111-1111-4111-8111-00000000000b',
   'SPMC-2026-0011', 'Test', null, 'Billing Staff',
   (select id from public.departments where code = 'BILL'), 'Regular', null, true,
   '11111111-1111-4111-8111-000000000002'),
  ('22222222-2222-4222-8222-00000000000c', '11111111-1111-4111-8111-00000000000c',
   'SPMC-2026-0012', 'Test', null, 'Inventory Staff',
   (select id from public.departments where code = 'ADMIN'), 'Regular', null, true,
   '11111111-1111-4111-8111-000000000002')
on conflict (id) do nothing;

insert into public.physicians (
  id, staff_id, specialty, license_number, is_available, created_by
)
values
  ('33333333-3333-4333-8333-000000000001',
   '22222222-2222-4222-8222-000000000004',
   'Internal Medicine', 'PRC-100001', true,
   '11111111-1111-4111-8111-000000000002'),
  ('33333333-3333-4333-8333-000000000002',
   '22222222-2222-4222-8222-000000000005',
   'Emergency Medicine', 'PRC-100002', true,
   '11111111-1111-4111-8111-000000000002')
on conflict (id) do nothing;

insert into public.staff_department_assignments (
  id, staff_id, department_id, assigned_at, created_by
)
select
  v.id,
  v.staff_id,
  d.id,
  now() - interval '90 days',
  '11111111-1111-4111-8111-000000000002'::uuid
from (values
  ('a3000000-0000-4000-8000-000000000001'::uuid, '22222222-2222-4222-8222-000000000001'::uuid, 'ADMIN'),
  ('a3000000-0000-4000-8000-000000000002'::uuid, '22222222-2222-4222-8222-000000000002'::uuid, 'ADMIN'),
  ('a3000000-0000-4000-8000-000000000003'::uuid, '22222222-2222-4222-8222-000000000003'::uuid, 'OPD'),
  ('a3000000-0000-4000-8000-000000000004'::uuid, '22222222-2222-4222-8222-000000000004'::uuid, 'OPD'),
  ('a3000000-0000-4000-8000-000000000005'::uuid, '22222222-2222-4222-8222-000000000005'::uuid, 'ER'),
  ('a3000000-0000-4000-8000-000000000006'::uuid, '22222222-2222-4222-8222-000000000006'::uuid, 'IPD'),
  ('a3000000-0000-4000-8000-000000000007'::uuid, '22222222-2222-4222-8222-000000000007'::uuid, 'ER'),
  ('a3000000-0000-4000-8000-000000000008'::uuid, '22222222-2222-4222-8222-000000000008'::uuid, 'LAB'),
  ('a3000000-0000-4000-8000-000000000009'::uuid, '22222222-2222-4222-8222-000000000009'::uuid, 'RAD'),
  ('a3000000-0000-4000-8000-00000000000a'::uuid, '22222222-2222-4222-8222-00000000000a'::uuid, 'PHARM'),
  ('a3000000-0000-4000-8000-00000000000b'::uuid, '22222222-2222-4222-8222-00000000000b'::uuid, 'BILL'),
  ('a3000000-0000-4000-8000-00000000000c'::uuid, '22222222-2222-4222-8222-00000000000c'::uuid, 'ADMIN')
) as v(id, staff_id, department_code)
join public.departments d on d.code = v.department_code
on conflict (id) do nothing;

-- ============================================================================
-- 4. ROOMS AND BEDS
-- ============================================================================

insert into public.rooms (
  id, room_number, department_id, room_type, floor_number, created_by
)
values
  ('44444444-4444-4444-8444-000000000001', 'ER-1',
   (select id from public.departments where code = 'ER'),
   'Emergency Bay', '1', '11111111-1111-4111-8111-000000000002'),
  ('44444444-4444-4444-8444-000000000002', 'ER-2',
   (select id from public.departments where code = 'ER'),
   'Emergency Bay', '1', '11111111-1111-4111-8111-000000000002'),
  ('44444444-4444-4444-8444-000000000003', 'W3-301',
   (select id from public.departments where code = 'IPD'),
   'Ward', '3', '11111111-1111-4111-8111-000000000002'),
  ('44444444-4444-4444-8444-000000000004', 'W3-302',
   (select id from public.departments where code = 'IPD'),
   'Ward', '3', '11111111-1111-4111-8111-000000000002'),
  ('44444444-4444-4444-8444-000000000005', 'W5-501',
   (select id from public.departments where code = 'IPD'),
   'Private Room', '5', '11111111-1111-4111-8111-000000000002')
on conflict (id) do nothing;

insert into public.beds (id, room_id, bed_number, status, created_by)
values
  ('55555555-5555-4555-8555-000000000001', '44444444-4444-4444-8444-000000000001', 'ER-1-A', 'available', '11111111-1111-4111-8111-000000000002'),
  ('55555555-5555-4555-8555-000000000002', '44444444-4444-4444-8444-000000000001', 'ER-1-B', 'available', '11111111-1111-4111-8111-000000000002'),
  ('55555555-5555-4555-8555-000000000003', '44444444-4444-4444-8444-000000000002', 'ER-2-A', 'available', '11111111-1111-4111-8111-000000000002'),
  ('55555555-5555-4555-8555-000000000004', '44444444-4444-4444-8444-000000000002', 'ER-2-B', 'maintenance', '11111111-1111-4111-8111-000000000002'),
  ('55555555-5555-4555-8555-000000000005', '44444444-4444-4444-8444-000000000003', 'W3-301-A', 'occupied', '11111111-1111-4111-8111-000000000002'),
  ('55555555-5555-4555-8555-000000000006', '44444444-4444-4444-8444-000000000003', 'W3-301-B', 'available', '11111111-1111-4111-8111-000000000002'),
  ('55555555-5555-4555-8555-000000000007', '44444444-4444-4444-8444-000000000004', 'W3-302-A', 'available', '11111111-1111-4111-8111-000000000002'),
  ('55555555-5555-4555-8555-000000000008', '44444444-4444-4444-8444-000000000004', 'W3-302-B', 'available', '11111111-1111-4111-8111-000000000002'),
  ('55555555-5555-4555-8555-000000000009', '44444444-4444-4444-8444-000000000005', 'W5-501-A', 'occupied', '11111111-1111-4111-8111-000000000002'),
  ('55555555-5555-4555-8555-00000000000a', '44444444-4444-4444-8444-000000000005', 'W5-501-B', 'reserved', '11111111-1111-4111-8111-000000000002')
on conflict (id) do nothing;

-- ============================================================================
-- 5. PATIENTS
-- ============================================================================

insert into public.patients (
  id, medical_record_number, first_name, middle_name, last_name,
  date_of_birth, sex, civil_status, nationality,
  contact_number, email, address_line, barangay, city, province, postal_code,
  registration_date, registration_status, created_by
)
values
  ('66666666-6666-4666-8666-000000000001', 'MRN-2026-0001', 'Test', null, 'Patient One',
   date '1985-03-14', 'Female', 'Married', 'Filipino',
   '+639170000101', 'patient1@example.test', '12 Test Street', 'Barangay Test', 'Quezon City', 'Metro Manila', '1100',
   now() - interval '30 days', 'active', '11111111-1111-4111-8111-000000000002'),
  ('66666666-6666-4666-8666-000000000002', 'MRN-2026-0002', 'Test', null, 'Patient Two',
   date '1978-07-22', 'Male', 'Married', 'Filipino',
   '+639170000102', 'patient2@example.test', '24 Test Street', 'Barangay Test', 'Quezon City', 'Metro Manila', '1101',
   now() - interval '25 days', 'active', '11111111-1111-4111-8111-000000000002'),
  ('66666666-6666-4666-8666-000000000003', 'MRN-2026-0003', 'Test', null, 'Patient Three',
   date '1992-11-05', 'Female', 'Single', 'Filipino',
   '+639170000103', 'patient3@example.test', '36 Test Street', 'Barangay Test', 'Quezon City', 'Metro Manila', '1102',
   now() - interval '20 days', 'active', '11111111-1111-4111-8111-000000000002'),
  ('66666666-6666-4666-8666-000000000004', 'MRN-2026-0004', 'Test', null, 'Patient Four',
   date '1965-01-30', 'Male', 'Widowed', 'Filipino',
   '+639170000104', 'patient4@example.test', '48 Test Street', 'Barangay Test', 'Quezon City', 'Metro Manila', '1103',
   now() - interval '18 days', 'active', '11111111-1111-4111-8111-000000000002'),
  ('66666666-6666-4666-8666-000000000005', 'MRN-2026-0005', 'Test', null, 'Patient Five',
   date '2001-06-18', 'Female', 'Single', 'Filipino',
   '+639170000105', 'patient5@example.test', '60 Test Street', 'Barangay Test', 'Quezon City', 'Metro Manila', '1104',
   now() - interval '14 days', 'active', '11111111-1111-4111-8111-000000000002'),
  ('66666666-6666-4666-8666-000000000006', 'MRN-2026-0006', 'Test', null, 'Patient Six',
   date '1950-09-09', 'Male', 'Married', 'Filipino',
   '+639170000106', 'patient6@example.test', '72 Test Street', 'Barangay Test', 'Quezon City', 'Metro Manila', '1105',
   now() - interval '12 days', 'active', '11111111-1111-4111-8111-000000000002'),
  ('66666666-6666-4666-8666-000000000007', 'MRN-2026-0007', 'Test', null, 'Patient Seven',
   date '1988-12-01', 'Female', 'Married', 'Filipino',
   '+639170000107', 'patient7@example.test', '84 Test Street', 'Barangay Test', 'Quezon City', 'Metro Manila', '1106',
   now() - interval '10 days', 'active', '11111111-1111-4111-8111-000000000002'),
  ('66666666-6666-4666-8666-000000000008', 'MRN-2026-0008', 'Test', null, 'Patient Eight',
   date '1973-04-27', 'Male', 'Separated', 'Filipino',
   '+639170000108', 'patient8@example.test', '96 Test Street', 'Barangay Test', 'Quezon City', 'Metro Manila', '1107',
   now() - interval '8 days', 'active', '11111111-1111-4111-8111-000000000002'),
  ('66666666-6666-4666-8666-000000000009', 'MRN-2026-0009', 'Test', null, 'Patient Nine',
   date '1995-08-16', 'Female', 'Single', 'Filipino',
   '+639170000109', 'patient9@example.test', '108 Test Street', 'Barangay Test', 'Quezon City', 'Metro Manila', '1108',
   now() - interval '5 days', 'active', '11111111-1111-4111-8111-000000000002'),
  ('66666666-6666-4666-8666-00000000000a', 'MRN-2026-0010', 'Test', null, 'Patient Ten',
   date '1960-02-11', 'Male', 'Married', 'Filipino',
   '+639170000110', 'patient10@example.test', '120 Test Street', 'Barangay Test', 'Quezon City', 'Metro Manila', '1109',
   now() - interval '3 days', 'active', '11111111-1111-4111-8111-000000000002')
on conflict (id) do nothing;

insert into public.emergency_contacts (
  id, patient_id, full_name, relationship, contact_number, address, is_primary, created_by
)
values
  ('77777777-7777-4777-8777-000000000001', '66666666-6666-4666-8666-000000000001', 'Test Contact One', 'Spouse', '+639170000201', '12 Test Street, Quezon City', true, '11111111-1111-4111-8111-000000000003'),
  ('77777777-7777-4777-8777-000000000002', '66666666-6666-4666-8666-000000000002', 'Test Contact Two', 'Sibling', '+639170000202', '24 Test Street, Quezon City', true, '11111111-1111-4111-8111-000000000003'),
  ('77777777-7777-4777-8777-000000000003', '66666666-6666-4666-8666-000000000003', 'Test Contact Three', 'Parent', '+639170000203', '36 Test Street, Quezon City', true, '11111111-1111-4111-8111-000000000003'),
  ('77777777-7777-4777-8777-000000000004', '66666666-6666-4666-8666-000000000004', 'Test Contact Four', 'Child', '+639170000204', '48 Test Street, Quezon City', true, '11111111-1111-4111-8111-000000000003'),
  ('77777777-7777-4777-8777-000000000005', '66666666-6666-4666-8666-000000000005', 'Test Contact Five', 'Parent', '+639170000205', '60 Test Street, Quezon City', true, '11111111-1111-4111-8111-000000000003'),
  ('77777777-7777-4777-8777-000000000006', '66666666-6666-4666-8666-000000000006', 'Test Contact Six', 'Spouse', '+639170000206', '72 Test Street, Quezon City', true, '11111111-1111-4111-8111-000000000003'),
  ('77777777-7777-4777-8777-000000000007', '66666666-6666-4666-8666-000000000007', 'Test Contact Seven', 'Sibling', '+639170000207', '84 Test Street, Quezon City', true, '11111111-1111-4111-8111-000000000003'),
  ('77777777-7777-4777-8777-000000000008', '66666666-6666-4666-8666-000000000008', 'Test Contact Eight', 'Child', '+639170000208', '96 Test Street, Quezon City', true, '11111111-1111-4111-8111-000000000003'),
  ('77777777-7777-4777-8777-000000000009', '66666666-6666-4666-8666-000000000009', 'Test Contact Nine', 'Parent', '+639170000209', '108 Test Street, Quezon City', true, '11111111-1111-4111-8111-000000000003'),
  ('77777777-7777-4777-8777-00000000000a', '66666666-6666-4666-8666-00000000000a', 'Test Contact Ten', 'Spouse', '+639170000210', '120 Test Street, Quezon City', true, '11111111-1111-4111-8111-000000000003')
on conflict (id) do nothing;

insert into public.patient_allergies (
  id, patient_id, allergen, reaction, severity, notes, recorded_by
)
values
  ('88888888-8888-4888-8888-000000000001', '66666666-6666-4666-8666-000000000001', 'Penicillin', 'Rash', 'Moderate', 'Confirmed by patient history.', '11111111-1111-4111-8111-000000000004'),
  ('88888888-8888-4888-8888-000000000002', '66666666-6666-4666-8666-000000000002', 'Seafood', 'Urticaria', 'Mild', null, '11111111-1111-4111-8111-000000000004'),
  ('88888888-8888-4888-8888-000000000003', '66666666-6666-4666-8666-000000000004', 'Latex', 'Contact dermatitis', 'Mild', null, '11111111-1111-4111-8111-000000000006'),
  ('88888888-8888-4888-8888-000000000004', '66666666-6666-4666-8666-000000000006', 'Aspirin', 'Bronchospasm', 'Severe', 'Avoid NSAIDs.', '11111111-1111-4111-8111-000000000004'),
  ('88888888-8888-4888-8888-000000000005', '66666666-6666-4666-8666-000000000008', 'Sulfonamides', 'Rash', 'Moderate', null, '11111111-1111-4111-8111-000000000005')
on conflict (id) do nothing;

insert into public.medical_histories (
  id, patient_id, history_type, description, recorded_by, recorded_at
)
values
  ('99999999-9999-4999-8999-000000000001', '66666666-6666-4666-8666-000000000001', 'Medical', 'Essential hypertension diagnosed in 2019.', '11111111-1111-4111-8111-000000000004', now() - interval '30 days'),
  ('99999999-9999-4999-8999-000000000002', '66666666-6666-4666-8666-000000000002', 'Medical', 'Type 2 diabetes mellitus on oral therapy.', '11111111-1111-4111-8111-000000000004', now() - interval '25 days'),
  ('99999999-9999-4999-8999-000000000003', '66666666-6666-4666-8666-000000000003', 'Medical', 'Mild persistent asthma.', '11111111-1111-4111-8111-000000000005', now() - interval '20 days'),
  ('99999999-9999-4999-8999-000000000004', '66666666-6666-4666-8666-000000000004', 'Surgical', 'Appendectomy in 2010.', '11111111-1111-4111-8111-000000000004', now() - interval '18 days'),
  ('99999999-9999-4999-8999-000000000005', '66666666-6666-4666-8666-000000000004', 'Medical', 'Chronic kidney disease stage 3.', '11111111-1111-4111-8111-000000000004', now() - interval '18 days'),
  ('99999999-9999-4999-8999-000000000006', '66666666-6666-4666-8666-000000000006', 'Medical', 'Chronic obstructive pulmonary disease.', '11111111-1111-4111-8111-000000000005', now() - interval '12 days'),
  ('99999999-9999-4999-8999-000000000007', '66666666-6666-4666-8666-000000000007', 'Family', 'Mother with breast cancer.', '11111111-1111-4111-8111-000000000004', now() - interval '10 days'),
  ('99999999-9999-4999-8999-000000000008', '66666666-6666-4666-8666-000000000009', 'Social', 'Non-smoker, occasional alcohol intake.', '11111111-1111-4111-8111-000000000005', now() - interval '5 days')
on conflict (id) do nothing;

insert into public.patient_care_assignments (
  id, patient_id, staff_id, assignment_type, assigned_by, assigned_at
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000001', '66666666-6666-4666-8666-000000000001', '22222222-2222-4222-8222-000000000004', 'Primary physician', '11111111-1111-4111-8111-000000000002', now() - interval '30 days'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000002', '66666666-6666-4666-8666-000000000001', '22222222-2222-4222-8222-000000000006', 'Primary nurse', '11111111-1111-4111-8111-000000000002', now() - interval '30 days'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000003', '66666666-6666-4666-8666-000000000002', '22222222-2222-4222-8222-000000000004', 'Primary physician', '11111111-1111-4111-8111-000000000002', now() - interval '25 days'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000004', '66666666-6666-4666-8666-000000000002', '22222222-2222-4222-8222-000000000006', 'Primary nurse', '11111111-1111-4111-8111-000000000002', now() - interval '25 days'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000005', '66666666-6666-4666-8666-000000000003', '22222222-2222-4222-8222-000000000005', 'Attending physician', '11111111-1111-4111-8111-000000000002', now() - interval '20 days'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000006', '66666666-6666-4666-8666-000000000003', '22222222-2222-4222-8222-000000000007', 'Assigning nurse', '11111111-1111-4111-8111-000000000002', now() - interval '20 days'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000007', '66666666-6666-4666-8666-000000000004', '22222222-2222-4222-8222-000000000004', 'Primary physician', '11111111-1111-4111-8111-000000000002', now() - interval '18 days'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000008', '66666666-6666-4666-8666-000000000004', '22222222-2222-4222-8222-000000000007', 'Primary nurse', '11111111-1111-4111-8111-000000000002', now() - interval '18 days'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-000000000009', '66666666-6666-4666-8666-000000000005', '22222222-2222-4222-8222-000000000004', 'Primary physician', '11111111-1111-4111-8111-000000000002', now() - interval '14 days'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-00000000000a', '66666666-6666-4666-8666-000000000006', '22222222-2222-4222-8222-000000000005', 'Attending physician', '11111111-1111-4111-8111-000000000002', now() - interval '12 days')
on conflict (id) do nothing;

-- ============================================================================
-- 6. APPOINTMENTS
-- ============================================================================

insert into public.appointments (
  id, appointment_number, patient_id, department_id, physician_id,
  scheduled_at, duration_minutes, appointment_type, reason_for_visit,
  status, notes, created_by
)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000001', 'APT-2026-0001',
   '66666666-6666-4666-8666-000000000001',
   (select id from public.departments where code = 'OPD'),
   '33333333-3333-4333-8333-000000000001',
   date_trunc('day', now()) + interval '1 day 9 hours', 30,
   'Consultation', 'Follow-up for hypertension', 'scheduled', null,
   '11111111-1111-4111-8111-000000000003'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000002', 'APT-2026-0002',
   '66666666-6666-4666-8666-000000000002',
   (select id from public.departments where code = 'OPD'),
   '33333333-3333-4333-8333-000000000001',
   now() + interval '2 hours', 30,
   'Consultation', 'Diabetes follow-up', 'confirmed', null,
   '11111111-1111-4111-8111-000000000003'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000003', 'APT-2026-0003',
   '66666666-6666-4666-8666-000000000003',
   (select id from public.departments where code = 'ER'),
   '33333333-3333-4333-8333-000000000002',
   now() - interval '30 minutes', 30,
   'Emergency', 'Abdominal pain', 'waiting', null,
   '11111111-1111-4111-8111-000000000003'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000004', 'APT-2026-0004',
   '66666666-6666-4666-8666-000000000004',
   (select id from public.departments where code = 'OPD'),
   '33333333-3333-4333-8333-000000000001',
   now() - interval '1 day', 30,
   'Consultation', 'Chronic kidney disease follow-up', 'completed', null,
   '11111111-1111-4111-8111-000000000003'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000005', 'APT-2026-0005',
   '66666666-6666-4666-8666-000000000005',
   (select id from public.departments where code = 'OPD'),
   '33333333-3333-4333-8333-000000000002',
   date_trunc('day', now()) + interval '3 days 10 hours', 30,
   'Consultation', 'General check-up', 'scheduled', null,
   '11111111-1111-4111-8111-000000000003'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-000000000006', 'APT-2026-0006',
   '66666666-6666-4666-8666-000000000006',
   (select id from public.departments where code = 'OPD'),
   '33333333-3333-4333-8333-000000000001',
   now() - interval '2 days', 30,
   'Consultation', 'Pneumonia follow-up', 'cancelled',
   'Patient rescheduled by phone.', '11111111-1111-4111-8111-000000000003')
on conflict (id) do nothing;

-- ============================================================================
-- 7. ADMISSIONS AND TRANSFERS
-- ============================================================================

insert into public.admissions (
  id, admission_number, patient_id, attending_physician_id, department_id,
  admission_date, discharge_date, admission_type, status,
  admission_notes, discharge_notes, admitted_by, discharged_by
)
values
  ('cccccccc-cccc-4ccc-8ccc-000000000001', 'ADM-2026-0001',
   '66666666-6666-4666-8666-000000000002',
   '33333333-3333-4333-8333-000000000001',
   (select id from public.departments where code = 'IPD'),
   now() - interval '2 days', null, 'Elective', 'admitted',
   'Admitted for intravenous antibiotics and observation.', null,
   '11111111-1111-4111-8111-000000000003', null),
  ('cccccccc-cccc-4ccc-8ccc-000000000002', 'ADM-2026-0002',
   '66666666-6666-4666-8666-000000000004',
   '33333333-3333-4333-8333-000000000001',
   (select id from public.departments where code = 'IPD'),
   now() - interval '5 days', null, 'Emergency', 'admitted',
   'Admitted for fluid management and renal monitoring.', null,
   '11111111-1111-4111-8111-000000000003', null),
  ('cccccccc-cccc-4ccc-8ccc-000000000003', 'ADM-2026-0003',
   '66666666-6666-4666-8666-000000000006',
   '33333333-3333-4333-8333-000000000002',
   (select id from public.departments where code = 'IPD'),
   now() - interval '7 days', now() - interval '6 days', 'Emergency', 'discharged',
   'Admitted for community-acquired pneumonia.',
   'Discharged in stable condition with oral antibiotics.',
   '11111111-1111-4111-8111-000000000003',
   '11111111-1111-4111-8111-000000000002')
on conflict (id) do nothing;

insert into public.admission_bed_assignments (
  id, admission_id, bed_id, assigned_at, released_at, assigned_by
)
values
  ('dddddddd-dddd-4ddd-8ddd-000000000001', 'cccccccc-cccc-4ccc-8ccc-000000000001',
   '55555555-5555-4555-8555-000000000005',
   now() - interval '2 days', null,
   '11111111-1111-4111-8111-000000000003'),
  ('dddddddd-dddd-4ddd-8ddd-000000000002', 'cccccccc-cccc-4ccc-8ccc-000000000002',
   '55555555-5555-4555-8555-000000000007',
   now() - interval '5 days', now() - interval '4 days',
   '11111111-1111-4111-8111-000000000003'),
  ('dddddddd-dddd-4ddd-8ddd-000000000003', 'cccccccc-cccc-4ccc-8ccc-000000000003',
   '55555555-5555-4555-8555-000000000006',
   now() - interval '7 days', now() - interval '6 days',
   '11111111-1111-4111-8111-000000000003'),
  ('dddddddd-dddd-4ddd-8ddd-000000000004', 'cccccccc-cccc-4ccc-8ccc-000000000002',
   '55555555-5555-4555-8555-000000000009',
   now() - interval '4 days', null,
   '11111111-1111-4111-8111-000000000003')
on conflict (id) do nothing;

insert into public.patient_transfers (
  id, admission_id, from_bed_id, to_bed_id, transfer_reason, transferred_by, transferred_at
)
values
  ('eeeeeeee-eeee-4eee-8eee-000000000001', 'cccccccc-cccc-4ccc-8ccc-000000000002',
   '55555555-5555-4555-8555-000000000007',
   '55555555-5555-4555-8555-000000000009',
   'Higher acuity monitoring', '11111111-1111-4111-8111-000000000006',
   now() - interval '4 days')
on conflict (id) do nothing;

-- ============================================================================
-- 8. ENCOUNTERS, VITALS, DIAGNOSES, CLINICAL NOTES
-- ============================================================================

insert into public.encounters (
  id, encounter_number, patient_id, appointment_id, admission_id,
  physician_id, department_id, encounter_type, chief_complaint,
  clinical_status, started_at, completed_at, created_by
)
values
  ('f0000000-0000-4000-8000-000000000001', 'ENC-2026-0001',
   '66666666-6666-4666-8666-000000000001',
   'bbbbbbbb-bbbb-4bbb-8bbb-000000000001', null,
   '33333333-3333-4333-8333-000000000001',
   (select id from public.departments where code = 'OPD'),
   'Outpatient consultation', 'Headache and elevated blood pressure',
   'completed', now() - interval '1 day 9 hours', now() - interval '1 day 8 hours',
   '11111111-1111-4111-8111-000000000004'),
  ('f0000000-0000-4000-8000-000000000002', 'ENC-2026-0002',
   '66666666-6666-4666-8666-000000000002',
   'bbbbbbbb-bbbb-4bbb-8bbb-000000000002', null,
   '33333333-3333-4333-8333-000000000001',
   (select id from public.departments where code = 'OPD'),
   'Outpatient consultation', 'Poor glycemic control',
   'in_progress', now() - interval '90 minutes', null,
   '11111111-1111-4111-8111-000000000004'),
  ('f0000000-0000-4000-8000-000000000003', 'ENC-2026-0003',
   '66666666-6666-4666-8666-000000000003',
   'bbbbbbbb-bbbb-4bbb-8bbb-000000000003', null,
   '33333333-3333-4333-8333-000000000002',
   (select id from public.departments where code = 'ER'),
   'Emergency visit', 'Abdominal pain and vomiting',
   'open', now() - interval '45 minutes', null,
   '11111111-1111-4111-8111-000000000005'),
  ('f0000000-0000-4000-8000-000000000004', 'ENC-2026-0004',
   '66666666-6666-4666-8666-000000000002',
   null, 'cccccccc-cccc-4ccc-8ccc-000000000001',
   '33333333-3333-4333-8333-000000000001',
   (select id from public.departments where code = 'IPD'),
   'Inpatient admission', 'Fever and productive cough',
   'in_progress', now() - interval '2 days', null,
   '11111111-1111-4111-8111-000000000004'),
  ('f0000000-0000-4000-8000-000000000005', 'ENC-2026-0005',
   '66666666-6666-4666-8666-000000000004',
   null, 'cccccccc-cccc-4ccc-8ccc-000000000002',
   '33333333-3333-4333-8333-000000000001',
   (select id from public.departments where code = 'IPD'),
   'Inpatient admission', 'Generalized weakness and reduced urine output',
   'completed', now() - interval '5 days', now() - interval '4 days',
   '11111111-1111-4111-8111-000000000004'),
  ('f0000000-0000-4000-8000-000000000006', 'ENC-2026-0006',
   '66666666-6666-4666-8666-000000000006',
   null, 'cccccccc-cccc-4ccc-8ccc-000000000003',
   '33333333-3333-4333-8333-000000000002',
   (select id from public.departments where code = 'IPD'),
   'Inpatient admission', 'Shortness of breath and fever',
   'completed', now() - interval '7 days', now() - interval '6 days',
   '11111111-1111-4111-8111-000000000005')
on conflict (id) do nothing;

insert into public.vital_signs (
  id, patient_id, encounter_id, systolic_bp, diastolic_bp,
  heart_rate, respiratory_rate, temperature, oxygen_saturation,
  weight_kg, height_cm, recorded_by, recorded_at
)
values
  ('f1000000-0000-4000-8000-000000000001', '66666666-6666-4666-8666-000000000001', 'f0000000-0000-4000-8000-000000000001', 148, 92, 88, 18, 36.7, 98, 68.5, 158, '11111111-1111-4111-8111-000000000006', now() - interval '1 day 9 hours'),
  ('f1000000-0000-4000-8000-000000000002', '66666666-6666-4666-8666-000000000002', 'f0000000-0000-4000-8000-000000000002', 132, 84, 96, 20, 37.8, 96, 82.0, 170, '11111111-1111-4111-8111-000000000006', now() - interval '80 minutes'),
  ('f1000000-0000-4000-8000-000000000003', '66666666-6666-4666-8666-000000000003', 'f0000000-0000-4000-8000-000000000003', 118, 76, 102, 22, 38.1, 98, 55.0, 162, '11111111-1111-4111-8111-000000000007', now() - interval '40 minutes'),
  ('f1000000-0000-4000-8000-000000000004', '66666666-6666-4666-8666-000000000002', 'f0000000-0000-4000-8000-000000000004', 128, 80, 92, 22, 38.4, 94, 81.5, 170, '11111111-1111-4111-8111-000000000006', now() - interval '1 day'),
  ('f1000000-0000-4000-8000-000000000005', '66666666-6666-4666-8666-000000000004', 'f0000000-0000-4000-8000-000000000005', 156, 94, 84, 18, 36.5, 97, 74.0, 168, '11111111-1111-4111-8111-000000000007', now() - interval '4 days'),
  ('f1000000-0000-4000-8000-000000000006', '66666666-6666-4666-8666-000000000006', 'f0000000-0000-4000-8000-000000000006', 138, 86, 98, 24, 38.6, 91, 70.0, 165, '11111111-1111-4111-8111-000000000006', now() - interval '6 days')
on conflict (id) do nothing;

insert into public.diagnoses (
  id, patient_id, encounter_id, diagnosis_code, diagnosis_name,
  diagnosis_type, clinical_notes, is_primary, recorded_by, recorded_at
)
values
  ('f2000000-0000-4000-8000-000000000001', '66666666-6666-4666-8666-000000000001', 'f0000000-0000-4000-8000-000000000001', 'I10', 'Essential hypertension', 'Primary', 'Blood pressure elevated on presentation.', true, '11111111-1111-4111-8111-000000000004', now() - interval '1 day 9 hours'),
  ('f2000000-0000-4000-8000-000000000002', '66666666-6666-4666-8666-000000000002', 'f0000000-0000-4000-8000-000000000004', 'J18.9', 'Pneumonia, unspecified organism', 'Primary', 'Consolidation on chest radiograph.', true, '11111111-1111-4111-8111-000000000004', now() - interval '2 days'),
  ('f2000000-0000-4000-8000-000000000003', '66666666-6666-4666-8666-000000000002', 'f0000000-0000-4000-8000-000000000004', 'E11.9', 'Type 2 diabetes mellitus without complications', 'Secondary', null, false, '11111111-1111-4111-8111-000000000004', now() - interval '2 days'),
  ('f2000000-0000-4000-8000-000000000004', '66666666-6666-4666-8666-000000000003', 'f0000000-0000-4000-8000-000000000003', 'A09', 'Infectious gastroenteritis and colitis', 'Primary', 'Oral rehydration started.', true, '11111111-1111-4111-8111-000000000005', now() - interval '40 minutes'),
  ('f2000000-0000-4000-8000-000000000005', '66666666-6666-4666-8666-000000000004', 'f0000000-0000-4000-8000-000000000005', 'N18.3', 'Chronic kidney disease, stage 3', 'Primary', 'Baseline creatinine elevated.', true, '11111111-1111-4111-8111-000000000004', now() - interval '5 days'),
  ('f2000000-0000-4000-8000-000000000006', '66666666-6666-4666-8666-000000000006', 'f0000000-0000-4000-8000-000000000006', 'J18.9', 'Pneumonia, unspecified organism', 'Primary', 'Improved with intravenous antibiotics.', true, '11111111-1111-4111-8111-000000000005', now() - interval '7 days')
on conflict (id) do nothing;

insert into public.clinical_notes (
  id, patient_id, encounter_id, note_type, content, status,
  authored_by, finalized_at
)
values
  ('f3000000-0000-4000-8000-000000000001', '66666666-6666-4666-8666-000000000001', 'f0000000-0000-4000-8000-000000000001', 'SOAP',
   'Subjective: Headache and dizziness. Objective: BP 148/92. Assessment: Essential hypertension, controlled on current therapy. Plan: Continue Losartan and review in two weeks.',
   'finalized', '11111111-1111-4111-8111-000000000004', now() - interval '1 day 8 hours'),
  ('f3000000-0000-4000-8000-000000000002', '66666666-6666-4666-8666-000000000002', 'f0000000-0000-4000-8000-000000000004', 'Progress',
   'Patient remains febrile but hemodynamically stable. Continue intravenous antibiotics and monitor oxygen saturation.',
   'finalized', '11111111-1111-4111-8111-000000000004', now() - interval '1 day 2 hours'),
  ('f3000000-0000-4000-8000-000000000003', '66666666-6666-4666-8666-000000000003', 'f0000000-0000-4000-8000-000000000003', 'Emergency',
   'Draft emergency note. Awaiting laboratory results before finalizing the assessment.',
   'draft', '11111111-1111-4111-8111-000000000005', null),
  ('f3000000-0000-4000-8000-000000000004', '66666666-6666-4666-8666-000000000004', 'f0000000-0000-4000-8000-000000000005', 'Discharge summary',
   'Admitted for fluid management. Renal function remained stable. Discharged with nephrology follow-up.',
   'finalized', '11111111-1111-4111-8111-000000000004', now() - interval '4 days')
on conflict (id) do nothing;

-- ============================================================================
-- 9. NURSING
-- ============================================================================

insert into public.nursing_assessments (
  id, patient_id, encounter_id, assessment_type, assessment_data, notes,
  assessed_by, assessed_at
)
values
  ('f4000000-0000-4000-8000-000000000001', '66666666-6666-4666-8666-000000000002', 'f0000000-0000-4000-8000-000000000004',
   'Shift assessment', '{"mobility":"independent","pain_scale":4,"fall_risk":"moderate"}'::jsonb,
   'Patient ambulates with assistance.', '11111111-1111-4111-8111-000000000006', now() - interval '1 day 4 hours'),
  ('f4000000-0000-4000-8000-000000000002', '66666666-6666-4666-8666-000000000003', 'f0000000-0000-4000-8000-000000000003',
   'Triage assessment', '{"mobility":"independent","pain_scale":7,"fall_risk":"low"}'::jsonb,
   'Priority 3 at triage.', '11111111-1111-4111-8111-000000000007', now() - interval '40 minutes'),
  ('f4000000-0000-4000-8000-000000000003', '66666666-6666-4666-8666-000000000004', 'f0000000-0000-4000-8000-000000000005',
   'Fall risk assessment', '{"mobility":"assisted","pain_scale":2,"fall_risk":"high"}'::jsonb,
   'Bed rails raised; assistive device required.', '11111111-1111-4111-8111-000000000007', now() - interval '4 days')
on conflict (id) do nothing;

insert into public.nursing_notes (
  id, patient_id, encounter_id, note, recorded_by, recorded_at
)
values
  ('f5000000-0000-4000-8000-000000000001', '66666666-6666-4666-8666-000000000002', 'f0000000-0000-4000-8000-000000000004',
   'Shift vital signs taken. Temperature trending down. Patient tolerated oral intake.',
   '11111111-1111-4111-8111-000000000006', now() - interval '1 day 1 hour'),
  ('f5000000-0000-4000-8000-000000000002', '66666666-6666-4666-8666-000000000003', 'f0000000-0000-4000-8000-000000000003',
   'Patient reassessed after antiemetic. Reported reduced nausea.',
   '11111111-1111-4111-8111-000000000007', now() - interval '15 minutes'),
  ('f5000000-0000-4000-8000-000000000003', '66666666-6666-4666-8666-000000000004', 'f0000000-0000-4000-8000-000000000005',
   'Assisted with ambulation. No falls. Family educated on fall precautions.',
   '11111111-1111-4111-8111-000000000007', now() - interval '4 days 2 hours')
on conflict (id) do nothing;

-- ============================================================================
-- 10. LABORATORY
-- ============================================================================

insert into public.laboratory_orders (
  id, order_number, patient_id, encounter_id, ordered_by,
  priority, status, ordered_at
)
values
  ('f6000000-0000-4000-8000-000000000001', 'LAB-2026-0001', '66666666-6666-4666-8666-000000000001', 'f0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-000000000004', 'routine', 'completed', now() - interval '1 day 9 hours'),
  ('f6000000-0000-4000-8000-000000000002', 'LAB-2026-0002', '66666666-6666-4666-8666-000000000002', 'f0000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-000000000004', 'urgent', 'processing', now() - interval '1 day 6 hours'),
  ('f6000000-0000-4000-8000-000000000003', 'LAB-2026-0003', '66666666-6666-4666-8666-000000000003', 'f0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-000000000005', 'stat', 'collection', now() - interval '35 minutes'),
  ('f6000000-0000-4000-8000-000000000004', 'LAB-2026-0004', '66666666-6666-4666-8666-000000000004', 'f0000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-000000000004', 'routine', 'completed', now() - interval '5 days')
on conflict (id) do nothing;

insert into public.laboratory_order_items (id, order_id, test_id, status)
select v.id, v.order_id, t.id, v.status
from (values
  ('f7000000-0000-4000-8000-000000000001'::uuid, 'f6000000-0000-4000-8000-000000000001'::uuid, 'CBC', 'completed'),
  ('f7000000-0000-4000-8000-000000000002'::uuid, 'f6000000-0000-4000-8000-000000000001'::uuid, 'FBS', 'completed'),
  ('f7000000-0000-4000-8000-000000000003'::uuid, 'f6000000-0000-4000-8000-000000000002'::uuid, 'CBC', 'processing'),
  ('f7000000-0000-4000-8000-000000000004'::uuid, 'f6000000-0000-4000-8000-000000000002'::uuid, 'CHEM', 'processing'),
  ('f7000000-0000-4000-8000-000000000005'::uuid, 'f6000000-0000-4000-8000-000000000003'::uuid, 'UA', 'pending'),
  ('f7000000-0000-4000-8000-000000000006'::uuid, 'f6000000-0000-4000-8000-000000000004'::uuid, 'LIPID', 'completed'),
  ('f7000000-0000-4000-8000-000000000007'::uuid, 'f6000000-0000-4000-8000-000000000004'::uuid, 'HBA1C', 'completed')
) as v(id, order_id, test_code, status)
join public.laboratory_tests t on t.test_code = v.test_code
on conflict (id) do nothing;

insert into public.laboratory_specimens (
  id, order_id, specimen_type, collection_status, collected_by, collected_at, notes
)
values
  ('f8000000-0000-4000-8000-000000000001', 'f6000000-0000-4000-8000-000000000001', 'Whole blood', 'collected', '11111111-1111-4111-8111-000000000008', now() - interval '1 day 8 hours', null),
  ('f8000000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000001', 'Serum', 'collected', '11111111-1111-4111-8111-000000000008', now() - interval '1 day 8 hours', null),
  ('f8000000-0000-4000-8000-000000000003', 'f6000000-0000-4000-8000-000000000002', 'Whole blood', 'collected', '11111111-1111-4111-8111-000000000008', now() - interval '1 day 5 hours', null),
  ('f8000000-0000-4000-8000-000000000004', 'f6000000-0000-4000-8000-000000000003', 'Urine', 'pending', null, null, 'Awaiting collection.'),
  ('f8000000-0000-4000-8000-000000000005', 'f6000000-0000-4000-8000-000000000004', 'Serum', 'collected', '11111111-1111-4111-8111-000000000008', now() - interval '5 days 2 hours', null),
  ('f8000000-0000-4000-8000-000000000006', 'f6000000-0000-4000-8000-000000000004', 'Whole blood', 'collected', '11111111-1111-4111-8111-000000000008', now() - interval '5 days 2 hours', null)
on conflict (id) do nothing;

insert into public.laboratory_results (
  id, order_item_id, result_value, result_unit, reference_range, interpretation,
  verification_status, performed_by, verified_by, performed_at, verified_at
)
values
  ('f9000000-0000-4000-8000-000000000001', 'f7000000-0000-4000-8000-000000000001', '7.2', '10^9/L', '4.0-11.0', 'Normal', 'verified', '11111111-1111-4111-8111-000000000008', '11111111-1111-4111-8111-000000000008', now() - interval '1 day 7 hours', now() - interval '1 day 6 hours'),
  ('f9000000-0000-4000-8000-000000000002', 'f7000000-0000-4000-8000-000000000002', '98', 'mg/dL', '70-110', 'Normal', 'verified', '11111111-1111-4111-8111-000000000008', '11111111-1111-4111-8111-000000000008', now() - interval '1 day 7 hours', now() - interval '1 day 6 hours'),
  ('f9000000-0000-4000-8000-000000000003', 'f7000000-0000-4000-8000-000000000006', '5.1', 'mmol/L', '<5.2', 'Desirable', 'verified', '11111111-1111-4111-8111-000000000008', '11111111-1111-4111-8111-000000000008', now() - interval '5 days 1 hour', now() - interval '5 days'),
  ('f9000000-0000-4000-8000-000000000004', 'f7000000-0000-4000-8000-000000000007', '6.8', '%', '<7.0', 'At target', 'verified', '11111111-1111-4111-8111-000000000008', '11111111-1111-4111-8111-000000000008', now() - interval '5 days 1 hour', now() - interval '5 days')
on conflict (id) do nothing;

-- ============================================================================
-- 11. RADIOLOGY
-- ============================================================================

insert into public.radiology_orders (
  id, order_number, patient_id, encounter_id, examination_type, body_part,
  ordered_by, scheduled_at, status
)
values
  ('fa000000-0000-4000-8000-000000000001', 'RAD-2026-0001', '66666666-6666-4666-8666-000000000002', 'f0000000-0000-4000-8000-000000000004', 'Chest X-ray', 'Chest', '11111111-1111-4111-8111-000000000004', now() - interval '1 day 5 hours', 'completed'),
  ('fa000000-0000-4000-8000-000000000002', 'RAD-2026-0002', '66666666-6666-4666-8666-000000000003', 'f0000000-0000-4000-8000-000000000003', 'CT Scan', 'Head', '11111111-1111-4111-8111-000000000005', now() + interval '2 hours', 'scheduled'),
  ('fa000000-0000-4000-8000-000000000003', 'RAD-2026-0003', '66666666-6666-4666-8666-000000000004', 'f0000000-0000-4000-8000-000000000005', 'Ultrasound', 'Abdomen', '11111111-1111-4111-8111-000000000004', now() - interval '4 days 6 hours', 'completed')
on conflict (id) do nothing;

insert into public.radiology_reports (
  id, order_id, report_content, report_status, reported_by, verified_by,
  reported_at, verified_at
)
values
  ('fb000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000001',
   'Patchy infiltrates in the right lower lobe consistent with pneumonia. No pleural effusion.',
   'verified', '11111111-1111-4111-8111-000000000009', '11111111-1111-4111-8111-000000000009',
   now() - interval '1 day 4 hours', now() - interval '1 day 3 hours'),
  ('fb000000-0000-4000-8000-000000000002', 'fa000000-0000-4000-8000-000000000002',
   'Draft report. Findings pending radiologist review.',
   'draft', '11111111-1111-4111-8111-000000000009', null,
   now() - interval '10 minutes', null),
  ('fb000000-0000-4000-8000-000000000003', 'fa000000-0000-4000-8000-000000000003',
   'Mild bilateral renal cortical thinning. No hydronephrosis.',
   'verified', '11111111-1111-4111-8111-000000000009', '11111111-1111-4111-8111-000000000009',
   now() - interval '4 days 5 hours', now() - interval '4 days 4 hours')
on conflict (id) do nothing;

-- ============================================================================
-- 12. PHARMACY
-- ============================================================================

insert into public.prescriptions (
  id, prescription_number, patient_id, encounter_id, prescribed_by,
  prescription_date, status, notes
)
values
  ('fc000000-0000-4000-8000-000000000001', 'RX-2026-0001', '66666666-6666-4666-8666-000000000001', 'f0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-000000000004', now() - interval '1 day 8 hours', 'dispensed', null),
  ('fc000000-0000-4000-8000-000000000002', 'RX-2026-0002', '66666666-6666-4666-8666-000000000002', 'f0000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-000000000004', now() - interval '2 days', 'partially_dispensed', 'Remaining paracetamol to be dispensed on request.'),
  ('fc000000-0000-4000-8000-000000000003', 'RX-2026-0003', '66666666-6666-4666-8666-000000000004', 'f0000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-000000000004', now() - interval '4 days', 'pending', null)
on conflict (id) do nothing;

insert into public.prescription_items (
  id, prescription_id, medication_id, dosage, frequency, duration_days,
  quantity, instructions
)
select v.id, v.prescription_id, m.id, v.dosage, v.frequency, v.duration_days,
       v.quantity, v.instructions
from (values
  ('fd000000-0000-4000-8000-000000000001'::uuid, 'fc000000-0000-4000-8000-000000000001'::uuid, 'MED-0001', '500 mg', 'Every 6 hours', 5, 20::numeric, 'Take after meals.'),
  ('fd000000-0000-4000-8000-000000000002'::uuid, 'fc000000-0000-4000-8000-000000000001'::uuid, 'MED-0006', '20 mg', 'Once daily', 7, 7::numeric, 'Take before breakfast.'),
  ('fd000000-0000-4000-8000-000000000003'::uuid, 'fc000000-0000-4000-8000-000000000002'::uuid, 'MED-0009', '1 g', 'Every 24 hours', 7, 7::numeric, 'Administer intravenously.'),
  ('fd000000-0000-4000-8000-000000000004'::uuid, 'fc000000-0000-4000-8000-000000000002'::uuid, 'MED-0001', '500 mg', 'Every 6 hours', 5, 20::numeric, 'Take after meals.'),
  ('fd000000-0000-4000-8000-000000000005'::uuid, 'fc000000-0000-4000-8000-000000000003'::uuid, 'MED-0003', '50 mg', 'Once daily', 30, 30::numeric, 'Monitor blood pressure.')
) as v(id, prescription_id, medication_code, dosage, frequency, duration_days, quantity, instructions)
join public.medications m on m.medication_code = v.medication_code
on conflict (id) do nothing;

insert into public.medication_dispenses (
  id, prescription_item_id, quantity_dispensed, dispensed_by, dispensed_at, notes
)
values
  ('fe000000-0000-4000-8000-000000000001', 'fd000000-0000-4000-8000-000000000001', 20, '11111111-1111-4111-8111-00000000000a', now() - interval '1 day 7 hours', null),
  ('fe000000-0000-4000-8000-000000000002', 'fd000000-0000-4000-8000-000000000002', 7, '11111111-1111-4111-8111-00000000000a', now() - interval '1 day 7 hours', null),
  ('fe000000-0000-4000-8000-000000000003', 'fd000000-0000-4000-8000-000000000003', 7, '11111111-1111-4111-8111-00000000000a', now() - interval '2 days', null)
on conflict (id) do nothing;

-- ============================================================================
-- 13. INVENTORY
-- ============================================================================

insert into public.inventory_items (
  id, item_code, name, description, category_id, unit, reorder_level, created_by
)
values
  ('ab000000-0000-4000-8000-000000000001', 'ITM-0001', 'Surgical Gloves (Medium)', 'Sterile latex-free surgical gloves.', (select id from public.inventory_categories where name = 'Surgical Supplies'), 'box', 20, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-000000000002', 'ITM-0002', 'Sterile Gauze Pads', 'Sterile 4x4 gauze pads.', (select id from public.inventory_categories where name = 'Medical Supplies'), 'pack', 30, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-000000000003', 'ITM-0003', 'Alcohol 70%', 'Isopropyl alcohol 70 percent.', (select id from public.inventory_categories where name = 'Medical Supplies'), 'bottle', 15, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-000000000004', 'ITM-0004', 'Face Masks', 'Disposable surgical face masks.', (select id from public.inventory_categories where name = 'PPE'), 'box', 25, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-000000000005', 'ITM-0005', 'IV Cannula 20G', 'Single-use intravenous cannula.', (select id from public.inventory_categories where name = 'Medical Supplies'), 'piece', 50, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-000000000006', 'ITM-0006', 'Laboratory Slides', 'Glass microscope slides.', (select id from public.inventory_categories where name = 'Laboratory Supplies'), 'box', 10, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-000000000007', 'ITM-0007', 'Disinfectant', 'Hospital-grade surface disinfectant.', (select id from public.inventory_categories where name = 'Housekeeping'), 'bottle', 12, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-000000000008', 'ITM-0008', 'Syringe 5mL', 'Disposable 5mL syringe.', (select id from public.inventory_categories where name = 'Medical Supplies'), 'piece', 100, '11111111-1111-4111-8111-00000000000c')
on conflict (id) do nothing;

-- Medication stock is represented as inventory items whose item_code matches
-- the medication code. A dedicated stock table remains future work.
insert into public.inventory_items (
  id, item_code, name, description, category_id, unit, reorder_level, created_by
)
values
  ('ab000000-0000-4000-8000-000000000009', 'MED-0001', 'Paracetamol', 'Medication stock.', (select id from public.inventory_categories where name = 'Pharmacy'), 'tablet', 300, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-00000000000a', 'MED-0002', 'Amoxicillin', 'Medication stock.', (select id from public.inventory_categories where name = 'Pharmacy'), 'capsule', 150, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-00000000000b', 'MED-0003', 'Losartan', 'Medication stock.', (select id from public.inventory_categories where name = 'Pharmacy'), 'tablet', 100, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-00000000000c', 'MED-0004', 'Metformin', 'Medication stock.', (select id from public.inventory_categories where name = 'Pharmacy'), 'tablet', 200, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-00000000000d', 'MED-0005', 'Salbutamol', 'Medication stock.', (select id from public.inventory_categories where name = 'Pharmacy'), 'nebule', 40, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-00000000000e', 'MED-0006', 'Omeprazole', 'Medication stock.', (select id from public.inventory_categories where name = 'Pharmacy'), 'capsule', 60, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-00000000000f', 'MED-0007', 'Cetirizine', 'Medication stock.', (select id from public.inventory_categories where name = 'Pharmacy'), 'tablet', 80, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-000000000010', 'MED-0008', 'Amlodipine', 'Medication stock.', (select id from public.inventory_categories where name = 'Pharmacy'), 'tablet', 100, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-000000000011', 'MED-0009', 'Ceftriaxone', 'Medication stock.', (select id from public.inventory_categories where name = 'Pharmacy'), 'vial', 50, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-000000000012', 'MED-0010', 'Insulin (Human)', 'Medication stock.', (select id from public.inventory_categories where name = 'Pharmacy'), 'vial', 25, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-000000000013', 'MED-0011', 'Ibuprofen', 'Medication stock.', (select id from public.inventory_categories where name = 'Pharmacy'), 'tablet', 100, '11111111-1111-4111-8111-00000000000c'),
  ('ab000000-0000-4000-8000-000000000014', 'MED-0012', 'Tranexamic Acid', 'Medication stock.', (select id from public.inventory_categories where name = 'Pharmacy'), 'tablet', 40, '11111111-1111-4111-8111-00000000000c')
on conflict do nothing;

insert into public.inventory_batches (
  id, item_id, batch_number, quantity_received, quantity_remaining,
  expiration_date, unit_cost, received_at, created_by
)
values
  ('ac000000-0000-4000-8000-000000000001', 'ab000000-0000-4000-8000-000000000001', 'BATCH-2026-0001', 100, 80, date '2027-12-31', 250.00, now() - interval '20 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-000000000002', 'ab000000-0000-4000-8000-000000000002', 'BATCH-2026-0002', 200, 175, date '2027-06-30', 45.00, now() - interval '18 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-000000000003', 'ab000000-0000-4000-8000-000000000003', 'BATCH-2026-0003', 120, 115, date '2026-12-31', 90.00, now() - interval '15 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-000000000004', 'ab000000-0000-4000-8000-000000000004', 'BATCH-2026-0004', 50, 50, date '2028-01-31', 180.00, now() - interval '12 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-000000000005', 'ab000000-0000-4000-8000-000000000005', 'BATCH-2026-0005', 300, 300, date '2027-09-30', 12.50, now() - interval '10 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-000000000006', 'ab000000-0000-4000-8000-000000000006', 'BATCH-2026-0006', 40, 30, date '2029-03-31', 320.00, now() - interval '8 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-000000000007', 'ab000000-0000-4000-8000-000000000007', 'BATCH-2026-0007', 60, 56, date '2027-08-31', 150.00, now() - interval '6 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-000000000008', 'ab000000-0000-4000-8000-000000000008', 'BATCH-2026-0008', 500, 500, date '2028-05-31', 6.00, now() - interval '4 days', '11111111-1111-4111-8111-00000000000c')
on conflict (id) do nothing;

-- Medication stock batches backing the pharmacy inventory tab.
insert into public.inventory_batches (
  id, item_id, batch_number, quantity_received, quantity_remaining,
  expiration_date, unit_cost, received_at, created_by
)
values
  ('ac000000-0000-4000-8000-000000000009', 'ab000000-0000-4000-8000-000000000009', 'MED-BATCH-0001', 1200, 1200, current_date + 200, null, now() - interval '30 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-00000000000a', 'ab000000-0000-4000-8000-00000000000a', 'MED-BATCH-0002', 80, 80, current_date + 45, null, now() - interval '30 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-00000000000b', 'ab000000-0000-4000-8000-00000000000b', 'MED-BATCH-0003', 420, 420, current_date + 300, null, now() - interval '30 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-00000000000c', 'ab000000-0000-4000-8000-00000000000c', 'MED-BATCH-0004', 0, 0, current_date + 60, null, now() - interval '30 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-00000000000d', 'ab000000-0000-4000-8000-00000000000d', 'MED-BATCH-0005', 65, 65, current_date + 120, null, now() - interval '30 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-00000000000e', 'ab000000-0000-4000-8000-00000000000e', 'MED-BATCH-0006', 30, 30, current_date + 25, null, now() - interval '30 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-00000000000f', 'ab000000-0000-4000-8000-00000000000f', 'MED-BATCH-0007', 250, 250, current_date + 400, null, now() - interval '30 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-000000000010', 'ab000000-0000-4000-8000-000000000010', 'MED-BATCH-0008', 150, 150, current_date + 180, null, now() - interval '30 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-000000000011', 'ab000000-0000-4000-8000-000000000011', 'MED-BATCH-0009', 0, 0, current_date + 90, null, now() - interval '30 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-000000000012', 'ab000000-0000-4000-8000-000000000012', 'MED-BATCH-0010', 18, 18, current_date + 30, null, now() - interval '30 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-000000000013', 'ab000000-0000-4000-8000-000000000013', 'MED-BATCH-0011', 300, 300, current_date + 220, null, now() - interval '30 days', '11111111-1111-4111-8111-00000000000c'),
  ('ac000000-0000-4000-8000-000000000014', 'ab000000-0000-4000-8000-000000000014', 'MED-BATCH-0012', 12, 12, current_date + 70, null, now() - interval '30 days', '11111111-1111-4111-8111-00000000000c')
on conflict do nothing;

insert into public.stock_transactions (
  id, item_id, batch_id, transaction_type, quantity, reference_type,
  reference_id, reason, performed_by, performed_at
)
values
  ('ad000000-0000-4000-8000-000000000001', 'ab000000-0000-4000-8000-000000000001', 'ac000000-0000-4000-8000-000000000001', 'stock_in', 100, 'purchase_order', null, 'Initial stock receipt', '11111111-1111-4111-8111-00000000000c', now() - interval '20 days'),
  ('ad000000-0000-4000-8000-000000000002', 'ab000000-0000-4000-8000-000000000002', 'ac000000-0000-4000-8000-000000000002', 'stock_in', 200, 'purchase_order', null, 'Initial stock receipt', '11111111-1111-4111-8111-00000000000c', now() - interval '18 days'),
  ('ad000000-0000-4000-8000-000000000003', 'ab000000-0000-4000-8000-000000000001', 'ac000000-0000-4000-8000-000000000001', 'stock_out', 20, 'department', null, 'ER restock', '11111111-1111-4111-8111-00000000000c', now() - interval '15 days'),
  ('ad000000-0000-4000-8000-000000000004', 'ab000000-0000-4000-8000-000000000004', 'ac000000-0000-4000-8000-000000000004', 'stock_in', 50, 'purchase_order', null, 'Initial stock receipt', '11111111-1111-4111-8111-00000000000c', now() - interval '12 days'),
  ('ad000000-0000-4000-8000-000000000005', 'ab000000-0000-4000-8000-000000000003', 'ac000000-0000-4000-8000-000000000003', 'adjustment', 5, 'inventory_count', null, 'Expired units removed', '11111111-1111-4111-8111-00000000000c', now() - interval '11 days'),
  ('ad000000-0000-4000-8000-000000000006', 'ab000000-0000-4000-8000-000000000005', 'ac000000-0000-4000-8000-000000000005', 'stock_in', 300, 'purchase_order', null, 'Initial stock receipt', '11111111-1111-4111-8111-00000000000c', now() - interval '10 days'),
  ('ad000000-0000-4000-8000-000000000007', 'ab000000-0000-4000-8000-000000000006', 'ac000000-0000-4000-8000-000000000006', 'dispensing', 10, 'laboratory_order', 'f6000000-0000-4000-8000-000000000001', 'Laboratory consumption', '11111111-1111-4111-8111-00000000000c', now() - interval '8 days'),
  ('ad000000-0000-4000-8000-000000000008', 'ab000000-0000-4000-8000-000000000007', 'ac000000-0000-4000-8000-000000000007', 'stock_out', 4, 'department', null, 'Housekeeping restock', '11111111-1111-4111-8111-00000000000c', now() - interval '6 days'),
  ('ad000000-0000-4000-8000-000000000009', 'ab000000-0000-4000-8000-000000000008', 'ac000000-0000-4000-8000-000000000008', 'stock_in', 500, 'purchase_order', null, 'Initial stock receipt', '11111111-1111-4111-8111-00000000000c', now() - interval '4 days'),
  ('ad000000-0000-4000-8000-00000000000a', 'ab000000-0000-4000-8000-000000000002', 'ac000000-0000-4000-8000-000000000002', 'transfer', 25, 'department', null, 'Transfer to OPD', '11111111-1111-4111-8111-00000000000c', now() - interval '3 days')
on conflict (id) do nothing;

-- ============================================================================
-- 14. BILLING AND PAYMENTS
-- ============================================================================

insert into public.invoices (
  id, invoice_number, patient_id, admission_id, encounter_id, invoice_date,
  subtotal, discount_amount, total_amount, amount_paid, balance, status, created_by
)
values
  ('ae000000-0000-4000-8000-000000000001', 'INV-2026-0001', '66666666-6666-4666-8666-000000000001', null, 'f0000000-0000-4000-8000-000000000001', now() - interval '1 day 7 hours', 2500.00, 0.00, 2500.00, 2500.00, 0.00, 'paid', '11111111-1111-4111-8111-00000000000b'),
  ('ae000000-0000-4000-8000-000000000002', 'INV-2026-0002', '66666666-6666-4666-8666-000000000002', 'cccccccc-cccc-4ccc-8ccc-000000000001', null, now() - interval '1 day 2 hours', 18500.00, 500.00, 18000.00, 8000.00, 10000.00, 'partially_paid', '11111111-1111-4111-8111-00000000000b'),
  ('ae000000-0000-4000-8000-000000000003', 'INV-2026-0003', '66666666-6666-4666-8666-000000000003', null, 'f0000000-0000-4000-8000-000000000003', now() - interval '30 minutes', 4200.00, 0.00, 4200.00, 0.00, 4200.00, 'unpaid', '11111111-1111-4111-8111-00000000000b'),
  ('ae000000-0000-4000-8000-000000000004', 'INV-2026-0004', '66666666-6666-4666-8666-000000000004', 'cccccccc-cccc-4ccc-8ccc-000000000002', null, now() - interval '4 days', 12750.00, 0.00, 12750.00, 12750.00, 0.00, 'paid', '11111111-1111-4111-8111-00000000000b')
on conflict (id) do nothing;

insert into public.invoice_items (
  id, invoice_id, description, quantity, unit_price, line_total
)
values
  ('af000000-0000-4000-8000-000000000001', 'ae000000-0000-4000-8000-000000000001', 'Consultation', 1, 500.00, 500.00),
  ('af000000-0000-4000-8000-000000000002', 'ae000000-0000-4000-8000-000000000001', 'Laboratory tests', 1, 1200.00, 1200.00),
  ('af000000-0000-4000-8000-000000000003', 'ae000000-0000-4000-8000-000000000001', 'Pharmacy', 1, 800.00, 800.00),
  ('af000000-0000-4000-8000-000000000004', 'ae000000-0000-4000-8000-000000000002', 'Room and board', 4, 3000.00, 12000.00),
  ('af000000-0000-4000-8000-000000000005', 'ae000000-0000-4000-8000-000000000002', 'Laboratory tests', 1, 3500.00, 3500.00),
  ('af000000-0000-4000-8000-000000000006', 'ae000000-0000-4000-8000-000000000002', 'Radiology', 1, 3000.00, 3000.00),
  ('af000000-0000-4000-8000-000000000007', 'ae000000-0000-4000-8000-000000000003', 'Emergency consultation', 1, 800.00, 800.00),
  ('af000000-0000-4000-8000-000000000008', 'ae000000-0000-4000-8000-000000000003', 'Laboratory tests', 1, 1400.00, 1400.00),
  ('af000000-0000-4000-8000-000000000009', 'ae000000-0000-4000-8000-000000000003', 'Radiology', 1, 2000.00, 2000.00),
  ('af000000-0000-4000-8000-00000000000a', 'ae000000-0000-4000-8000-000000000004', 'Room and board', 3, 3000.00, 9000.00),
  ('af000000-0000-4000-8000-00000000000b', 'ae000000-0000-4000-8000-000000000004', 'Laboratory tests', 1, 2500.00, 2500.00),
  ('af000000-0000-4000-8000-00000000000c', 'ae000000-0000-4000-8000-000000000004', 'Pharmacy', 1, 1250.00, 1250.00)
on conflict (id) do nothing;

insert into public.payments (
  id, payment_reference, invoice_id, amount, payment_method, payment_status,
  received_by, received_at, notes
)
values
  ('a1000000-0000-4000-8000-000000000001', 'PAY-2026-0001', 'ae000000-0000-4000-8000-000000000001', 2500.00, 'Cash', 'completed', '11111111-1111-4111-8111-00000000000b', now() - interval '1 day 7 hours', null),
  ('a1000000-0000-4000-8000-000000000002', 'PAY-2026-0002', 'ae000000-0000-4000-8000-000000000002', 8000.00, 'Credit card', 'completed', '11111111-1111-4111-8111-00000000000b', now() - interval '1 day', 'Partial payment.'),
  ('a1000000-0000-4000-8000-000000000003', 'PAY-2026-0003', 'ae000000-0000-4000-8000-000000000004', 12750.00, 'Cash', 'completed', '11111111-1111-4111-8111-00000000000b', now() - interval '4 days', null)
on conflict (id) do nothing;

-- ============================================================================
-- 15. NOTIFICATIONS AND AUDIT LOGS
-- ============================================================================

insert into public.notifications (
  id, user_id, title, message, notification_type, related_entity_type,
  related_entity_id, is_read, created_at, read_at
)
values
  ('a2000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-000000000004', 'Laboratory result ready', 'A verified laboratory result is ready for release. Open the laboratory record for details.', 'laboratory_result', 'laboratory_order', 'f6000000-0000-4000-8000-000000000001', false, now() - interval '1 day 6 hours', null),
  ('a2000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-000000000002', 'Low stock alert', 'Surgical Gloves (Medium) is below its reorder level. Open inventory for details.', 'low_stock', 'inventory_item', 'ab000000-0000-4000-8000-000000000001', false, now() - interval '12 hours', null),
  ('a2000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-000000000006', 'Admission notification', 'An inpatient admission was recorded. Open the admission record for details.', 'admission', 'admission', 'cccccccc-cccc-4ccc-8ccc-000000000001', true, now() - interval '2 days', now() - interval '1 day 20 hours'),
  ('a2000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-00000000000b', 'Billing reminder', 'An invoice has an outstanding balance. Open the invoice record for details.', 'billing', 'invoice', 'ae000000-0000-4000-8000-000000000003', false, now() - interval '6 hours', null),
  ('a2000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-000000000002', 'Preventive maintenance due', 'Preventive maintenance is due for a medical asset. Open the equipment record for details.', 'maintenance', 'equipment', null, true, now() - interval '3 days', now() - interval '2 days'),
  ('a2000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-000000000003', 'Appointment reminder', 'A patient has an appointment tomorrow. Open the appointment record for details.', 'appointment', 'appointment', 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001', false, now() - interval '4 hours', null),
  ('a2000000-0000-4000-8000-000000000007', '11111111-1111-4111-8111-000000000004', 'Radiology report verified', 'A radiology report was verified. Open the report for details.', 'radiology_report', 'radiology_order', 'fa000000-0000-4000-8000-000000000001', true, now() - interval '1 day 3 hours', now() - interval '1 day 2 hours'),
  ('a2000000-0000-4000-8000-000000000008', '11111111-1111-4111-8111-000000000009', 'Staff announcement', 'The quarterly staff town hall is scheduled. Open the announcement for details.', 'announcement', 'announcement', null, true, now() - interval '2 days', now() - interval '1 day')
on conflict (id) do nothing;

insert into public.audit_logs (
  actor_id, action, entity_type, entity_id, description, metadata, ip_address, created_at
)
select v.actor_id, v.action, v.entity_type, v.entity_id, v.description,
       v.metadata, v.ip_address, v.created_at
from (values
  ('11111111-1111-4111-8111-000000000002'::uuid, 'patient.create', 'patient', '66666666-6666-4666-8666-000000000001'::uuid, 'Registered a new patient.', '{"source":"seed"}'::jsonb, '192.0.2.10'::inet, now() - interval '30 days'),
  ('11111111-1111-4111-8111-000000000002'::uuid, 'patient.create', 'patient', '66666666-6666-4666-8666-000000000002'::uuid, 'Registered a new patient.', '{"source":"seed"}'::jsonb, '192.0.2.10'::inet, now() - interval '25 days'),
  ('11111111-1111-4111-8111-000000000003'::uuid, 'appointment.create', 'appointment', 'bbbbbbbb-bbbb-4bbb-8bbb-000000000001'::uuid, 'Created an appointment.', '{"source":"seed"}'::jsonb, '192.0.2.11'::inet, now() - interval '2 days'),
  ('11111111-1111-4111-8111-000000000002'::uuid, 'admission.create', 'admission', 'cccccccc-cccc-4ccc-8ccc-000000000001'::uuid, 'Admitted a patient.', '{"source":"seed"}'::jsonb, '192.0.2.10'::inet, now() - interval '2 days'),
  ('11111111-1111-4111-8111-000000000004'::uuid, 'medical_record.finalize', 'clinical_note', 'f3000000-0000-4000-8000-000000000001'::uuid, 'Finalized a clinical note.', '{"source":"seed"}'::jsonb, '192.0.2.12'::inet, now() - interval '1 day 8 hours'),
  ('11111111-1111-4111-8111-000000000008'::uuid, 'laboratory.result.verify', 'laboratory_result', 'f9000000-0000-4000-8000-000000000001'::uuid, 'Verified a laboratory result.', '{"source":"seed"}'::jsonb, '192.0.2.13'::inet, now() - interval '1 day 6 hours'),
  ('11111111-1111-4111-8111-000000000009'::uuid, 'radiology.report.verify', 'radiology_report', 'fb000000-0000-4000-8000-000000000001'::uuid, 'Verified a radiology report.', '{"source":"seed"}'::jsonb, '192.0.2.14'::inet, now() - interval '1 day 3 hours'),
  ('11111111-1111-4111-8111-00000000000a'::uuid, 'prescription.dispense', 'prescription', 'fc000000-0000-4000-8000-000000000001'::uuid, 'Dispensed a prescription.', '{"source":"seed"}'::jsonb, '192.0.2.15'::inet, now() - interval '1 day 7 hours'),
  ('11111111-1111-4111-8111-00000000000b'::uuid, 'billing.payment.create', 'payment', 'a1000000-0000-4000-8000-000000000001'::uuid, 'Recorded a payment.', '{"source":"seed"}'::jsonb, '192.0.2.16'::inet, now() - interval '1 day 7 hours'),
  ('11111111-1111-4111-8111-000000000002'::uuid, 'system.settings.manage', 'system', null::uuid, 'Reviewed system settings.', '{"source":"seed"}'::jsonb, '192.0.2.10'::inet, now() - interval '6 hours')
) as v(actor_id, action, entity_type, entity_id, description, metadata, ip_address, created_at)
where not exists (select 1 from public.audit_logs);

-- ============================================================================
-- 16. REFERENCE NUMBER SEQUENCES
-- ============================================================================
-- Keep generate_reference_number() ahead of the seeded identifiers so new
-- records do not collide with MRN-2026-0001 ... INV-2026-0004.

insert into public.reference_sequences as seq (prefix, last_value)
values
  ('MRN', 10),
  ('APT', 6),
  ('ADM', 3),
  ('ENC', 6),
  ('LAB', 4),
  ('RAD', 3),
  ('RX', 3),
  ('INV', 4),
  ('PAY', 3)
on conflict (prefix) do update
set last_value = greatest(seq.last_value, excluded.last_value),
    updated_at = now();

commit;

-- ============================================================================
-- OPTIONAL VERIFICATION (uncomment and run separately)
-- ============================================================================
-- select 'auth.users' as table_name, count(*) from auth.users
-- union all select 'profiles', count(*) from public.profiles
-- union all select 'patients', count(*) from public.patients
-- union all select 'appointments', count(*) from public.appointments
-- union all select 'admissions', count(*) from public.admissions
-- union all select 'encounters', count(*) from public.encounters
-- union all select 'laboratory_orders', count(*) from public.laboratory_orders
-- union all select 'radiology_orders', count(*) from public.radiology_orders
-- union all select 'prescriptions', count(*) from public.prescriptions
-- union all select 'invoices', count(*) from public.invoices
-- union all select 'notifications', count(*) from public.notifications
-- union all select 'audit_logs', count(*) from public.audit_logs;


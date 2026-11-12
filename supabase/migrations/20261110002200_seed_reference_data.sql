-- ============================================================================
-- SPMC HMS — seed reference data
-- Migration 022 of 22. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

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
  -- Administration
  'system.admin',
  'system.settings.manage',
  'user.view',
  'user.create',
  'user.update',
  'user.deactivate',
  'role.manage',
  'audit.view',
  -- Patient management
  'patient.view',
  'patient.create',
  'patient.update',
  'patient.archive',
  'patient.search',
  'patient.export',
  -- Appointments
  'appointment.view',
  'appointment.create',
  'appointment.update',
  'appointment.cancel',
  'appointment.manage_schedule',
  -- Admissions
  'admission.view',
  'admission.create',
  'admission.update',
  'admission.transfer',
  'admission.discharge',
  'bed.view',
  'bed.manage',
  -- Medical records
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
  -- Nursing
  'nursing.view',
  'nursing.assessment.create',
  'nursing.notes.create',
  'nursing.notes.view',
  -- Laboratory
  'laboratory.view',
  'laboratory.order.view',
  'laboratory.order.create',
  'laboratory.specimen.manage',
  'laboratory.result.create',
  'laboratory.result.verify',
  -- Radiology
  'radiology.view',
  'radiology.order.manage',
  'radiology.report.create',
  'radiology.report.verify',
  -- Pharmacy
  'pharmacy.view',
  'prescription.view',
  'prescription.create',
  'prescription.dispense',
  'medication.manage',
  -- Billing
  'billing.view',
  'billing.invoice.create',
  'billing.invoice.update',
  'billing.payment.create',
  'billing.refund',
  'billing.report.view',
  -- Inventory
  'inventory.view',
  'inventory.item.manage',
  'inventory.stock.in',
  'inventory.stock.out',
  'inventory.stock.adjust',
  'inventory.report.view',
  -- Reports
  'reports.patient.view',
  'reports.admission.view',
  'reports.appointment.view',
  'reports.financial.view',
  'reports.inventory.view',
  'reports.laboratory.view'
]) as slug
on conflict (slug) do nothing;

-- Starter laboratory catalog from PROJECT.MD section 16.
insert into public.laboratory_tests (
  test_code,
  test_name,
  category,
  description,
  specimen_type
)
values
  ('CBC',   'Complete Blood Count', 'Hematology',          'Complete blood count with differential.',                     'Whole blood'),
  ('UA',    'Urinalysis',           'Clinical Microscopy',  'Macroscopic and microscopic urine examination.',              'Urine'),
  ('FEC',   'Fecalysis',            'Clinical Microscopy',  'Fecal examination for parasites and occult blood.',           'Stool'),
  ('CHEM',  'Blood Chemistry',      'Clinical Chemistry',   'Serum chemistry panel.',                                      'Serum'),
  ('LIPID', 'Lipid Profile',        'Clinical Chemistry',   'Total cholesterol, HDL, LDL, and triglycerides.',             'Serum'),
  ('FBS',   'Blood Glucose',        'Clinical Chemistry',   'Fasting or random blood glucose.',                            'Blood'),
  ('PT',    'Pregnancy Test',       'Clinical Microscopy',  'Urine hCG pregnancy test.',                                   'Urine'),
  ('HBA1C', 'Hemoglobin A1c',       'Clinical Chemistry',   'Glycated hemoglobin.',                                        'Whole blood')
on conflict (test_code) do nothing;

-- Starter medication catalog. Pharmacy must review and extend this list before
-- production use; it mirrors the reference data used by the UI preview.
insert into public.medications (
  medication_code,
  generic_name,
  brand_name,
  strength,
  dosage_form,
  unit
)
values
  ('MED-0001', 'Paracetamol',      'Biogesic',   '500 mg',     'Tablet',  'tablet'),
  ('MED-0002', 'Amoxicillin',      'Amoxil',     '500 mg',     'Capsule', 'capsule'),
  ('MED-0003', 'Losartan',         'Cozaar',     '50 mg',      'Tablet',  'tablet'),
  ('MED-0004', 'Metformin',        'Glucophage', '500 mg',     'Tablet',  'tablet'),
  ('MED-0005', 'Salbutamol',       'Ventolin',   '2.5 mg',     'Nebule',  'nebule'),
  ('MED-0006', 'Omeprazole',       'Losec',      '20 mg',      'Capsule', 'capsule'),
  ('MED-0007', 'Cetirizine',       'Zyrtec',     '10 mg',      'Tablet',  'tablet'),
  ('MED-0008', 'Amlodipine',       'Norvasc',    '5 mg',       'Tablet',  'tablet'),
  ('MED-0009', 'Ceftriaxone',      'Rocephin',   '1 g',        'Vial',    'vial'),
  ('MED-0010', 'Insulin (Human)',  'Humulin',    '100 IU/mL',  'Vial',    'vial'),
  ('MED-0011', 'Ibuprofen',        'Advil',      '200 mg',     'Tablet',  'tablet'),
  ('MED-0012', 'Tranexamic Acid',  'Cyklokapron','500 mg',     'Tablet',  'tablet')
on conflict (medication_code) do nothing;

-- Starter inventory categories. Departments may add more through the
-- inventory administration workflow.
insert into public.inventory_categories (name, description)
values
  ('Medical Supplies',    'General medical consumables.'),
  ('Surgical Supplies',   'Operating and procedure supplies.'),
  ('Laboratory Supplies', 'Laboratory collection and testing supplies.'),
  ('PPE',                 'Personal protective equipment.'),
  ('Housekeeping',        'Cleaning and housekeeping supplies.')
on conflict (name) do nothing;

-- Role -> permission mapping is intentionally NOT seeded.
-- SUPABASE.MD section 22.2 states the matrix is an initial proposal that must
-- be approved by hospital stakeholders before it becomes an enforced policy.
--
-- Example once approved:
--   insert into public.role_permissions (role_id, permission_id)
--   select r.id, p.id
--   from public.roles r
--   join public.permissions p on p.slug = any(array['patient.view', 'patient.search'])
--   where r.slug = 'receptionist'
--   on conflict do nothing;

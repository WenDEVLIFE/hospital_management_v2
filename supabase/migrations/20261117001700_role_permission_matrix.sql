-- ============================================================================
-- SPMC HMS — role → permission matrix
-- Migration 040. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Authoritative, idempotent seeding of the role matrix. Additive only: it never
-- removes grants, so ad-hoc approvals made in the dashboard survive a re-run.
-- Gaps closed here: physicians could not admit or transfer patients, nurses
-- could not transfer, and physicians could not schedule follow-up appointments.

-- Administrators hold every permission.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug in ('super_admin', 'hospital_admin')
on conflict do nothing;

-- Receptionist: registration, scheduling, admissions front desk.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.create', 'patient.update', 'patient.search',
  'appointment.view', 'appointment.create', 'appointment.update',
  'appointment.cancel', 'appointment.manage_schedule',
  'admission.view', 'admission.create', 'bed.view',
  'emergency.view', 'emergency.create',
  'reports.patient.view', 'reports.appointment.view'
])
where r.slug = 'receptionist'
on conflict do nothing;

-- Physician: diagnosis, ordering, admission decisions, surgery.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.search', 'patient.export',
  'appointment.view', 'appointment.create', 'appointment.update',
  'admission.view', 'admission.create', 'admission.update',
  'admission.transfer', 'admission.discharge', 'bed.view',
  'medical_record.view', 'medical_record.create', 'medical_record.update',
  'medical_record.finalize', 'medical_record.amend',
  'diagnosis.view', 'diagnosis.create', 'diagnosis.update',
  'vital_signs.view', 'vital_signs.record',
  'nursing.view', 'nursing.notes.view',
  'laboratory.view', 'laboratory.order.view', 'laboratory.order.create',
  'radiology.view', 'radiology.order.manage',
  'prescription.view', 'prescription.create',
  'emergency.view', 'emergency.create', 'emergency.update',
  'surgery.view', 'surgery.create', 'surgery.update',
  'hr.view',
  'reports.patient.view', 'reports.admission.view',
  'reports.laboratory.view'
])
where r.slug = 'physician'
on conflict do nothing;

-- Nurse: charting, triage, ward movement, theatre assistance.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.search',
  'appointment.view',
  'admission.view', 'admission.transfer', 'bed.view',
  'medical_record.view',
  'diagnosis.view',
  'vital_signs.view', 'vital_signs.record',
  'nursing.view', 'nursing.assessment.create',
  'nursing.notes.view', 'nursing.notes.create',
  'laboratory.view', 'laboratory.order.view',
  'radiology.view',
  'prescription.view',
  'emergency.view', 'emergency.create', 'emergency.update',
  'surgery.view', 'surgery.create', 'surgery.update',
  'hr.view',
  'reports.patient.view'
])
where r.slug = 'nurse'
on conflict do nothing;

-- Laboratory staff.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.search',
  'medical_record.view',
  'laboratory.view', 'laboratory.order.view', 'laboratory.specimen.manage',
  'laboratory.result.create', 'laboratory.result.verify',
  'reports.laboratory.view'
])
where r.slug = 'laboratory_staff'
on conflict do nothing;

-- Radiology staff.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.search',
  'medical_record.view',
  'radiology.view', 'radiology.order.manage',
  'radiology.report.create', 'radiology.report.verify',
  'reports.patient.view'
])
where r.slug = 'radiology_staff'
on conflict do nothing;

-- Pharmacist.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'patient.view', 'patient.search',
  'pharmacy.view', 'prescription.view', 'prescription.dispense',
  'medication.manage',
  'inventory.view', 'reports.inventory.view'
])
where r.slug = 'pharmacist'
on conflict do nothing;

-- Billing staff.
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

-- Inventory staff.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'inventory.view', 'inventory.item.manage',
  'inventory.stock.in', 'inventory.stock.out', 'inventory.stock.adjust',
  'inventory.report.view', 'reports.inventory.view'
])
where r.slug = 'inventory_staff'
on conflict do nothing;

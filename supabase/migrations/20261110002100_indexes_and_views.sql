-- ============================================================================
-- SPMC HMS — indexes and views
-- Migration 021 of 22. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

create index if not exists idx_patients_mrn
  on public.patients(medical_record_number);

create index if not exists idx_patients_name
  on public.patients(last_name, first_name);

create index if not exists idx_appointments_patient
  on public.appointments(patient_id);

create index if not exists idx_appointments_physician_schedule
  on public.appointments(physician_id, scheduled_at);

create index if not exists idx_appointments_status
  on public.appointments(status);

create index if not exists idx_admissions_patient
  on public.admissions(patient_id);

create index if not exists idx_admissions_status
  on public.admissions(status);

create index if not exists idx_beds_room
  on public.beds(room_id);

create index if not exists idx_beds_status
  on public.beds(status);

create index if not exists idx_encounters_patient
  on public.encounters(patient_id);

create index if not exists idx_vital_signs_encounter
  on public.vital_signs(encounter_id);

create index if not exists idx_diagnoses_patient
  on public.diagnoses(patient_id);

create index if not exists idx_laboratory_orders_patient
  on public.laboratory_orders(patient_id);

create index if not exists idx_laboratory_orders_status
  on public.laboratory_orders(status);

create index if not exists idx_prescriptions_patient
  on public.prescriptions(patient_id);

create index if not exists idx_prescriptions_status
  on public.prescriptions(status);

create index if not exists idx_inventory_batches_item
  on public.inventory_batches(item_id);

create index if not exists idx_stock_transactions_item
  on public.stock_transactions(item_id);

create index if not exists idx_invoices_patient
  on public.invoices(patient_id);

create index if not exists idx_invoices_status
  on public.invoices(status);

create index if not exists idx_payments_invoice
  on public.payments(invoice_id);

create index if not exists idx_notifications_user
  on public.notifications(user_id, created_at desc);

create index if not exists idx_audit_logs_actor
  on public.audit_logs(actor_id, created_at desc);

-- Additional foreign-key and operational indexes
create index if not exists idx_profiles_email
  on public.profiles(email);

create index if not exists idx_user_roles_role
  on public.user_roles(role_id);

create index if not exists idx_staff_profiles_department
  on public.staff_profiles(department_id);

create index if not exists idx_rooms_department
  on public.rooms(department_id);

create index if not exists idx_emergency_contacts_patient
  on public.emergency_contacts(patient_id);

create index if not exists idx_patient_allergies_patient
  on public.patient_allergies(patient_id);

create index if not exists idx_medical_histories_patient
  on public.medical_histories(patient_id);

create index if not exists idx_patient_care_assignments_patient
  on public.patient_care_assignments(patient_id, ended_at);

create index if not exists idx_admission_bed_assignments_admission
  on public.admission_bed_assignments(admission_id);

create index if not exists idx_admission_bed_assignments_bed
  on public.admission_bed_assignments(bed_id)
  where released_at is null;

create index if not exists idx_clinical_notes_encounter
  on public.clinical_notes(encounter_id);

create index if not exists idx_radiology_orders_patient
  on public.radiology_orders(patient_id);

create index if not exists idx_radiology_reports_order
  on public.radiology_reports(order_id);

create index if not exists idx_medications_generic_name
  on public.medications(generic_name);

create index if not exists idx_prescription_items_prescription
  on public.prescription_items(prescription_id);

create index if not exists idx_medication_dispenses_item
  on public.medication_dispenses(prescription_item_id);

create index if not exists idx_inventory_items_category
  on public.inventory_items(category_id);

create index if not exists idx_invoice_items_invoice
  on public.invoice_items(invoice_id);

-- Only one active (unreleased) bed assignment per bed at a time.
create unique index if not exists uq_active_bed_assignment
  on public.admission_bed_assignments(bed_id)
  where released_at is null;

create or replace view public.v_bed_availability
with (security_invoker = true)
as
select
  b.id as bed_id,
  b.bed_number,
  b.status,
  r.room_number,
  d.name as department_name
from public.beds b
join public.rooms r on r.id = b.room_id
join public.departments d on d.id = r.department_id;

create or replace view public.v_patient_summary
with (security_invoker = true)
as
select
  p.id,
  p.medical_record_number,
  p.first_name,
  p.middle_name,
  p.last_name,
  p.date_of_birth,
  p.sex,
  p.registration_status,
  p.registration_date
from public.patients p;

create or replace view public.v_appointment_summary
with (security_invoker = true)
as
select
  a.id,
  a.appointment_number,
  a.patient_id,
  a.scheduled_at,
  a.duration_minutes,
  a.status,
  d.name as department_name,
  sp.first_name || ' ' || sp.last_name as physician_name
from public.appointments a
join public.departments d on d.id = a.department_id
left join public.physicians ph on ph.id = a.physician_id
left join public.staff_profiles sp on sp.id = ph.staff_id;

create or replace view public.v_admission_census
with (security_invoker = true)
as
select
  ad.id,
  ad.admission_number,
  ad.patient_id,
  ad.status,
  ad.admission_date,
  ad.discharge_date,
  d.name as department_name
from public.admissions ad
join public.departments d on d.id = ad.department_id;

create or replace view public.v_laboratory_summary
with (security_invoker = true)
as
select
  lo.id,
  lo.order_number,
  lo.patient_id,
  lo.status,
  lo.priority,
  lo.ordered_at,
  count(loi.id) as item_count
from public.laboratory_orders lo
left join public.laboratory_order_items loi on loi.order_id = lo.id
group by lo.id;

create or replace view public.v_pharmacy_summary
with (security_invoker = true)
as
select
  pr.id,
  pr.prescription_number,
  pr.patient_id,
  pr.status,
  pr.prescription_date,
  count(pi.id) as item_count
from public.prescriptions pr
left join public.prescription_items pi on pi.prescription_id = pr.id
group by pr.id;

create or replace view public.v_billing_summary
with (security_invoker = true)
as
select
  i.id,
  i.invoice_number,
  i.patient_id,
  i.status,
  i.invoice_date,
  i.total_amount,
  i.amount_paid,
  i.balance
from public.invoices i;

create or replace view public.v_inventory_summary
with (security_invoker = true)
as
select
  ii.id,
  ii.item_code,
  ii.name,
  ii.unit,
  ii.reorder_level,
  c.name as category_name,
  coalesce(sum(ib.quantity_remaining), 0) as quantity_on_hand
from public.inventory_items ii
left join public.inventory_categories c on c.id = ii.category_id
left join public.inventory_batches ib on ib.item_id = ii.id
group by ii.id, c.name;

-- ----------------------------------------------------------------------------
-- VIEW GRANTS
-- ----------------------------------------------------------------------------
-- The views are security_invoker, so RLS on the underlying tables is the row
-- boundary. They are read-only API projections.

grant select on
  public.v_bed_availability,
  public.v_patient_summary,
  public.v_appointment_summary,
  public.v_admission_census,
  public.v_laboratory_summary,
  public.v_pharmacy_summary,
  public.v_billing_summary,
  public.v_inventory_summary
to authenticated;

grant select on
  public.v_bed_availability,
  public.v_patient_summary,
  public.v_appointment_summary,
  public.v_admission_census,
  public.v_laboratory_summary,
  public.v_pharmacy_summary,
  public.v_billing_summary,
  public.v_inventory_summary
to service_role;

revoke all on
  public.v_bed_availability,
  public.v_patient_summary,
  public.v_appointment_summary,
  public.v_admission_census,
  public.v_laboratory_summary,
  public.v_pharmacy_summary,
  public.v_billing_summary,
  public.v_inventory_summary
from anon;

revoke insert, update, delete on
  public.v_bed_availability,
  public.v_patient_summary,
  public.v_appointment_summary,
  public.v_admission_census,
  public.v_laboratory_summary,
  public.v_pharmacy_summary,
  public.v_billing_summary,
  public.v_inventory_summary
from authenticated, service_role;

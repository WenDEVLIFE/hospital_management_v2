-- ============================================================================
-- SPMC HMS — Row Level Security
-- Migration 018 of 22.
-- ============================================================================
-- Deny-by-default. Every policy targets `authenticated`; `anon` gets no access.
-- Policies use the permission helpers from migration 017. Until the Phase 0
-- role -> permission matrix is approved and seeded, only administrators
-- (is_admin()) pass these checks. That is intentional: the database stays closed
-- rather than open.
--
-- FORCE ROW LEVEL SECURITY is intentionally not used. The SECURITY DEFINER
-- helpers and migration/maintenance jobs must retain owner bypass. Revisit only
-- after auditing every definer function.
--
-- EXISTING DATABASE
--   Run supabase/upgrade/20261112000000_schema_hardening.sql first, then run
--   this file manually. It is idempotent.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HELPER HARDENING
-- ----------------------------------------------------------------------------

create or replace function public.current_staff_department_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select sp.department_id
  from public.staff_profiles sp
  where sp.user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.has_role(text) from public;
grant execute on function public.has_role(text) to authenticated, service_role;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;

revoke all on function public.has_permission(text) from public;
grant execute on function public.has_permission(text) to authenticated, service_role;

revoke all on function public.can_access_patient(uuid) from public;
grant execute on function public.can_access_patient(uuid) to authenticated, service_role;

revoke all on function public.current_staff_department_id() from public;
grant execute on function public.current_staff_department_id() to authenticated, service_role;

-- Self-service profile updates must not become an account-reactivation or
-- email-change path. Service-role maintenance is allowed because auth.uid()
-- is null in those sessions.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.is_active is distinct from old.is_active then
      raise exception 'Only administrators can change account status'
        using errcode = '42501';
    end if;

    if new.email is distinct from old.email then
      raise exception 'Only administrators can change account email'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_fields() from public;
grant execute on function public.protect_profile_fields() to authenticated, service_role;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
before update on public.profiles
for each row
execute function public.protect_profile_fields();

-- ----------------------------------------------------------------------------
-- 2. DROP PRE-EXISTING POLICIES
-- ----------------------------------------------------------------------------
-- Keeps this migration re-runnable and makes the policy set deterministic.

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. ENABLE RLS ON EVERY PUBLIC TABLE
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.departments enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.physicians enable row level security;
alter table public.staff_department_assignments enable row level security;
alter table public.rooms enable row level security;
alter table public.beds enable row level security;
alter table public.patients enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.patient_allergies enable row level security;
alter table public.medical_histories enable row level security;
alter table public.patient_care_assignments enable row level security;
alter table public.appointments enable row level security;
alter table public.admissions enable row level security;
alter table public.admission_bed_assignments enable row level security;
alter table public.patient_transfers enable row level security;
alter table public.encounters enable row level security;
alter table public.vital_signs enable row level security;
alter table public.diagnoses enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.nursing_assessments enable row level security;
alter table public.nursing_notes enable row level security;
alter table public.laboratory_tests enable row level security;
alter table public.laboratory_orders enable row level security;
alter table public.laboratory_order_items enable row level security;
alter table public.laboratory_specimens enable row level security;
alter table public.laboratory_results enable row level security;
alter table public.radiology_orders enable row level security;
alter table public.radiology_reports enable row level security;
alter table public.medications enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.medication_dispenses enable row level security;
alter table public.inventory_categories enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.stock_transactions enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.reference_sequences enable row level security;

-- ----------------------------------------------------------------------------
-- 4. IDENTITY, PROFILES & RBAC
-- ----------------------------------------------------------------------------

create policy "profiles_select_self_or_authorized"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
  or public.has_permission('user.view')
);

create policy "profiles_insert_admin"
on public.profiles
for insert
to authenticated
with check (public.is_admin());

create policy "profiles_update_self_or_admin"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "roles_select_authenticated"
on public.roles
for select
to authenticated
using (true);

create policy "roles_insert_authorized"
on public.roles
for insert
to authenticated
with check (public.has_permission('role.manage'));

create policy "roles_update_authorized"
on public.roles
for update
to authenticated
using (public.has_permission('role.manage'))
with check (public.has_permission('role.manage'));

create policy "roles_delete_authorized"
on public.roles
for delete
to authenticated
using (public.has_permission('role.manage'));

create policy "permissions_select_authenticated"
on public.permissions
for select
to authenticated
using (true);

create policy "permissions_insert_authorized"
on public.permissions
for insert
to authenticated
with check (public.has_permission('role.manage'));

create policy "permissions_update_authorized"
on public.permissions
for update
to authenticated
using (public.has_permission('role.manage'))
with check (public.has_permission('role.manage'));

create policy "permissions_delete_authorized"
on public.permissions
for delete
to authenticated
using (public.has_permission('role.manage'));

create policy "role_permissions_select_authenticated"
on public.role_permissions
for select
to authenticated
using (true);

create policy "role_permissions_insert_authorized"
on public.role_permissions
for insert
to authenticated
with check (public.has_permission('role.manage'));

create policy "role_permissions_update_authorized"
on public.role_permissions
for update
to authenticated
using (public.has_permission('role.manage'))
with check (public.has_permission('role.manage'));

create policy "role_permissions_delete_authorized"
on public.role_permissions
for delete
to authenticated
using (public.has_permission('role.manage'));

create policy "user_roles_select_self_or_admin"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "user_roles_insert_admin_not_self"
on public.user_roles
for insert
to authenticated
with check (
  public.is_admin()
  and user_id <> auth.uid()
  and granted_by = auth.uid()
);

create policy "user_roles_update_admin_not_self"
on public.user_roles
for update
to authenticated
using (public.is_admin() and user_id <> auth.uid())
with check (public.is_admin() and user_id <> auth.uid());

create policy "user_roles_delete_admin_not_self"
on public.user_roles
for delete
to authenticated
using (public.is_admin() and user_id <> auth.uid());

create policy "departments_select_authenticated"
on public.departments
for select
to authenticated
using (true);

create policy "departments_insert_authorized"
on public.departments
for insert
to authenticated
with check (
  public.is_admin()
  and created_by = auth.uid()
);

create policy "departments_update_authorized"
on public.departments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "departments_delete_authorized"
on public.departments
for delete
to authenticated
using (public.is_admin());

create policy "staff_profiles_select_scoped"
on public.staff_profiles
for select
to authenticated
using (
  public.is_admin()
  or public.has_permission('user.view')
  or user_id = auth.uid()
  or department_id = public.current_staff_department_id()
);

create policy "staff_profiles_insert_admin"
on public.staff_profiles
for insert
to authenticated
with check (
  public.is_admin()
  and created_by = auth.uid()
);

create policy "staff_profiles_update_admin"
on public.staff_profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "staff_profiles_delete_admin"
on public.staff_profiles
for delete
to authenticated
using (public.is_admin());

create policy "physicians_select_scoped"
on public.physicians
for select
to authenticated
using (
  public.is_admin()
  or public.has_permission('user.view')
  or exists (
    select 1
    from public.staff_profiles sp
    where sp.id = physicians.staff_id
      and (
        sp.user_id = auth.uid()
        or sp.department_id = public.current_staff_department_id()
      )
  )
);

create policy "physicians_insert_admin"
on public.physicians
for insert
to authenticated
with check (
  public.is_admin()
  and created_by = auth.uid()
);

create policy "physicians_update_admin"
on public.physicians
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "physicians_delete_admin"
on public.physicians
for delete
to authenticated
using (public.is_admin());

create policy "staff_assignments_select_scoped"
on public.staff_department_assignments
for select
to authenticated
using (
  public.is_admin()
  or public.has_permission('user.view')
  or exists (
    select 1
    from public.staff_profiles sp
    where sp.id = staff_department_assignments.staff_id
      and (
        sp.user_id = auth.uid()
        or sp.department_id = public.current_staff_department_id()
      )
  )
);

create policy "staff_assignments_insert_admin"
on public.staff_department_assignments
for insert
to authenticated
with check (
  public.is_admin()
  and created_by = auth.uid()
);

create policy "staff_assignments_update_admin"
on public.staff_department_assignments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "staff_assignments_delete_admin"
on public.staff_department_assignments
for delete
to authenticated
using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. PATIENTS & PATIENT-CENTRIC DATA
-- ----------------------------------------------------------------------------

create policy "patients_select_authorized"
on public.patients
for select
to authenticated
using (public.has_permission('patient.view'));

create policy "patients_insert_authorized"
on public.patients
for insert
to authenticated
with check (
  public.has_permission('patient.create')
  and created_by = auth.uid()
);

create policy "patients_update_authorized"
on public.patients
for update
to authenticated
using (public.has_permission('patient.update'))
with check (public.has_permission('patient.update'));

create policy "emergency_contacts_select_authorized"
on public.emergency_contacts
for select
to authenticated
using (public.has_permission('patient.view'));

create policy "emergency_contacts_insert_authorized"
on public.emergency_contacts
for insert
to authenticated
with check (
  (
    public.has_permission('patient.create')
    or public.has_permission('patient.update')
  )
  and created_by = auth.uid()
);

create policy "emergency_contacts_update_authorized"
on public.emergency_contacts
for update
to authenticated
using (public.has_permission('patient.update'))
with check (public.has_permission('patient.update'));

create policy "emergency_contacts_delete_authorized"
on public.emergency_contacts
for delete
to authenticated
using (public.has_permission('patient.update'));

create policy "patient_allergies_select_authorized"
on public.patient_allergies
for select
to authenticated
using (
  public.has_permission('medical_record.view')
  and public.can_access_patient(patient_id)
);

create policy "patient_allergies_insert_authorized"
on public.patient_allergies
for insert
to authenticated
with check (
  public.has_permission('medical_record.create')
  and public.can_access_patient(patient_id)
  and recorded_by = auth.uid()
);

create policy "patient_allergies_update_authorized"
on public.patient_allergies
for update
to authenticated
using (
  public.has_permission('medical_record.update')
  and public.can_access_patient(patient_id)
)
with check (
  public.has_permission('medical_record.update')
  and public.can_access_patient(patient_id)
);

create policy "medical_histories_select_authorized"
on public.medical_histories
for select
to authenticated
using (
  public.has_permission('medical_record.view')
  and public.can_access_patient(patient_id)
);

create policy "medical_histories_insert_authorized"
on public.medical_histories
for insert
to authenticated
with check (
  public.has_permission('medical_record.create')
  and public.can_access_patient(patient_id)
  and recorded_by = auth.uid()
);

create policy "patient_care_assignments_select_admin_or_physician"
on public.patient_care_assignments
for select
to authenticated
using (public.is_admin() or public.has_role('physician'));

create policy "patient_care_assignments_insert_admin_or_physician"
on public.patient_care_assignments
for insert
to authenticated
with check (
  (public.is_admin() or public.has_role('physician'))
  and assigned_by = auth.uid()
);

create policy "patient_care_assignments_update_admin_or_physician"
on public.patient_care_assignments
for update
to authenticated
using (public.is_admin() or public.has_role('physician'))
with check (public.is_admin() or public.has_role('physician'));

create policy "patient_care_assignments_delete_admin"
on public.patient_care_assignments
for delete
to authenticated
using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. APPOINTMENTS, ADT, ROOMS & BEDS
-- ----------------------------------------------------------------------------

create policy "appointments_select_authorized"
on public.appointments
for select
to authenticated
using (public.has_permission('appointment.view'));

create policy "appointments_insert_authorized"
on public.appointments
for insert
to authenticated
with check (
  public.has_permission('appointment.create')
  and created_by = auth.uid()
);

create policy "appointments_update_authorized"
on public.appointments
for update
to authenticated
using (public.has_permission('appointment.update'))
with check (public.has_permission('appointment.update'));

create policy "rooms_select_authorized"
on public.rooms
for select
to authenticated
using (
  public.has_permission('bed.view')
  or public.has_permission('admission.view')
);

create policy "rooms_insert_authorized"
on public.rooms
for insert
to authenticated
with check (
  public.has_permission('bed.manage')
  and created_by = auth.uid()
);

create policy "rooms_update_authorized"
on public.rooms
for update
to authenticated
using (public.has_permission('bed.manage'))
with check (public.has_permission('bed.manage'));

create policy "rooms_delete_authorized"
on public.rooms
for delete
to authenticated
using (public.has_permission('bed.manage'));

create policy "beds_select_authorized"
on public.beds
for select
to authenticated
using (
  public.has_permission('bed.view')
  or public.has_permission('admission.view')
);

create policy "beds_insert_authorized"
on public.beds
for insert
to authenticated
with check (
  public.has_permission('bed.manage')
  and created_by = auth.uid()
);

create policy "beds_update_authorized"
on public.beds
for update
to authenticated
using (public.has_permission('bed.manage'))
with check (public.has_permission('bed.manage'));

create policy "beds_delete_authorized"
on public.beds
for delete
to authenticated
using (public.has_permission('bed.manage'));

create policy "admissions_select_authorized"
on public.admissions
for select
to authenticated
using (public.has_permission('admission.view'));

create policy "admissions_insert_authorized"
on public.admissions
for insert
to authenticated
with check (
  public.has_permission('admission.create')
  and admitted_by = auth.uid()
);

create policy "admissions_update_authorized"
on public.admissions
for update
to authenticated
using (
  public.has_permission('admission.update')
  or public.has_permission('admission.discharge')
)
with check (
  public.has_permission('admission.update')
  or public.has_permission('admission.discharge')
);

create policy "admission_bed_assignments_select_authorized"
on public.admission_bed_assignments
for select
to authenticated
using (public.has_permission('admission.view'));

create policy "admission_bed_assignments_insert_authorized"
on public.admission_bed_assignments
for insert
to authenticated
with check (
  (
    public.has_permission('admission.create')
    or public.has_permission('admission.transfer')
  )
  and assigned_by = auth.uid()
);

create policy "admission_bed_assignments_update_authorized"
on public.admission_bed_assignments
for update
to authenticated
using (
  public.has_permission('admission.transfer')
  or public.has_permission('admission.discharge')
)
with check (
  public.has_permission('admission.transfer')
  or public.has_permission('admission.discharge')
);

create policy "patient_transfers_select_authorized"
on public.patient_transfers
for select
to authenticated
using (public.has_permission('admission.view'));

create policy "patient_transfers_insert_authorized"
on public.patient_transfers
for insert
to authenticated
with check (
  public.has_permission('admission.transfer')
  and transferred_by = auth.uid()
);

-- ----------------------------------------------------------------------------
-- 7. MEDICAL RECORDS
-- ----------------------------------------------------------------------------

create policy "encounters_select_authorized"
on public.encounters
for select
to authenticated
using (
  public.has_permission('medical_record.view')
  and public.can_access_patient(patient_id)
);

create policy "encounters_insert_authorized"
on public.encounters
for insert
to authenticated
with check (
  public.has_permission('medical_record.create')
  and public.can_access_patient(patient_id)
  and created_by = auth.uid()
);

create policy "encounters_update_authorized"
on public.encounters
for update
to authenticated
using (
  public.has_permission('medical_record.update')
  and public.can_access_patient(patient_id)
)
with check (
  public.has_permission('medical_record.update')
  and public.can_access_patient(patient_id)
);

create policy "vital_signs_select_authorized"
on public.vital_signs
for select
to authenticated
using (
  (
    public.has_permission('vital_signs.view')
    or public.has_permission('medical_record.view')
  )
  and public.can_access_patient(patient_id)
);

create policy "vital_signs_insert_authorized"
on public.vital_signs
for insert
to authenticated
with check (
  public.has_permission('vital_signs.record')
  and public.can_access_patient(patient_id)
  and recorded_by = auth.uid()
);

create policy "diagnoses_select_authorized"
on public.diagnoses
for select
to authenticated
using (
  public.has_permission('diagnosis.view')
  and public.can_access_patient(patient_id)
);

create policy "diagnoses_insert_authorized"
on public.diagnoses
for insert
to authenticated
with check (
  public.has_permission('diagnosis.create')
  and public.can_access_patient(patient_id)
  and recorded_by = auth.uid()
);

create policy "diagnoses_update_authorized"
on public.diagnoses
for update
to authenticated
using (
  public.has_permission('diagnosis.update')
  and public.can_access_patient(patient_id)
)
with check (
  public.has_permission('diagnosis.update')
  and public.can_access_patient(patient_id)
);

create policy "clinical_notes_select_authorized"
on public.clinical_notes
for select
to authenticated
using (
  public.has_permission('medical_record.view')
  and public.can_access_patient(patient_id)
);

create policy "clinical_notes_insert_authorized"
on public.clinical_notes
for insert
to authenticated
with check (
  public.has_permission('medical_record.create')
  and public.can_access_patient(patient_id)
  and authored_by = auth.uid()
);

-- Draft notes need update permission; finalization needs finalize permission;
-- changing a finalized note requires amend permission.
create policy "clinical_notes_update_authorized"
on public.clinical_notes
for update
to authenticated
using (
  public.can_access_patient(patient_id)
  and (
    public.has_permission('medical_record.amend')
    or (
      authored_by = auth.uid()
      and status <> 'finalized'
      and (
        public.has_permission('medical_record.update')
        or public.has_permission('medical_record.finalize')
      )
    )
  )
)
with check (
  public.can_access_patient(patient_id)
  and (
    public.has_permission('medical_record.amend')
    or (
      authored_by = auth.uid()
      and status = 'draft'
      and public.has_permission('medical_record.update')
    )
    or (
      authored_by = auth.uid()
      and status = 'finalized'
      and public.has_permission('medical_record.finalize')
    )
  )
);

-- ----------------------------------------------------------------------------
-- 8. NURSING
-- ----------------------------------------------------------------------------

create policy "nursing_assessments_select_authorized"
on public.nursing_assessments
for select
to authenticated
using (
  public.has_permission('nursing.view')
  and public.can_access_patient(patient_id)
);

create policy "nursing_assessments_insert_authorized"
on public.nursing_assessments
for insert
to authenticated
with check (
  public.has_permission('nursing.assessment.create')
  and public.can_access_patient(patient_id)
  and assessed_by = auth.uid()
);

create policy "nursing_notes_select_authorized"
on public.nursing_notes
for select
to authenticated
using (
  public.has_permission('nursing.notes.view')
  and public.can_access_patient(patient_id)
);

create policy "nursing_notes_insert_authorized"
on public.nursing_notes
for insert
to authenticated
with check (
  public.has_permission('nursing.notes.create')
  and public.can_access_patient(patient_id)
  and recorded_by = auth.uid()
);

-- ----------------------------------------------------------------------------
-- 9. LABORATORY
-- ----------------------------------------------------------------------------

create policy "laboratory_tests_select_authorized"
on public.laboratory_tests
for select
to authenticated
using (
  public.has_permission('laboratory.view')
  or public.has_permission('laboratory.order.view')
  or public.has_permission('medical_record.view')
);

create policy "laboratory_tests_insert_admin"
on public.laboratory_tests
for insert
to authenticated
with check (
  public.is_admin()
  and created_by = auth.uid()
);

create policy "laboratory_tests_update_admin"
on public.laboratory_tests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "laboratory_tests_delete_admin"
on public.laboratory_tests
for delete
to authenticated
using (public.is_admin());

create policy "laboratory_orders_select_authorized"
on public.laboratory_orders
for select
to authenticated
using (
  public.has_permission('laboratory.view')
  or (
    public.has_permission('medical_record.view')
    and public.can_access_patient(patient_id)
  )
);

create policy "laboratory_orders_insert_authorized"
on public.laboratory_orders
for insert
to authenticated
with check (
  public.has_permission('laboratory.order.create')
  and public.can_access_patient(patient_id)
  and ordered_by = auth.uid()
);

create policy "laboratory_orders_update_authorized"
on public.laboratory_orders
for update
to authenticated
using (
  public.has_permission('laboratory.specimen.manage')
  or public.has_permission('laboratory.result.create')
)
with check (
  public.has_permission('laboratory.specimen.manage')
  or public.has_permission('laboratory.result.create')
);

create policy "laboratory_order_items_select_authorized"
on public.laboratory_order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.laboratory_orders lo
    where lo.id = laboratory_order_items.order_id
  )
);

create policy "laboratory_order_items_insert_authorized"
on public.laboratory_order_items
for insert
to authenticated
with check (
  public.has_permission('laboratory.order.create')
  and exists (
    select 1
    from public.laboratory_orders lo
    where lo.id = laboratory_order_items.order_id
      and lo.ordered_by = auth.uid()
  )
);

create policy "laboratory_order_items_update_authorized"
on public.laboratory_order_items
for update
to authenticated
using (
  public.has_permission('laboratory.specimen.manage')
  or public.has_permission('laboratory.result.create')
)
with check (
  public.has_permission('laboratory.specimen.manage')
  or public.has_permission('laboratory.result.create')
);

create policy "laboratory_specimens_select_authorized"
on public.laboratory_specimens
for select
to authenticated
using (
  exists (
    select 1
    from public.laboratory_orders lo
    where lo.id = laboratory_specimens.order_id
  )
);

create policy "laboratory_specimens_insert_authorized"
on public.laboratory_specimens
for insert
to authenticated
with check (public.has_permission('laboratory.specimen.manage'));

create policy "laboratory_specimens_update_authorized"
on public.laboratory_specimens
for update
to authenticated
using (public.has_permission('laboratory.specimen.manage'))
with check (public.has_permission('laboratory.specimen.manage'));

create policy "laboratory_results_select_authorized"
on public.laboratory_results
for select
to authenticated
using (
  exists (
    select 1
    from public.laboratory_order_items loi
    where loi.id = laboratory_results.order_item_id
  )
);

create policy "laboratory_results_insert_authorized"
on public.laboratory_results
for insert
to authenticated
with check (
  public.has_permission('laboratory.result.create')
  and performed_by = auth.uid()
);

-- Result entry may edit pending results; only a verifier may mark verified.
create policy "laboratory_results_update_authorized"
on public.laboratory_results
for update
to authenticated
using (
  public.has_permission('laboratory.result.verify')
  or (
    verification_status = 'pending'
    and public.has_permission('laboratory.result.create')
  )
)
with check (
  public.has_permission('laboratory.result.verify')
  or (
    verification_status = 'pending'
    and public.has_permission('laboratory.result.create')
  )
);

-- ----------------------------------------------------------------------------
-- 10. RADIOLOGY
-- ----------------------------------------------------------------------------

create policy "radiology_orders_select_authorized"
on public.radiology_orders
for select
to authenticated
using (
  public.has_permission('radiology.view')
  or (
    public.has_permission('medical_record.view')
    and public.can_access_patient(patient_id)
  )
);

create policy "radiology_orders_insert_authorized"
on public.radiology_orders
for insert
to authenticated
with check (
  public.has_permission('radiology.order.manage')
  and public.can_access_patient(patient_id)
  and ordered_by = auth.uid()
);

create policy "radiology_orders_update_authorized"
on public.radiology_orders
for update
to authenticated
using (public.has_permission('radiology.order.manage'))
with check (public.has_permission('radiology.order.manage'));

create policy "radiology_reports_select_authorized"
on public.radiology_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.radiology_orders ro
    where ro.id = radiology_reports.order_id
  )
);

create policy "radiology_reports_insert_authorized"
on public.radiology_reports
for insert
to authenticated
with check (
  public.has_permission('radiology.report.create')
  and reported_by = auth.uid()
);

create policy "radiology_reports_update_authorized"
on public.radiology_reports
for update
to authenticated
using (
  public.has_permission('radiology.report.verify')
  or (
    report_status = 'draft'
    and public.has_permission('radiology.report.create')
  )
)
with check (
  public.has_permission('radiology.report.verify')
  or (
    report_status = 'draft'
    and public.has_permission('radiology.report.create')
  )
);

-- ----------------------------------------------------------------------------
-- 11. PHARMACY
-- ----------------------------------------------------------------------------

create policy "medications_select_authorized"
on public.medications
for select
to authenticated
using (
  public.has_permission('pharmacy.view')
  or public.has_permission('prescription.view')
  or public.has_permission('prescription.create')
  or public.has_permission('medical_record.view')
);

create policy "medications_insert_authorized"
on public.medications
for insert
to authenticated
with check (
  public.has_permission('medication.manage')
  and created_by = auth.uid()
);

create policy "medications_update_authorized"
on public.medications
for update
to authenticated
using (public.has_permission('medication.manage'))
with check (public.has_permission('medication.manage'));

create policy "medications_delete_authorized"
on public.medications
for delete
to authenticated
using (public.has_permission('medication.manage'));

create policy "prescriptions_select_authorized"
on public.prescriptions
for select
to authenticated
using (
  public.has_permission('pharmacy.view')
  or public.has_permission('prescription.view')
  or (
    public.has_permission('medical_record.view')
    and public.can_access_patient(patient_id)
  )
);

create policy "prescriptions_insert_authorized"
on public.prescriptions
for insert
to authenticated
with check (
  public.has_permission('prescription.create')
  and public.can_access_patient(patient_id)
  and prescribed_by = auth.uid()
);

create policy "prescriptions_update_authorized"
on public.prescriptions
for update
to authenticated
using (
  public.has_permission('prescription.dispense')
  or (
    public.has_permission('prescription.create')
    and prescribed_by = auth.uid()
    and status = 'pending'
  )
)
with check (
  public.has_permission('prescription.dispense')
  or (
    public.has_permission('prescription.create')
    and prescribed_by = auth.uid()
    and status = 'pending'
  )
);

create policy "prescription_items_select_authorized"
on public.prescription_items
for select
to authenticated
using (
  exists (
    select 1
    from public.prescriptions p
    where p.id = prescription_items.prescription_id
  )
);

create policy "prescription_items_insert_authorized"
on public.prescription_items
for insert
to authenticated
with check (
  public.has_permission('prescription.create')
  and exists (
    select 1
    from public.prescriptions p
    where p.id = prescription_items.prescription_id
      and p.prescribed_by = auth.uid()
  )
);

create policy "prescription_items_update_authorized"
on public.prescription_items
for update
to authenticated
using (
  public.has_permission('prescription.dispense')
  or (
    public.has_permission('prescription.create')
    and exists (
      select 1
      from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and p.prescribed_by = auth.uid()
    )
  )
)
with check (
  public.has_permission('prescription.dispense')
  or (
    public.has_permission('prescription.create')
    and exists (
      select 1
      from public.prescriptions p
      where p.id = prescription_items.prescription_id
        and p.prescribed_by = auth.uid()
    )
  )
);

create policy "medication_dispenses_select_authorized"
on public.medication_dispenses
for select
to authenticated
using (
  public.has_permission('pharmacy.view')
  or public.has_permission('prescription.view')
);

create policy "medication_dispenses_insert_authorized"
on public.medication_dispenses
for insert
to authenticated
with check (
  public.has_permission('prescription.dispense')
  and dispensed_by = auth.uid()
);

-- ----------------------------------------------------------------------------
-- 12. INVENTORY
-- ----------------------------------------------------------------------------

create policy "inventory_categories_select_authorized"
on public.inventory_categories
for select
to authenticated
using (public.has_permission('inventory.view'));

create policy "inventory_categories_insert_authorized"
on public.inventory_categories
for insert
to authenticated
with check (
  public.has_permission('inventory.item.manage')
  and created_by = auth.uid()
);

create policy "inventory_categories_update_authorized"
on public.inventory_categories
for update
to authenticated
using (public.has_permission('inventory.item.manage'))
with check (public.has_permission('inventory.item.manage'));

create policy "inventory_categories_delete_authorized"
on public.inventory_categories
for delete
to authenticated
using (public.has_permission('inventory.item.manage'));

create policy "inventory_items_select_authorized"
on public.inventory_items
for select
to authenticated
using (
  public.has_permission('inventory.view')
  or public.has_permission('pharmacy.view')
);

create policy "inventory_items_insert_authorized"
on public.inventory_items
for insert
to authenticated
with check (
  public.has_permission('inventory.item.manage')
  and created_by = auth.uid()
);

create policy "inventory_items_update_authorized"
on public.inventory_items
for update
to authenticated
using (public.has_permission('inventory.item.manage'))
with check (public.has_permission('inventory.item.manage'));

create policy "inventory_items_delete_authorized"
on public.inventory_items
for delete
to authenticated
using (public.has_permission('inventory.item.manage'));

create policy "inventory_batches_select_authorized"
on public.inventory_batches
for select
to authenticated
using (
  public.has_permission('inventory.view')
  or public.has_permission('pharmacy.view')
);

create policy "inventory_batches_insert_authorized"
on public.inventory_batches
for insert
to authenticated
with check (
  public.has_permission('inventory.stock.in')
  and created_by = auth.uid()
);

create policy "inventory_batches_update_authorized"
on public.inventory_batches
for update
to authenticated
using (
  public.has_permission('inventory.stock.out')
  or public.has_permission('inventory.stock.adjust')
)
with check (
  public.has_permission('inventory.stock.out')
  or public.has_permission('inventory.stock.adjust')
);

create policy "stock_transactions_select_authorized"
on public.stock_transactions
for select
to authenticated
using (
  public.has_permission('inventory.view')
  or public.has_permission('pharmacy.view')
);

create policy "stock_transactions_insert_authorized"
on public.stock_transactions
for insert
to authenticated
with check (
  (
    public.has_permission('inventory.stock.in')
    or public.has_permission('inventory.stock.out')
    or public.has_permission('inventory.stock.adjust')
  )
  and performed_by = auth.uid()
);

-- ----------------------------------------------------------------------------
-- 13. BILLING & PAYMENTS
-- ----------------------------------------------------------------------------

create policy "invoices_select_authorized"
on public.invoices
for select
to authenticated
using (public.has_permission('billing.view'));

create policy "invoices_insert_authorized"
on public.invoices
for insert
to authenticated
with check (
  public.has_permission('billing.invoice.create')
  and created_by = auth.uid()
);

create policy "invoices_update_authorized"
on public.invoices
for update
to authenticated
using (public.has_permission('billing.invoice.update'))
with check (public.has_permission('billing.invoice.update'));

create policy "invoice_items_select_authorized"
on public.invoice_items
for select
to authenticated
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_items.invoice_id
  )
);

create policy "invoice_items_insert_authorized"
on public.invoice_items
for insert
to authenticated
with check (public.has_permission('billing.invoice.create'));

create policy "invoice_items_update_authorized"
on public.invoice_items
for update
to authenticated
using (public.has_permission('billing.invoice.update'))
with check (public.has_permission('billing.invoice.update'));

create policy "payments_select_authorized"
on public.payments
for select
to authenticated
using (public.has_permission('billing.view'));

create policy "payments_insert_authorized"
on public.payments
for insert
to authenticated
with check (
  public.has_permission('billing.payment.create')
  and received_by = auth.uid()
);

-- ----------------------------------------------------------------------------
-- 14. NOTIFICATIONS, AUDIT LOGS & REFERENCE SEQUENCES
-- ----------------------------------------------------------------------------

create policy "notifications_select_owner"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

create policy "notifications_update_owner"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "audit_logs_select_authorized"
on public.audit_logs
for select
to authenticated
using (public.has_permission('audit.view'));

-- reference_sequences intentionally has no policies. Direct access is denied;
-- generate_reference_number() is SECURITY DEFINER and runs as the owner.

-- ----------------------------------------------------------------------------
-- 15. SECURITY INVOKER VIEWS
-- ----------------------------------------------------------------------------
-- In the ordered chain the views are created in migration 021, after this one.
-- The guard below makes this migration safe both for a clean reset (skip) and
-- for an existing database where the views already exist (apply).

do $$
begin
  if to_regclass('public.v_bed_availability') is not null then
    alter view public.v_bed_availability set (security_invoker = true);
    alter view public.v_patient_summary set (security_invoker = true);
    alter view public.v_appointment_summary set (security_invoker = true);
    alter view public.v_admission_census set (security_invoker = true);
    alter view public.v_laboratory_summary set (security_invoker = true);
    alter view public.v_pharmacy_summary set (security_invoker = true);
    alter view public.v_billing_summary set (security_invoker = true);
    alter view public.v_inventory_summary set (security_invoker = true);

    grant select on
      public.v_bed_availability,
      public.v_patient_summary,
      public.v_appointment_summary,
      public.v_admission_census,
      public.v_laboratory_summary,
      public.v_pharmacy_summary,
      public.v_billing_summary,
      public.v_inventory_summary
    to authenticated, service_role;

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
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 16. TABLE & SEQUENCE GRANTS
-- ----------------------------------------------------------------------------
-- Table privileges are broad; RLS is the row boundary. Anonymous access is
-- removed entirely. Sequences are never exposed to anonymous clients.

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Sequences are an implementation detail; the generator is SECURITY DEFINER.
revoke all on table public.reference_sequences from authenticated;

-- Audit logs are append-only and never client-writable.
revoke insert, update, delete on table public.audit_logs from authenticated;
grant select on table public.audit_logs to authenticated;

-- ============================================================================
-- END
-- ============================================================================

-- ============================================================================
-- SPMC Hospital Management System — Core Database Schema
-- ============================================================================
-- Source of truth: docs/SUPABASE.MD (sections 5-20, 22-29, 34)
-- Target: fresh Supabase PostgreSQL project (PG 15+)
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> paste this file -> Run
--   or: npx supabase db execute --file supabase/schema.sql
--
-- SCOPE
--   [x] Application tables (domains: identity, reference, patient, clinical,
--       laboratory, radiology, pharmacy, inventory, billing, system)
--   [x] updated_at triggers + auth user -> profile bootstrap trigger
--   [x] RBAC helper functions (has_role / is_admin / has_permission)
--   [x] Indexes and reporting views
--   [x] Reference seed data (roles, permissions, departments)
--   [ ] Row Level Security policies  -> separate migration
--   [x] Storage buckets / Realtime / transactional functions -> separate
--
-- NOTE: this script is intended for a fresh database. It is NOT idempotent for
-- table creation (plain CREATE TABLE). Re-running it will fail on the first
-- existing table, which is intentional.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HOSPITAL REFERENCE TABLES
-- ----------------------------------------------------------------------------

create table public.departments (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,
  name text not null unique,
  description text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. AUTHENTICATION, PROFILES & ROLE-BASED ACCESS CONTROL
-- ----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  email text not null,
  full_name text not null,

  avatar_path text,
  contact_number text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),

  slug text not null unique,
  name text not null,
  description text,

  is_system boolean not null default true,

  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),

  slug text not null unique,
  description text,

  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,

  primary key (role_id, permission_id)
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,

  granted_by uuid references public.profiles(id),

  created_at timestamptz not null default now(),

  primary key (user_id, role_id)
);

-- ----------------------------------------------------------------------------
-- 3. STAFF & PHYSICIANS
-- ----------------------------------------------------------------------------

create table public.staff_profiles (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique references public.profiles(id) on delete cascade,

  staff_number text not null unique,

  first_name text not null,
  middle_name text,
  last_name text not null,

  department_id uuid references public.departments(id),

  employment_type text,
  professional_license_number text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.physicians (
  id uuid primary key default gen_random_uuid(),

  staff_id uuid not null unique references public.staff_profiles(id),

  specialty text,
  license_number text not null unique,

  is_available boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_department_assignments (
  id uuid primary key default gen_random_uuid(),

  staff_id uuid not null references public.staff_profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id),

  assigned_at timestamptz not null default now(),
  ended_at timestamptz,

  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. ROOMS & BEDS
-- ----------------------------------------------------------------------------

create table public.rooms (
  id uuid primary key default gen_random_uuid(),

  room_number text not null,
  department_id uuid not null references public.departments(id),

  room_type text,
  floor_number text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (department_id, room_number)
);

create table public.beds (
  id uuid primary key default gen_random_uuid(),

  room_id uuid not null references public.rooms(id),

  bed_number text not null,

  status text not null default 'available'
    check (status in ('available', 'occupied', 'maintenance', 'reserved')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (room_id, bed_number)
);

-- ----------------------------------------------------------------------------
-- 5. PATIENT MANAGEMENT
-- ----------------------------------------------------------------------------

create table public.patients (
  id uuid primary key default gen_random_uuid(),

  medical_record_number text not null unique,

  first_name text not null,
  middle_name text,
  last_name text not null,
  suffix text,

  date_of_birth date,
  sex text,

  civil_status text,
  nationality text,

  contact_number text,
  email text,

  address_line text,
  barangay text,
  city text,
  province text,
  postal_code text,

  registration_date timestamptz not null default now(),

  registration_status text not null default 'active'
    check (registration_status in ('active', 'inactive', 'archived')),

  created_by uuid not null references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete cascade,

  full_name text not null,
  relationship text,
  contact_number text not null,
  address text,

  is_primary boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_allergies (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete cascade,

  allergen text not null,
  reaction text,
  severity text,

  notes text,

  recorded_by uuid not null references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medical_histories (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete cascade,

  history_type text not null,
  description text not null,

  recorded_by uuid not null references public.profiles(id),

  recorded_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

-- Staff-to-patient care relationship used by patient access helpers.
create table public.patient_care_assignments (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id),
  staff_id uuid not null references public.staff_profiles(id),

  assignment_type text not null,

  assigned_by uuid not null references public.profiles(id),

  assigned_at timestamptz not null default now(),
  ended_at timestamptz
);

-- ----------------------------------------------------------------------------
-- 6. APPOINTMENTS
-- ----------------------------------------------------------------------------

create table public.appointments (
  id uuid primary key default gen_random_uuid(),

  appointment_number text not null unique,

  patient_id uuid not null references public.patients(id),

  department_id uuid not null references public.departments(id),

  physician_id uuid references public.physicians(id),

  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30
    check (duration_minutes > 0),

  appointment_type text,
  reason_for_visit text,

  status text not null default 'scheduled'
    check (
      status in (
        'scheduled',
        'confirmed',
        'waiting',
        'in_consultation',
        'completed',
        'cancelled',
        'no_show'
      )
    ),

  notes text,

  created_by uuid not null references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. ADMISSIONS, BED ASSIGNMENTS & TRANSFERS
-- ----------------------------------------------------------------------------

create table public.admissions (
  id uuid primary key default gen_random_uuid(),

  admission_number text not null unique,

  patient_id uuid not null references public.patients(id),

  attending_physician_id uuid references public.physicians(id),

  department_id uuid not null references public.departments(id),

  admission_date timestamptz not null default now(),
  discharge_date timestamptz,

  admission_type text,

  status text not null default 'admitted'
    check (
      status in (
        'admitted',
        'transferred',
        'discharged',
        'cancelled'
      )
    ),

  admission_notes text,
  discharge_notes text,

  admitted_by uuid not null references public.profiles(id),
  discharged_by uuid references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admission_bed_assignments (
  id uuid primary key default gen_random_uuid(),

  admission_id uuid not null references public.admissions(id),

  bed_id uuid not null references public.beds(id),

  assigned_at timestamptz not null default now(),
  released_at timestamptz,

  assigned_by uuid not null references public.profiles(id),

  created_at timestamptz not null default now()
);

create table public.patient_transfers (
  id uuid primary key default gen_random_uuid(),

  admission_id uuid not null references public.admissions(id),

  from_bed_id uuid references public.beds(id),
  to_bed_id uuid not null references public.beds(id),

  transfer_reason text,

  transferred_by uuid not null references public.profiles(id),

  transferred_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 8. ELECTRONIC MEDICAL RECORDS
-- ----------------------------------------------------------------------------

create table public.encounters (
  id uuid primary key default gen_random_uuid(),

  encounter_number text not null unique,

  patient_id uuid not null references public.patients(id),

  appointment_id uuid references public.appointments(id),
  admission_id uuid references public.admissions(id),

  physician_id uuid references public.physicians(id),

  department_id uuid not null references public.departments(id),

  encounter_type text not null,

  chief_complaint text,

  clinical_status text not null default 'open'
    check (
      clinical_status in (
        'open',
        'in_progress',
        'completed',
        'cancelled'
      )
    ),

  started_at timestamptz not null default now(),
  completed_at timestamptz,

  created_by uuid not null references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vital_signs (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  systolic_bp numeric,
  diastolic_bp numeric,

  heart_rate numeric,
  respiratory_rate numeric,

  temperature numeric,
  oxygen_saturation numeric,

  weight_kg numeric,
  height_cm numeric,

  recorded_by uuid not null references public.profiles(id),

  recorded_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

create table public.diagnoses (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  diagnosis_code text,
  diagnosis_name text not null,

  diagnosis_type text,
  clinical_notes text,

  is_primary boolean not null default false,

  recorded_by uuid not null references public.profiles(id),

  recorded_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  note_type text not null,
  content text not null,

  status text not null default 'draft'
    check (status in ('draft', 'finalized', 'amended')),

  authored_by uuid not null references public.profiles(id),

  finalized_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 9. NURSING
-- ----------------------------------------------------------------------------

create table public.nursing_assessments (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  assessment_type text not null,
  assessment_data jsonb not null default '{}'::jsonb,

  notes text,

  assessed_by uuid not null references public.profiles(id),

  assessed_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

create table public.nursing_notes (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  note text not null,

  recorded_by uuid not null references public.profiles(id),

  recorded_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 10. LABORATORY
-- ----------------------------------------------------------------------------

create table public.laboratory_tests (
  id uuid primary key default gen_random_uuid(),

  test_code text not null unique,
  test_name text not null,

  category text,
  description text,

  specimen_type text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.laboratory_orders (
  id uuid primary key default gen_random_uuid(),

  order_number text not null unique,

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  ordered_by uuid not null references public.profiles(id),

  priority text not null default 'routine'
    check (priority in ('routine', 'urgent', 'stat')),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'collection',
        'processing',
        'completed',
        'cancelled'
      )
    ),

  ordered_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.laboratory_order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null references public.laboratory_orders(id) on delete cascade,

  test_id uuid not null references public.laboratory_tests(id),

  status text not null default 'pending',

  created_at timestamptz not null default now()
);

create table public.laboratory_specimens (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null references public.laboratory_orders(id),

  specimen_type text not null,

  collection_status text not null default 'pending'
    check (
      collection_status in (
        'pending',
        'collected',
        'rejected'
      )
    ),

  collected_by uuid references public.profiles(id),

  collected_at timestamptz,

  notes text,

  created_at timestamptz not null default now()
);

create table public.laboratory_results (
  id uuid primary key default gen_random_uuid(),

  order_item_id uuid not null references public.laboratory_order_items(id),

  result_value text,
  result_unit text,
  reference_range text,

  interpretation text,

  verification_status text not null default 'pending'
    check (
      verification_status in (
        'pending',
        'verified',
        'rejected'
      )
    ),

  performed_by uuid references public.profiles(id),
  verified_by uuid references public.profiles(id),

  performed_at timestamptz,
  verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 11. RADIOLOGY
-- ----------------------------------------------------------------------------

create table public.radiology_orders (
  id uuid primary key default gen_random_uuid(),

  order_number text not null unique,

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  examination_type text not null,
  body_part text,

  ordered_by uuid not null references public.profiles(id),

  scheduled_at timestamptz,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'scheduled',
        'in_progress',
        'completed',
        'cancelled'
      )
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.radiology_reports (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null references public.radiology_orders(id),

  report_content text,

  report_status text not null default 'draft'
    check (
      report_status in (
        'draft',
        'verified',
        'amended'
      )
    ),

  reported_by uuid references public.profiles(id),
  verified_by uuid references public.profiles(id),

  reported_at timestamptz,
  verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 12. PHARMACY & PRESCRIPTIONS
-- ----------------------------------------------------------------------------

create table public.medications (
  id uuid primary key default gen_random_uuid(),

  medication_code text not null unique,

  generic_name text not null,
  brand_name text,

  strength text,
  dosage_form text,

  unit text,

  description text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),

  prescription_number text not null unique,

  patient_id uuid not null references public.patients(id),
  encounter_id uuid not null references public.encounters(id),

  prescribed_by uuid not null references public.profiles(id),

  prescription_date timestamptz not null default now(),

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'partially_dispensed',
        'dispensed',
        'cancelled'
      )
    ),

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),

  prescription_id uuid not null references public.prescriptions(id) on delete cascade,

  medication_id uuid not null references public.medications(id),

  dosage text not null,
  frequency text not null,

  duration_days integer,
  quantity numeric not null check (quantity > 0),

  instructions text,

  created_at timestamptz not null default now()
);

create table public.medication_dispenses (
  id uuid primary key default gen_random_uuid(),

  prescription_item_id uuid not null references public.prescription_items(id),

  quantity_dispensed numeric not null check (quantity_dispensed > 0),

  dispensed_by uuid not null references public.profiles(id),

  dispensed_at timestamptz not null default now(),

  notes text,

  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 13. INVENTORY
-- ----------------------------------------------------------------------------

create table public.inventory_categories (
  id uuid primary key default gen_random_uuid(),

  name text not null unique,
  description text,

  created_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),

  item_code text not null unique,

  name text not null,
  description text,

  category_id uuid references public.inventory_categories(id),

  unit text not null,

  reorder_level numeric not null default 0,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_batches (
  id uuid primary key default gen_random_uuid(),

  item_id uuid not null references public.inventory_items(id),

  batch_number text,

  quantity_received numeric not null default 0,
  quantity_remaining numeric not null default 0,

  expiration_date date,

  unit_cost numeric(12,2),

  received_at timestamptz not null default now(),

  created_at timestamptz not null default now(),

  check (quantity_received >= 0),
  check (quantity_remaining >= 0),
  check (quantity_remaining <= quantity_received)
);

create table public.stock_transactions (
  id uuid primary key default gen_random_uuid(),

  item_id uuid not null references public.inventory_items(id),

  batch_id uuid references public.inventory_batches(id),

  transaction_type text not null
    check (
      transaction_type in (
        'stock_in',
        'stock_out',
        'adjustment',
        'transfer',
        'dispensing'
      )
    ),

  quantity numeric not null check (quantity > 0),

  reference_type text,
  reference_id uuid,

  reason text,

  performed_by uuid not null references public.profiles(id),

  performed_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 14. BILLING & PAYMENTS
-- ----------------------------------------------------------------------------

create table public.invoices (
  id uuid primary key default gen_random_uuid(),

  invoice_number text not null unique,

  patient_id uuid not null references public.patients(id),

  admission_id uuid references public.admissions(id),
  encounter_id uuid references public.encounters(id),

  invoice_date timestamptz not null default now(),

  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,

  amount_paid numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,

  status text not null default 'unpaid'
    check (
      status in (
        'unpaid',
        'partially_paid',
        'paid',
        'cancelled',
        'refunded'
      )
    ),

  created_by uuid not null references public.profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (subtotal >= 0),
  check (discount_amount >= 0),
  check (total_amount >= 0),
  check (amount_paid >= 0),
  check (balance >= 0)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),

  invoice_id uuid not null references public.invoices(id) on delete cascade,

  description text not null,

  quantity numeric not null check (quantity > 0),

  unit_price numeric(12,2) not null check (unit_price >= 0),

  line_total numeric(12,2) not null check (line_total >= 0),

  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),

  payment_reference text not null unique,

  invoice_id uuid not null references public.invoices(id),

  amount numeric(12,2) not null check (amount > 0),

  payment_method text not null,

  payment_status text not null default 'completed'
    check (
      payment_status in (
        'pending',
        'completed',
        'failed',
        'refunded',
        'cancelled'
      )
    ),

  received_by uuid not null references public.profiles(id),

  received_at timestamptz not null default now(),

  notes text,

  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 15. NOTIFICATIONS & AUDIT LOGS
-- ----------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references public.profiles(id) on delete cascade,

  title text not null,
  message text not null,

  notification_type text not null,

  related_entity_type text,
  related_entity_id uuid,

  is_read boolean not null default false,

  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.audit_logs (
  id bigint generated always as identity primary key,

  actor_id uuid references public.profiles(id),

  action text not null,

  entity_type text not null,
  entity_id uuid,

  description text,

  metadata jsonb not null default '{}'::jsonb,

  ip_address inet,

  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 16. FUNCTIONS
-- ----------------------------------------------------------------------------

-- 16.1 Automatic updated_at maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 16.2 Profile bootstrap on Supabase Auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 16.3 RBAC helpers used by Row Level Security policies
create or replace function public.has_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.slug = p_role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.has_role('super_admin')
    or public.has_role('hospital_admin');
$$;

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.user_roles ur
      join public.role_permissions rp
        on rp.role_id = ur.role_id
      join public.permissions p
        on p.id = rp.permission_id
      where ur.user_id = auth.uid()
        and p.slug = p_permission
    );
$$;

create or replace function public.can_access_patient(p_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_admin()
    or (
      public.has_permission('patient.view')
      and exists (
        select 1
        from public.patient_care_assignments pca
        join public.staff_profiles sp
          on sp.id = pca.staff_id
        where pca.patient_id = p_patient_id
          and sp.user_id = auth.uid()
          and pca.ended_at is null
      )
    );
$$;

-- ----------------------------------------------------------------------------
-- 17. TRIGGERS
-- ----------------------------------------------------------------------------

-- 17.1 updated_at trigger on every mutable table
do $$
declare
  t text;
begin
  foreach t in array array[
    'public.profiles',
    'public.departments',
    'public.staff_profiles',
    'public.physicians',
    'public.rooms',
    'public.beds',
    'public.patients',
    'public.emergency_contacts',
    'public.patient_allergies',
    'public.appointments',
    'public.admissions',
    'public.encounters',
    'public.clinical_notes',
    'public.laboratory_tests',
    'public.laboratory_orders',
    'public.laboratory_results',
    'public.radiology_orders',
    'public.radiology_reports',
    'public.medications',
    'public.prescriptions',
    'public.inventory_items',
    'public.invoices'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on %s', t);
    execute format(
      'create trigger set_updated_at before update on %s
         for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;

-- 17.2 Auth user -> application profile
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 18. INDEXES
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- 19. REPORTING VIEWS
-- ----------------------------------------------------------------------------

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
-- 20. REFERENCE SEED DATA
-- ----------------------------------------------------------------------------

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

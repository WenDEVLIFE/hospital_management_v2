-- ============================================================================
-- SPMC Hospital Management System â€” Core Database Schema
-- ============================================================================
-- Source of truth: docs/SUPABASE.MD (sections 5-20, 22-29, 34)
-- Target: fresh Supabase PostgreSQL project (PG 15+)
--
-- HOW TO RUN
--   Preferred: npx supabase db reset -> runs the 22 ordered migrations
--   One-shot reference: Supabase Dashboard -> SQL Editor -> paste this file
--   or: npx supabase db execute --file supabase/schema.sql
--
-- MIGRATIONS
--   supabase/migrations/20261110000100 ... 20261110002200 are the canonical
--   reset path. This file is a consolidated reference; keep both in sync.
--
-- EXISTING DATABASE
--   Do not re-run this file. It fails on the first existing table by design.
--   Apply supabase/upgrade/20261112000000_schema_hardening.sql instead.
--
-- SCOPE
--   [x] Application tables (domains: identity, reference, patient, clinical,
--       laboratory, radiology, pharmacy, inventory, billing, system)
--   [x] PostgreSQL enum types for fixed-value state columns
--   [x] created_by / updated_by accountability columns
--   [x] Explicit on-delete rules for every foreign key
--   [x] updated_at triggers + auth user -> profile bootstrap trigger
--   [x] RBAC helper functions (has_role / is_admin / has_permission)
--   [x] generate_reference_number() controlled identifier generator
--   [x] Indexes and reporting views
--   [x] Reference seed data (roles, permissions, departments)
--   [x] Row Level Security policies (migration 018)
--   [x] Storage buckets / Realtime / transactional functions -> separate
--
-- NOTE: this script is intended for a fresh database. It is NOT idempotent for
-- table creation (plain CREATE TABLE). Re-running it will fail on the first
-- existing table, which is intentional.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. ENUMERATED TYPES
-- ----------------------------------------------------------------------------
-- Fixed-value state columns use PostgreSQL enum types instead of text + check
-- (SUPABASE.MD section 5.1). Enum values are part of the API surface: append
-- new values with ALTER TYPE ... ADD VALUE in a migration, never edit history.

create type public.bed_status as enum (
  'available',
  'occupied',
  'maintenance',
  'reserved'
);

create type public.patient_registration_status as enum (
  'active',
  'inactive',
  'archived'
);

create type public.appointment_status as enum (
  'scheduled',
  'confirmed',
  'waiting',
  'in_consultation',
  'completed',
  'cancelled',
  'no_show'
);

create type public.admission_status as enum (
  'admitted',
  'transferred',
  'discharged',
  'cancelled'
);

create type public.encounter_status as enum (
  'open',
  'in_progress',
  'completed',
  'cancelled'
);

create type public.clinical_note_status as enum (
  'draft',
  'finalized',
  'amended'
);

create type public.laboratory_priority as enum (
  'routine',
  'urgent',
  'stat'
);

create type public.laboratory_order_status as enum (
  'pending',
  'collection',
  'processing',
  'completed',
  'cancelled'
);

create type public.laboratory_specimen_status as enum (
  'pending',
  'collected',
  'rejected'
);

create type public.laboratory_verification_status as enum (
  'pending',
  'verified',
  'rejected'
);

create type public.radiology_order_status as enum (
  'pending',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

create type public.radiology_report_status as enum (
  'draft',
  'verified',
  'amended'
);

create type public.prescription_status as enum (
  'pending',
  'partially_dispensed',
  'dispensed',
  'cancelled'
);

create type public.stock_transaction_type as enum (
  'stock_in',
  'stock_out',
  'adjustment',
  'transfer',
  'dispensing'
);

create type public.invoice_status as enum (
  'unpaid',
  'partially_paid',
  'paid',
  'cancelled',
  'refunded'
);

create type public.payment_status as enum (
  'pending',
  'completed',
  'failed',
  'refunded',
  'cancelled'
);

-- FOREIGN KEY DELETE POLICY
--   cascade  -> identity, role join rows, and notifications only. These rows
--               have no independent clinical or financial meaning.
--   restrict -> every patient, clinical, diagnostic, pharmacy, inventory,
--               billing, and audit relationship. Clinical records are never
--               removed as a side effect of deleting a parent row.

-- ----------------------------------------------------------------------------
-- 1. AUTHENTICATION, PROFILES & ROLE-BASED ACCESS CONTROL
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

  granted_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),

  primary key (user_id, role_id)
);

-- ----------------------------------------------------------------------------
-- 2. HOSPITAL REFERENCE TABLES
-- ----------------------------------------------------------------------------

create table public.departments (
  id uuid primary key default gen_random_uuid(),

  code text not null unique,
  name text not null unique,
  description text,

  is_active boolean not null default true,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

  department_id uuid references public.departments(id) on delete restrict,

  employment_type text,
  professional_license_number text,

  is_active boolean not null default true,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.physicians (
  id uuid primary key default gen_random_uuid(),

  staff_id uuid not null unique references public.staff_profiles(id) on delete restrict,

  specialty text,
  license_number text not null unique,

  is_available boolean not null default true,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_department_assignments (
  id uuid primary key default gen_random_uuid(),

  staff_id uuid not null references public.staff_profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,

  assigned_at timestamptz not null default now(),
  ended_at timestamptz,

  created_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. ROOMS & BEDS
-- ----------------------------------------------------------------------------

create table public.rooms (
  id uuid primary key default gen_random_uuid(),

  room_number text not null,
  department_id uuid not null references public.departments(id) on delete restrict,

  room_type text,
  floor_number text,

  is_active boolean not null default true,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (department_id, room_number)
);

create table public.beds (
  id uuid primary key default gen_random_uuid(),

  room_id uuid not null references public.rooms(id) on delete restrict,

  bed_number text not null,

  status public.bed_status not null default 'available',

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

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

  registration_status public.patient_registration_status not null default 'active',

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Patient records are retained permanently. Registration status is the
-- supported lifecycle mechanism; deleting a patient is deliberately blocked by
-- RESTRICT on every child relationship below.
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,

  full_name text not null,
  relationship text,
  contact_number text not null,
  address text,

  is_primary boolean not null default false,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_allergies (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,

  allergen text not null,
  reaction text,
  severity text,

  notes text,

  recorded_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medical_histories (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,

  history_type text not null,
  description text not null,

  recorded_by uuid not null references public.profiles(id) on delete restrict,

  recorded_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

-- Staff-to-patient care relationship used by patient access helpers.
create table public.patient_care_assignments (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,
  staff_id uuid not null references public.staff_profiles(id) on delete restrict,

  assignment_type text not null,

  assigned_by uuid not null references public.profiles(id) on delete restrict,

  assigned_at timestamptz not null default now(),
  ended_at timestamptz
);

-- ----------------------------------------------------------------------------
-- 6. APPOINTMENTS
-- ----------------------------------------------------------------------------

create table public.appointments (
  id uuid primary key default gen_random_uuid(),

  appointment_number text not null unique,

  patient_id uuid not null references public.patients(id) on delete restrict,

  department_id uuid not null references public.departments(id) on delete restrict,

  physician_id uuid references public.physicians(id) on delete restrict,

  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30
    check (duration_minutes > 0),

  appointment_type text,
  reason_for_visit text,

  status public.appointment_status not null default 'scheduled',

  notes text,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. ADMISSIONS, BED ASSIGNMENTS & TRANSFERS
-- ----------------------------------------------------------------------------

create table public.admissions (
  id uuid primary key default gen_random_uuid(),

  admission_number text not null unique,

  patient_id uuid not null references public.patients(id) on delete restrict,

  attending_physician_id uuid references public.physicians(id) on delete restrict,

  department_id uuid not null references public.departments(id) on delete restrict,

  admission_date timestamptz not null default now(),
  discharge_date timestamptz,

  admission_type text,

  status public.admission_status not null default 'admitted',

  admission_notes text,
  discharge_notes text,

  admitted_by uuid not null references public.profiles(id) on delete restrict,
  discharged_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admission_bed_assignments (
  id uuid primary key default gen_random_uuid(),

  admission_id uuid not null references public.admissions(id) on delete restrict,

  bed_id uuid not null references public.beds(id) on delete restrict,

  assigned_at timestamptz not null default now(),
  released_at timestamptz,

  assigned_by uuid not null references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now()
);

create table public.patient_transfers (
  id uuid primary key default gen_random_uuid(),

  admission_id uuid not null references public.admissions(id) on delete restrict,

  from_bed_id uuid references public.beds(id) on delete restrict,
  to_bed_id uuid not null references public.beds(id) on delete restrict,

  transfer_reason text,

  transferred_by uuid not null references public.profiles(id) on delete restrict,

  transferred_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 8. ELECTRONIC MEDICAL RECORDS
-- ----------------------------------------------------------------------------

create table public.encounters (
  id uuid primary key default gen_random_uuid(),

  encounter_number text not null unique,

  patient_id uuid not null references public.patients(id) on delete restrict,

  appointment_id uuid references public.appointments(id) on delete restrict,
  admission_id uuid references public.admissions(id) on delete restrict,

  physician_id uuid references public.physicians(id) on delete restrict,

  department_id uuid not null references public.departments(id) on delete restrict,

  encounter_type text not null,

  chief_complaint text,

  clinical_status public.encounter_status not null default 'open',

  started_at timestamptz not null default now(),
  completed_at timestamptz,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vital_signs (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,

  systolic_bp numeric,
  diastolic_bp numeric,

  heart_rate numeric,
  respiratory_rate numeric,

  temperature numeric,
  oxygen_saturation numeric,

  weight_kg numeric,
  height_cm numeric,

  recorded_by uuid not null references public.profiles(id) on delete restrict,

  recorded_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

create table public.diagnoses (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,

  diagnosis_code text,
  diagnosis_name text not null,

  diagnosis_type text,
  clinical_notes text,

  is_primary boolean not null default false,

  recorded_by uuid not null references public.profiles(id) on delete restrict,

  recorded_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,

  note_type text not null,
  content text not null,

  status public.clinical_note_status not null default 'draft',

  authored_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  finalized_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 9. NURSING
-- ----------------------------------------------------------------------------

create table public.nursing_assessments (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,

  assessment_type text not null,
  assessment_data jsonb not null default '{}'::jsonb,

  notes text,

  assessed_by uuid not null references public.profiles(id) on delete restrict,

  assessed_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

create table public.nursing_notes (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,

  note text not null,

  recorded_by uuid not null references public.profiles(id) on delete restrict,

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

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.laboratory_orders (
  id uuid primary key default gen_random_uuid(),

  order_number text not null unique,

  patient_id uuid not null references public.patients(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,

  ordered_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  priority public.laboratory_priority not null default 'routine',

  status public.laboratory_order_status not null default 'pending',

  ordered_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.laboratory_order_items (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null references public.laboratory_orders(id) on delete restrict,

  test_id uuid not null references public.laboratory_tests(id) on delete restrict,

  -- The specification does not define an allowed value set for this column,
  -- so it intentionally remains text until the laboratory workflow is agreed.
  status text not null default 'pending',

  created_at timestamptz not null default now()
);

create table public.laboratory_specimens (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null references public.laboratory_orders(id) on delete restrict,

  specimen_type text not null,

  collection_status public.laboratory_specimen_status not null default 'pending',

  collected_by uuid references public.profiles(id) on delete restrict,

  collected_at timestamptz,

  notes text,

  created_at timestamptz not null default now()
);

create table public.laboratory_results (
  id uuid primary key default gen_random_uuid(),

  order_item_id uuid not null references public.laboratory_order_items(id) on delete restrict,

  result_value text,
  result_unit text,
  reference_range text,

  interpretation text,

  verification_status public.laboratory_verification_status not null default 'pending',

  performed_by uuid references public.profiles(id) on delete restrict,
  verified_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

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

  patient_id uuid not null references public.patients(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,

  examination_type text not null,
  body_part text,

  ordered_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  scheduled_at timestamptz,

  status public.radiology_order_status not null default 'pending',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.radiology_reports (
  id uuid primary key default gen_random_uuid(),

  order_id uuid not null references public.radiology_orders(id) on delete restrict,

  report_content text,

  report_status public.radiology_report_status not null default 'draft',

  reported_by uuid references public.profiles(id) on delete restrict,
  verified_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

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

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),

  prescription_number text not null unique,

  patient_id uuid not null references public.patients(id) on delete restrict,
  encounter_id uuid not null references public.encounters(id) on delete restrict,

  prescribed_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  prescription_date timestamptz not null default now(),

  status public.prescription_status not null default 'pending',

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prescription_items (
  id uuid primary key default gen_random_uuid(),

  prescription_id uuid not null references public.prescriptions(id) on delete restrict,

  medication_id uuid not null references public.medications(id) on delete restrict,

  dosage text not null,
  frequency text not null,

  duration_days integer,
  quantity numeric not null check (quantity > 0),

  instructions text,

  created_at timestamptz not null default now()
);

create table public.medication_dispenses (
  id uuid primary key default gen_random_uuid(),

  prescription_item_id uuid not null references public.prescription_items(id) on delete restrict,

  quantity_dispensed numeric not null check (quantity_dispensed > 0),

  dispensed_by uuid not null references public.profiles(id) on delete restrict,

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

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),

  item_code text not null unique,

  name text not null,
  description text,

  category_id uuid references public.inventory_categories(id) on delete restrict,

  unit text not null,

  reorder_level numeric not null default 0,

  is_active boolean not null default true,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_batches (
  id uuid primary key default gen_random_uuid(),

  item_id uuid not null references public.inventory_items(id) on delete restrict,

  batch_number text,

  quantity_received numeric not null default 0,
  quantity_remaining numeric not null default 0,

  expiration_date date,

  unit_cost numeric(12,2),

  received_at timestamptz not null default now(),

  created_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),

  check (quantity_received >= 0),
  check (quantity_remaining >= 0),
  check (quantity_remaining <= quantity_received)
);

create table public.stock_transactions (
  id uuid primary key default gen_random_uuid(),

  item_id uuid not null references public.inventory_items(id) on delete restrict,

  batch_id uuid references public.inventory_batches(id) on delete restrict,

  transaction_type public.stock_transaction_type not null,

  quantity numeric not null check (quantity > 0),

  reference_type text,
  reference_id uuid,

  reason text,

  performed_by uuid not null references public.profiles(id) on delete restrict,

  performed_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 14. BILLING & PAYMENTS
-- ----------------------------------------------------------------------------

create table public.invoices (
  id uuid primary key default gen_random_uuid(),

  invoice_number text not null unique,

  patient_id uuid not null references public.patients(id) on delete restrict,

  admission_id uuid references public.admissions(id) on delete restrict,
  encounter_id uuid references public.encounters(id) on delete restrict,

  invoice_date timestamptz not null default now(),

  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,

  amount_paid numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,

  status public.invoice_status not null default 'unpaid',

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

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

  invoice_id uuid not null references public.invoices(id) on delete restrict,

  description text not null,

  quantity numeric not null check (quantity > 0),

  unit_price numeric(12,2) not null check (unit_price >= 0),

  line_total numeric(12,2) not null check (line_total >= 0),

  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),

  payment_reference text not null unique,

  invoice_id uuid not null references public.invoices(id) on delete restrict,

  amount numeric(12,2) not null check (amount > 0),

  payment_method text not null,

  payment_status public.payment_status not null default 'completed',

  received_by uuid not null references public.profiles(id) on delete restrict,

  received_at timestamptz not null default now(),

  notes text,

  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 15. NOTIFICATIONS, AUDIT LOGS & REFERENCE SEQUENCES
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

  actor_id uuid references public.profiles(id) on delete restrict,

  action text not null,

  entity_type text not null,
  entity_id uuid,

  description text,

  metadata jsonb not null default '{}'::jsonb,

  ip_address inet,

  created_at timestamptz not null default now()
);

-- Monotonic counters backing generate_reference_number(). One row per prefix
-- (MRN, APT, ADM, ENC, LAB, RAD, RX, INV, PAY). Row-level locking through
-- INSERT ... ON CONFLICT DO UPDATE makes concurrent generation safe.
create table public.reference_sequences (
  prefix text primary key,

  last_value bigint not null default 0
    check (last_value >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 16. FUNCTIONS
-- ----------------------------------------------------------------------------

-- 16.1 Automatic updated_at / updated_by maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();

  -- Tables with accountability columns pass 'updated_by' as a trigger argument,
  -- so this function never touches a column that does not exist. Preserve the
  -- previous value when no authenticated user is present (migrations, seeds,
  -- and privileged maintenance jobs).
  if tg_nargs > 0 and tg_argv[0] = 'updated_by' then
    new.updated_by = coalesce(auth.uid(), new.updated_by);
  end if;

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

-- 16.4 Controlled reference number generation
-- Produces PREFIX-YYYY-NNNN values (for example MRN-2026-0001). The counter is
-- stored per prefix and incremented atomically, so registration and order
-- creation cannot produce duplicate identifiers.
create or replace function public.generate_reference_number(p_prefix text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prefix text;
  v_next bigint;
  v_year text;
begin
  v_prefix := upper(btrim(coalesce(p_prefix, '')));

  if v_prefix !~ '^[A-Z0-9]{2,8}$' then
    raise exception 'Invalid reference prefix: %', p_prefix
      using errcode = '22023';
  end if;

  insert into public.reference_sequences as seq (prefix, last_value)
  values (v_prefix, 1)
  on conflict (prefix) do update
    set last_value = seq.last_value + 1,
        updated_at = now()
  returning last_value into v_next;

  v_year := to_char(now() at time zone 'Asia/Manila', 'YYYY');

  return format('%s-%s-%s', v_prefix, v_year, lpad(v_next::text, 4, '0'));
end;
$$;

revoke all on function public.generate_reference_number(text) from public;
grant execute on function public.generate_reference_number(text)
  to authenticated, service_role;

-- 16.5 Transactional patient registration
-- Creates the patient, primary emergency contact, and audit entry atomically.
-- SECURITY DEFINER is required because audit_logs has no authenticated insert
-- policy; the function enforces auth.uid() and patient.create itself.
create or replace function public.register_patient(
  p_first_name text,
  p_middle_name text,
  p_last_name text,
  p_suffix text,
  p_date_of_birth date,
  p_sex text,
  p_civil_status text,
  p_nationality text,
  p_contact_number text,
  p_email text,
  p_address_line text,
  p_barangay text,
  p_city text,
  p_province text,
  p_postal_code text,
  p_emergency_full_name text,
  p_emergency_relationship text,
  p_emergency_contact_number text,
  p_emergency_is_primary boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_patient_id uuid;
  v_mrn text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('patient.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if coalesce(btrim(p_first_name), '') = ''
     or coalesce(btrim(p_last_name), '') = '' then
    raise exception 'First and last name are required'
      using errcode = '22023';
  end if;

  if p_date_of_birth is null then
    raise exception 'Date of birth is required'
      using errcode = '22023';
  end if;

  if coalesce(btrim(p_sex), '') not in ('Male', 'Female') then
    raise exception 'Sex is required' using errcode = '22023';
  end if;

  if coalesce(btrim(p_emergency_full_name), '') = ''
     or coalesce(btrim(p_emergency_contact_number), '') = '' then
    raise exception 'Emergency contact name and number are required'
      using errcode = '22023';
  end if;

  v_mrn := public.generate_reference_number('MRN');

  insert into public.patients (
    medical_record_number,
    first_name,
    middle_name,
    last_name,
    suffix,
    date_of_birth,
    sex,
    civil_status,
    nationality,
    contact_number,
    email,
    address_line,
    barangay,
    city,
    province,
    postal_code,
    registration_status,
    created_by
  )
  values (
    v_mrn,
    btrim(p_first_name),
    nullif(btrim(p_middle_name), ''),
    btrim(p_last_name),
    nullif(btrim(p_suffix), ''),
    p_date_of_birth,
    btrim(p_sex),
    nullif(btrim(p_civil_status), ''),
    nullif(btrim(p_nationality), ''),
    nullif(btrim(p_contact_number), ''),
    nullif(btrim(p_email), ''),
    nullif(btrim(p_address_line), ''),
    nullif(btrim(p_barangay), ''),
    nullif(btrim(p_city), ''),
    nullif(btrim(p_province), ''),
    nullif(btrim(p_postal_code), ''),
    'active',
    v_actor
  )
  returning id into v_patient_id;

  insert into public.emergency_contacts (
    patient_id,
    full_name,
    relationship,
    contact_number,
    is_primary,
    created_by
  )
  values (
    v_patient_id,
    btrim(p_emergency_full_name),
    nullif(btrim(p_emergency_relationship), ''),
    btrim(p_emergency_contact_number),
    coalesce(p_emergency_is_primary, false),
    v_actor
  );

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'patient.create',
    'patient',
    v_patient_id,
    'Registered a new patient.',
    '{"source":"register_patient"}'::jsonb
  );

  return v_patient_id;
end;
$$;

revoke all on function public.register_patient(
  text, text, text, text, date, text, text, text, text, text,
  text, text, text, text, text, text, text, text, boolean
) from public;

grant execute on function public.register_patient(
  text, text, text, text, date, text, text, text, text, text,
  text, text, text, text, text, text, text, text, boolean
) to authenticated, service_role;

-- 16.6 Transactional appointment creation
-- Validates the active patient/department, optional physician, and physician
-- schedule, then creates the appointment and audit entry atomically.
create or replace function public.create_appointment(
  p_patient_id uuid,
  p_department_id uuid,
  p_physician_id uuid,
  p_scheduled_at timestamptz,
  p_duration_minutes integer,
  p_appointment_type text,
  p_reason_for_visit text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_appointment_id uuid;
  v_appointment_number text;
  v_duration integer := coalesce(p_duration_minutes, 30);
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('appointment.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_patient_id is null
     or not exists (
       select 1
       from public.patients
       where id = p_patient_id
         and registration_status = 'active'
     ) then
    raise exception 'Active patient not found' using errcode = '22023';
  end if;

  if p_department_id is null
     or not exists (
       select 1
       from public.departments
       where id = p_department_id
         and is_active
     ) then
    raise exception 'Active department not found' using errcode = '22023';
  end if;

  if p_scheduled_at is null then
    raise exception 'Scheduled time is required' using errcode = '22023';
  end if;

  if v_duration <= 0 or v_duration > 480 then
    raise exception 'Duration must be between 1 and 480 minutes'
      using errcode = '22023';
  end if;

  if p_physician_id is not null then
    if not exists (
      select 1 from public.physicians where id = p_physician_id
    ) then
      raise exception 'Physician not found' using errcode = '22023';
    end if;

    if exists (
      select 1
      from public.appointments a
      where a.physician_id = p_physician_id
        and a.status not in ('cancelled', 'no_show')
        and a.scheduled_at < p_scheduled_at + make_interval(mins => v_duration)
        and a.scheduled_at + make_interval(mins => a.duration_minutes)
            > p_scheduled_at
    ) then
      raise exception 'Physician has a scheduling conflict'
        using errcode = '23P01';
    end if;
  end if;

  v_appointment_number := public.generate_reference_number('APT');

  insert into public.appointments (
    appointment_number,
    patient_id,
    department_id,
    physician_id,
    scheduled_at,
    duration_minutes,
    appointment_type,
    reason_for_visit,
    status,
    notes,
    created_by
  )
  values (
    v_appointment_number,
    p_patient_id,
    p_department_id,
    p_physician_id,
    p_scheduled_at,
    v_duration,
    nullif(btrim(p_appointment_type), ''),
    nullif(btrim(p_reason_for_visit), ''),
    'scheduled',
    nullif(btrim(p_notes), ''),
    v_actor
  )
  returning id into v_appointment_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'appointment.create',
    'appointment',
    v_appointment_id,
    'Created an appointment.',
    '{"source":"create_appointment"}'::jsonb
  );

  return v_appointment_id;
end;
$$;

revoke all on function public.create_appointment(
  uuid, uuid, uuid, timestamptz, integer, text, text, text
) from public;

grant execute on function public.create_appointment(
  uuid, uuid, uuid, timestamptz, integer, text, text, text
) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 17. TRIGGERS
-- ----------------------------------------------------------------------------

-- 17.1 updated_at trigger on every mutable table
do $$
declare
  t text;
  v_has_updated_by boolean;
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
    'public.inventory_categories',
    'public.inventory_items',
    'public.invoices'
  ]
  loop
    select exists (
      select 1
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = split_part(t, '.', 2)
        and a.attname = 'updated_by'
        and a.attnum > 0
        and not a.attisdropped
    )
    into v_has_updated_by;

    execute format('drop trigger if exists set_updated_at on %s', t);
    execute format(
      'create trigger set_updated_at before update on %s
         for each row execute function public.set_updated_at(%s)',
      t,
      case
        when v_has_updated_by then quote_literal('updated_by')
        else ''
      end
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

-- ----------------------------------------------------------------------------
-- 21. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

-- Deny-by-default. Every policy targets `authenticated`; `anon` gets no access.
-- Policies use the permission helpers from migration 017. Until the Phase 0
-- role -> permission matrix is approved and seeded, only administrators
-- (is_admin()) pass these checks. That is intentional: the database stays closed
-- rather than open.
--
-- FORCE ROW LEVEL SECURITY is intentionally not used. The SECURITY DEFINER
-- helpers and migration/maintenance jobs must retain owner bypass. Revisit only
-- after auditing every definer function.
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
-- The 8 reporting views are declared with `security_invoker = true` in section
-- 19. In the ordered migration chain their grants are applied in migration 021.

-- ----------------------------------------------------------------------------
-- 16. TABLE, VIEW & SEQUENCE GRANTS
-- ----------------------------------------------------------------------------
-- Table privileges are broad; RLS is the row boundary. Anonymous access is
-- removed entirely. Sequences are never exposed to anonymous clients.

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Views are read-only projections.
revoke insert, update, delete on public.v_bed_availability from authenticated, service_role;
revoke insert, update, delete on public.v_patient_summary from authenticated, service_role;
revoke insert, update, delete on public.v_appointment_summary from authenticated, service_role;
revoke insert, update, delete on public.v_admission_census from authenticated, service_role;
revoke insert, update, delete on public.v_laboratory_summary from authenticated, service_role;
revoke insert, update, delete on public.v_pharmacy_summary from authenticated, service_role;
revoke insert, update, delete on public.v_billing_summary from authenticated, service_role;
revoke insert, update, delete on public.v_inventory_summary from authenticated, service_role;

-- Sequences are an implementation detail; the generator is SECURITY DEFINER.
revoke all on table public.reference_sequences from authenticated;

-- Audit logs are append-only and never client-writable.
revoke insert, update, delete on table public.audit_logs from authenticated;
grant select on table public.audit_logs to authenticated;

-- ============================================================================
-- Transactional admissions, transfers, and discharges (migration 025)
-- ============================================================================

-- ============================================================================
-- SPMC HMS â€?transactional admissions, transfers, and discharges
-- Migration 025. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- All three functions lock the affected admission/bed rows, enforce their
-- permission, keep bed assignments consistent, and write an audit entry.

create or replace function public.create_admission(
  p_patient_id uuid,
  p_department_id uuid,
  p_attending_physician_id uuid,
  p_bed_id uuid,
  p_admission_type text,
  p_admission_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_admission_id uuid;
  v_admission_number text;
  v_bed_status public.bed_status;
  v_bed_department uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('admission.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_patient_id is null
     or not exists (
       select 1
       from public.patients
       where id = p_patient_id
         and registration_status = 'active'
     ) then
    raise exception 'Active patient not found' using errcode = '22023';
  end if;

  if p_department_id is null
     or not exists (
       select 1
       from public.departments
       where id = p_department_id
         and is_active
     ) then
    raise exception 'Active department not found' using errcode = '22023';
  end if;

  if p_attending_physician_id is not null
     and not exists (
       select 1 from public.physicians where id = p_attending_physician_id
     ) then
    raise exception 'Physician not found' using errcode = '22023';
  end if;

  select b.status, r.department_id
  into v_bed_status, v_bed_department
  from public.beds b
  join public.rooms r on r.id = b.room_id
  where b.id = p_bed_id
  for update of b;

  if not found then
    raise exception 'Bed not found' using errcode = '22023';
  end if;

  if v_bed_status <> 'available' then
    raise exception 'Bed is not available' using errcode = '22023';
  end if;

  if v_bed_department <> p_department_id then
    raise exception 'Bed does not belong to the selected department'
      using errcode = '22023';
  end if;

  v_admission_number := public.generate_reference_number('ADM');

  insert into public.admissions (
    admission_number,
    patient_id,
    attending_physician_id,
    department_id,
    admission_type,
    status,
    admission_notes,
    admitted_by
  )
  values (
    v_admission_number,
    p_patient_id,
    p_attending_physician_id,
    p_department_id,
    coalesce(nullif(btrim(p_admission_type), ''), 'Elective'),
    'admitted',
    nullif(btrim(p_admission_notes), ''),
    v_actor
  )
  returning id into v_admission_id;

  insert into public.admission_bed_assignments (
    admission_id,
    bed_id,
    assigned_by
  )
  values (
    v_admission_id,
    p_bed_id,
    v_actor
  );

  update public.beds
  set status = 'occupied'
  where id = p_bed_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'admission.create',
    'admission',
    v_admission_id,
    'Admitted a patient.',
    '{"source":"create_admission"}'::jsonb
  );

  return v_admission_id;
end;
$$;

create or replace function public.transfer_patient(
  p_admission_id uuid,
  p_to_bed_id uuid,
  p_transfer_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status public.admission_status;
  v_department_id uuid;
  v_from_bed_id uuid;
  v_to_status public.bed_status;
  v_to_department uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('admission.transfer') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status, department_id
  into v_status, v_department_id
  from public.admissions
  where id = p_admission_id
  for update;

  if not found then
    raise exception 'Admission not found' using errcode = '22023';
  end if;

  if v_status <> 'admitted' then
    raise exception 'Only admitted patients can be transferred'
      using errcode = '22023';
  end if;

  select bed_id
  into v_from_bed_id
  from public.admission_bed_assignments
  where admission_id = p_admission_id
    and released_at is null
  order by assigned_at desc
  limit 1
  for update;

  if v_from_bed_id is null then
    raise exception 'Active bed assignment not found' using errcode = '22023';
  end if;

  if p_to_bed_id = v_from_bed_id then
    raise exception 'Patient is already in the selected bed'
      using errcode = '22023';
  end if;

  perform 1 from public.beds where id = v_from_bed_id for update;

  select b.status, r.department_id
  into v_to_status, v_to_department
  from public.beds b
  join public.rooms r on r.id = b.room_id
  where b.id = p_to_bed_id
  for update of b;

  if not found then
    raise exception 'Bed not found' using errcode = '22023';
  end if;

  if v_to_status <> 'available' then
    raise exception 'Bed is not available' using errcode = '22023';
  end if;

  if v_to_department <> v_department_id then
    raise exception 'Bed does not belong to the admission department'
      using errcode = '22023';
  end if;

  update public.admission_bed_assignments
  set released_at = now()
  where admission_id = p_admission_id
    and released_at is null;

  update public.beds
  set status = 'available'
  where id = v_from_bed_id;

  insert into public.admission_bed_assignments (
    admission_id,
    bed_id,
    assigned_by
  )
  values (
    p_admission_id,
    p_to_bed_id,
    v_actor
  );

  update public.beds
  set status = 'occupied'
  where id = p_to_bed_id;

  insert into public.patient_transfers (
    admission_id,
    from_bed_id,
    to_bed_id,
    transfer_reason,
    transferred_by
  )
  values (
    p_admission_id,
    v_from_bed_id,
    p_to_bed_id,
    nullif(btrim(p_transfer_reason), ''),
    v_actor
  );

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'admission.transfer',
    'admission',
    p_admission_id,
    'Transferred a patient between beds.',
    '{"source":"transfer_patient"}'::jsonb
  );

  return p_admission_id;
end;
$$;

create or replace function public.discharge_patient(
  p_admission_id uuid,
  p_discharge_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status public.admission_status;
  v_bed_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('admission.discharge') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status
  into v_status
  from public.admissions
  where id = p_admission_id
  for update;

  if not found then
    raise exception 'Admission not found' using errcode = '22023';
  end if;

  if v_status <> 'admitted' then
    raise exception 'Only admitted patients can be discharged'
      using errcode = '22023';
  end if;

  select bed_id
  into v_bed_id
  from public.admission_bed_assignments
  where admission_id = p_admission_id
    and released_at is null
  order by assigned_at desc
  limit 1
  for update;

  if v_bed_id is not null then
    update public.admission_bed_assignments
    set released_at = now()
    where admission_id = p_admission_id
      and released_at is null;

    update public.beds
    set status = 'available'
    where id = v_bed_id;
  end if;

  update public.admissions
  set status = 'discharged',
      discharge_date = now(),
      discharge_notes = nullif(btrim(p_discharge_notes), ''),
      discharged_by = v_actor
  where id = p_admission_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'admission.discharge',
    'admission',
    p_admission_id,
    'Discharged a patient.',
    '{"source":"discharge_patient"}'::jsonb
  );

  return p_admission_id;
end;
$$;

revoke all on function public.create_admission(
  uuid, uuid, uuid, uuid, text, text
) from public;

grant execute on function public.create_admission(
  uuid, uuid, uuid, uuid, text, text
) to authenticated, service_role;

revoke all on function public.transfer_patient(
  uuid, uuid, text
) from public;

grant execute on function public.transfer_patient(
  uuid, uuid, text
) to authenticated, service_role;

revoke all on function public.discharge_patient(
  uuid, text
) from public;

grant execute on function public.discharge_patient(
  uuid, text
) to authenticated, service_role;

-- ============================================================================
-- Finalize clinical note (migration 026)
-- ============================================================================

-- ============================================================================
-- SPMC HMS â€?finalize clinical note
-- Migration 026. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

create or replace function public.finalize_clinical_note(
  p_note_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status public.clinical_note_status;
  v_patient_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('medical_record.finalize') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status, patient_id
  into v_status, v_patient_id
  from public.clinical_notes
  where id = p_note_id
  for update;

  if not found then
    raise exception 'Clinical note not found' using errcode = '22023';
  end if;

  if not public.can_access_patient(v_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_status <> 'draft' then
    raise exception 'Only draft notes can be finalized' using errcode = '22023';
  end if;

  update public.clinical_notes
  set status = 'finalized',
      finalized_at = now(),
      updated_by = v_actor
  where id = p_note_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'clinical_note.finalize',
    'clinical_note',
    p_note_id,
    'Finalized a clinical note.',
    '{"source":"finalize_clinical_note"}'::jsonb
  );

  return p_note_id;
end;
$$;

revoke all on function public.finalize_clinical_note(uuid) from public;

grant execute on function public.finalize_clinical_note(uuid)
  to authenticated, service_role;

-- ============================================================================
-- Verify laboratory result (migration 027)
-- ============================================================================

-- ============================================================================
-- SPMC HMS â€?verify laboratory result
-- Migration 027. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

create or replace function public.verify_laboratory_result(
  p_result_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_order_item_id uuid;
  v_order_id uuid;
  v_patient_id uuid;
  v_status public.laboratory_verification_status;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('laboratory.result.verify') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select order_item_id, verification_status
  into v_order_item_id, v_status
  from public.laboratory_results
  where id = p_result_id
  for update;

  if not found then
    raise exception 'Laboratory result not found' using errcode = '22023';
  end if;

  if v_status = 'verified' then
    raise exception 'Laboratory result is already verified'
      using errcode = '22023';
  end if;

  select order_id
  into v_order_id
  from public.laboratory_order_items
  where id = v_order_item_id;

  select patient_id
  into v_patient_id
  from public.laboratory_orders
  where id = v_order_id;

  if not public.can_access_patient(v_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  update public.laboratory_results
  set verification_status = 'verified',
      verified_by = v_actor,
      verified_at = now(),
      updated_by = v_actor
  where id = p_result_id;

  update public.laboratory_order_items
  set status = 'completed'
  where id = v_order_item_id;

  -- Complete the order only when every item has a verified result.
  if not exists (
    select 1
    from public.laboratory_order_items i
    where i.order_id = v_order_id
      and not exists (
        select 1
        from public.laboratory_results r
        where r.order_item_id = i.id
          and r.verification_status = 'verified'
      )
  ) then
    update public.laboratory_orders
    set status = 'completed'
    where id = v_order_id;
  end if;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'laboratory_result.verify',
    'laboratory_result',
    p_result_id,
    'Verified a laboratory result.',
    '{"source":"verify_laboratory_result"}'::jsonb
  );

  return p_result_id;
end;
$$;

revoke all on function public.verify_laboratory_result(uuid) from public;

grant execute on function public.verify_laboratory_result(uuid)
  to authenticated, service_role;

-- ============================================================================
-- Dispense prescription (migration 028)
-- ============================================================================

-- ============================================================================
-- SPMC HMS â€?dispense prescription
-- Migration 028. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Dispenses every remaining prescription item, deducts medication stock from
-- inventory batches FIFO, records stock transactions, and audits atomically.

create or replace function public.dispense_prescription(
  p_prescription_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status public.prescription_status;
  v_patient_id uuid;
  v_item record;
  v_batch record;
  v_dispensed numeric;
  v_remaining numeric;
  v_needed numeric;
  v_take numeric;
  v_medication_code text;
  v_inventory_item_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('prescription.dispense') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status, patient_id
  into v_status, v_patient_id
  from public.prescriptions
  where id = p_prescription_id
  for update;

  if not found then
    raise exception 'Prescription not found' using errcode = '22023';
  end if;

  if not public.can_access_patient(v_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_status = 'dispensed' then
    raise exception 'Prescription is already dispensed'
      using errcode = '22023';
  end if;

  if v_status = 'cancelled' then
    raise exception 'Prescription is cancelled' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.prescription_items
    where prescription_id = p_prescription_id
  ) then
    raise exception 'Prescription has no items' using errcode = '22023';
  end if;

  for v_item in
    select id, medication_id, quantity
    from public.prescription_items
    where prescription_id = p_prescription_id
    order by created_at
  loop
    select coalesce(sum(quantity_dispensed), 0)
    into v_dispensed
    from public.medication_dispenses
    where prescription_item_id = v_item.id;

    v_remaining := v_item.quantity - v_dispensed;

    if v_remaining <= 0 then
      continue;
    end if;

    select medication_code
    into v_medication_code
    from public.medications
    where id = v_item.medication_id;

    if v_medication_code is null then
      raise exception 'Medication not found' using errcode = '22023';
    end if;

    select id
    into v_inventory_item_id
    from public.inventory_items
    where item_code = v_medication_code;

    if v_inventory_item_id is null then
      raise exception 'Medication stock is not configured for %',
        v_medication_code using errcode = '22023';
    end if;

    v_needed := v_remaining;

    for v_batch in
      select id, quantity_remaining
      from public.inventory_batches
      where item_id = v_inventory_item_id
        and quantity_remaining > 0
      order by expiration_date nulls last, received_at
      for update
    loop
      exit when v_needed <= 0;

      v_take := least(v_batch.quantity_remaining, v_needed);

      update public.inventory_batches
      set quantity_remaining = quantity_remaining - v_take
      where id = v_batch.id;

      insert into public.stock_transactions (
        item_id,
        batch_id,
        transaction_type,
        quantity,
        reference_type,
        reference_id,
        reason,
        performed_by
      )
      values (
        v_inventory_item_id,
        v_batch.id,
        'dispensing',
        v_take,
        'prescription',
        p_prescription_id,
        'Prescription dispensing',
        v_actor
      );

      v_needed := v_needed - v_take;
    end loop;

    if v_needed > 0 then
      raise exception 'Insufficient stock for medication %',
        v_medication_code using errcode = '22023';
    end if;

    insert into public.medication_dispenses (
      prescription_item_id,
      quantity_dispensed,
      dispensed_by,
      notes
    )
    values (
      v_item.id,
      v_remaining,
      v_actor,
      'Dispensed via dispense_prescription'
    );
  end loop;

  update public.prescriptions
  set status = 'dispensed',
      updated_by = v_actor
  where id = p_prescription_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'prescription.dispense',
    'prescription',
    p_prescription_id,
    'Dispensed a prescription.',
    '{"source":"dispense_prescription"}'::jsonb
  );

  return p_prescription_id;
end;
$$;

revoke all on function public.dispense_prescription(uuid) from public;

grant execute on function public.dispense_prescription(uuid)
  to authenticated, service_role;

-- ============================================================================
-- Fix dispense_prescription authorization (migration 029)
-- ============================================================================

-- ============================================================================
-- SPMC HMS â€?fix dispense_prescription authorization
-- Migration 029. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Pharmacists are not assigned through patient_care_assignments, so gating
-- dispensing on can_access_patient() rejected every legitimate dispense with
-- 42501. Dispensing is authorized by prescription.dispense alone.

create or replace function public.dispense_prescription(
  p_prescription_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status public.prescription_status;
  v_item record;
  v_batch record;
  v_dispensed numeric;
  v_remaining numeric;
  v_needed numeric;
  v_take numeric;
  v_medication_code text;
  v_inventory_item_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('prescription.dispense') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status
  into v_status
  from public.prescriptions
  where id = p_prescription_id
  for update;

  if not found then
    raise exception 'Prescription not found' using errcode = '22023';
  end if;

  if v_status = 'dispensed' then
    raise exception 'Prescription is already dispensed'
      using errcode = '22023';
  end if;

  if v_status = 'cancelled' then
    raise exception 'Prescription is cancelled' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.prescription_items
    where prescription_id = p_prescription_id
  ) then
    raise exception 'Prescription has no items' using errcode = '22023';
  end if;

  for v_item in
    select id, medication_id, quantity
    from public.prescription_items
    where prescription_id = p_prescription_id
    order by created_at
  loop
    select coalesce(sum(quantity_dispensed), 0)
    into v_dispensed
    from public.medication_dispenses
    where prescription_item_id = v_item.id;

    v_remaining := v_item.quantity - v_dispensed;

    if v_remaining <= 0 then
      continue;
    end if;

    select medication_code
    into v_medication_code
    from public.medications
    where id = v_item.medication_id;

    if v_medication_code is null then
      raise exception 'Medication not found' using errcode = '22023';
    end if;

    select id
    into v_inventory_item_id
    from public.inventory_items
    where item_code = v_medication_code
      and is_active
    order by created_at
    limit 1;

    if v_inventory_item_id is null then
      raise exception 'Medication stock is not configured for %',
        v_medication_code using errcode = '22023';
    end if;

    v_needed := v_remaining;

    for v_batch in
      select id, quantity_remaining
      from public.inventory_batches
      where item_id = v_inventory_item_id
        and quantity_remaining > 0
      order by expiration_date nulls last, received_at
      for update
    loop
      exit when v_needed <= 0;

      v_take := least(v_batch.quantity_remaining, v_needed);

      update public.inventory_batches
      set quantity_remaining = quantity_remaining - v_take
      where id = v_batch.id;

      insert into public.stock_transactions (
        item_id,
        batch_id,
        transaction_type,
        quantity,
        reference_type,
        reference_id,
        reason,
        performed_by
      )
      values (
        v_inventory_item_id,
        v_batch.id,
        'dispensing',
        v_take,
        'prescription',
        p_prescription_id,
        'Prescription dispensing',
        v_actor
      );

      v_needed := v_needed - v_take;
    end loop;

    if v_needed > 0 then
      raise exception 'Insufficient stock for medication %',
        v_medication_code using errcode = '22023';
    end if;

    insert into public.medication_dispenses (
      prescription_item_id,
      quantity_dispensed,
      dispensed_by,
      notes
    )
    values (
      v_item.id,
      v_remaining,
      v_actor,
      'Dispensed via dispense_prescription'
    );
  end loop;

  update public.prescriptions
  set status = 'dispensed',
      updated_by = v_actor
  where id = p_prescription_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'prescription.dispense',
    'prescription',
    p_prescription_id,
    'Dispensed a prescription.',
    '{"source":"dispense_prescription"}'::jsonb
  );

  return p_prescription_id;
end;
$$;

revoke all on function public.dispense_prescription(uuid) from public;

grant execute on function public.dispense_prescription(uuid)
  to authenticated, service_role;

-- ============================================================================
-- Record and refund payments (migration 030)
-- ============================================================================

-- ============================================================================
-- SPMC HMS â€?record and refund payments
-- Migration 030. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- record_payment applies a completed payment to an invoice and recomputes the
-- balance and invoice status atomically. refund_payment reverses a single
-- completed payment without deleting it, so the financial history is preserved.

create or replace function public.record_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_amount numeric(12,2);
  v_invoice public.invoices%rowtype;
  v_payment_id uuid;
  v_reference text;
  v_balance numeric(12,2);
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('billing.payment.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_amount is null then
    raise exception 'Payment amount is required' using errcode = '22023';
  end if;

  v_amount := round(p_amount, 2);

  if v_amount <= 0 then
    raise exception 'Payment amount must be greater than zero'
      using errcode = '22023';
  end if;

  if p_payment_method is null
    or p_payment_method not in (
      'Cash',
      'Credit card',
      'Debit card',
      'Bank transfer',
      'Check',
      'HMO',
      'Insurance'
    ) then
    raise exception 'Unsupported payment method' using errcode = '22023';
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found' using errcode = '22023';
  end if;

  if v_invoice.status in ('cancelled', 'refunded') then
    raise exception 'Invoice is not payable' using errcode = '22023';
  end if;

  if v_invoice.balance <= 0 then
    raise exception 'Invoice is already paid' using errcode = '22023';
  end if;

  if v_amount > v_invoice.balance then
    raise exception 'Payment exceeds the outstanding balance'
      using errcode = '22023';
  end if;

  v_reference := public.generate_reference_number('PAY');
  v_balance := v_invoice.balance - v_amount;

  insert into public.payments (
    payment_reference,
    invoice_id,
    amount,
    payment_method,
    payment_status,
    received_by,
    notes
  )
  values (
    v_reference,
    p_invoice_id,
    v_amount,
    p_payment_method,
    'completed',
    v_actor,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_payment_id;

  update public.invoices
  set amount_paid = v_invoice.amount_paid + v_amount,
      balance = v_balance,
      status = case when v_balance <= 0 then 'paid' else 'partially_paid' end,
      updated_by = v_actor
  where id = p_invoice_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'payment.record',
    'payment',
    v_payment_id,
    'Recorded a patient payment.',
    jsonb_build_object(
      'source', 'record_payment',
      'invoice_id', p_invoice_id,
      'payment_reference', v_reference,
      'amount', v_amount
    )
  );

  return v_payment_id;
end;
$$;

create or replace function public.refund_payment(
  p_payment_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_payment public.payments%rowtype;
  v_invoice public.invoices%rowtype;
  v_amount_paid numeric(12,2);
  v_balance numeric(12,2);
  v_reason text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('billing.refund') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select *
  into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found' using errcode = '22023';
  end if;

  if v_payment.payment_status <> 'completed' then
    raise exception 'Only completed payments can be refunded'
      using errcode = '22023';
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = v_payment.invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found' using errcode = '22023';
  end if;

  if v_payment.amount > v_invoice.amount_paid then
    raise exception 'Refund exceeds the recorded amount paid'
      using errcode = '22023';
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');
  v_amount_paid := v_invoice.amount_paid - v_payment.amount;
  v_balance := v_invoice.total_amount - v_amount_paid;

  -- The charge still stands after a refund, so the invoice returns to the
  -- unpaid or partially paid state and can be collected again.
  update public.invoices
  set amount_paid = v_amount_paid,
      balance = v_balance,
      status = case
        when v_amount_paid <= 0 then 'unpaid'
        else 'partially_paid'
      end,
      updated_by = v_actor
  where id = v_payment.invoice_id;

  update public.payments
  set payment_status = 'refunded',
      notes = concat_ws(
        ' | ',
        nullif(btrim(coalesce(notes, '')), ''),
        case when v_reason is not null then 'Refund: ' || v_reason end
      )
  where id = p_payment_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'payment.refund',
    'payment',
    p_payment_id,
    'Refunded a patient payment.',
    jsonb_build_object(
      'source', 'refund_payment',
      'invoice_id', v_payment.invoice_id,
      'payment_reference', v_payment.payment_reference,
      'amount', v_payment.amount,
      'reason', v_reason
    )
  );

  return p_payment_id;
end;
$$;

revoke all on function public.record_payment(uuid, numeric, text, text)
  from public;
revoke all on function public.refund_payment(uuid, text) from public;

grant execute on function public.record_payment(uuid, numeric, text, text)
  to authenticated, service_role;
grant execute on function public.refund_payment(uuid, text)
  to authenticated, service_role;

-- ============================================================================
-- Fix payment enum casts (migration 031)
-- ============================================================================

-- ============================================================================
-- SPMC HMS â€?record and refund payments (enum casts)
-- Migration 031. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Migration 030 assigned CASE expressions to an enum column without casts,
-- which PostgreSQL rejects with 42804 ("column status is of type
-- public.invoice_status but expression is of type text"). Both functions are
-- redefined with explicit enum casts.
-- record_payment applies a completed payment to an invoice and recomputes the
-- balance and invoice status atomically. refund_payment reverses a single
-- completed payment without deleting it, so the financial history is preserved.

create or replace function public.record_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_amount numeric(12,2);
  v_invoice public.invoices%rowtype;
  v_payment_id uuid;
  v_reference text;
  v_balance numeric(12,2);
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('billing.payment.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_amount is null then
    raise exception 'Payment amount is required' using errcode = '22023';
  end if;

  v_amount := round(p_amount, 2);

  if v_amount <= 0 then
    raise exception 'Payment amount must be greater than zero'
      using errcode = '22023';
  end if;

  if p_payment_method is null
    or p_payment_method not in (
      'Cash',
      'Credit card',
      'Debit card',
      'Bank transfer',
      'Check',
      'HMO',
      'Insurance'
    ) then
    raise exception 'Unsupported payment method' using errcode = '22023';
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found' using errcode = '22023';
  end if;

  if v_invoice.status in ('cancelled', 'refunded') then
    raise exception 'Invoice is not payable' using errcode = '22023';
  end if;

  if v_invoice.balance <= 0 then
    raise exception 'Invoice is already paid' using errcode = '22023';
  end if;

  if v_amount > v_invoice.balance then
    raise exception 'Payment exceeds the outstanding balance'
      using errcode = '22023';
  end if;

  v_reference := public.generate_reference_number('PAY');
  v_balance := v_invoice.balance - v_amount;

  insert into public.payments (
    payment_reference,
    invoice_id,
    amount,
    payment_method,
    payment_status,
    received_by,
    notes
  )
  values (
    v_reference,
    p_invoice_id,
    v_amount,
    p_payment_method,
    'completed',
    v_actor,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_payment_id;

  update public.invoices
  set amount_paid = v_invoice.amount_paid + v_amount,
      balance = v_balance,
      status = case
        when v_balance <= 0 then 'paid'::public.invoice_status
        else 'partially_paid'::public.invoice_status
      end,
      updated_by = v_actor
  where id = p_invoice_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'payment.record',
    'payment',
    v_payment_id,
    'Recorded a patient payment.',
    jsonb_build_object(
      'source', 'record_payment',
      'invoice_id', p_invoice_id,
      'payment_reference', v_reference,
      'amount', v_amount
    )
  );

  return v_payment_id;
end;
$$;

create or replace function public.refund_payment(
  p_payment_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_payment public.payments%rowtype;
  v_invoice public.invoices%rowtype;
  v_amount_paid numeric(12,2);
  v_balance numeric(12,2);
  v_reason text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('billing.refund') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select *
  into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found' using errcode = '22023';
  end if;

  if v_payment.payment_status <> 'completed' then
    raise exception 'Only completed payments can be refunded'
      using errcode = '22023';
  end if;

  select *
  into v_invoice
  from public.invoices
  where id = v_payment.invoice_id
  for update;

  if not found then
    raise exception 'Invoice not found' using errcode = '22023';
  end if;

  if v_payment.amount > v_invoice.amount_paid then
    raise exception 'Refund exceeds the recorded amount paid'
      using errcode = '22023';
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');
  v_amount_paid := v_invoice.amount_paid - v_payment.amount;
  v_balance := v_invoice.total_amount - v_amount_paid;

  -- The charge still stands after a refund, so the invoice returns to the
  -- unpaid or partially paid state and can be collected again.
  update public.invoices
  set amount_paid = v_amount_paid,
      balance = v_balance,
      status = case
        when v_amount_paid <= 0 then 'unpaid'::public.invoice_status
        else 'partially_paid'::public.invoice_status
      end,
      updated_by = v_actor
  where id = v_payment.invoice_id;

  update public.payments
  set payment_status = 'refunded',
      notes = concat_ws(
        ' | ',
        nullif(btrim(coalesce(notes, '')), ''),
        case when v_reason is not null then 'Refund: ' || v_reason end
      )
  where id = p_payment_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'payment.refund',
    'payment',
    p_payment_id,
    'Refunded a patient payment.',
    jsonb_build_object(
      'source', 'refund_payment',
      'invoice_id', v_payment.invoice_id,
      'payment_reference', v_payment.payment_reference,
      'amount', v_payment.amount,
      'reason', v_reason
    )
  );

  return p_payment_id;
end;
$$;

revoke all on function public.record_payment(uuid, numeric, text, text)
  from public;
revoke all on function public.refund_payment(uuid, text) from public;

grant execute on function public.record_payment(uuid, numeric, text, text)
  to authenticated, service_role;
grant execute on function public.refund_payment(uuid, text)
  to authenticated, service_role;

-- ============================================================================
-- Stock movements (migration 032)
-- ============================================================================

-- ============================================================================
-- SPMC HMS â€?stock movements
-- Migration 032. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- One atomic entry point for stock in, stock out and stock-count adjustments.
-- Every movement writes a stock_transactions row, and stock-out deducts batches
-- FIFO so quantities can never go negative.

create or replace function public.adjust_inventory(
  p_item_id uuid,
  p_transaction_type text,
  p_quantity numeric,
  p_reason text default null,
  p_batch_id uuid default null,
  p_batch_number text default null,
  p_expiration_date date default null,
  p_unit_cost numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_item public.inventory_items%rowtype;
  v_batch public.inventory_batches%rowtype;
  v_batch_id uuid;
  v_needed numeric;
  v_take numeric;
  v_delta numeric;
  v_reason text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_transaction_type is null
    or p_transaction_type not in ('stock_in', 'stock_out', 'adjustment') then
    raise exception 'Unsupported stock movement type' using errcode = '22023';
  end if;

  if p_quantity is null then
    raise exception 'Quantity is required' using errcode = '22023';
  end if;

  select *
  into v_item
  from public.inventory_items
  where id = p_item_id;

  if not found then
    raise exception 'Inventory item not found' using errcode = '22023';
  end if;

  if not v_item.is_active then
    raise exception 'Inventory item is inactive' using errcode = '22023';
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');

  -- --------------------------------------------------------------------------
  -- Stock in: receive a new batch
  -- --------------------------------------------------------------------------
  if p_transaction_type = 'stock_in' then
    if not public.has_permission('inventory.stock.in') then
      raise exception 'Insufficient permission' using errcode = '42501';
    end if;

    if p_quantity <= 0 then
      raise exception 'Received quantity must be greater than zero'
        using errcode = '22023';
    end if;

    if p_unit_cost is not null and p_unit_cost < 0 then
      raise exception 'Unit cost cannot be negative' using errcode = '22023';
    end if;

    insert into public.inventory_batches (
      item_id,
      batch_number,
      quantity_received,
      quantity_remaining,
      expiration_date,
      unit_cost,
      created_by
    )
    values (
      p_item_id,
      nullif(btrim(coalesce(p_batch_number, '')), ''),
      p_quantity,
      p_quantity,
      p_expiration_date,
      p_unit_cost,
      v_actor
    )
    returning id into v_batch_id;

    insert into public.stock_transactions (
      item_id,
      batch_id,
      transaction_type,
      quantity,
      reason,
      performed_by
    )
    values (
      p_item_id,
      v_batch_id,
      'stock_in'::public.stock_transaction_type,
      p_quantity,
      v_reason,
      v_actor
    );

    insert into public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      description,
      metadata
    )
    values (
      v_actor,
      'inventory.stock_in',
      'inventory_item',
      p_item_id,
      'Received stock into inventory.',
      jsonb_build_object(
        'source', 'adjust_inventory',
        'item_code', v_item.item_code,
        'batch_id', v_batch_id,
        'quantity', p_quantity
      )
    );

    return v_batch_id;
  end if;

  -- --------------------------------------------------------------------------
  -- Stock out: issue FIFO across available batches
  -- --------------------------------------------------------------------------
  if p_transaction_type = 'stock_out' then
    if not public.has_permission('inventory.stock.out') then
      raise exception 'Insufficient permission' using errcode = '42501';
    end if;

    if p_quantity <= 0 then
      raise exception 'Issued quantity must be greater than zero'
        using errcode = '22023';
    end if;

    if v_reason is null then
      raise exception 'A reason is required to issue stock'
        using errcode = '22023';
    end if;

    v_needed := p_quantity;

    for v_batch in
      select *
      from public.inventory_batches
      where item_id = p_item_id
        and quantity_remaining > 0
      order by expiration_date nulls last, received_at
      for update
    loop
      exit when v_needed <= 0;

      v_take := least(v_batch.quantity_remaining, v_needed);

      update public.inventory_batches
      set quantity_remaining = quantity_remaining - v_take
      where id = v_batch.id;

      insert into public.stock_transactions (
        item_id,
        batch_id,
        transaction_type,
        quantity,
        reason,
        performed_by
      )
      values (
        p_item_id,
        v_batch.id,
        'stock_out'::public.stock_transaction_type,
        v_take,
        v_reason,
        v_actor
      );

      v_needed := v_needed - v_take;
    end loop;

    if v_needed > 0 then
      raise exception 'Insufficient stock for %', v_item.item_code
        using errcode = '22023';
    end if;

    insert into public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      description,
      metadata
    )
    values (
      v_actor,
      'inventory.stock_out',
      'inventory_item',
      p_item_id,
      'Issued stock from inventory.',
      jsonb_build_object(
        'source', 'adjust_inventory',
        'item_code', v_item.item_code,
        'quantity', p_quantity,
        'reason', v_reason
      )
    );

    return p_item_id;
  end if;

  -- --------------------------------------------------------------------------
  -- Adjustment: record a physical count for one batch
  -- --------------------------------------------------------------------------
  if not public.has_permission('inventory.stock.adjust') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_reason is null then
    raise exception 'A reason is required to adjust stock'
      using errcode = '22023';
  end if;

  if p_batch_id is null then
    raise exception 'Select a batch to adjust' using errcode = '22023';
  end if;

  if p_quantity < 0 then
    raise exception 'Counted quantity cannot be negative'
      using errcode = '22023';
  end if;

  select *
  into v_batch
  from public.inventory_batches
  where id = p_batch_id
  for update;

  if not found then
    raise exception 'Inventory batch not found' using errcode = '22023';
  end if;

  if v_batch.item_id <> p_item_id then
    raise exception 'Batch does not belong to the selected item'
      using errcode = '22023';
  end if;

  v_delta := p_quantity - v_batch.quantity_remaining;

  if v_delta = 0 then
    return v_batch.id;
  end if;

  if p_quantity > v_batch.quantity_received then
    raise exception 'Counted quantity exceeds the received quantity for this batch'
      using errcode = '22023';
  end if;

  update public.inventory_batches
  set quantity_remaining = p_quantity
  where id = v_batch.id;

  insert into public.stock_transactions (
    item_id,
    batch_id,
    transaction_type,
    quantity,
    reason,
    performed_by
  )
  values (
    p_item_id,
    v_batch.id,
    'adjustment'::public.stock_transaction_type,
    abs(v_delta),
    v_reason,
    v_actor
  );

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'inventory.adjustment',
    'inventory_item',
    p_item_id,
    'Adjusted a stock count.',
    jsonb_build_object(
      'source', 'adjust_inventory',
      'item_code', v_item.item_code,
      'batch_id', v_batch.id,
      'previous_quantity', v_batch.quantity_remaining,
      'counted_quantity', p_quantity,
      'delta', v_delta,
      'reason', v_reason
    )
  );

  return v_batch.id;
end;
$$;

revoke all on function public.adjust_inventory(
  uuid, text, numeric, text, uuid, text, date, numeric
) from public;

grant execute on function public.adjust_inventory(
  uuid, text, numeric, text, uuid, text, date, numeric
) to authenticated, service_role;

-- ============================================================================
-- Invoice, patient record, and nursing writes (migration 033)
-- ============================================================================

-- ============================================================================
-- SPMC HMS â€?invoice, patient record, and nursing writes
-- Migration 033. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Create an invoice with itemized charges
-- ----------------------------------------------------------------------------
create or replace function public.create_invoice(
  p_patient_id uuid,
  p_items jsonb,
  p_discount_amount numeric default 0,
  p_encounter_id uuid default null,
  p_admission_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_item jsonb;
  v_description text;
  v_quantity numeric;
  v_unit_price numeric;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2);
  v_total numeric(12,2);
  v_invoice_id uuid;
  v_invoice_number text;
  v_count integer := 0;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('billing.invoice.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one charge line' using errcode = '22023';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_description := btrim(coalesce(v_item->>'description', ''));
    v_quantity := coalesce((v_item->>'quantity')::numeric, 0);
    v_unit_price := coalesce((v_item->>'unit_price')::numeric, -1);

    if v_description = '' then
      raise exception 'Every charge line needs a description'
        using errcode = '22023';
    end if;

    if v_quantity <= 0 then
      raise exception 'Charge quantities must be greater than zero'
        using errcode = '22023';
    end if;

    if v_unit_price < 0 then
      raise exception 'Unit prices cannot be negative' using errcode = '22023';
    end if;

    v_subtotal := v_subtotal + round(v_quantity * v_unit_price, 2);
    v_count := v_count + 1;
  end loop;

  v_discount := round(coalesce(p_discount_amount, 0), 2);

  if v_discount < 0 then
    raise exception 'Discount cannot be negative' using errcode = '22023';
  end if;

  if v_discount > v_subtotal then
    raise exception 'Discount cannot exceed the subtotal' using errcode = '22023';
  end if;

  v_total := v_subtotal - v_discount;
  v_invoice_number := public.generate_reference_number('INV');

  insert into public.invoices (
    invoice_number,
    patient_id,
    admission_id,
    encounter_id,
    subtotal,
    discount_amount,
    total_amount,
    amount_paid,
    balance,
    status,
    created_by
  )
  values (
    v_invoice_number,
    p_patient_id,
    p_admission_id,
    p_encounter_id,
    v_subtotal,
    v_discount,
    v_total,
    0,
    v_total,
    'unpaid'::public.invoice_status,
    v_actor
  )
  returning id into v_invoice_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_description := btrim(coalesce(v_item->>'description', ''));
    v_quantity := (v_item->>'quantity')::numeric;
    v_unit_price := round((v_item->>'unit_price')::numeric, 2);

    insert into public.invoice_items (
      invoice_id,
      description,
      quantity,
      unit_price,
      line_total
    )
    values (
      v_invoice_id,
      v_description,
      v_quantity,
      v_unit_price,
      round(v_quantity * v_unit_price, 2)
    );
  end loop;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'billing.invoice.create',
    'invoice',
    v_invoice_id,
    'Created a patient invoice.',
    jsonb_build_object(
      'source', 'create_invoice',
      'invoice_number', v_invoice_number,
      'line_count', v_count,
      'subtotal', v_subtotal,
      'discount', v_discount,
      'total', v_total
    )
  );

  return v_invoice_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Update a patient record (including registration status)
-- ----------------------------------------------------------------------------
create or replace function public.update_patient(
  p_patient_id uuid,
  p_patch jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_patient public.patients%rowtype;
  v_status text;
  v_first_name text;
  v_last_name text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('patient.update') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select *
  into v_patient
  from public.patients
  where id = p_patient_id
  for update;

  if not found then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  v_status := nullif(btrim(coalesce(p_patch->>'registration_status', '')), '');

  if v_status is not null then
    if v_status not in ('active', 'inactive', 'archived') then
      raise exception 'Unsupported registration status'
        using errcode = '22023';
    end if;

    if v_status = 'archived'
      and not public.has_permission('patient.archive') then
      raise exception 'Insufficient permission' using errcode = '42501';
    end if;
  end if;

  v_first_name := case
    when p_patch ? 'first_name'
      then nullif(btrim(p_patch->>'first_name'), '')
    else v_patient.first_name
  end;

  v_last_name := case
    when p_patch ? 'last_name'
      then nullif(btrim(p_patch->>'last_name'), '')
    else v_patient.last_name
  end;

  if v_first_name is null or v_last_name is null then
    raise exception 'First name and last name are required'
      using errcode = '22023';
  end if;

  update public.patients
  set
    first_name = v_first_name,
    last_name = v_last_name,
    middle_name = case
      when p_patch ? 'middle_name'
        then nullif(btrim(p_patch->>'middle_name'), '')
      else middle_name
    end,
    suffix = case
      when p_patch ? 'suffix'
        then nullif(btrim(p_patch->>'suffix'), '')
      else suffix
    end,
    date_of_birth = case
      when p_patch ? 'date_of_birth'
        then nullif(btrim(p_patch->>'date_of_birth'), '')::date
      else date_of_birth
    end,
    sex = case
      when p_patch ? 'sex'
        then nullif(btrim(p_patch->>'sex'), '')
      else sex
    end,
    civil_status = case
      when p_patch ? 'civil_status'
        then nullif(btrim(p_patch->>'civil_status'), '')
      else civil_status
    end,
    nationality = case
      when p_patch ? 'nationality'
        then nullif(btrim(p_patch->>'nationality'), '')
      else nationality
    end,
    contact_number = case
      when p_patch ? 'contact_number'
        then nullif(btrim(p_patch->>'contact_number'), '')
      else contact_number
    end,
    email = case
      when p_patch ? 'email'
        then nullif(btrim(p_patch->>'email'), '')
      else email
    end,
    address_line = case
      when p_patch ? 'address_line'
        then nullif(btrim(p_patch->>'address_line'), '')
      else address_line
    end,
    barangay = case
      when p_patch ? 'barangay'
        then nullif(btrim(p_patch->>'barangay'), '')
      else barangay
    end,
    city = case
      when p_patch ? 'city'
        then nullif(btrim(p_patch->>'city'), '')
      else city
    end,
    province = case
      when p_patch ? 'province'
        then nullif(btrim(p_patch->>'province'), '')
      else province
    end,
    postal_code = case
      when p_patch ? 'postal_code'
        then nullif(btrim(p_patch->>'postal_code'), '')
      else postal_code
    end,
    registration_status = coalesce(
      v_status::public.patient_registration_status,
      registration_status
    ),
    updated_by = v_actor
  where id = p_patient_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    case
      when v_status = 'archived' then 'patient.archive'
      else 'patient.update'
    end,
    'patient',
    p_patient_id,
    case
      when v_status = 'archived' then 'Archived a patient record.'
      else 'Updated a patient record.'
    end,
    jsonb_build_object(
      'source', 'update_patient',
      'fields', (
        select coalesce(jsonb_agg(key), '[]'::jsonb)
        from jsonb_object_keys(p_patch) as key
      )
    )
  );

  return p_patient_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Record a patient allergy
-- ----------------------------------------------------------------------------
create or replace function public.record_patient_allergy(
  p_patient_id uuid,
  p_allergen text,
  p_reaction text default null,
  p_severity text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_allergen text := btrim(coalesce(p_allergen, ''));
  v_severity text := nullif(btrim(coalesce(p_severity, '')), '');
  v_allergy_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('medical_record.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not public.can_access_patient(p_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_allergen = '' then
    raise exception 'An allergen is required' using errcode = '22023';
  end if;

  if v_severity is not null
    and v_severity not in ('mild', 'moderate', 'severe', 'life_threatening') then
    raise exception 'Unsupported allergy severity' using errcode = '22023';
  end if;

  insert into public.patient_allergies (
    patient_id,
    allergen,
    reaction,
    severity,
    notes,
    recorded_by
  )
  values (
    p_patient_id,
    v_allergen,
    nullif(btrim(coalesce(p_reaction, '')), ''),
    v_severity,
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_allergy_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'medical_record.allergy.create',
    'patient_allergy',
    v_allergy_id,
    'Recorded a patient allergy.',
    jsonb_build_object('source', 'record_patient_allergy', 'patient_id', p_patient_id)
  );

  return v_allergy_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Record vital signs
-- ----------------------------------------------------------------------------
create or replace function public.record_vital_signs(
  p_patient_id uuid,
  p_encounter_id uuid,
  p_systolic_bp numeric default null,
  p_diastolic_bp numeric default null,
  p_heart_rate numeric default null,
  p_respiratory_rate numeric default null,
  p_temperature numeric default null,
  p_oxygen_saturation numeric default null,
  p_weight_kg numeric default null,
  p_height_cm numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_vitals_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('vital_signs.record') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not public.can_access_patient(p_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.encounters
    where id = p_encounter_id
      and patient_id = p_patient_id
  ) then
    raise exception 'Encounter not found for this patient'
      using errcode = '22023';
  end if;

  if coalesce(
    p_systolic_bp,
    p_diastolic_bp,
    p_heart_rate,
    p_respiratory_rate,
    p_temperature,
    p_oxygen_saturation,
    p_weight_kg,
    p_height_cm
  ) is null then
    raise exception 'Record at least one measurement' using errcode = '22023';
  end if;

  if p_systolic_bp is not null and p_systolic_bp <= 0
    or p_diastolic_bp is not null and p_diastolic_bp <= 0
    or p_heart_rate is not null and p_heart_rate <= 0
    or p_respiratory_rate is not null and p_respiratory_rate <= 0
    or p_temperature is not null and p_temperature <= 0
    or p_oxygen_saturation is not null and p_oxygen_saturation <= 0
    or p_weight_kg is not null and p_weight_kg <= 0
    or p_height_cm is not null and p_height_cm <= 0 then
    raise exception 'Measurements must be greater than zero'
      using errcode = '22023';
  end if;

  insert into public.vital_signs (
    patient_id,
    encounter_id,
    systolic_bp,
    diastolic_bp,
    heart_rate,
    respiratory_rate,
    temperature,
    oxygen_saturation,
    weight_kg,
    height_cm,
    recorded_by
  )
  values (
    p_patient_id,
    p_encounter_id,
    p_systolic_bp,
    p_diastolic_bp,
    p_heart_rate,
    p_respiratory_rate,
    p_temperature,
    p_oxygen_saturation,
    p_weight_kg,
    p_height_cm,
    v_actor
  )
  returning id into v_vitals_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'vital_signs.record',
    'vital_sign',
    v_vitals_id,
    'Recorded patient vital signs.',
    jsonb_build_object('source', 'record_vital_signs', 'patient_id', p_patient_id)
  );

  return v_vitals_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Add a nursing note
-- ----------------------------------------------------------------------------
create or replace function public.add_nursing_note(
  p_patient_id uuid,
  p_encounter_id uuid,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_note text := btrim(coalesce(p_note, ''));
  v_note_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('nursing.notes.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not public.can_access_patient(p_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_note = '' then
    raise exception 'A nursing note is required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.encounters
    where id = p_encounter_id
      and patient_id = p_patient_id
  ) then
    raise exception 'Encounter not found for this patient'
      using errcode = '22023';
  end if;

  insert into public.nursing_notes (
    patient_id,
    encounter_id,
    note,
    recorded_by
  )
  values (
    p_patient_id,
    p_encounter_id,
    v_note,
    v_actor
  )
  returning id into v_note_id;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'nursing.notes.create',
    'nursing_note',
    v_note_id,
    'Added a nursing note.',
    jsonb_build_object('source', 'add_nursing_note', 'patient_id', p_patient_id)
  );

  return v_note_id;
end;
$$;

revoke all on function public.create_invoice(uuid, jsonb, numeric, uuid, uuid)
  from public;
revoke all on function public.update_patient(uuid, jsonb) from public;
revoke all on function public.record_patient_allergy(uuid, text, text, text, text)
  from public;
revoke all on function public.record_vital_signs(
  uuid, uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric
) from public;
revoke all on function public.add_nursing_note(uuid, uuid, text) from public;

grant execute on function public.create_invoice(uuid, jsonb, numeric, uuid, uuid)
  to authenticated, service_role;
grant execute on function public.update_patient(uuid, jsonb)
  to authenticated, service_role;
grant execute on function public.record_patient_allergy(uuid, text, text, text, text)
  to authenticated, service_role;
grant execute on function public.record_vital_signs(
  uuid, uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, numeric
) to authenticated, service_role;
grant execute on function public.add_nursing_note(uuid, uuid, text)
  to authenticated, service_role;

-- ============================================================================
-- Departments, rooms, and staff administration (migration 034)
-- ============================================================================

-- ============================================================================
-- SPMC HMS â€?departments, rooms, and staff administration
-- Migration 034. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Create a department
-- ----------------------------------------------------------------------------
create or replace function public.create_department(
  p_code text,
  p_name text,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_name text := btrim(coalesce(p_name, ''));
  v_department_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_code = '' or v_name = '' then
    raise exception 'Department code and name are required'
      using errcode = '22023';
  end if;

  insert into public.departments (code, name, description, created_by)
  values (
    v_code,
    v_name,
    nullif(btrim(coalesce(p_description, '')), ''),
    v_actor
  )
  returning id into v_department_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'department.create',
    'department',
    v_department_id,
    'Created a department.',
    jsonb_build_object('source', 'create_department', 'code', v_code)
  );

  return v_department_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Create a room
-- ----------------------------------------------------------------------------
create or replace function public.create_room(
  p_department_id uuid,
  p_room_number text,
  p_room_type text default null,
  p_floor_number text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_room_number text := btrim(coalesce(p_room_number, ''));
  v_room_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('bed.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.departments where id = p_department_id
  ) then
    raise exception 'Department not found' using errcode = '22023';
  end if;

  if v_room_number = '' then
    raise exception 'A room number is required' using errcode = '22023';
  end if;

  insert into public.rooms (
    room_number,
    department_id,
    room_type,
    floor_number,
    created_by
  )
  values (
    v_room_number,
    p_department_id,
    nullif(btrim(coalesce(p_room_type, '')), ''),
    nullif(btrim(coalesce(p_floor_number, '')), ''),
    v_actor
  )
  returning id into v_room_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'room.create',
    'room',
    v_room_id,
    'Created a room.',
    jsonb_build_object(
      'source', 'create_room',
      'room_number', v_room_number,
      'department_id', p_department_id
    )
  );

  return v_room_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Update a staff record (including deactivation)
-- ----------------------------------------------------------------------------
create or replace function public.update_staff(
  p_staff_id uuid,
  p_patch jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_staff public.staff_profiles%rowtype;
  v_first_name text;
  v_last_name text;
  v_is_active boolean;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select *
  into v_staff
  from public.staff_profiles
  where id = p_staff_id
  for update;

  if not found then
    raise exception 'Staff record not found' using errcode = '22023';
  end if;

  v_first_name := case
    when p_patch ? 'first_name'
      then nullif(btrim(p_patch->>'first_name'), '')
    else v_staff.first_name
  end;

  v_last_name := case
    when p_patch ? 'last_name'
      then nullif(btrim(p_patch->>'last_name'), '')
    else v_staff.last_name
  end;

  if v_first_name is null or v_last_name is null then
    raise exception 'First name and last name are required'
      using errcode = '22023';
  end if;

  v_is_active := coalesce((p_patch->>'is_active')::boolean, v_staff.is_active);

  update public.staff_profiles
  set
    first_name = v_first_name,
    last_name = v_last_name,
    middle_name = case
      when p_patch ? 'middle_name'
        then nullif(btrim(p_patch->>'middle_name'), '')
      else middle_name
    end,
    department_id = case
      when p_patch ? 'department_id'
        then nullif(btrim(p_patch->>'department_id'), '')::uuid
      else department_id
    end,
    employment_type = case
      when p_patch ? 'employment_type'
        then nullif(btrim(p_patch->>'employment_type'), '')
      else employment_type
    end,
    professional_license_number = case
      when p_patch ? 'professional_license_number'
        then nullif(btrim(p_patch->>'professional_license_number'), '')
      else professional_license_number
    end,
    is_active = v_is_active,
    updated_by = v_actor
  where id = p_staff_id;

  -- Keep the account state aligned with the employment record so a
  -- deactivated staff member cannot keep signing in.
  update public.profiles
  set is_active = v_is_active,
      updated_at = now()
  where id = v_staff.user_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    case when v_is_active then 'staff.update' else 'staff.deactivate' end,
    'staff_profile',
    p_staff_id,
    case
      when v_is_active then 'Updated a staff record.'
      else 'Deactivated a staff account.'
    end,
    jsonb_build_object(
      'source', 'update_staff',
      'fields', (
        select coalesce(jsonb_agg(key), '[]'::jsonb)
        from jsonb_object_keys(p_patch) as key
      )
    )
  );

  return p_staff_id;
end;
$$;

revoke all on function public.create_department(text, text, text) from public;
revoke all on function public.create_room(uuid, text, text, text) from public;
revoke all on function public.update_staff(uuid, jsonb) from public;

grant execute on function public.create_department(text, text, text)
  to authenticated, service_role;
grant execute on function public.create_room(uuid, text, text, text)
  to authenticated, service_role;
grant execute on function public.update_staff(uuid, jsonb)
  to authenticated, service_role;

-- ============================================================================
-- Emergency department (migration 035)
-- ============================================================================

-- ============================================================================
-- SPMC HMS â€?emergency department
-- Migration 035. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Emergency visits sit on top of an encounter so vitals, notes, diagnoses and
-- orders keep using the shared clinical tables.

create type public.emergency_triage_level as enum (
  'critical',
  'emergent',
  'urgent',
  'less_urgent',
  'non_urgent'
);

create type public.emergency_visit_status as enum (
  'waiting',
  'triage',
  'in_treatment',
  'observation',
  'admitted',
  'transferred',
  'discharged'
);

create type public.emergency_arrival_mode as enum (
  'walk_in',
  'ambulance',
  'referral'
);

create type public.emergency_disposition as enum (
  'admit',
  'transfer',
  'discharge'
);

create table if not exists public.emergency_visits (
  id uuid primary key default gen_random_uuid(),

  visit_number text not null unique,

  encounter_id uuid not null unique
    references public.encounters(id) on delete restrict,
  patient_id uuid not null
    references public.patients(id) on delete restrict,

  arrival_at timestamptz not null default now(),
  arrival_mode public.emergency_arrival_mode not null default 'walk_in',

  triage_level public.emergency_triage_level not null default 'urgent',
  triage_note text,
  triaged_at timestamptz,

  chief_complaint text not null,

  status public.emergency_visit_status not null default 'waiting',

  attending_physician_id uuid
    references public.physicians(id) on delete restrict,
  triage_nurse_id uuid
    references public.staff_profiles(id) on delete restrict,

  treatment_area text,

  disposition public.emergency_disposition,
  disposition_at timestamptz,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_emergency_visits_status
  on public.emergency_visits(status, arrival_at desc);
create index if not exists idx_emergency_visits_patient
  on public.emergency_visits(patient_id, arrival_at desc);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('emergency.view', 'View emergency visits and triage board.'),
  ('emergency.create', 'Register and triage emergency patients.'),
  ('emergency.update', 'Update emergency visit status and disposition.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('emergency.view', 'emergency.create', 'emergency.update')
where r.slug in ('hospital_admin', 'physician', 'nurse')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('emergency.view', 'emergency.create')
where r.slug = 'receptionist'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.emergency_visits enable row level security;

drop policy if exists "emergency_visits_select_authorized"
  on public.emergency_visits;
create policy "emergency_visits_select_authorized"
on public.emergency_visits
for select
to authenticated
using (public.has_permission('emergency.view'));

drop policy if exists "emergency_visits_insert_authorized"
  on public.emergency_visits;
create policy "emergency_visits_insert_authorized"
on public.emergency_visits
for insert
to authenticated
with check (
  public.has_permission('emergency.create')
  and created_by = auth.uid()
);

drop policy if exists "emergency_visits_update_authorized"
  on public.emergency_visits;
create policy "emergency_visits_update_authorized"
on public.emergency_visits
for update
to authenticated
using (public.has_permission('emergency.update'))
with check (public.has_permission('emergency.update'));

-- ----------------------------------------------------------------------------
-- Start triage: create the emergency encounter and visit together
-- ----------------------------------------------------------------------------
create or replace function public.start_emergency_visit(
  p_patient_id uuid,
  p_chief_complaint text,
  p_triage_level text,
  p_arrival_mode text default 'walk_in',
  p_triage_note text default null,
  p_attending_physician_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_encounter_id uuid;
  v_visit_id uuid;
  v_department_id uuid;
  v_staff_id uuid;
  v_complaint text := btrim(coalesce(p_chief_complaint, ''));
  v_encounter_number text;
  v_visit_number text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('emergency.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if v_complaint = '' then
    raise exception 'A chief complaint is required' using errcode = '22023';
  end if;

  if p_triage_level not in (
    'critical', 'emergent', 'urgent', 'less_urgent', 'non_urgent'
  ) then
    raise exception 'Unsupported triage level' using errcode = '22023';
  end if;

  if p_arrival_mode not in ('walk_in', 'ambulance', 'referral') then
    raise exception 'Unsupported arrival mode' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.emergency_visits
    where patient_id = p_patient_id
      and status not in ('discharged', 'transferred')
  ) then
    raise exception 'This patient already has an active emergency visit'
      using errcode = '22023';
  end if;

  select id
  into v_department_id
  from public.departments
  where code = 'ER';

  if v_department_id is null then
    raise exception 'Emergency department is not configured'
      using errcode = '22023';
  end if;

  select id
  into v_staff_id
  from public.staff_profiles
  where user_id = v_actor;

  v_encounter_number := public.generate_reference_number('ENC');
  v_visit_number := public.generate_reference_number('ER');

  insert into public.encounters (
    encounter_number,
    patient_id,
    physician_id,
    department_id,
    encounter_type,
    chief_complaint,
    clinical_status,
    created_by
  )
  values (
    v_encounter_number,
    p_patient_id,
    p_attending_physician_id,
    v_department_id,
    'Emergency visit',
    v_complaint,
    'in_progress',
    v_actor
  )
  returning id into v_encounter_id;

  insert into public.emergency_visits (
    visit_number,
    encounter_id,
    patient_id,
    arrival_mode,
    triage_level,
    triage_note,
    triaged_at,
    chief_complaint,
    status,
    attending_physician_id,
    triage_nurse_id,
    created_by
  )
  values (
    v_visit_number,
    v_encounter_id,
    p_patient_id,
    p_arrival_mode::public.emergency_arrival_mode,
    p_triage_level::public.emergency_triage_level,
    nullif(btrim(coalesce(p_triage_note, '')), ''),
    now(),
    v_complaint,
    'triage'::public.emergency_visit_status,
    p_attending_physician_id,
    v_staff_id,
    v_actor
  )
  returning id into v_visit_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'emergency.visit.start',
    'emergency_visit',
    v_visit_id,
    'Started emergency triage.',
    jsonb_build_object(
      'source', 'start_emergency_visit',
      'visit_number', v_visit_number,
      'triage_level', p_triage_level,
      'arrival_mode', p_arrival_mode
    )
  );

  return v_visit_id;
end;
$$;

revoke all on function public.start_emergency_visit(
  uuid, text, text, text, text, uuid
) from public;

grant execute on function public.start_emergency_visit(
  uuid, text, text, text, text, uuid
) to authenticated, service_role;

-- ============================================================================
-- SPMC Hospital Management System — Core Database Schema
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
-- SPMC HMS —transactional admissions, transfers, and discharges
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
-- SPMC HMS —finalize clinical note
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
-- SPMC HMS —verify laboratory result
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
-- SPMC HMS —dispense prescription
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
-- SPMC HMS —fix dispense_prescription authorization
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
-- SPMC HMS —record and refund payments
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
-- SPMC HMS —record and refund payments (enum casts)
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
-- SPMC HMS —stock movements
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
-- SPMC HMS —invoice, patient record, and nursing writes
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
-- SPMC HMS —departments, rooms, and staff administration
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
-- Update a room
-- ----------------------------------------------------------------------------
create or replace function public.update_room(
  p_room_id uuid,
  p_department_id uuid,
  p_room_number text,
  p_room_type text default null,
  p_floor_number text default null,
  p_is_active boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_room_number text := btrim(coalesce(p_room_number, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('bed.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.rooms where id = p_room_id
  ) then
    raise exception 'Room not found' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.departments where id = p_department_id
  ) then
    raise exception 'Department not found' using errcode = '22023';
  end if;

  if v_room_number = '' then
    raise exception 'A room number is required' using errcode = '22023';
  end if;

  update public.rooms
  set
    room_number = v_room_number,
    department_id = p_department_id,
    room_type = nullif(btrim(coalesce(p_room_type, '')), ''),
    floor_number = nullif(btrim(coalesce(p_floor_number, '')), ''),
    is_active = p_is_active,
    updated_by = v_actor
  where id = p_room_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'room.update',
    'room',
    p_room_id,
    'Updated a room.',
    jsonb_build_object(
      'source', 'update_room',
      'room_number', v_room_number,
      'department_id', p_department_id,
      'is_active', p_is_active
    )
  );
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
revoke all on function public.update_room(uuid, uuid, text, text, text, boolean) from public;
revoke all on function public.update_staff(uuid, jsonb) from public;

grant execute on function public.create_department(text, text, text)
  to authenticated, service_role;
grant execute on function public.create_room(uuid, text, text, text)
  to authenticated, service_role;
grant execute on function public.update_room(uuid, uuid, text, text, text, boolean)
  to authenticated, service_role;
grant execute on function public.update_staff(uuid, jsonb)
  to authenticated, service_role;

-- ============================================================================
-- Emergency department (migration 035)
-- ============================================================================

-- ============================================================================
-- SPMC HMS —emergency department
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

-- ============================================================================
-- Surgery and operating theatres (migration 036)
-- ============================================================================

-- ============================================================================
-- SPMC HMS —surgery and operating theatres
-- Migration 036. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

create type public.surgery_status as enum (
  'requested',
  'scheduled',
  'pre_op',
  'in_progress',
  'recovery',
  'completed',
  'cancelled'
);

create type public.surgery_priority as enum (
  'elective',
  'urgent',
  'emergency'
);

create type public.operating_room_status as enum (
  'available',
  'in_use',
  'cleaning',
  'maintenance'
);

create type public.anesthesia_type as enum (
  'general',
  'regional',
  'local',
  'sedation'
);

create table if not exists public.operating_rooms (
  id uuid primary key default gen_random_uuid(),

  room_name text not null unique,
  department_id uuid not null
    references public.departments(id) on delete restrict,

  status public.operating_room_status not null default 'available',
  notes text,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.surgery_cases (
  id uuid primary key default gen_random_uuid(),

  case_number text not null unique,

  patient_id uuid not null references public.patients(id) on delete restrict,
  room_id uuid not null
    references public.operating_rooms(id) on delete restrict,

  procedure_code text not null,
  procedure_name text not null,

  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  actual_start timestamptz,
  actual_end timestamptz,

  status public.surgery_status not null default 'requested',
  priority public.surgery_priority not null default 'elective',

  surgeon_id uuid not null references public.physicians(id) on delete restrict,
  anesthesiologist_id uuid
    references public.physicians(id) on delete restrict,
  scrub_nurse_id uuid
    references public.staff_profiles(id) on delete restrict,
  circulating_nurse_id uuid
    references public.staff_profiles(id) on delete restrict,

  anesthesia_type public.anesthesia_type,

  pre_op_completed boolean not null default false,
  consent_signed boolean not null default false,
  safety_checklist_completed boolean not null default false,

  notes text,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (scheduled_end > scheduled_start)
);

create index if not exists idx_surgery_cases_room_time
  on public.surgery_cases(room_id, scheduled_start);
create index if not exists idx_surgery_cases_status
  on public.surgery_cases(status, scheduled_start);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('surgery.view', 'View surgical cases and theatre board.'),
  ('surgery.create', 'Register operating rooms and schedule cases.'),
  ('surgery.update', 'Update surgical case status and theatre state.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('surgery.view', 'surgery.create', 'surgery.update')
where r.slug in ('hospital_admin', 'physician', 'nurse')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.operating_rooms enable row level security;
alter table public.surgery_cases enable row level security;

drop policy if exists "operating_rooms_select_authorized"
  on public.operating_rooms;
create policy "operating_rooms_select_authorized"
on public.operating_rooms
for select
to authenticated
using (public.has_permission('surgery.view'));

drop policy if exists "surgery_cases_select_authorized"
  on public.surgery_cases;
create policy "surgery_cases_select_authorized"
on public.surgery_cases
for select
to authenticated
using (public.has_permission('surgery.view'));

drop policy if exists "surgery_cases_insert_authorized"
  on public.surgery_cases;
create policy "surgery_cases_insert_authorized"
on public.surgery_cases
for insert
to authenticated
with check (
  public.has_permission('surgery.create')
  and created_by = auth.uid()
);

drop policy if exists "surgery_cases_update_authorized"
  on public.surgery_cases;
create policy "surgery_cases_update_authorized"
on public.surgery_cases
for update
to authenticated
using (public.has_permission('surgery.update'))
with check (public.has_permission('surgery.update'));

-- ----------------------------------------------------------------------------
-- Register an operating room
-- ----------------------------------------------------------------------------
create or replace function public.register_operating_room(
  p_room_name text,
  p_department_id uuid,
  p_status text default 'available',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_room_name text := btrim(coalesce(p_room_name, ''));
  v_room_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('surgery.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_room_name = '' then
    raise exception 'A room name is required' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.departments where id = p_department_id
  ) then
    raise exception 'Department not found' using errcode = '22023';
  end if;

  if p_status not in ('available', 'in_use', 'cleaning', 'maintenance') then
    raise exception 'Unsupported operating room status'
      using errcode = '22023';
  end if;

  insert into public.operating_rooms (
    room_name, department_id, status, notes, created_by
  )
  values (
    v_room_name,
    p_department_id,
    p_status::public.operating_room_status,
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_room_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'surgery.room.register',
    'operating_room',
    v_room_id,
    'Registered an operating room.',
    jsonb_build_object('source', 'register_operating_room', 'room_name', v_room_name)
  );

  return v_room_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Schedule a surgical case
-- ----------------------------------------------------------------------------
create or replace function public.schedule_surgery_case(
  p_patient_id uuid,
  p_room_id uuid,
  p_procedure_code text,
  p_procedure_name text,
  p_scheduled_start timestamptz,
  p_scheduled_end timestamptz,
  p_priority text,
  p_surgeon_id uuid,
  p_anesthesia_type text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_case_id uuid;
  v_case_number text;
  v_procedure_code text := upper(btrim(coalesce(p_procedure_code, '')));
  v_procedure_name text := btrim(coalesce(p_procedure_name, ''));
  v_room_status public.operating_room_status;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('surgery.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if v_procedure_code = '' or v_procedure_name = '' then
    raise exception 'Procedure code and name are required'
      using errcode = '22023';
  end if;

  if p_scheduled_start is null
    or p_scheduled_end is null
    or p_scheduled_end <= p_scheduled_start then
    raise exception 'The case end time must be after the start time'
      using errcode = '22023';
  end if;

  if p_priority not in ('elective', 'urgent', 'emergency') then
    raise exception 'Unsupported surgery priority' using errcode = '22023';
  end if;

  if p_anesthesia_type is not null
    and p_anesthesia_type not in ('general', 'regional', 'local', 'sedation') then
    raise exception 'Unsupported anesthesia type' using errcode = '22023';
  end if;

  select status
  into v_room_status
  from public.operating_rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Operating room not found' using errcode = '22023';
  end if;

  if v_room_status = 'maintenance' then
    raise exception 'The operating room is under maintenance'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.surgery_cases
    where room_id = p_room_id
      and status not in ('cancelled', 'completed')
      and tstzrange(scheduled_start, scheduled_end, '[)')
        && tstzrange(p_scheduled_start, p_scheduled_end, '[)')
  ) then
    raise exception 'The operating room is already booked for that slot'
      using errcode = '23P01';
  end if;

  v_case_number := public.generate_reference_number('SUR');

  insert into public.surgery_cases (
    case_number,
    patient_id,
    room_id,
    procedure_code,
    procedure_name,
    scheduled_start,
    scheduled_end,
    status,
    priority,
    surgeon_id,
    anesthesia_type,
    notes,
    created_by
  )
  values (
    v_case_number,
    p_patient_id,
    p_room_id,
    v_procedure_code,
    v_procedure_name,
    p_scheduled_start,
    p_scheduled_end,
    'scheduled'::public.surgery_status,
    p_priority::public.surgery_priority,
    p_surgeon_id,
    p_anesthesia_type::public.anesthesia_type,
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_case_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'surgery.case.schedule',
    'surgery_case',
    v_case_id,
    'Scheduled a surgical case.',
    jsonb_build_object(
      'source', 'schedule_surgery_case',
      'case_number', v_case_number,
      'priority', p_priority,
      'room_id', p_room_id
    )
  );

  return v_case_id;
end;
$$;

revoke all on function public.register_operating_room(
  text, uuid, text, text
) from public;
revoke all on function public.schedule_surgery_case(
  uuid, uuid, text, text, timestamptz, timestamptz, text, uuid, text, text
) from public;

grant execute on function public.register_operating_room(
  text, uuid, text, text
) to authenticated, service_role;
grant execute on function public.schedule_surgery_case(
  uuid, uuid, text, text, timestamptz, timestamptz, text, uuid, text, text
) to authenticated, service_role;

-- ============================================================================
-- Human resources (migration 037)
-- ============================================================================

-- ============================================================================
-- SPMC HMS —human resources
-- Migration 037. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- HR extends staff_profiles rather than duplicating it: identity, department
-- and employment type stay in the staff record, HR adds position, credentials,
-- shifts, attendance, leave and payroll.

create table if not exists public.hr_employee_details (
  staff_profile_id uuid primary key
    references public.staff_profiles(id) on delete cascade,

  position text not null,
  employment_status text not null default 'active'
    check (employment_status in ('active', 'on_leave', 'inactive', 'separated')),
  hire_date date not null,
  license_expiry date,
  leave_balance numeric(6,2) not null default 0 check (leave_balance >= 0),

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_credentials (
  id uuid primary key default gen_random_uuid(),

  staff_profile_id uuid not null
    references public.staff_profiles(id) on delete cascade,

  credential_type text not null,
  credential_number text not null,
  issued_at date not null,
  expires_at date,
  status text not null default 'valid'
    check (status in ('valid', 'expiring', 'expired', 'revoked')),

  created_at timestamptz not null default now()
);

create table if not exists public.hr_shifts (
  id uuid primary key default gen_random_uuid(),

  staff_profile_id uuid not null
    references public.staff_profiles(id) on delete cascade,

  shift_date date not null,
  shift_type text not null
    check (shift_type in ('morning', 'afternoon', 'night', 'off', 'on_call')),
  start_time time not null,
  end_time time not null,
  published boolean not null default true,

  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_attendance (
  id uuid primary key default gen_random_uuid(),

  staff_profile_id uuid not null
    references public.staff_profiles(id) on delete cascade,

  attendance_date date not null,
  time_in time,
  time_out time,
  status text not null default 'present'
    check (status in ('present', 'late', 'absent', 'leave', 'holiday')),
  overtime_minutes integer not null default 0 check (overtime_minutes >= 0),
  note text,

  created_at timestamptz not null default now(),

  unique (staff_profile_id, attendance_date)
);

create table if not exists public.hr_leave_requests (
  id uuid primary key default gen_random_uuid(),

  staff_profile_id uuid not null
    references public.staff_profiles(id) on delete cascade,

  leave_type text not null
    check (leave_type in ('vacation', 'sick', 'maternity', 'paternity', 'emergency', 'study')),
  start_date date not null,
  end_date date not null,
  days numeric(5,1) not null check (days > 0),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reason text not null,

  requested_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),

  check (end_date >= start_date)
);

create table if not exists public.hr_payroll_periods (
  id uuid primary key default gen_random_uuid(),

  period_start date not null,
  period_end date not null,
  pay_date date not null,
  status text not null default 'draft'
    check (status in ('draft', 'processing', 'approved', 'paid')),

  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),

  check (period_end >= period_start)
);

create table if not exists public.hr_payroll_entries (
  id uuid primary key default gen_random_uuid(),

  payroll_period_id uuid not null
    references public.hr_payroll_periods(id) on delete cascade,
  staff_profile_id uuid not null
    references public.staff_profiles(id) on delete cascade,

  position text not null,
  basic_pay numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  overtime_pay numeric(12,2) not null default 0,
  gross_pay numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_pay numeric(12,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'paid')),

  created_at timestamptz not null default now(),

  unique (payroll_period_id, staff_profile_id)
);

create index if not exists idx_hr_shifts_date
  on public.hr_shifts(shift_date, staff_profile_id);
create index if not exists idx_hr_attendance_date
  on public.hr_attendance(attendance_date, staff_profile_id);
create index if not exists idx_hr_leave_status
  on public.hr_leave_requests(status, start_date desc);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('hr.view', 'View employee records, attendance, leave and payroll.'),
  ('hr.manage', 'Schedule shifts and process leave requests.'),
  ('hr.payroll', 'Prepare and approve payroll.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('hr.view', 'hr.manage', 'hr.payroll')
where r.slug = 'hospital_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug = 'hr.view'
where r.slug in ('physician', 'nurse')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'hr_employee_details',
    'hr_credentials',
    'hr_shifts',
    'hr_attendance',
    'hr_leave_requests',
    'hr_payroll_periods',
    'hr_payroll_entries'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''hr.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

drop policy if exists "hr_shifts_insert_authorized" on public.hr_shifts;
create policy "hr_shifts_insert_authorized"
on public.hr_shifts
for insert
to authenticated
with check (
  public.has_permission('hr.manage')
  and created_by = auth.uid()
);

drop policy if exists "hr_leave_insert_authorized" on public.hr_leave_requests;
create policy "hr_leave_insert_authorized"
on public.hr_leave_requests
for insert
to authenticated
with check (
  public.has_permission('hr.manage')
  and requested_by = auth.uid()
);

drop policy if exists "hr_leave_update_authorized" on public.hr_leave_requests;
create policy "hr_leave_update_authorized"
on public.hr_leave_requests
for update
to authenticated
using (public.has_permission('hr.manage'))
with check (public.has_permission('hr.manage'));

-- ----------------------------------------------------------------------------
-- Schedule a shift
-- ----------------------------------------------------------------------------
create or replace function public.schedule_shift(
  p_staff_profile_id uuid,
  p_shift_date date,
  p_shift_type text,
  p_start_time time,
  p_end_time time
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_shift_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.staff_profiles where id = p_staff_profile_id
  ) then
    raise exception 'Staff record not found' using errcode = '22023';
  end if;

  if p_shift_type not in ('morning', 'afternoon', 'night', 'off', 'on_call') then
    raise exception 'Unsupported shift type' using errcode = '22023';
  end if;

  if p_start_time is null or p_end_time is null or p_end_time <= p_start_time then
    raise exception 'The shift end time must be after the start time'
      using errcode = '22023';
  end if;

  insert into public.hr_shifts (
    staff_profile_id, shift_date, shift_type, start_time, end_time, created_by
  )
  values (
    p_staff_profile_id, p_shift_date, p_shift_type,
    p_start_time, p_end_time, v_actor
  )
  returning id into v_shift_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'hr.shift.schedule',
    'hr_shift',
    v_shift_id,
    'Scheduled a staff shift.',
    jsonb_build_object(
      'source', 'schedule_shift',
      'shift_date', p_shift_date,
      'shift_type', p_shift_type
    )
  );

  return v_shift_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- File a leave request
-- ----------------------------------------------------------------------------
create or replace function public.file_leave_request(
  p_staff_profile_id uuid,
  p_leave_type text,
  p_start_date date,
  p_end_date date,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_leave_id uuid;
  v_days numeric(5,1);
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.staff_profiles where id = p_staff_profile_id
  ) then
    raise exception 'Staff record not found' using errcode = '22023';
  end if;

  if p_leave_type not in (
    'vacation', 'sick', 'maternity', 'paternity', 'emergency', 'study'
  ) then
    raise exception 'Unsupported leave type' using errcode = '22023';
  end if;

  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'The leave end date must be on or after the start date'
      using errcode = '22023';
  end if;

  if v_reason = '' then
    raise exception 'A leave reason is required' using errcode = '22023';
  end if;

  v_days := (p_end_date - p_start_date) + 1;

  insert into public.hr_leave_requests (
    staff_profile_id, leave_type, start_date, end_date, days, reason, requested_by
  )
  values (
    p_staff_profile_id, p_leave_type, p_start_date, p_end_date,
    v_days, v_reason, v_actor
  )
  returning id into v_leave_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'hr.leave.file',
    'hr_leave_request',
    v_leave_id,
    'Filed a leave request.',
    jsonb_build_object(
      'source', 'file_leave_request',
      'leave_type', p_leave_type,
      'days', v_days
    )
  );

  return v_leave_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Review a leave request
-- ----------------------------------------------------------------------------
create or replace function public.review_leave_request(
  p_leave_id uuid,
  p_decision text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Unsupported leave decision' using errcode = '22023';
  end if;

  select status
  into v_status
  from public.hr_leave_requests
  where id = p_leave_id
  for update;

  if not found then
    raise exception 'Leave request not found' using errcode = '22023';
  end if;

  if v_status <> 'pending' then
    raise exception 'Only pending leave requests can be reviewed'
      using errcode = '22023';
  end if;

  update public.hr_leave_requests
  set status = p_decision,
      reviewed_by = v_actor,
      reviewed_at = now()
  where id = p_leave_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'hr.leave.review',
    'hr_leave_request',
    p_leave_id,
    'Reviewed a leave request.',
    jsonb_build_object('source', 'review_leave_request', 'decision', p_decision)
  );

  return p_leave_id;
end;
$$;

revoke all on function public.schedule_shift(uuid, date, text, time, time)
  from public;
revoke all on function public.file_leave_request(uuid, text, date, date, text)
  from public;
revoke all on function public.review_leave_request(uuid, text) from public;

grant execute on function public.schedule_shift(uuid, date, text, time, time)
  to authenticated, service_role;
grant execute on function public.file_leave_request(uuid, text, date, date, text)
  to authenticated, service_role;
grant execute on function public.review_leave_request(uuid, text)
  to authenticated, service_role;

-- ============================================================================
-- Overnight shifts (migration 038)
-- ============================================================================

-- ============================================================================
-- SPMC HMS —overnight shifts
-- Migration 038. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- A 23:00-07:00 night shift ends before it starts on the clock, so the original
-- ordering check rejected every overnight roster entry.

create or replace function public.schedule_shift(
  p_staff_profile_id uuid,
  p_shift_date date,
  p_shift_type text,
  p_start_time time,
  p_end_time time
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_shift_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.staff_profiles where id = p_staff_profile_id
  ) then
    raise exception 'Staff record not found' using errcode = '22023';
  end if;

  if p_shift_type not in ('morning', 'afternoon', 'night', 'off', 'on_call') then
    raise exception 'Unsupported shift type' using errcode = '22023';
  end if;

  if p_start_time is null or p_end_time is null then
    raise exception 'Shift start and end times are required'
      using errcode = '22023';
  end if;

  -- An end time earlier than the start time is a shift that crosses midnight.
  if p_end_time = p_start_time then
    raise exception 'Shift start and end times cannot be the same'
      using errcode = '22023';
  end if;

  insert into public.hr_shifts (
    staff_profile_id, shift_date, shift_type, start_time, end_time, created_by
  )
  values (
    p_staff_profile_id, p_shift_date, p_shift_type,
    p_start_time, p_end_time, v_actor
  )
  returning id into v_shift_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'hr.shift.schedule',
    'hr_shift',
    v_shift_id,
    'Scheduled a staff shift.',
    jsonb_build_object(
      'source', 'schedule_shift',
      'shift_date', p_shift_date,
      'shift_type', p_shift_type,
      'overnight', p_end_time < p_start_time
    )
  );

  return v_shift_id;
end;
$$;

revoke all on function public.schedule_shift(uuid, date, text, time, time)
  from public;

grant execute on function public.schedule_shift(uuid, date, text, time, time)
  to authenticated, service_role;

-- ============================================================================
-- Role permission matrix (migration 040)
-- ============================================================================

-- ============================================================================
-- SPMC HMS —role —permission matrix
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

-- ============================================================================
-- Storage buckets (migration 041)
-- ============================================================================

-- ============================================================================
-- SPMC HMS —storage buckets
-- Migration 041. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Private buckets for clinical attachments. Objects are namespaced by patient
-- and read through short-lived signed URLs; nothing is public.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'patient-documents',
    'patient-documents',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'laboratory-attachments',
    'laboratory-attachments',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'radiology-files',
    'radiology-files',
    false,
    52428800,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/dicom']
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Patient documents
-- ----------------------------------------------------------------------------
drop policy if exists "patient_documents_select" on storage.objects;
create policy "patient_documents_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'patient-documents'
  and public.has_permission('medical_record.view')
);

drop policy if exists "patient_documents_insert" on storage.objects;
create policy "patient_documents_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'patient-documents'
  and public.has_permission('medical_record.create')
);

drop policy if exists "patient_documents_delete" on storage.objects;
create policy "patient_documents_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'patient-documents'
  and public.has_permission('medical_record.update')
);

-- ----------------------------------------------------------------------------
-- Laboratory attachments
-- ----------------------------------------------------------------------------
drop policy if exists "laboratory_attachments_select" on storage.objects;
create policy "laboratory_attachments_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'laboratory-attachments'
  and public.has_permission('laboratory.view')
);

drop policy if exists "laboratory_attachments_insert" on storage.objects;
create policy "laboratory_attachments_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'laboratory-attachments'
  and public.has_permission('laboratory.result.create')
);

-- ----------------------------------------------------------------------------
-- Radiology files
-- ----------------------------------------------------------------------------
drop policy if exists "radiology_files_select" on storage.objects;
create policy "radiology_files_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'radiology-files'
  and public.has_permission('radiology.view')
);

drop policy if exists "radiology_files_insert" on storage.objects;
create policy "radiology_files_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'radiology-files'
  and public.has_permission('radiology.report.create')
);

-- ============================================================================
-- Realtime publication completion (migration 042)
-- ============================================================================

-- ============================================================================
-- SPMC HMS —realtime publication completion
-- Migration 042. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Migration 039 published the operational tables that existed at the time.
-- Payments and stock movements complete the SUPABASE.MD §25 list.

do $$
declare
  v_table text;
begin
  foreach v_table in array array['payments', 'stock_transactions']
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        v_table
      );
    end if;
  end loop;
end;
$$;

-- ============================================================================
-- Reject past-dated appointments (migration 043)
-- ============================================================================

-- ============================================================================
-- SPMC HMS —reject past-dated appointments
-- Migration 043. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- create_appointment accepted any timestamp, so an appointment could be
-- scheduled in the past. It now requires a future slot.

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

  if p_scheduled_at < now() then
    raise exception 'Appointments cannot be scheduled in the past'
      using errcode = '22023';
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
    'Scheduled an appointment.',
    jsonb_build_object(
      'source', 'create_appointment',
      'appointment_number', v_appointment_number,
      'scheduled_at', p_scheduled_at
    )
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

-- ============================================================================
-- Insurance and PhilHealth (migration 044)
-- ============================================================================

-- ============================================================================
-- SPMC HMS —insurance and PhilHealth
-- Migration 044. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Manual insurance workflow: policies, eligibility checks, authorizations,
-- claims with lines and events. No payer integration exists, so every status
-- change is recorded by staff.

create table if not exists public.insurance_providers (
  id uuid primary key default gen_random_uuid(),

  name text not null unique,
  code text not null unique,
  type text not null
    check (type in ('philhealth', 'private_hmo', 'private_insurer', 'government')),
  contact_number text,
  integration_status text not null default 'manual'
    check (integration_status in ('not_connected', 'manual', 'connected')),
  is_active boolean not null default true,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.insurance_policies (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null references public.patients(id) on delete restrict,
  provider_id uuid not null
    references public.insurance_providers(id) on delete restrict,

  policy_number text not null,
  member_number text not null,
  coverage_type text not null,

  effective_date date not null,
  expiry_date date not null,

  status text not null default 'active'
    check (status in ('active', 'expired', 'pending', 'cancelled')),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified', 'failed')),
  last_verified_at timestamptz,

  notes text,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (provider_id, policy_number),
  check (expiry_date >= effective_date)
);

create table if not exists public.coverage_verifications (
  id uuid primary key default gen_random_uuid(),

  policy_id uuid not null
    references public.insurance_policies(id) on delete cascade,

  status text not null check (status in ('verified', 'failed')),
  reference_number text not null,
  verified_at timestamptz not null default now(),
  verified_by uuid not null references public.profiles(id) on delete restrict,
  notes text
);

create table if not exists public.authorization_requests (
  id uuid primary key default gen_random_uuid(),

  authorization_number text not null unique,

  patient_id uuid not null references public.patients(id) on delete restrict,
  provider_id uuid not null
    references public.insurance_providers(id) on delete restrict,
  policy_id uuid not null
    references public.insurance_policies(id) on delete restrict,

  procedure_name text not null,
  diagnosis text not null,

  requested_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied', 'expired')),
  reference_number text,
  approved_at timestamptz,
  valid_until date,

  notes text,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.insurance_claims (
  id uuid primary key default gen_random_uuid(),

  claim_number text not null unique,

  patient_id uuid not null references public.patients(id) on delete restrict,
  provider_id uuid not null
    references public.insurance_providers(id) on delete restrict,
  policy_id uuid not null
    references public.insurance_policies(id) on delete restrict,
  authorization_id uuid
    references public.authorization_requests(id) on delete restrict,

  claim_type text not null,
  diagnosis text not null,

  total_charged numeric(12,2) not null default 0 check (total_charged >= 0),
  amount_claimed numeric(12,2) not null default 0 check (amount_claimed >= 0),
  amount_approved numeric(12,2) not null default 0 check (amount_approved >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),

  status text not null default 'draft'
    check (status in (
      'draft', 'prepared', 'submitted', 'in_review',
      'approved', 'partially_approved', 'rejected', 'paid'
    )),

  submitted_at timestamptz,
  adjudicated_at timestamptz,
  paid_at timestamptz,
  notes text,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.insurance_claim_lines (
  id uuid primary key default gen_random_uuid(),

  claim_id uuid not null
    references public.insurance_claims(id) on delete cascade,

  description text not null,
  quantity numeric not null default 1 check (quantity > 0),
  unit_amount numeric(12,2) not null default 0 check (unit_amount >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0)
);

create table if not exists public.insurance_claim_events (
  id uuid primary key default gen_random_uuid(),

  claim_id uuid not null
    references public.insurance_claims(id) on delete cascade,

  event_type text not null,
  description text not null,
  actor_id uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.insurance_benefits (
  id uuid primary key default gen_random_uuid(),

  provider_id uuid not null
    references public.insurance_providers(id) on delete cascade,

  name text not null,
  coverage_type text not null,
  case_rate numeric(12,2) not null default 0 check (case_rate >= 0),
  description text,
  is_active boolean not null default true,

  created_at timestamptz not null default now()
);

create index if not exists idx_insurance_policies_patient
  on public.insurance_policies(patient_id, status);
create index if not exists idx_insurance_claims_policy
  on public.insurance_claims(policy_id, status);
create index if not exists idx_claims_status_amount
  on public.insurance_claims(status, amount_claimed);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('insurance.view', 'View policies, verifications, authorizations and claims.'),
  ('insurance.manage', 'Verify coverage and prepare or review claims.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug in ('insurance.view', 'insurance.manage')
where r.slug in ('hospital_admin', 'billing_staff')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'insurance.view'
where r.slug in ('physician', 'nurse', 'receptionist')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'insurance_providers',
    'insurance_policies',
    'coverage_verifications',
    'authorization_requests',
    'insurance_claims',
    'insurance_claim_lines',
    'insurance_claim_events',
    'insurance_benefits'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''insurance.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Verify coverage
-- ----------------------------------------------------------------------------
create or replace function public.verify_coverage(
  p_policy_id uuid,
  p_status text,
  p_reference_number text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_policy public.insurance_policies%rowtype;
  v_verification_id uuid;
  v_reference text := btrim(coalesce(p_reference_number, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('insurance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_status not in ('verified', 'failed') then
    raise exception 'Unsupported verification status' using errcode = '22023';
  end if;

  if v_reference = '' then
    raise exception 'A payer reference number is required'
      using errcode = '22023';
  end if;

  select *
  into v_policy
  from public.insurance_policies
  where id = p_policy_id
  for update;

  if not found then
    raise exception 'Insurance policy not found' using errcode = '22023';
  end if;

  insert into public.coverage_verifications (
    policy_id, status, reference_number, verified_by, notes
  )
  values (
    p_policy_id,
    p_status,
    v_reference,
    v_actor,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_verification_id;

  update public.insurance_policies
  set verification_status = p_status,
      last_verified_at = now(),
      updated_by = v_actor
  where id = p_policy_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'insurance.coverage.verify',
    'insurance_policy',
    p_policy_id,
    'Recorded a coverage verification.',
    jsonb_build_object(
      'source', 'verify_coverage',
      'status', p_status,
      'reference_number', v_reference
    )
  );

  return v_verification_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Create a claim
-- ----------------------------------------------------------------------------
create or replace function public.create_claim(
  p_policy_id uuid,
  p_claim_type text,
  p_diagnosis text,
  p_total_charged numeric,
  p_amount_claimed numeric,
  p_lines jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_policy public.insurance_policies%rowtype;
  v_claim_id uuid;
  v_claim_number text;
  v_item jsonb;
  v_quantity numeric;
  v_unit numeric;
  v_line jsonb;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('insurance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select *
  into v_policy
  from public.insurance_policies
  where id = p_policy_id;

  if not found then
    raise exception 'Insurance policy not found' using errcode = '22023';
  end if;

  if v_policy.status <> 'active' then
    raise exception 'Only active policies can be claimed against'
      using errcode = '22023';
  end if;

  if btrim(coalesce(p_claim_type, '')) = ''
    or btrim(coalesce(p_diagnosis, '')) = '' then
    raise exception 'Claim type and diagnosis are required'
      using errcode = '22023';
  end if;

  if p_total_charged is null
    or p_amount_claimed is null
    or p_total_charged <= 0
    or p_amount_claimed <= 0 then
    raise exception 'Claim amounts must be greater than zero'
      using errcode = '22023';
  end if;

  if p_amount_claimed > p_total_charged then
    raise exception 'The claimed amount cannot exceed the total charged'
      using errcode = '22023';
  end if;

  v_claim_number := public.generate_reference_number('CLM');

  insert into public.insurance_claims (
    claim_number,
    patient_id,
    provider_id,
    policy_id,
    claim_type,
    diagnosis,
    total_charged,
    amount_claimed,
    status,
    created_by
  )
  values (
    v_claim_number,
    v_policy.patient_id,
    v_policy.provider_id,
    p_policy_id,
    btrim(p_claim_type),
    btrim(p_diagnosis),
    round(p_total_charged, 2),
    round(p_amount_claimed, 2),
    'prepared',
    v_actor
  )
  returning id into v_claim_id;

  if p_lines is not null and jsonb_typeof(p_lines) = 'array' then
    for v_item in select * from jsonb_array_elements(p_lines) loop
      v_quantity := coalesce((v_item->>'quantity')::numeric, 1);
      v_unit := round(coalesce((v_item->>'unit_amount')::numeric, 0), 2);

      if v_quantity > 0 and v_unit >= 0 then
        insert into public.insurance_claim_lines (
          claim_id, description, quantity, unit_amount, line_total
        )
        values (
          v_claim_id,
          btrim(coalesce(v_item->>'description', 'Charge')),
          v_quantity,
          v_unit,
          round(v_quantity * v_unit, 2)
        );
      end if;
    end loop;
  end if;

  insert into public.insurance_claim_events (
    claim_id, event_type, description, actor_id
  )
  values (
    v_claim_id, 'created', 'Claim prepared from the insurance workspace.', v_actor
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'insurance.claim.create',
    'insurance_claim',
    v_claim_id,
    'Prepared an insurance claim.',
    jsonb_build_object(
      'source', 'create_claim',
      'claim_number', v_claim_number,
      'amount_claimed', round(p_amount_claimed, 2)
    )
  );

  return v_claim_id;
end;
$$;

revoke all on function public.verify_coverage(uuid, text, text, text) from public;
revoke all on function public.create_claim(
  uuid, text, text, numeric, numeric, jsonb
) from public;

grant execute on function public.verify_coverage(uuid, text, text, text)
  to authenticated, service_role;
grant execute on function public.create_claim(
  uuid, text, text, numeric, numeric, jsonb
) to authenticated, service_role;

-- ============================================================================
-- Blood bank (migration 045)
-- ============================================================================

-- ============================================================================
-- SPMC HMS —blood bank
-- Migration 045. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Donor —donation —unit —screening —request —crossmatch —issue —-- transfusion. Issuing a unit requires a compatible crossmatch, passed
-- screening and an unexpired unit; those rules live in issue_blood_unit.

create table if not exists public.blood_donors (
  id uuid primary key default gen_random_uuid(),

  donor_number text not null unique,
  full_name text not null,
  date_of_birth date not null,
  sex text not null,
  blood_type text not null
    check (blood_type in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  contact_number text,
  address text,

  eligibility_status text not null default 'eligible'
    check (eligibility_status in ('eligible', 'deferred', 'inactive')),
  last_donation_date date,
  total_donations integer not null default 0 check (total_donations >= 0),
  notes text,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blood_donations (
  id uuid primary key default gen_random_uuid(),

  donation_number text not null unique,
  donor_id uuid not null references public.blood_donors(id) on delete restrict,

  donation_date date not null default current_date,
  blood_type text not null
    check (blood_type in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units_collected integer not null default 1 check (units_collected > 0),
  collection_site text not null default 'Blood bank',
  status text not null default 'collected'
    check (status in ('collected', 'tested', 'released', 'discarded')),
  notes text,

  created_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.blood_units (
  id uuid primary key default gen_random_uuid(),

  unit_number text not null unique,
  donation_id uuid not null
    references public.blood_donations(id) on delete restrict,
  donor_id uuid not null references public.blood_donors(id) on delete restrict,

  blood_type text not null
    check (blood_type in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  component text not null
    check (component in ('whole_blood', 'packed_rbc', 'plasma', 'platelets', 'cryoprecipitate')),

  collection_date date not null,
  expiry_date date not null,
  status text not null default 'available'
    check (status in ('available', 'reserved', 'crossmatched', 'issued', 'discarded', 'expired')),
  storage_location text not null default 'Blood bank refrigerator',
  screening_status text not null default 'pending'
    check (screening_status in ('pending', 'passed', 'failed')),
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (expiry_date > collection_date)
);

create table if not exists public.blood_screenings (
  id uuid primary key default gen_random_uuid(),

  unit_id uuid not null references public.blood_units(id) on delete cascade,

  test_name text not null,
  result text not null default 'pending'
    check (result in ('pending', 'negative', 'positive')),
  tested_at timestamptz,
  tested_by uuid references public.profiles(id) on delete restrict,
  notes text,

  created_at timestamptz not null default now()
);

create table if not exists public.blood_requests (
  id uuid primary key default gen_random_uuid(),

  request_number text not null unique,
  patient_id uuid not null references public.patients(id) on delete restrict,

  blood_type text not null
    check (blood_type in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  component text not null
    check (component in ('whole_blood', 'packed_rbc', 'plasma', 'platelets', 'cryoprecipitate')),

  units_requested integer not null check (units_requested > 0),
  units_fulfilled integer not null default 0 check (units_fulfilled >= 0),

  priority text not null default 'routine'
    check (priority in ('routine', 'urgent', 'emergency')),
  status text not null default 'pending'
    check (status in ('pending', 'reserved', 'crossmatched', 'issued', 'completed', 'cancelled')),

  department_id uuid references public.departments(id) on delete restrict,
  required_by timestamp with time zone not null default now(),
  notes text,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (units_fulfilled <= units_requested)
);

create table if not exists public.blood_crossmatches (
  id uuid primary key default gen_random_uuid(),

  request_id uuid not null references public.blood_requests(id) on delete cascade,
  unit_id uuid not null references public.blood_units(id) on delete restrict,

  result text not null default 'pending'
    check (result in ('pending', 'compatible', 'incompatible')),
  crossmatched_at timestamptz,
  crossmatched_by uuid references public.profiles(id) on delete restrict,
  notes text,

  created_at timestamptz not null default now(),

  unique (request_id, unit_id)
);

create table if not exists public.blood_issues (
  id uuid primary key default gen_random_uuid(),

  request_id uuid not null references public.blood_requests(id) on delete restrict,
  unit_id uuid not null references public.blood_units(id) on delete restrict,

  issued_at timestamptz not null default now(),
  issued_by uuid not null references public.profiles(id) on delete restrict,
  received_by_name text not null,
  notes text,

  unique (unit_id)
);

create table if not exists public.transfusion_records (
  id uuid primary key default gen_random_uuid(),

  request_id uuid not null references public.blood_requests(id) on delete restrict,
  unit_id uuid not null references public.blood_units(id) on delete restrict,

  transfused_at timestamptz not null default now(),
  transfused_by uuid not null references public.profiles(id) on delete restrict,
  reaction_severity text not null default 'none'
    check (reaction_severity in ('none', 'mild', 'moderate', 'severe')),
  reaction_notes text,

  unique (unit_id)
);

create index if not exists idx_blood_units_status
  on public.blood_units(status, expiry_date);
create index if not exists idx_blood_requests_status
  on public.blood_requests(status, priority);
create index if not exists idx_crossmatches_request
  on public.blood_crossmatches(request_id, result);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('blood_bank.view', 'View donors, units, requests and transfusions.'),
  ('blood_bank.manage', 'Register donations, screen units and crossmatch.'),
  ('blood_bank.issue', 'Issue blood units for transfusion.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('blood_bank.view', 'blood_bank.manage', 'blood_bank.issue')
where r.slug = 'hospital_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('blood_bank.view', 'blood_bank.manage')
where r.slug = 'laboratory_staff'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug in ('blood_bank.view', 'blood_bank.issue')
where r.slug = 'nurse'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'blood_bank.view'
where r.slug = 'physician'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'blood_donors',
    'blood_donations',
    'blood_units',
    'blood_screenings',
    'blood_requests',
    'blood_crossmatches',
    'blood_issues',
    'transfusion_records'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''blood_bank.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Record a donation and mint its units
-- ----------------------------------------------------------------------------
create or replace function public.record_blood_donation(
  p_donor_id uuid,
  p_units integer default 1,
  p_collection_site text default 'Blood bank',
  p_component text default 'whole_blood',
  p_expiry_days integer default 35
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_donor public.blood_donors%rowtype;
  v_donation_id uuid;
  v_donation_number text;
  v_unit_number text;
  v_index integer;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('blood_bank.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_donor
  from public.blood_donors
  where id = p_donor_id
  for update;

  if not found then
    raise exception 'Blood donor not found' using errcode = '22023';
  end if;

  if v_donor.eligibility_status <> 'eligible' then
    raise exception 'Only eligible donors can donate' using errcode = '22023';
  end if;

  if p_units is null or p_units < 1 or p_units > 4 then
    raise exception 'Units collected must be between 1 and 4'
      using errcode = '22023';
  end if;

  if p_component not in (
    'whole_blood', 'packed_rbc', 'plasma', 'platelets', 'cryoprecipitate'
  ) then
    raise exception 'Unsupported blood component' using errcode = '22023';
  end if;

  if p_expiry_days is null or p_expiry_days < 1 then
    raise exception 'Expiry days must be at least 1' using errcode = '22023';
  end if;

  v_donation_number := public.generate_reference_number('BDN');

  insert into public.blood_donations (
    donation_number, donor_id, blood_type, units_collected,
    collection_site, status, created_by
  )
  values (
    v_donation_number, p_donor_id, v_donor.blood_type, p_units,
    coalesce(nullif(btrim(p_collection_site), ''), 'Blood bank'),
    'collected', v_actor
  )
  returning id into v_donation_id;

  for v_index in 1..p_units loop
    v_unit_number := public.generate_reference_number('BU');

    insert into public.blood_units (
      unit_number, donation_id, donor_id, blood_type, component,
      collection_date, expiry_date, status, screening_status
    )
    values (
      v_unit_number,
      v_donation_id,
      p_donor_id,
      v_donor.blood_type,
      p_component::text,
      current_date,
      current_date + p_expiry_days,
      'available',
      'pending'
    );
  end loop;

  update public.blood_donors
  set last_donation_date = current_date,
      total_donations = total_donations + 1,
      updated_by = v_actor
  where id = p_donor_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'blood_bank.donation.record',
    'blood_donation',
    v_donation_id,
    'Recorded a blood donation.',
    jsonb_build_object(
      'source', 'record_blood_donation',
      'donation_number', v_donation_number,
      'units', p_units,
      'component', p_component
    )
  );

  return v_donation_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Crossmatch a unit against a request
-- ----------------------------------------------------------------------------
create or replace function public.crossmatch_blood_unit(
  p_request_id uuid,
  p_unit_id uuid,
  p_result text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_unit public.blood_units%rowtype;
  v_request public.blood_requests%rowtype;
  v_crossmatch_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('blood_bank.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_result not in ('compatible', 'incompatible') then
    raise exception 'Unsupported crossmatch result' using errcode = '22023';
  end if;

  select * into v_request
  from public.blood_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Blood request not found' using errcode = '22023';
  end if;

  if v_request.status in ('completed', 'cancelled') then
    raise exception 'This request is closed' using errcode = '22023';
  end if;

  select * into v_unit
  from public.blood_units
  where id = p_unit_id
  for update;

  if not found then
    raise exception 'Blood unit not found' using errcode = '22023';
  end if;

  if v_unit.status not in ('available', 'reserved', 'crossmatched') then
    raise exception 'This unit cannot be crossmatched in its current state'
      using errcode = '22023';
  end if;

  if v_unit.screening_status <> 'passed' then
    raise exception 'The unit must pass screening before crossmatching'
      using errcode = '22023';
  end if;

  if v_unit.expiry_date <= current_date then
    raise exception 'The unit has expired' using errcode = '22023';
  end if;

  insert into public.blood_crossmatches (
    request_id, unit_id, result, crossmatched_at, crossmatched_by
  )
  values (p_request_id, p_unit_id, p_result, now(), v_actor)
  on conflict (request_id, unit_id) do update
  set result = excluded.result,
      crossmatched_at = excluded.crossmatched_at,
      crossmatched_by = excluded.crossmatched_by
  returning id into v_crossmatch_id;

  update public.blood_units
  set status = case
        when p_result = 'compatible' then 'crossmatched'::text
        else 'available'::text
      end,
      updated_at = now()
  where id = p_unit_id;

  if p_result = 'compatible' then
    update public.blood_requests
    set status = 'crossmatched',
        updated_by = v_actor
    where id = p_request_id
      and status in ('pending', 'reserved');
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'blood_bank.crossmatch',
    'blood_crossmatch',
    v_crossmatch_id,
    'Recorded a crossmatch result.',
    jsonb_build_object(
      'source', 'crossmatch_blood_unit',
      'result', p_result,
      'request_id', p_request_id,
      'unit_id', p_unit_id
    )
  );

  return v_crossmatch_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Issue a screened, compatible, unexpired unit
-- ----------------------------------------------------------------------------
create or replace function public.issue_blood_unit(
  p_request_id uuid,
  p_unit_id uuid,
  p_received_by text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_unit public.blood_units%rowtype;
  v_request public.blood_requests%rowtype;
  v_crossmatch public.blood_crossmatches%rowtype;
  v_issue_id uuid;
  v_fulfilled integer;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('blood_bank.issue') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if btrim(coalesce(p_received_by, '')) = '' then
    raise exception 'Record who received the unit' using errcode = '22023';
  end if;

  select * into v_request
  from public.blood_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Blood request not found' using errcode = '22023';
  end if;

  if v_request.status in ('completed', 'cancelled') then
    raise exception 'This request is closed' using errcode = '22023';
  end if;

  select * into v_unit
  from public.blood_units
  where id = p_unit_id
  for update;

  if not found then
    raise exception 'Blood unit not found' using errcode = '22023';
  end if;

  if v_unit.status in ('issued', 'discarded', 'expired') then
    raise exception 'This unit cannot be issued' using errcode = '22023';
  end if;

  if v_unit.screening_status <> 'passed' then
    raise exception 'The unit must pass screening before issue'
      using errcode = '22023';
  end if;

  if v_unit.expiry_date <= current_date then
    raise exception 'The unit has expired' using errcode = '22023';
  end if;

  select * into v_crossmatch
  from public.blood_crossmatches
  where request_id = p_request_id
    and unit_id = p_unit_id
  order by created_at desc
  limit 1;

  if not found or v_crossmatch.result <> 'compatible' then
    raise exception 'A compatible crossmatch is required before issue'
      using errcode = '22023';
  end if;

  insert into public.blood_issues (
    request_id, unit_id, issued_by, received_by_name, notes
  )
  values (
    p_request_id, p_unit_id, v_actor, btrim(p_received_by),
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_issue_id;

  update public.blood_units
  set status = 'issued',
      updated_at = now()
  where id = p_unit_id;

  v_fulfilled := v_request.units_fulfilled + 1;

  update public.blood_requests
  set units_fulfilled = v_fulfilled,
      status = case
        when v_fulfilled >= units_requested then 'completed'::text
        else 'issued'::text
      end,
      updated_by = v_actor
  where id = p_request_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'blood_bank.issue',
    'blood_issue',
    v_issue_id,
    'Issued a blood unit.',
    jsonb_build_object(
      'source', 'issue_blood_unit',
      'request_id', p_request_id,
      'unit_id', p_unit_id,
      'units_fulfilled', v_fulfilled
    )
  );

  return v_issue_id;
end;
$$;

revoke all on function public.record_blood_donation(
  uuid, integer, text, text, integer
) from public;
revoke all on function public.crossmatch_blood_unit(uuid, uuid, text) from public;
revoke all on function public.issue_blood_unit(uuid, uuid, text, text) from public;

grant execute on function public.record_blood_donation(
  uuid, integer, text, text, integer
) to authenticated, service_role;
grant execute on function public.crossmatch_blood_unit(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.issue_blood_unit(uuid, uuid, text, text) to authenticated, service_role;

-- ============================================================================
-- Blood bank intake (migration 046)
-- ============================================================================

-- ============================================================================
-- SPMC HMS —blood bank intake
-- Migration 046. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Donor registration, blood requests and unit screening complete the chain
-- that record_blood_donation / crossmatch_blood_unit / issue_blood_unit use.

create or replace function public.register_blood_donor(
  p_full_name text,
  p_date_of_birth date,
  p_sex text,
  p_blood_type text,
  p_contact_number text default null,
  p_address text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_donor_id uuid;
  v_donor_number text;
  v_name text := btrim(coalesce(p_full_name, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('blood_bank.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_name = '' then
    raise exception 'Donor name is required' using errcode = '22023';
  end if;

  if p_date_of_birth is null or p_date_of_birth >= current_date then
    raise exception 'Enter a valid date of birth' using errcode = '22023';
  end if;

  if p_blood_type not in ('A+','A-','B+','B-','AB+','AB-','O+','O-') then
    raise exception 'Unsupported blood type' using errcode = '22023';
  end if;

  v_donor_number := public.generate_reference_number('BD');

  insert into public.blood_donors (
    donor_number, full_name, date_of_birth, sex, blood_type,
    contact_number, address, created_by
  )
  values (
    v_donor_number,
    v_name,
    p_date_of_birth,
    coalesce(nullif(btrim(p_sex), ''), 'Unspecified'),
    p_blood_type,
    nullif(btrim(coalesce(p_contact_number, '')), ''),
    nullif(btrim(coalesce(p_address, '')), ''),
    v_actor
  )
  returning id into v_donor_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'blood_bank.donor.register',
    'blood_donor',
    v_donor_id,
    'Registered a blood donor.',
    jsonb_build_object(
      'source', 'register_blood_donor',
      'donor_number', v_donor_number,
      'blood_type', p_blood_type
    )
  );

  return v_donor_id;
end;
$$;

create or replace function public.create_blood_request(
  p_patient_id uuid,
  p_blood_type text,
  p_component text,
  p_units_requested integer,
  p_priority text default 'routine',
  p_required_by timestamp with time zone default null,
  p_department_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_request_id uuid;
  v_request_number text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('blood_bank.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if p_blood_type not in ('A+','A-','B+','B-','AB+','AB-','O+','O-') then
    raise exception 'Unsupported blood type' using errcode = '22023';
  end if;

  if p_component not in (
    'whole_blood', 'packed_rbc', 'plasma', 'platelets', 'cryoprecipitate'
  ) then
    raise exception 'Unsupported blood component' using errcode = '22023';
  end if;

  if p_units_requested is null or p_units_requested < 1
    or p_units_requested > 10 then
    raise exception 'Units requested must be between 1 and 10'
      using errcode = '22023';
  end if;

  if p_priority not in ('routine', 'urgent', 'emergency') then
    raise exception 'Unsupported request priority' using errcode = '22023';
  end if;

  v_request_number := public.generate_reference_number('BR');

  insert into public.blood_requests (
    request_number, patient_id, blood_type, component,
    units_requested, priority, department_id, required_by, notes, created_by
  )
  values (
    v_request_number,
    p_patient_id,
    p_blood_type,
    p_component,
    p_units_requested,
    p_priority,
    p_department_id,
    coalesce(p_required_by, now() + interval '4 hours'),
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_request_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'blood_bank.request.create',
    'blood_request',
    v_request_id,
    'Created a blood request.',
    jsonb_build_object(
      'source', 'create_blood_request',
      'request_number', v_request_number,
      'units_requested', p_units_requested,
      'priority', p_priority
    )
  );

  return v_request_id;
end;
$$;

create or replace function public.screen_blood_unit(
  p_unit_id uuid,
  p_result text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_unit public.blood_units%rowtype;
  v_screening_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('blood_bank.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_result not in ('pending', 'negative', 'positive') then
    raise exception 'Unsupported screening result' using errcode = '22023';
  end if;

  select * into v_unit
  from public.blood_units
  where id = p_unit_id
  for update;

  if not found then
    raise exception 'Blood unit not found' using errcode = '22023';
  end if;

  if v_unit.status in ('issued', 'discarded') then
    raise exception 'This unit is already closed' using errcode = '22023';
  end if;

  insert into public.blood_screenings (
    unit_id, test_name, result, tested_at, tested_by, notes
  )
  values (
    p_unit_id,
    'Infectious disease panel',
    p_result,
    now(),
    v_actor,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_screening_id;

  update public.blood_units
  set screening_status = case
        when p_result = 'positive' then 'failed'
        when p_result = 'negative' then 'passed'
        else 'pending'
      end,
      status = case
        when p_result = 'positive' then 'discarded'::text
        else status
      end,
      updated_at = now()
  where id = p_unit_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'blood_bank.unit.screen',
    'blood_unit',
    p_unit_id,
    'Recorded a blood unit screening.',
    jsonb_build_object(
      'source', 'screen_blood_unit',
      'result', p_result
    )
  );

  return v_screening_id;
end;
$$;

revoke all on function public.register_blood_donor(
  text, date, text, text, text, text
) from public;
revoke all on function public.create_blood_request(
  uuid, text, text, integer, text, timestamptz, uuid, text
) from public;
revoke all on function public.screen_blood_unit(uuid, text, text) from public;

grant execute on function public.register_blood_donor(
  text, date, text, text, text, text
) to authenticated, service_role;
grant execute on function public.create_blood_request(
  uuid, text, text, integer, text, timestamptz, uuid, text
) to authenticated, service_role;
grant execute on function public.screen_blood_unit(uuid, text, text)
  to authenticated, service_role;

-- Privileged Edge Function operations and their transactional audit records.
create function public.check_edge_account_target(p_actor uuid, p_target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_super boolean;
begin
  -- Serialize account and role changes issued through the administrative APIs.
  perform pg_catalog.pg_advisory_xact_lock(618371524);

  select pg_catalog.bool_or(r.slug = 'super_admin')
  into v_super
  from public.profiles p
  join public.user_roles ur on ur.user_id = p.id
  join public.roles r on r.id = ur.role_id
  where p.id = p_actor and p.is_active
    and r.slug in ('super_admin', 'hospital_admin');

  if v_super is null or p_target = p_actor then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_target is null then
    return;
  end if;

  if not exists (select 1 from public.profiles where id = p_target) then
    raise exception 'Account not found' using errcode = 'P0002';
  end if;

  if not v_super and exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_target and r.slug in ('super_admin', 'hospital_admin')
  ) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;
end;
$$;

create function public.audit_edge_auth_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_active boolean;
  v_profile_active boolean;
begin
  if tg_name = 'audit_edge_auth_creation' and new.raw_app_meta_data ? 'hms_create_actor' then
    v_actor := (new.raw_app_meta_data->>'hms_create_actor')::uuid;
    perform public.check_edge_account_target(v_actor, null);
    new.raw_app_meta_data := new.raw_app_meta_data - 'hms_create_actor';

    insert into public.audit_logs (actor_id, action, entity_type, entity_id)
    values (v_actor, 'user.create', 'profile', new.id);
  elsif tg_name = 'audit_edge_auth_status' and new.raw_app_meta_data ? 'hms_status_actor' then
    v_actor := (new.raw_app_meta_data->>'hms_status_actor')::uuid;
    perform public.check_edge_account_target(v_actor, new.id);
    new.raw_app_meta_data := new.raw_app_meta_data - 'hms_status_actor';
    v_active := not coalesce(new.banned_until > now(), false);

    select is_active into v_profile_active from public.profiles where id = new.id for update;
    if v_active = v_profile_active
      and v_active = not coalesce(old.banned_until > now(), false) then
      -- A deactivation retry does not extend an already recorded ban.
      new.banned_until := old.banned_until;
      return new;
    end if;

    update public.profiles set is_active = v_active where id = new.id;
    insert into public.audit_logs (actor_id, action, entity_type, entity_id)
    values (
      v_actor,
      case when v_active then 'user.activate' else 'user.deactivate' end,
      'profile',
      new.id
    );
  end if;

  return new;
end;
$$;

-- GoTrue writes administrative app metadata separately from the insert and ban.
create trigger audit_edge_auth_creation
before insert or update of raw_app_meta_data on auth.users
for each row execute function public.audit_edge_auth_change();

create trigger audit_edge_auth_status
before update of banned_until on auth.users
for each row execute function public.audit_edge_auth_change();

create function public.protect_profile_active()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and new.is_active is distinct from old.is_active then
    raise exception 'Use the administrative account operation' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger protect_profile_active
before update of is_active on public.profiles
for each row execute function public.protect_profile_active();

create function public.set_edge_user_role(p_target uuid, p_role uuid, p_grant boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_changed boolean;
begin
  if p_target is null or p_role is null or p_grant is null then
    raise exception 'Invalid role assignment' using errcode = '22023';
  end if;

  perform public.check_edge_account_target(v_actor, p_target);
  select slug into v_role from public.roles where id = p_role for share;
  if not found then
    raise exception 'Role not found' using errcode = 'P0002';
  end if;

  if v_role in ('super_admin', 'hospital_admin') and not public.has_role('super_admin') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_grant then
    insert into public.user_roles (user_id, role_id, granted_by)
    values (p_target, p_role, v_actor)
    on conflict (user_id, role_id) do nothing;
  else
    delete from public.user_roles where user_id = p_target and role_id = p_role;
  end if;
  v_changed := found;

  if v_changed then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      v_actor,
      case when p_grant then 'role.grant' else 'role.revoke' end,
      'profile',
      p_target,
      jsonb_build_object('role_id', p_role, 'role_slug', v_role)
    );
  end if;

  return v_changed;
end;
$$;

create function public.expire_insurance_policies()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.insurance_policies
  set status = 'expired'
  where status = 'active' and expiry_date < (now() at time zone 'Asia/Manila')::date;
  get diagnostics v_count = row_count;

  if v_count > 0 then
    insert into public.audit_logs (action, entity_type, metadata)
    values ('insurance.expire', 'insurance_policy', jsonb_build_object('count', v_count));
  end if;

  return v_count;
end;
$$;

revoke all on function public.check_edge_account_target(uuid, uuid) from public, anon, authenticated;
grant execute on function public.check_edge_account_target(uuid, uuid) to service_role;

revoke all on function public.audit_edge_auth_change() from public, anon, authenticated;
revoke all on function public.protect_profile_active() from public, anon, authenticated;

revoke insert, update, delete on public.user_roles from public, anon, authenticated;
revoke all on function public.set_edge_user_role(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_edge_user_role(uuid, uuid, boolean) to authenticated;

revoke all on function public.expire_insurance_policies() from public, anon, authenticated;
grant execute on function public.expire_insurance_policies() to service_role;

-- An SMTP reply can be lost after the provider accepts a message. Keep a
-- durable claim so concurrent calls and retries cannot send it a second time.
create table public.notification_email_deliveries (
  notification_id uuid primary key references public.notifications(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.notification_email_deliveries enable row level security;
revoke all on table public.notification_email_deliveries from public, anon, authenticated;
grant select, insert, update, delete on public.notification_email_deliveries to service_role;

-- ============================================================================
-- Insurance intake (migration 20261119000100)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — insurance intake
-- Migration 047. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- The insurance module could verify coverage and prepare claims, but there was
-- no way to register a payer or a patient policy, so every policy had to be
-- inserted by hand.

create or replace function public.create_insurance_provider(
  p_name text,
  p_code text,
  p_type text,
  p_contact_number text default null,
  p_integration_status text default 'manual'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_provider_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_code text := upper(btrim(coalesce(p_code, '')));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('insurance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_name = '' or v_code = '' then
    raise exception 'Provider name and code are required'
      using errcode = '22023';
  end if;

  if p_type not in ('philhealth', 'private_hmo', 'private_insurer', 'government') then
    raise exception 'Unsupported provider type' using errcode = '22023';
  end if;

  if p_integration_status not in ('not_connected', 'manual', 'connected') then
    raise exception 'Unsupported integration status' using errcode = '22023';
  end if;

  insert into public.insurance_providers (
    name, code, type, contact_number, integration_status, created_by
  )
  values (
    v_name,
    v_code,
    p_type,
    nullif(btrim(coalesce(p_contact_number, '')), ''),
    p_integration_status,
    v_actor
  )
  returning id into v_provider_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'insurance.provider.create',
    'insurance_provider',
    v_provider_id,
    'Registered an insurance provider.',
    jsonb_build_object('source', 'create_insurance_provider', 'code', v_code)
  );

  return v_provider_id;
end;
$$;

create or replace function public.create_insurance_policy(
  p_patient_id uuid,
  p_provider_id uuid,
  p_policy_number text,
  p_member_number text,
  p_coverage_type text,
  p_effective_date date,
  p_expiry_date date,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_policy_id uuid;
  v_policy_number text := btrim(coalesce(p_policy_number, ''));
  v_member_number text := btrim(coalesce(p_member_number, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('insurance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.insurance_providers where id = p_provider_id
  ) then
    raise exception 'Insurance provider not found' using errcode = '22023';
  end if;

  if v_policy_number = '' or v_member_number = '' then
    raise exception 'Policy and member numbers are required'
      using errcode = '22023';
  end if;

  if p_effective_date is null
    or p_expiry_date is null
    or p_expiry_date <= p_effective_date then
    raise exception 'The expiry date must be after the effective date'
      using errcode = '22023';
  end if;

  insert into public.insurance_policies (
    patient_id, provider_id, policy_number, member_number,
    coverage_type, effective_date, expiry_date, notes, created_by
  )
  values (
    p_patient_id,
    p_provider_id,
    v_policy_number,
    v_member_number,
    coalesce(nullif(btrim(p_coverage_type), ''), 'Standard coverage'),
    p_effective_date,
    p_expiry_date,
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_policy_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'insurance.policy.create',
    'insurance_policy',
    v_policy_id,
    'Registered an insurance policy.',
    jsonb_build_object(
      'source', 'create_insurance_policy',
      'policy_number', v_policy_number,
      'provider_id', p_provider_id
    )
  );

  return v_policy_id;
end;
$$;

revoke all on function public.create_insurance_provider(
  text, text, text, text, text
) from public;
revoke all on function public.create_insurance_policy(
  uuid, uuid, text, text, text, date, date, text
) from public;

grant execute on function public.create_insurance_provider(
  text, text, text, text, text
) to authenticated, service_role;
grant execute on function public.create_insurance_policy(
  uuid, uuid, text, text, text, date, date, text
) to authenticated, service_role;

-- ============================================================================
-- Administrator bootstrap (migration 20261119000200)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — administrator bootstrap
-- Migration 20261119000200. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- The first administrator cannot be created through the UI (that would be a
-- public privilege-escalation path). This function is granted to service_role
-- only and is meant to be run once, from the Supabase SQL editor or a trusted
-- operator shell after the account exists in Auth.

create or replace function public.bootstrap_administrator(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile_id uuid;
  v_role_id uuid;
  v_existing boolean;
begin
  if btrim(coalesce(p_email, '')) = '' then
    raise exception 'An email address is required' using errcode = '22023';
  end if;

  select id
  into v_profile_id
  from public.profiles
  where lower(email) = lower(btrim(p_email));

  if v_profile_id is null then
    raise exception 'No account exists for %; create it in Auth first', p_email
      using errcode = '22023';
  end if;

  select id into v_role_id from public.roles where slug = 'super_admin';

  if v_role_id is null then
    raise exception 'The super_admin role is missing' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.user_roles where user_id = v_profile_id
  )
  into v_existing;

  if v_existing then
    raise exception 'The account already has a role; bootstrap only grants the first one'
      using errcode = '22023';
  end if;

  update public.profiles
  set is_active = true
  where id = v_profile_id;

  insert into public.user_roles (user_id, role_id)
  values (v_profile_id, v_role_id)
  on conflict do nothing;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_profile_id,
    'user.bootstrap_admin',
    'profile',
    v_profile_id,
    'Bootstrapped the first administrator account.',
    jsonb_build_object('source', 'bootstrap_administrator')
  );

  return v_profile_id;
end;
$$;

-- Deliberately not executable by anon or authenticated.
revoke all on function public.bootstrap_administrator(text) from public;
revoke all on function public.bootstrap_administrator(text) from anon;
revoke all on function public.bootstrap_administrator(text) from authenticated;

grant execute on function public.bootstrap_administrator(text)
  to service_role;

-- ============================================================================
-- Reject claims against expired policies (migration 20261119000300)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — reject claims against expired policies
-- Migration 20261119000300. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- create_claim checked the policy status but not its expiry date, so a policy
-- that ended last year could still be claimed against.

create or replace function public.create_claim(
  p_policy_id uuid,
  p_claim_type text,
  p_diagnosis text,
  p_total_charged numeric,
  p_amount_claimed numeric,
  p_lines jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_policy public.insurance_policies%rowtype;
  v_claim_id uuid;
  v_claim_number text;
  v_item jsonb;
  v_quantity numeric;
  v_unit numeric;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('insurance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select *
  into v_policy
  from public.insurance_policies
  where id = p_policy_id;

  if not found then
    raise exception 'Insurance policy not found' using errcode = '22023';
  end if;

  if v_policy.status <> 'active' then
    raise exception 'Only active policies can be claimed against'
      using errcode = '22023';
  end if;

  if v_policy.expiry_date < current_date then
    raise exception 'The policy has expired' using errcode = '22023';
  end if;

  if btrim(coalesce(p_claim_type, '')) = ''
    or btrim(coalesce(p_diagnosis, '')) = '' then
    raise exception 'Claim type and diagnosis are required'
      using errcode = '22023';
  end if;

  if p_total_charged is null
    or p_amount_claimed is null
    or p_total_charged <= 0
    or p_amount_claimed <= 0 then
    raise exception 'Claim amounts must be greater than zero'
      using errcode = '22023';
  end if;

  if p_amount_claimed > p_total_charged then
    raise exception 'The claimed amount cannot exceed the total charged'
      using errcode = '22023';
  end if;

  v_claim_number := public.generate_reference_number('CLM');

  insert into public.insurance_claims (
    claim_number,
    patient_id,
    provider_id,
    policy_id,
    claim_type,
    diagnosis,
    total_charged,
    amount_claimed,
    status,
    created_by
  )
  values (
    v_claim_number,
    v_policy.patient_id,
    v_policy.provider_id,
    p_policy_id,
    btrim(p_claim_type),
    btrim(p_diagnosis),
    round(p_total_charged, 2),
    round(p_amount_claimed, 2),
    'prepared',
    v_actor
  )
  returning id into v_claim_id;

  if p_lines is not null and jsonb_typeof(p_lines) = 'array' then
    for v_item in select * from jsonb_array_elements(p_lines) loop
      v_quantity := coalesce((v_item->>'quantity')::numeric, 1);
      v_unit := round(coalesce((v_item->>'unit_amount')::numeric, 0), 2);

      if v_quantity > 0 and v_unit >= 0 then
        insert into public.insurance_claim_lines (
          claim_id, description, quantity, unit_amount, line_total
        )
        values (
          v_claim_id,
          btrim(coalesce(v_item->>'description', 'Charge')),
          v_quantity,
          v_unit,
          round(v_quantity * v_unit, 2)
        );
      end if;
    end loop;
  end if;

  insert into public.insurance_claim_events (
    claim_id, event_type, description, actor_id
  )
  values (
    v_claim_id, 'created', 'Claim prepared from the insurance workspace.', v_actor
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'insurance.claim.create',
    'insurance_claim',
    v_claim_id,
    'Prepared an insurance claim.',
    jsonb_build_object(
      'source', 'create_claim',
      'claim_number', v_claim_number,
      'amount_claimed', round(p_amount_claimed, 2)
    )
  );

  return v_claim_id;
end;
$$;

revoke all on function public.create_claim(
  uuid, text, text, numeric, numeric, jsonb
) from public;

grant execute on function public.create_claim(
  uuid, text, text, numeric, numeric, jsonb
) to authenticated, service_role;

-- ============================================================================
-- Housekeeping (migration 20261119000400)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — housekeeping
-- Migration 20261119000400. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Cleaning requests move through requested → assigned → in_progress →
-- completed → verified. Completion requires a disinfection record, because a
-- room cannot be released without one.

create table if not exists public.housekeeping_staff (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  role text not null default 'Housekeeper',
  status text not null default 'on_duty'
    check (status in ('on_duty', 'off_duty', 'on_break')),
  contact_number text,
  current_assignment text,
  completed_today integer not null default 0 check (completed_today >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cleaning_requests (
  id uuid primary key default gen_random_uuid(),

  request_number text not null unique,

  location_type text not null
    check (location_type in ('room', 'bed', 'common_area', 'isolation_room')),
  location_label text not null,
  department_id uuid references public.departments(id) on delete restrict,

  request_type text not null
    check (request_type in ('routine', 'discharge', 'terminal', 'spill', 'isolation')),
  priority text not null default 'routine'
    check (priority in ('routine', 'urgent', 'emergency')),
  status text not null default 'requested'
    check (status in ('requested', 'assigned', 'in_progress', 'completed', 'verified', 'cancelled')),

  requested_at timestamptz not null default now(),
  due_at timestamptz not null default now() + interval '2 hours',
  scheduled_for timestamptz not null default now(),

  assigned_staff_id uuid
    references public.housekeeping_staff(id) on delete restrict,
  started_at timestamptz,
  completed_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete restrict,

  disinfection_used text,
  notes text,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.disinfection_records (
  id uuid primary key default gen_random_uuid(),

  request_id uuid not null unique
    references public.cleaning_requests(id) on delete cascade,

  method text not null,
  chemical text not null,
  contact_time_minutes integer not null check (contact_time_minutes > 0),

  performed_by uuid not null references public.profiles(id) on delete restrict,
  performed_at timestamptz not null default now(),
  notes text
);

create index if not exists idx_cleaning_requests_status
  on public.cleaning_requests(status, due_at);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('housekeeping.view', 'View cleaning requests and housekeeping staff.'),
  ('housekeeping.manage', 'Create, assign and close cleaning requests.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('housekeeping.view', 'housekeeping.manage')
where r.slug in ('hospital_admin', 'nurse')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'housekeeping.view'
where r.slug = 'physician'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'housekeeping_staff',
    'cleaning_requests',
    'disinfection_records'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''housekeeping.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Create a cleaning request
-- ----------------------------------------------------------------------------
create or replace function public.create_cleaning_request(
  p_location_type text,
  p_location_label text,
  p_request_type text,
  p_priority text default 'routine',
  p_due_at timestamp with time zone default null,
  p_notes text default null,
  p_department_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_request_id uuid;
  v_request_number text;
  v_label text := btrim(coalesce(p_location_label, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('housekeeping.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_location_type not in ('room', 'bed', 'common_area', 'isolation_room') then
    raise exception 'Unsupported location type' using errcode = '22023';
  end if;

  if p_request_type not in ('routine', 'discharge', 'terminal', 'spill', 'isolation') then
    raise exception 'Unsupported cleaning request type' using errcode = '22023';
  end if;

  if p_priority not in ('routine', 'urgent', 'emergency') then
    raise exception 'Unsupported priority' using errcode = '22023';
  end if;

  if v_label = '' then
    raise exception 'A location is required' using errcode = '22023';
  end if;

  v_request_number := public.generate_reference_number('CLN');

  insert into public.cleaning_requests (
    request_number, location_type, location_label, department_id,
    request_type, priority, due_at, notes, created_by
  )
  values (
    v_request_number,
    p_location_type,
    v_label,
    p_department_id,
    p_request_type,
    p_priority,
    coalesce(p_due_at, now() + interval '2 hours'),
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_request_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'housekeeping.request.create',
    'cleaning_request',
    v_request_id,
    'Created a cleaning request.',
    jsonb_build_object(
      'source', 'create_cleaning_request',
      'request_number', v_request_number,
      'request_type', p_request_type,
      'priority', p_priority
    )
  );

  return v_request_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Advance a cleaning request
-- ----------------------------------------------------------------------------
create or replace function public.advance_cleaning_request(
  p_request_id uuid,
  p_action text,
  p_staff_id uuid default null,
  p_method text default null,
  p_chemical text default null,
  p_contact_minutes integer default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.cleaning_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('housekeeping.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_request
  from public.cleaning_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Cleaning request not found' using errcode = '22023';
  end if;

  if v_request.status in ('verified', 'cancelled') then
    raise exception 'This request is already closed' using errcode = '22023';
  end if;

  if p_action = 'assign' then
    if p_staff_id is null
      or not exists (select 1 from public.housekeeping_staff where id = p_staff_id) then
      raise exception 'Select a housekeeping staff member' using errcode = '22023';
    end if;

    update public.cleaning_requests
    set assigned_staff_id = p_staff_id,
        status = 'assigned',
        updated_by = v_actor
    where id = p_request_id;

  elsif p_action = 'start' then
    if v_request.assigned_staff_id is null then
      raise exception 'Assign the request before starting it' using errcode = '22023';
    end if;

    update public.cleaning_requests
    set status = 'in_progress',
        started_at = coalesce(started_at, now()),
        updated_by = v_actor
    where id = p_request_id;

  elsif p_action = 'complete' then
    if btrim(coalesce(p_method, '')) = ''
      or btrim(coalesce(p_chemical, '')) = ''
      or p_contact_minutes is null
      or p_contact_minutes <= 0 then
      raise exception 'A disinfection method, chemical and contact time are required'
        using errcode = '22023';
    end if;

    insert into public.disinfection_records (
      request_id, method, chemical, contact_time_minutes, performed_by, notes
    )
    values (
      p_request_id,
      btrim(p_method),
      btrim(p_chemical),
      p_contact_minutes,
      v_actor,
      nullif(btrim(coalesce(p_notes, '')), '')
    )
    on conflict (request_id) do update
    set method = excluded.method,
        chemical = excluded.chemical,
        contact_time_minutes = excluded.contact_time_minutes,
        performed_by = excluded.performed_by,
        notes = excluded.notes;

    update public.cleaning_requests
    set status = 'completed',
        completed_at = now(),
        disinfection_used = btrim(p_chemical),
        updated_by = v_actor
    where id = p_request_id;

    update public.housekeeping_staff
    set completed_today = completed_today + 1,
        current_assignment = null,
        updated_at = now()
    where id = v_request.assigned_staff_id;

  elsif p_action = 'verify' then
    if v_request.status <> 'completed' then
      raise exception 'Only completed requests can be verified' using errcode = '22023';
    end if;

    update public.cleaning_requests
    set status = 'verified',
        verified_at = now(),
        verified_by = v_actor,
        updated_by = v_actor
    where id = p_request_id;

  elsif p_action = 'cancel' then
    update public.cleaning_requests
    set status = 'cancelled',
        updated_by = v_actor
    where id = p_request_id;

  else
    raise exception 'Unsupported cleaning action' using errcode = '22023';
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'housekeeping.request.' || p_action,
    'cleaning_request',
    p_request_id,
    'Updated a cleaning request.',
    jsonb_build_object('source', 'advance_cleaning_request', 'action', p_action)
  );

  return p_request_id;
end;
$$;

revoke all on function public.create_cleaning_request(
  text, text, text, text, timestamptz, text, uuid
) from public;
revoke all on function public.advance_cleaning_request(
  uuid, text, uuid, text, text, integer, text
) from public;

grant execute on function public.create_cleaning_request(
  text, text, text, text, timestamptz, text, uuid
) to authenticated, service_role;
grant execute on function public.advance_cleaning_request(
  uuid, text, uuid, text, text, integer, text
) to authenticated, service_role;

-- ============================================================================
-- Housekeeping staff intake (migration 20261119000500)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — housekeeping staff intake
-- Migration 20261119000500. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Cleaning requests can only be assigned to a housekeeping staff row, but there
-- was no way to create one without SQL access.

create or replace function public.create_housekeeping_staff(
  p_name text,
  p_role text default 'Housekeeper',
  p_contact_number text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_staff_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('housekeeping.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_name = '' then
    raise exception 'A staff name is required' using errcode = '22023';
  end if;

  insert into public.housekeeping_staff (
    name, role, contact_number, status
  )
  values (
    v_name,
    coalesce(nullif(btrim(p_role), ''), 'Housekeeper'),
    nullif(btrim(coalesce(p_contact_number, '')), ''),
    'on_duty'
  )
  returning id into v_staff_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'housekeeping.staff.create',
    'housekeeping_staff',
    v_staff_id,
    'Added a housekeeping staff member.',
    jsonb_build_object('source', 'create_housekeeping_staff')
  );

  return v_staff_id;
end;
$$;

create or replace function public.set_housekeeping_staff_status(
  p_staff_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('housekeeping.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_status not in ('on_duty', 'off_duty', 'on_break') then
    raise exception 'Unsupported staff status' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.housekeeping_staff where id = p_staff_id
  ) then
    raise exception 'Housekeeping staff not found' using errcode = '22023';
  end if;

  update public.housekeeping_staff
  set status = p_status,
      updated_at = now()
  where id = p_staff_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'housekeeping.staff.status',
    'housekeeping_staff',
    p_staff_id,
    'Updated a housekeeping staff status.',
    jsonb_build_object('source', 'set_housekeeping_staff_status', 'status', p_status)
  );

  return p_staff_id;
end;
$$;

revoke all on function public.create_housekeeping_staff(text, text, text)
  from public;
revoke all on function public.set_housekeeping_staff_status(uuid, text)
  from public;

grant execute on function public.create_housekeeping_staff(text, text, text)
  to authenticated, service_role;
grant execute on function public.set_housekeeping_staff_status(uuid, text)
  to authenticated, service_role;

-- ============================================================================
-- Ambulance fleet and dispatch (migration 20261119000600)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — ambulance fleet and dispatch
-- Migration 20261119000600. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Fleet register, transport requests, maintenance history and fuel records.
-- Dispatch is transactional: a vehicle can only be assigned when available, and
-- the vehicle status follows the trip lifecycle.

create table if not exists public.ambulance_vehicles (
  id uuid primary key default gen_random_uuid(),

  vehicle_number text not null unique,
  plate_number text not null unique,

  type text not null
    check (type in ('basic_life_support', 'advanced_life_support', 'patient_transport', 'mobile_icu')),
  status text not null default 'available'
    check (status in ('available', 'dispatched', 'on_trip', 'maintenance', 'out_of_service')),

  driver_name text,
  crew_names text[] not null default '{}',
  location text not null default 'Station',

  fuel_level numeric(5,2) not null default 100
    check (fuel_level >= 0 and fuel_level <= 100),
  odometer_km numeric(10,2) not null default 0 check (odometer_km >= 0),

  last_service_date date,
  next_service_due date,
  notes text,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ambulance_trips (
  id uuid primary key default gen_random_uuid(),

  trip_number text not null unique,
  patient_id uuid not null references public.patients(id) on delete restrict,
  vehicle_id uuid references public.ambulance_vehicles(id) on delete restrict,

  status text not null default 'requested'
    check (status in ('requested', 'assigned', 'en_route', 'on_scene', 'transporting', 'completed', 'cancelled')),
  priority text not null default 'routine'
    check (priority in ('routine', 'urgent', 'emergency')),

  pickup_location text not null,
  destination text not null,

  requested_at timestamptz not null default now(),
  dispatched_at timestamptz,
  arrived_pickup_at timestamptz,
  departed_pickup_at timestamptz,
  arrived_destination_at timestamptz,
  completed_at timestamptz,

  crew_names text[] not null default '{}',
  notes text,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ambulance_maintenance (
  id uuid primary key default gen_random_uuid(),

  vehicle_id uuid not null
    references public.ambulance_vehicles(id) on delete cascade,

  maintenance_type text not null,
  performed_at timestamptz not null default now(),
  performed_by uuid references public.profiles(id) on delete restrict,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  notes text,
  next_due_date date,

  created_at timestamptz not null default now()
);

create table if not exists public.ambulance_fuel_records (
  id uuid primary key default gen_random_uuid(),

  vehicle_id uuid not null
    references public.ambulance_vehicles(id) on delete cascade,

  fueled_at timestamptz not null default now(),
  liters numeric(8,2) not null check (liters > 0),
  cost numeric(12,2) not null default 0 check (cost >= 0),
  odometer_km numeric(10,2) not null default 0 check (odometer_km >= 0),
  recorded_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now()
);

create index if not exists idx_ambulance_trips_status
  on public.ambulance_trips(status, requested_at desc);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('ambulance.view', 'View the fleet, dispatch requests and vehicle records.'),
  ('ambulance.manage', 'Register vehicles and dispatch ambulances.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('ambulance.view', 'ambulance.manage')
where r.slug = 'hospital_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('ambulance.view', 'ambulance.manage')
where r.slug in ('nurse', 'receptionist')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'ambulance.view'
where r.slug = 'physician'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'ambulance_vehicles',
    'ambulance_trips',
    'ambulance_maintenance',
    'ambulance_fuel_records'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''ambulance.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Register a vehicle
-- ----------------------------------------------------------------------------
create or replace function public.register_ambulance_vehicle(
  p_vehicle_number text,
  p_plate_number text,
  p_type text,
  p_location text default 'Station',
  p_next_service_due date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_vehicle_id uuid;
  v_number text := upper(btrim(coalesce(p_vehicle_number, '')));
  v_plate text := upper(btrim(coalesce(p_plate_number, '')));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('ambulance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_number = '' or v_plate = '' then
    raise exception 'Vehicle number and plate number are required'
      using errcode = '22023';
  end if;

  if p_type not in ('basic_life_support', 'advanced_life_support', 'patient_transport', 'mobile_icu') then
    raise exception 'Unsupported ambulance type' using errcode = '22023';
  end if;

  insert into public.ambulance_vehicles (
    vehicle_number, plate_number, type, location, next_service_due, created_by
  )
  values (
    v_number, v_plate, p_type,
    coalesce(nullif(btrim(p_location), ''), 'Station'),
    p_next_service_due, v_actor
  )
  returning id into v_vehicle_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'ambulance.vehicle.register', 'ambulance_vehicle', v_vehicle_id,
    'Registered an ambulance.',
    jsonb_build_object('source', 'register_ambulance_vehicle', 'vehicle_number', v_number)
  );

  return v_vehicle_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Create a dispatch request
-- ----------------------------------------------------------------------------
create or replace function public.create_ambulance_trip(
  p_patient_id uuid,
  p_pickup_location text,
  p_destination text,
  p_priority text default 'routine',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_trip_id uuid;
  v_trip_number text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('ambulance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if btrim(coalesce(p_pickup_location, '')) = ''
    or btrim(coalesce(p_destination, '')) = '' then
    raise exception 'Pickup and destination are required' using errcode = '22023';
  end if;

  if p_priority not in ('routine', 'urgent', 'emergency') then
    raise exception 'Unsupported dispatch priority' using errcode = '22023';
  end if;

  v_trip_number := public.generate_reference_number('AMB');

  insert into public.ambulance_trips (
    trip_number, patient_id, priority, pickup_location, destination, notes, created_by
  )
  values (
    v_trip_number, p_patient_id, p_priority,
    btrim(p_pickup_location), btrim(p_destination),
    nullif(btrim(coalesce(p_notes, '')), ''), v_actor
  )
  returning id into v_trip_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'ambulance.trip.create', 'ambulance_trip', v_trip_id,
    'Requested an ambulance dispatch.',
    jsonb_build_object('source', 'create_ambulance_trip', 'trip_number', v_trip_number, 'priority', p_priority)
  );

  return v_trip_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Assign a vehicle and advance the trip
-- ----------------------------------------------------------------------------
create or replace function public.advance_ambulance_trip(
  p_trip_id uuid,
  p_action text,
  p_vehicle_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_trip public.ambulance_trips%rowtype;
  v_vehicle public.ambulance_vehicles%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('ambulance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_trip
  from public.ambulance_trips
  where id = p_trip_id
  for update;

  if not found then
    raise exception 'Dispatch request not found' using errcode = '22023';
  end if;

  if v_trip.status in ('completed', 'cancelled') then
    raise exception 'This dispatch is already closed' using errcode = '22023';
  end if;

  if p_action = 'assign' then
    if p_vehicle_id is null then
      raise exception 'Select an ambulance' using errcode = '22023';
    end if;

    select * into v_vehicle
    from public.ambulance_vehicles
    where id = p_vehicle_id
    for update;

    if not found then
      raise exception 'Ambulance not found' using errcode = '22023';
    end if;

    if v_vehicle.status <> 'available' then
      raise exception 'This ambulance is not available' using errcode = '22023';
    end if;

    update public.ambulance_trips
    set vehicle_id = p_vehicle_id,
        status = 'assigned',
        dispatched_at = now(),
        updated_by = v_actor
    where id = p_trip_id;

    update public.ambulance_vehicles
    set status = 'dispatched',
        driver_name = coalesce(driver_name, 'Assigned driver'),
        updated_by = v_actor
    where id = p_vehicle_id;

  elsif p_action = 'en_route' then
    if v_trip.vehicle_id is null then
      raise exception 'Assign an ambulance first' using errcode = '22023';
    end if;

    update public.ambulance_trips
    set status = 'en_route',
        updated_by = v_actor
    where id = p_trip_id;

  elsif p_action = 'on_scene' then
    update public.ambulance_trips
    set status = 'on_scene',
        arrived_pickup_at = now(),
        updated_by = v_actor
    where id = p_trip_id;

  elsif p_action = 'transporting' then
    update public.ambulance_trips
    set status = 'transporting',
        departed_pickup_at = now(),
        updated_by = v_actor
    where id = p_trip_id;

    update public.ambulance_vehicles
    set status = 'on_trip',
        updated_by = v_actor
    where id = v_trip.vehicle_id;

  elsif p_action = 'complete' then
    update public.ambulance_trips
    set status = 'completed',
        arrived_destination_at = now(),
        completed_at = now(),
        updated_by = v_actor
    where id = p_trip_id;

    update public.ambulance_vehicles
    set status = 'available',
        location = v_trip.destination,
        updated_by = v_actor
    where id = v_trip.vehicle_id;

  elsif p_action = 'cancel' then
    update public.ambulance_trips
    set status = 'cancelled',
        updated_by = v_actor
    where id = p_trip_id;

    if v_trip.vehicle_id is not null then
      update public.ambulance_vehicles
      set status = 'available',
          updated_by = v_actor
      where id = v_trip.vehicle_id;
    end if;

  else
    raise exception 'Unsupported dispatch action' using errcode = '22023';
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'ambulance.trip.' || p_action, 'ambulance_trip', p_trip_id,
    'Updated an ambulance dispatch.',
    jsonb_build_object('source', 'advance_ambulance_trip', 'action', p_action)
  );

  return p_trip_id;
end;
$$;

revoke all on function public.register_ambulance_vehicle(
  text, text, text, text, date
) from public;
revoke all on function public.create_ambulance_trip(
  uuid, text, text, text, text
) from public;
revoke all on function public.advance_ambulance_trip(uuid, text, uuid)
  from public;

grant execute on function public.register_ambulance_vehicle(
  text, text, text, text, date
) to authenticated, service_role;
grant execute on function public.create_ambulance_trip(
  uuid, text, text, text, text
) to authenticated, service_role;
grant execute on function public.advance_ambulance_trip(uuid, text, uuid)
  to authenticated, service_role;

-- ============================================================================
-- Dietary (migration 20261119000700)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — dietary
-- Migration 20261119000700. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Diet catalogue, per-patient dietary assessments and the meal tray queue.
-- Creating an assessment also generates today's meal orders from its schedule,
-- and allergens are copied onto each tray so the kitchen sees them.

create table if not exists public.diet_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.therapeutic_diets (
  id uuid primary key default gen_random_uuid(),

  category_id uuid not null
    references public.diet_categories(id) on delete restrict,

  name text not null,
  indication text not null default '',
  restrictions text not null default '',
  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  unique (category_id, name)
);

create table if not exists public.dietary_orders (
  id uuid primary key default gen_random_uuid(),

  order_number text not null unique,
  patient_id uuid not null references public.patients(id) on delete restrict,

  category_id uuid not null
    references public.diet_categories(id) on delete restrict,
  therapeutic_diet_id uuid not null
    references public.therapeutic_diets(id) on delete restrict,

  allergies text[] not null default '{}',
  restrictions text[] not null default '{}',
  assessment_notes text,

  meal_schedule text[] not null default '{breakfast,lunch,dinner}',

  status text not null default 'active'
    check (status in ('active', 'discontinued', 'pending')),

  ordered_by uuid not null references public.profiles(id) on delete restrict,
  assessed_at timestamptz not null default now(),

  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_orders (
  id uuid primary key default gen_random_uuid(),

  meal_number text not null unique,

  dietary_order_id uuid not null
    references public.dietary_orders(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete restrict,

  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  scheduled_for timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'preparing', 'ready', 'delivered', 'cancelled')),

  allergens text[] not null default '{}',
  notes text,

  prepared_by uuid references public.profiles(id) on delete restrict,
  delivered_at timestamptz,
  delivered_by uuid references public.profiles(id) on delete restrict,

  ward text not null default '',
  room text not null default '',
  bed text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (dietary_order_id, meal_type, scheduled_for)
);

create index if not exists idx_meal_orders_schedule
  on public.meal_orders(scheduled_for, status);
create index if not exists idx_dietary_orders_patient
  on public.dietary_orders(patient_id, status);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('dietary.view', 'View dietary assessments and the meal queue.'),
  ('dietary.manage', 'Record dietary assessments and advance meal orders.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('dietary.view', 'dietary.manage')
where r.slug in ('hospital_admin', 'nurse')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'dietary.view'
where r.slug = 'physician'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'diet_categories',
    'therapeutic_diets',
    'dietary_orders',
    'meal_orders'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''dietary.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Record a dietary assessment and its meal orders
-- ----------------------------------------------------------------------------
create or replace function public.create_dietary_order(
  p_patient_id uuid,
  p_therapeutic_diet_id uuid,
  p_allergies text[] default '{}',
  p_restrictions text[] default '{}',
  p_meal_schedule text[] default '{breakfast,lunch,dinner}',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_diet public.therapeutic_diets%rowtype;
  v_order_id uuid;
  v_order_number text;
  v_schedule text[];
  v_meal text;
  v_meal_at timestamptz;
  v_slot integer := 0;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('dietary.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  select * into v_diet
  from public.therapeutic_diets
  where id = p_therapeutic_diet_id;

  if not found then
    raise exception 'Therapeutic diet not found' using errcode = '22023';
  end if;

  if not v_diet.is_active then
    raise exception 'This therapeutic diet is inactive' using errcode = '22023';
  end if;

  v_schedule := coalesce(nullif(p_meal_schedule, '{}'), array['breakfast', 'lunch', 'dinner']);

  foreach v_meal in array v_schedule loop
    if v_meal not in ('breakfast', 'lunch', 'dinner', 'snack') then
      raise exception 'Unsupported meal type: %', v_meal using errcode = '22023';
    end if;
  end loop;

  v_order_number := public.generate_reference_number('DIET');

  insert into public.dietary_orders (
    order_number, patient_id, category_id, therapeutic_diet_id,
    allergies, restrictions, assessment_notes, meal_schedule,
    status, ordered_by
  )
  values (
    v_order_number,
    p_patient_id,
    v_diet.category_id,
    p_therapeutic_diet_id,
    coalesce(p_allergies, '{}'),
    coalesce(p_restrictions, '{}'),
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_schedule,
    'active',
    v_actor
  )
  returning id into v_order_id;

  foreach v_meal in array v_schedule loop
    v_meal_at := date_trunc('day', now()) + (
      case v_meal
        when 'breakfast' then interval '7 hours'
        when 'lunch' then interval '12 hours'
        when 'dinner' then interval '18 hours'
        else interval '15 hours'
      end
    );

    if v_meal_at < now() then
      v_meal_at := v_meal_at + interval '1 day';
    end if;

    v_slot := v_slot + 1;

    insert into public.meal_orders (
      meal_number, dietary_order_id, patient_id, meal_type,
      scheduled_for, status, allergens, ward, room, bed
    )
    values (
      public.generate_reference_number('MEAL'),
      v_order_id,
      p_patient_id,
      v_meal,
      v_meal_at,
      'scheduled',
      coalesce(p_allergies, '{}'),
      '',
      '',
      ''
    )
    on conflict (dietary_order_id, meal_type, scheduled_for) do nothing;
  end loop;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'dietary.order.create',
    'dietary_order',
    v_order_id,
    'Recorded a dietary assessment.',
    jsonb_build_object(
      'source', 'create_dietary_order',
      'order_number', v_order_number,
      'meals', v_schedule
    )
  );

  return v_order_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Advance a meal order
-- ----------------------------------------------------------------------------
create or replace function public.advance_meal_order(
  p_meal_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_meal public.meal_orders%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('dietary.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_status not in ('preparing', 'ready', 'delivered', 'cancelled') then
    raise exception 'Unsupported meal status' using errcode = '22023';
  end if;

  select * into v_meal
  from public.meal_orders
  where id = p_meal_id
  for update;

  if not found then
    raise exception 'Meal order not found' using errcode = '22023';
  end if;

  if v_meal.status = 'delivered' then
    raise exception 'This meal has already been delivered' using errcode = '22023';
  end if;

  update public.meal_orders
  set status = p_status,
      prepared_by = case
        when p_status in ('preparing', 'ready') then v_actor
        else prepared_by
      end,
      delivered_at = case when p_status = 'delivered' then now() else delivered_at end,
      delivered_by = case when p_status = 'delivered' then v_actor else delivered_by end,
      updated_at = now()
  where id = p_meal_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'dietary.meal.' || p_status,
    'meal_order',
    p_meal_id,
    'Updated a meal order.',
    jsonb_build_object('source', 'advance_meal_order', 'status', p_status)
  );

  return p_meal_id;
end;
$$;

revoke all on function public.create_dietary_order(
  uuid, uuid, text[], text[], text[], text
) from public;
revoke all on function public.advance_meal_order(uuid, text) from public;

grant execute on function public.create_dietary_order(
  uuid, uuid, text[], text[], text[], text
) to authenticated, service_role;
grant execute on function public.advance_meal_order(uuid, text)
  to authenticated, service_role;

-- ============================================================================
-- Dietary catalogue (migration 20261119000800)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — dietary catalogue (reference data)
-- Migration 20261119000800. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- The diet catalogue is configuration, not demo data, so it ships with the
-- schema: an empty catalogue makes it impossible to record an assessment.

insert into public.diet_categories (id, name, description)
values
  ('d1000000-0000-4000-8000-000000000001', 'Regular', 'Standard hospital meals.'),
  ('d1000000-0000-4000-8000-000000000002', 'Therapeutic', 'Modified diets for treatment.'),
  ('d1000000-0000-4000-8000-000000000003', 'Special', 'Nil-by-mouth and pre-procedure.')
on conflict (id) do nothing;

insert into public.therapeutic_diets (
  id, category_id, name, indication, restrictions
)
values
  ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
   'Regular diet', 'No dietary modification required.', 'None'),
  ('d2000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002',
   'Diabetic diet', 'Diabetes mellitus and hyperglycaemia.',
   'Added sugar, refined carbohydrates'),
  ('d2000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000002',
   'Low-sodium diet', 'Hypertension, heart failure, CKD.',
   'Salt, processed foods'),
  ('d2000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000002',
   'Renal diet', 'Chronic kidney disease.',
   'Potassium, phosphorus, sodium'),
  ('d2000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000002',
   'Soft diet', 'Dysphagia, post-operative.',
   'Hard or fibrous foods'),
  ('d2000000-0000-4000-8000-000000000006', 'd1000000-0000-4000-8000-000000000003',
   'Nil by mouth', 'Pre-procedure or acute abdomen.',
   'All oral intake')
on conflict (id) do nothing;

-- ============================================================================
-- Mortuary (migration 20261119000900)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — mortuary
-- Migration 20261119000900. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Storage units, custody records, release workflow and the access log. A body
-- cannot occupy two units, a unit cannot hold two bodies, and a release frees
-- the unit only when it is completed.

create table if not exists public.mortuary_storage_units (
  id uuid primary key default gen_random_uuid(),

  unit_number text not null unique,
  location text not null default 'Mortuary',
  status text not null default 'available'
    check (status in ('available', 'occupied', 'reserved', 'maintenance')),
  current_record_id uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mortuary_records (
  id uuid primary key default gen_random_uuid(),

  case_number text not null unique,
  patient_id uuid not null references public.patients(id) on delete restrict,

  declared_at timestamptz not null default now(),
  place_of_death text not null default 'SPMC',
  body_tag_number text not null unique,

  identification_status text not null default 'pending'
    check (identification_status in ('pending', 'verified', 'discrepancy')),

  storage_unit_id uuid
    references public.mortuary_storage_units(id) on delete restrict,

  status text not null default 'admitted'
    check (status in ('admitted', 'identified', 'release_pending', 'released', 'unclaimed')),

  next_of_kin_name text,
  next_of_kin_relationship text,
  next_of_kin_contact text,
  next_of_kin_verified boolean not null default false,

  admitted_at timestamptz not null default now(),
  released_at timestamptz,
  released_to_name text,
  release_authorized_by uuid references public.profiles(id) on delete restrict,
  release_document_reference text,

  notes text,

  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mortuary_storage_units
  drop constraint if exists mortuary_storage_units_current_record_fkey;
alter table public.mortuary_storage_units
  add constraint mortuary_storage_units_current_record_fkey
  foreign key (current_record_id)
  references public.mortuary_records(id) on delete set null;

create table if not exists public.mortuary_releases (
  id uuid primary key default gen_random_uuid(),

  record_id uuid not null unique
    references public.mortuary_records(id) on delete cascade,

  status text not null default 'pending'
    check (status in ('pending', 'authorized', 'completed', 'cancelled')),

  requested_at timestamptz not null default now(),
  authorized_by uuid references public.profiles(id) on delete restrict,
  authorized_at timestamptz,
  released_to_name text,
  relationship text,
  document_reference text,
  released_at timestamptz,
  notes text
);

create table if not exists public.mortuary_access_log (
  id uuid primary key default gen_random_uuid(),

  record_id uuid not null
    references public.mortuary_records(id) on delete cascade,

  action text not null,
  actor_id uuid references public.profiles(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_mortuary_records_status
  on public.mortuary_records(status, declared_at desc);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('mortuary.view', 'View custody records, storage units and releases.'),
  ('mortuary.manage', 'Admit, release and record mortuary access.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('mortuary.view', 'mortuary.manage')
where r.slug = 'hospital_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'mortuary.view'
where r.slug in ('nurse', 'physician')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'mortuary_storage_units',
    'mortuary_records',
    'mortuary_releases',
    'mortuary_access_log'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''mortuary.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Admit a body into custody
-- ----------------------------------------------------------------------------
create or replace function public.admit_mortuary_case(
  p_patient_id uuid,
  p_body_tag_number text,
  p_place_of_death text default 'SPMC',
  p_identification_status text default 'pending',
  p_storage_unit_id uuid default null,
  p_next_of_kin_name text default null,
  p_next_of_kin_relationship text default null,
  p_next_of_kin_contact text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_record_id uuid;
  v_case_number text;
  v_unit public.mortuary_storage_units%rowtype;
  v_tag text := btrim(coalesce(p_body_tag_number, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('mortuary.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if v_tag = '' then
    raise exception 'A body tag number is required' using errcode = '22023';
  end if;

  if p_identification_status not in ('pending', 'verified', 'discrepancy') then
    raise exception 'Unsupported identification status' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.mortuary_records where body_tag_number = v_tag
  ) then
    raise exception 'That body tag is already in use' using errcode = '22023';
  end if;

  if p_storage_unit_id is null then
    select * into v_unit
    from public.mortuary_storage_units
    where status = 'available'
    order by unit_number
    limit 1
    for update;
  else
    select * into v_unit
    from public.mortuary_storage_units
    where id = p_storage_unit_id
    for update;
  end if;

  if v_unit.id is null then
    raise exception 'No storage unit is available' using errcode = '22023';
  end if;

  if v_unit.status <> 'available' then
    raise exception 'That storage unit is not available' using errcode = '22023';
  end if;

  v_case_number := public.generate_reference_number('MOR');

  insert into public.mortuary_records (
    case_number, patient_id, place_of_death, body_tag_number,
    identification_status, storage_unit_id, status,
    next_of_kin_name, next_of_kin_relationship, next_of_kin_contact,
    next_of_kin_verified, notes, created_by
  )
  values (
    v_case_number, p_patient_id,
    coalesce(nullif(btrim(p_place_of_death), ''), 'SPMC'),
    v_tag, p_identification_status, v_unit.id,
    case when p_identification_status = 'verified' then 'identified' else 'admitted' end,
    nullif(btrim(coalesce(p_next_of_kin_name, '')), ''),
    nullif(btrim(coalesce(p_next_of_kin_relationship, '')), ''),
    nullif(btrim(coalesce(p_next_of_kin_contact, '')), ''),
    false,
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_record_id;

  update public.mortuary_storage_units
  set status = 'occupied',
      current_record_id = v_record_id,
      updated_at = now()
  where id = v_unit.id;

  insert into public.mortuary_releases (record_id, status)
  values (v_record_id, 'pending');

  insert into public.mortuary_access_log (record_id, action, actor_id, notes)
  values (v_record_id, 'admitted', v_actor, 'Body admitted into custody.');

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'mortuary.case.admit', 'mortuary_record', v_record_id,
    'Admitted a body into mortuary custody.',
    jsonb_build_object(
      'source', 'admit_mortuary_case',
      'case_number', v_case_number,
      'storage_unit', v_unit.unit_number
    )
  );

  return v_record_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Complete a release
-- ----------------------------------------------------------------------------
create or replace function public.release_mortuary_case(
  p_record_id uuid,
  p_released_to text,
  p_relationship text default null,
  p_document_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_record public.mortuary_records%rowtype;
  v_to text := btrim(coalesce(p_released_to, ''));
  v_document text := btrim(coalesce(p_document_reference, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('mortuary.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_record
  from public.mortuary_records
  where id = p_record_id
  for update;

  if not found then
    raise exception 'Mortuary record not found' using errcode = '22023';
  end if;

  if v_record.status = 'released' then
    raise exception 'This body has already been released' using errcode = '22023';
  end if;

  if v_to = '' then
    raise exception 'Record who received the body' using errcode = '22023';
  end if;

  if v_document = '' then
    raise exception 'A release document reference is required' using errcode = '22023';
  end if;

  if v_record.identification_status = 'discrepancy' then
    raise exception 'Resolve the identification discrepancy before release'
      using errcode = '22023';
  end if;

  update public.mortuary_records
  set status = 'released',
      released_at = now(),
      released_to_name = v_to,
      release_authorized_by = v_actor,
      release_document_reference = v_document,
      updated_by = v_actor
  where id = p_record_id;

  update public.mortuary_releases
  set status = 'completed',
      authorized_by = v_actor,
      authorized_at = now(),
      released_to_name = v_to,
      relationship = nullif(btrim(coalesce(p_relationship, '')), ''),
      document_reference = v_document,
      released_at = now(),
      notes = nullif(btrim(coalesce(p_notes, '')), '')
  where record_id = p_record_id;

  update public.mortuary_storage_units
  set status = 'available',
      current_record_id = null,
      updated_at = now()
  where current_record_id = p_record_id;

  insert into public.mortuary_access_log (record_id, action, actor_id, notes)
  values (p_record_id, 'released', v_actor, 'Body released to ' || v_to || '.');

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'mortuary.case.release', 'mortuary_record', p_record_id,
    'Released a body from mortuary custody.',
    jsonb_build_object(
      'source', 'release_mortuary_case',
      'document_reference', v_document
    )
  );

  return p_record_id;
end;
$$;

revoke all on function public.admit_mortuary_case(
  uuid, text, text, text, uuid, text, text, text, text
) from public;
revoke all on function public.release_mortuary_case(
  uuid, text, text, text, text
) from public;

grant execute on function public.admit_mortuary_case(
  uuid, text, text, text, uuid, text, text, text, text
) to authenticated, service_role;
grant execute on function public.release_mortuary_case(
  uuid, text, text, text, text
) to authenticated, service_role;

-- ============================================================================
-- Mortuary storage units (migration 20261119001000)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — mortuary storage units (reference infrastructure)
-- Migration 20261119001000. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- A mortuary cannot admit a body without a storage unit, so the physical units
-- ship with the schema rather than the demo seed.

insert into public.mortuary_storage_units (id, unit_number, location, status)
values
  ('f1000000-0000-4000-8000-000000000001', 'MU-01', 'Mortuary cold room', 'available'),
  ('f1000000-0000-4000-8000-000000000002', 'MU-02', 'Mortuary cold room', 'available'),
  ('f1000000-0000-4000-8000-000000000003', 'MU-03', 'Mortuary cold room', 'available'),
  ('f1000000-0000-4000-8000-000000000004', 'MU-04', 'Mortuary annex', 'available')
on conflict (id) do nothing;

-- ============================================================================
-- Equipment and maintenance (20261119001100_equipment.sql)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — equipment and maintenance
-- Migration 20261119001100. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Asset register, work orders, preventive schedules, calibrations and history.
-- Completing a work order writes history and returns the asset to service;
-- recording a calibration moves the next calibration due date.

create table if not exists public.equipment_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.medical_equipment (
  id uuid primary key default gen_random_uuid(),

  asset_number text not null unique,
  name text not null,
  category_id uuid references public.equipment_categories(id) on delete restrict,

  manufacturer text not null default '',
  model text not null default '',
  serial_number text not null unique,

  department_id uuid references public.departments(id) on delete restrict,
  location text not null default '',

  status text not null default 'available'
    check (status in ('available', 'in_use', 'maintenance', 'out_of_service', 'retired')),

  purchase_date date,
  warranty_expiry date,
  next_maintenance_due date,
  next_calibration_due date,

  notes text,
  is_active boolean not null default true,

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment_work_orders (
  id uuid primary key default gen_random_uuid(),

  work_order_number text not null unique,
  equipment_id uuid not null
    references public.medical_equipment(id) on delete restrict,

  issue_description text not null,
  priority text not null default 'routine'
    check (priority in ('routine', 'urgent', 'emergency')),
  status text not null default 'requested'
    check (status in ('requested', 'scheduled', 'in_progress', 'on_hold', 'completed', 'cancelled')),

  requested_by uuid not null references public.profiles(id) on delete restrict,
  assigned_technician_id uuid references public.profiles(id) on delete restrict,

  requested_at timestamptz not null default now(),
  scheduled_for timestamptz,
  completed_at timestamptz,

  resolution_notes text,
  parts_used text,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment_maintenance_schedules (
  id uuid primary key default gen_random_uuid(),

  equipment_id uuid not null
    references public.medical_equipment(id) on delete cascade,

  maintenance_type text not null
    check (maintenance_type in ('preventive', 'calibration', 'inspection', 'repair')),
  interval_days integer not null check (interval_days > 0),
  due_date date not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'overdue')),

  created_at timestamptz not null default now()
);

create table if not exists public.equipment_calibrations (
  id uuid primary key default gen_random_uuid(),

  equipment_id uuid not null
    references public.medical_equipment(id) on delete cascade,

  calibration_type text not null,
  performed_at timestamptz not null default now(),
  performed_by uuid references public.profiles(id) on delete restrict,
  result text not null
    check (result in ('passed', 'failed', 'adjusted')),
  next_due_date date,
  certificate_number text not null,
  notes text
);

create table if not exists public.equipment_maintenance_history (
  id uuid primary key default gen_random_uuid(),

  equipment_id uuid not null
    references public.medical_equipment(id) on delete cascade,

  event_type text not null
    check (event_type in ('preventive', 'calibration', 'inspection', 'repair')),
  performed_at timestamptz not null default now(),
  performed_by uuid references public.profiles(id) on delete restrict,
  summary text not null,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  notes text
);

create index if not exists idx_equipment_status
  on public.medical_equipment(status, next_maintenance_due);
create index if not exists idx_work_orders_status
  on public.equipment_work_orders(status, priority);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('equipment.view', 'View the asset register, work orders and calibrations.'),
  ('equipment.manage', 'Register equipment and manage maintenance.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('equipment.view', 'equipment.manage')
where r.slug = 'hospital_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'equipment.view'
where r.slug in ('physician', 'nurse', 'inventory_staff')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'equipment_categories',
    'medical_equipment',
    'equipment_work_orders',
    'equipment_maintenance_schedules',
    'equipment_calibrations',
    'equipment_maintenance_history'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''equipment.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Register equipment
-- ----------------------------------------------------------------------------
create or replace function public.register_equipment(
  p_asset_number text,
  p_name text,
  p_serial_number text,
  p_category_id uuid default null,
  p_department_id uuid default null,
  p_manufacturer text default null,
  p_model text default null,
  p_location text default null,
  p_next_maintenance_due date default null,
  p_next_calibration_due date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_asset text := upper(btrim(coalesce(p_asset_number, '')));
  v_serial text := btrim(coalesce(p_serial_number, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('equipment.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_asset = '' or btrim(coalesce(p_name, '')) = '' or v_serial = '' then
    raise exception 'Asset number, name and serial number are required'
      using errcode = '22023';
  end if;

  insert into public.medical_equipment (
    asset_number, name, category_id, department_id,
    manufacturer, model, serial_number, location,
    next_maintenance_due, next_calibration_due, created_by
  )
  values (
    v_asset,
    btrim(p_name),
    p_category_id,
    p_department_id,
    coalesce(nullif(btrim(coalesce(p_manufacturer, '')), ''), 'Unspecified'),
    coalesce(nullif(btrim(coalesce(p_model, '')), ''), 'Unspecified'),
    v_serial,
    coalesce(nullif(btrim(coalesce(p_location, '')), ''), 'Biomedical store'),
    p_next_maintenance_due,
    p_next_calibration_due,
    v_actor
  )
  returning id into v_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'equipment.register', 'medical_equipment', v_id,
    'Registered medical equipment.',
    jsonb_build_object('source', 'register_equipment', 'asset_number', v_asset)
  );

  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Create a work order
-- ----------------------------------------------------------------------------
create or replace function public.create_equipment_work_order(
  p_equipment_id uuid,
  p_issue_description text,
  p_priority text default 'routine',
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_number text;
  v_status text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('equipment.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status into v_status
  from public.medical_equipment
  where id = p_equipment_id;

  if not found then
    raise exception 'Equipment not found' using errcode = '22023';
  end if;

  if v_status = 'retired' then
    raise exception 'Retired equipment cannot receive work orders' using errcode = '22023';
  end if;

  if btrim(coalesce(p_issue_description, '')) = '' then
    raise exception 'Describe the issue' using errcode = '22023';
  end if;

  if p_priority not in ('routine', 'urgent', 'emergency') then
    raise exception 'Unsupported priority' using errcode = '22023';
  end if;

  v_number := public.generate_reference_number('WO');

  insert into public.equipment_work_orders (
    work_order_number, equipment_id, issue_description, priority, notes, requested_by
  )
  values (
    v_number, p_equipment_id, btrim(p_issue_description), p_priority,
    nullif(btrim(coalesce(p_notes, '')), ''), v_actor
  )
  returning id into v_id;

  if v_status = 'available' then
    update public.medical_equipment
    set status = 'maintenance', updated_by = v_actor
    where id = p_equipment_id;
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'equipment.work_order.create', 'equipment_work_order', v_id,
    'Raised an equipment work order.',
    jsonb_build_object('source', 'create_equipment_work_order', 'work_order', v_number, 'priority', p_priority)
  );

  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Complete a work order
-- ----------------------------------------------------------------------------
create or replace function public.complete_equipment_work_order(
  p_work_order_id uuid,
  p_resolution_notes text,
  p_parts_used text default null,
  p_cost numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.equipment_work_orders%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('equipment.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_order
  from public.equipment_work_orders
  where id = p_work_order_id
  for update;

  if not found then
    raise exception 'Work order not found' using errcode = '22023';
  end if;

  if v_order.status = 'completed' then
    raise exception 'This work order is already completed' using errcode = '22023';
  end if;

  if v_order.status = 'cancelled' then
    raise exception 'This work order is cancelled' using errcode = '22023';
  end if;

  if btrim(coalesce(p_resolution_notes, '')) = '' then
    raise exception 'Record the resolution before completing' using errcode = '22023';
  end if;

  update public.equipment_work_orders
  set status = 'completed',
      completed_at = now(),
      resolution_notes = btrim(p_resolution_notes),
      parts_used = nullif(btrim(coalesce(p_parts_used, '')), ''),
      cost = coalesce(p_cost, 0),
      updated_at = now()
  where id = p_work_order_id;

  update public.medical_equipment
  set status = 'available',
      updated_by = v_actor
  where id = v_order.equipment_id
    and status = 'maintenance';

  insert into public.equipment_maintenance_history (
    equipment_id, event_type, performed_by, summary, cost, notes
  )
  values (
    v_order.equipment_id,
    'repair',
    v_actor,
    'Work order ' || v_order.work_order_number || ' completed.',
    coalesce(p_cost, 0),
    btrim(p_resolution_notes)
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'equipment.work_order.complete', 'equipment_work_order', p_work_order_id,
    'Completed an equipment work order.',
    jsonb_build_object('source', 'complete_equipment_work_order', 'cost', coalesce(p_cost, 0))
  );

  return p_work_order_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Record a calibration
-- ----------------------------------------------------------------------------
create or replace function public.record_equipment_calibration(
  p_equipment_id uuid,
  p_calibration_type text,
  p_result text,
  p_certificate_number text,
  p_next_due_date date default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('equipment.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.medical_equipment where id = p_equipment_id) then
    raise exception 'Equipment not found' using errcode = '22023';
  end if;

  if p_result not in ('passed', 'failed', 'adjusted') then
    raise exception 'Unsupported calibration result' using errcode = '22023';
  end if;

  if btrim(coalesce(p_certificate_number, '')) = '' then
    raise exception 'A certificate number is required' using errcode = '22023';
  end if;

  insert into public.equipment_calibrations (
    equipment_id, calibration_type, performed_by, result,
    next_due_date, certificate_number, notes
  )
  values (
    p_equipment_id,
    coalesce(nullif(btrim(p_calibration_type), ''), 'Routine calibration'),
    v_actor,
    p_result,
    p_next_due_date,
    btrim(p_certificate_number),
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_id;

  update public.medical_equipment
  set next_calibration_due = coalesce(p_next_due_date, next_calibration_due),
      status = case when p_result = 'failed' then 'out_of_service'::text else status end,
      updated_by = v_actor
  where id = p_equipment_id;

  insert into public.equipment_maintenance_history (
    equipment_id, event_type, performed_by, summary, notes
  )
  values (
    p_equipment_id, 'calibration', v_actor,
    'Calibration ' || p_result || ' (' || btrim(p_certificate_number) || ').',
    nullif(btrim(coalesce(p_notes, '')), '')
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'equipment.calibration.record', 'equipment_calibration', v_id,
    'Recorded an equipment calibration.',
    jsonb_build_object('source', 'record_equipment_calibration', 'result', p_result)
  );

  return v_id;
end;
$$;

revoke all on function public.register_equipment(
  text, text, text, uuid, uuid, text, text, text, date, date
) from public;
revoke all on function public.create_equipment_work_order(
  uuid, text, text, text
) from public;
revoke all on function public.complete_equipment_work_order(
  uuid, text, text, numeric
) from public;
revoke all on function public.record_equipment_calibration(
  uuid, text, text, text, date, text
) from public;

grant execute on function public.register_equipment(
  text, text, text, uuid, uuid, text, text, text, date, date
) to authenticated, service_role;
grant execute on function public.create_equipment_work_order(
  uuid, text, text, text
) to authenticated, service_role;
grant execute on function public.complete_equipment_work_order(
  uuid, text, text, numeric
) to authenticated, service_role;
grant execute on function public.record_equipment_calibration(
  uuid, text, text, text, date, text
) to authenticated, service_role;

-- ============================================================================
-- Equipment categories (20261119001200_equipment_categories.sql)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — equipment categories (reference data)
-- Migration 20261119001200. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

insert into public.equipment_categories (id, name, description)
values
  ('e1000000-0000-4000-8000-000000000001', 'Imaging', 'Radiology and ultrasound equipment.'),
  ('e1000000-0000-4000-8000-000000000002', 'Monitoring', 'Vital signs and patient monitors.'),
  ('e1000000-0000-4000-8000-000000000003', 'Life support', 'Ventilators, defibrillators and infusion pumps.'),
  ('e1000000-0000-4000-8000-000000000004', 'Laboratory', 'Analysers and laboratory instruments.'),
  ('e1000000-0000-4000-8000-000000000005', 'Surgical', 'Operating theatre equipment.')
on conflict (id) do nothing;

-- ============================================================================
-- Notifications, announcements and preferences (20261119001300_notifications.sql)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — notifications, announcements and preferences
-- Migration 20261119001300. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- The notifications table already existed and the send-notification function
-- reads it, so this migration extends it instead of replacing it. Delivery
-- status is not modelled: a row is in-app and read or unread. Email delivery is
-- tracked separately by notification_email_deliveries (service role only).

alter table public.notifications
  add column if not exists severity text not null default 'info';

alter table public.notifications
  drop constraint if exists notifications_severity_check;

alter table public.notifications
  add constraint notifications_severity_check
  check (severity in ('info', 'success', 'warning', 'critical'));

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, is_read, created_at desc);

create table if not exists public.staff_announcements (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  body text not null,

  audience text not null default 'all_staff'
    check (audience in ('all_staff', 'physicians', 'nurses', 'department')),
  department_id uuid references public.departments(id) on delete restrict,

  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),

  pinned boolean not null default false,
  expires_at timestamptz,

  published_by uuid references public.profiles(id) on delete restrict,
  published_at timestamptz,

  created_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_staff_announcements_status
  on public.staff_announcements(status, published_at desc);

create table if not exists public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,

  category text not null check (category in (
    'appointment', 'queue', 'admission', 'discharge', 'laboratory',
    'radiology', 'prescription', 'billing', 'inventory', 'maintenance',
    'announcement', 'system'
  )),

  in_app boolean not null default true,

  updated_at timestamptz not null default now(),

  primary key (user_id, category)
);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('notification.manage', 'Publish staff announcements and review all notifications.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'notification.manage'
where r.slug = 'hospital_admin'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.staff_announcements enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists staff_announcements_select_visible
  on public.staff_announcements;
create policy staff_announcements_select_visible
  on public.staff_announcements
  for select to authenticated
  using (
    status = 'published'
    or public.has_permission('notification.manage')
  );

drop policy if exists notifications_select_managers
  on public.notifications;
create policy notifications_select_managers
  on public.notifications
  for select to authenticated
  using (public.has_permission('notification.manage'));

drop policy if exists notification_preferences_select_owner
  on public.notification_preferences;
create policy notification_preferences_select_owner
  on public.notification_preferences
  for select to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Mark one notification read
-- ----------------------------------------------------------------------------
create or replace function public.mark_notification_read(
  p_notification_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.notifications
  set is_read = true,
      read_at = coalesce(read_at, now())
  where id = p_notification_id
    and user_id = v_actor;

  if not found then
    raise exception 'Notification not found' using errcode = '22023';
  end if;

  return p_notification_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Mark every notification read
-- ----------------------------------------------------------------------------
create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_count integer;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.notifications
  set is_read = true,
      read_at = now()
  where user_id = v_actor
    and is_read = false;

  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- Publish an announcement and fan it out to the audience
-- ----------------------------------------------------------------------------
create or replace function public.publish_staff_announcement(
  p_announcement_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_announcement public.staff_announcements%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('notification.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_announcement
  from public.staff_announcements
  where id = p_announcement_id
  for update;

  if not found then
    raise exception 'Announcement not found' using errcode = '22023';
  end if;

  if v_announcement.status = 'published' then
    raise exception 'This announcement is already published'
      using errcode = '22023';
  end if;

  if v_announcement.status = 'archived' then
    raise exception 'Archived announcements cannot be published'
      using errcode = '22023';
  end if;

  if v_announcement.audience = 'department'
     and v_announcement.department_id is null then
    raise exception 'Select the department for this audience'
      using errcode = '22023';
  end if;

  update public.staff_announcements
  set status = 'published',
      published_by = v_actor,
      published_at = now(),
      updated_at = now()
  where id = p_announcement_id;

  insert into public.notifications (
    user_id, title, message, notification_type, severity,
    related_entity_type, related_entity_id
  )
  select
    sp.user_id,
    v_announcement.title,
    v_announcement.body,
    'announcement',
    'info',
    'staff_announcement',
    p_announcement_id
  from public.staff_profiles sp
  join public.profiles p on p.id = sp.user_id and p.is_active
  where sp.is_active
    and (
      v_announcement.audience = 'all_staff'
      or (
        v_announcement.audience = 'physicians'
        and exists (
          select 1
          from public.user_roles ur
          join public.roles r on r.id = ur.role_id
          where ur.user_id = sp.user_id and r.slug = 'physician'
        )
      )
      or (
        v_announcement.audience = 'nurses'
        and exists (
          select 1
          from public.user_roles ur
          join public.roles r on r.id = ur.role_id
          where ur.user_id = sp.user_id and r.slug = 'nurse'
        )
      )
      or (
        v_announcement.audience = 'department'
        and sp.department_id = v_announcement.department_id
      )
    )
    and not exists (
      select 1
      from public.notification_preferences np
      where np.user_id = sp.user_id
        and np.category = 'announcement'
        and np.in_app = false
    );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'notification.announcement.publish', 'staff_announcement',
    p_announcement_id, 'Published a staff announcement.',
    jsonb_build_object(
      'source', 'publish_staff_announcement',
      'audience', v_announcement.audience
    )
  );

  return p_announcement_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Create an announcement (draft or published)
-- ----------------------------------------------------------------------------
create or replace function public.create_staff_announcement(
  p_title text,
  p_body text,
  p_audience text default 'all_staff',
  p_department_id uuid default null,
  p_pinned boolean default false,
  p_expires_at timestamptz default null,
  p_publish boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_audience text := coalesce(nullif(btrim(p_audience), ''), 'all_staff');
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('notification.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if btrim(coalesce(p_title, '')) = '' or btrim(coalesce(p_body, '')) = '' then
    raise exception 'A title and body are required' using errcode = '22023';
  end if;

  if v_audience not in ('all_staff', 'physicians', 'nurses', 'department') then
    raise exception 'Unsupported announcement audience' using errcode = '22023';
  end if;

  if v_audience = 'department' and p_department_id is null then
    raise exception 'Select the department for this audience'
      using errcode = '22023';
  end if;

  insert into public.staff_announcements (
    title, body, audience, department_id, pinned, expires_at, created_by
  )
  values (
    btrim(p_title),
    btrim(p_body),
    v_audience,
    case when v_audience = 'department' then p_department_id else null end,
    coalesce(p_pinned, false),
    p_expires_at,
    v_actor
  )
  returning id into v_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'notification.announcement.create', 'staff_announcement', v_id,
    'Created a staff announcement.',
    jsonb_build_object('source', 'create_staff_announcement', 'audience', v_audience)
  );

  if coalesce(p_publish, false) then
    perform public.publish_staff_announcement(v_id);
  end if;

  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Archive an announcement
-- ----------------------------------------------------------------------------
create or replace function public.archive_staff_announcement(
  p_announcement_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('notification.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status into v_status
  from public.staff_announcements
  where id = p_announcement_id
  for update;

  if not found then
    raise exception 'Announcement not found' using errcode = '22023';
  end if;

  if v_status = 'archived' then
    raise exception 'This announcement is already archived' using errcode = '22023';
  end if;

  update public.staff_announcements
  set status = 'archived',
      updated_at = now()
  where id = p_announcement_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'notification.announcement.archive', 'staff_announcement',
    p_announcement_id, 'Archived a staff announcement.',
    jsonb_build_object('source', 'archive_staff_announcement')
  );

  return p_announcement_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Save the caller's in-app notification preferences
-- ----------------------------------------------------------------------------
create or replace function public.save_notification_preferences(
  p_preferences jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_count integer;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_preferences is null or jsonb_typeof(p_preferences) <> 'array' then
    raise exception 'Preferences must be a JSON array' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_preferences) as item
    where coalesce(item->>'category', '') not in (
      'appointment', 'queue', 'admission', 'discharge', 'laboratory',
      'radiology', 'prescription', 'billing', 'inventory', 'maintenance',
      'announcement', 'system'
    )
  ) then
    raise exception 'Unsupported notification category' using errcode = '22023';
  end if;

  insert into public.notification_preferences (user_id, category, in_app)
  select
    v_actor,
    item->>'category',
    coalesce((item->>'in_app')::boolean, true)
  from jsonb_array_elements(p_preferences) as item
  on conflict (user_id, category) do update
  set in_app = excluded.in_app,
      updated_at = now();

  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

revoke all on function public.mark_notification_read(uuid) from public;
revoke all on function public.mark_all_notifications_read() from public;
revoke all on function public.create_staff_announcement(
  text, text, text, uuid, boolean, timestamptz, boolean
) from public;
revoke all on function public.publish_staff_announcement(uuid) from public;
revoke all on function public.archive_staff_announcement(uuid) from public;
revoke all on function public.save_notification_preferences(jsonb) from public;

grant execute on function public.mark_notification_read(uuid) to authenticated, service_role;
grant execute on function public.mark_all_notifications_read() to authenticated, service_role;
grant execute on function public.create_staff_announcement(
  text, text, text, uuid, boolean, timestamptz, boolean
) to authenticated, service_role;
grant execute on function public.publish_staff_announcement(uuid) to authenticated, service_role;
grant execute on function public.archive_staff_announcement(uuid) to authenticated, service_role;
grant execute on function public.save_notification_preferences(jsonb) to authenticated, service_role;

-- ============================================================================
-- Staff record creation (20261119001400_staff_creation.sql)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — staff record creation after an Auth account exists
-- Migration 20261119001400. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- The admin-users Edge Function creates the Auth account with the service role.
-- This function writes the employment record and assigns the first role in one
-- transaction, so a half-created staff member cannot be committed.

create or replace function public.create_staff_record(
  p_user_id uuid,
  p_staff_number text,
  p_first_name text,
  p_last_name text,
  p_middle_name text default null,
  p_department_id uuid default null,
  p_employment_type text default null,
  p_professional_license_number text default null,
  p_role_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_staff_number text := upper(btrim(coalesce(p_staff_number, '')));
  v_first_name text := btrim(coalesce(p_first_name, ''));
  v_last_name text := btrim(coalesce(p_last_name, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_staff_number = '' or v_first_name = '' or v_last_name = '' then
    raise exception 'Staff number, first name and last name are required'
      using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Account not found' using errcode = '22023';
  end if;

  if exists (select 1 from public.staff_profiles where user_id = p_user_id) then
    raise exception 'This account already has a staff record'
      using errcode = '22023';
  end if;

  insert into public.staff_profiles (
    user_id, staff_number, first_name, middle_name, last_name,
    department_id, employment_type, professional_license_number, created_by
  )
  values (
    p_user_id,
    v_staff_number,
    v_first_name,
    nullif(btrim(coalesce(p_middle_name, '')), ''),
    v_last_name,
    p_department_id,
    nullif(btrim(coalesce(p_employment_type, '')), ''),
    nullif(btrim(coalesce(p_professional_license_number, '')), ''),
    v_actor
  )
  returning id into v_id;

  if p_role_id is not null then
    perform public.set_edge_user_role(p_user_id, p_role_id, true);
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'staff.create', 'staff_profile', v_id,
    'Created a staff employment record.',
    jsonb_build_object(
      'source', 'create_staff_record',
      'staff_number', v_staff_number,
      'user_id', p_user_id,
      'role_id', p_role_id
    )
  );

  return v_id;
end;
$$;

revoke all on function public.create_staff_record(
  uuid, text, text, text, text, uuid, text, text, uuid
) from public;
grant execute on function public.create_staff_record(
  uuid, text, text, text, text, uuid, text, text, uuid
) to authenticated, service_role;

-- ============================================================================
-- Housekeeping assignment integrity (20261119001500_housekeeping_assignment.sql)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — cleaning assignment integrity
-- Migration 20261119001500. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- The assign branch wrote the request but never marked the staff member busy,
-- allowed the same request to be assigned twice, and allowed a staff member to
-- hold two active requests. Completion cleared the assignment, so the staff
-- list looked free while the request said assigned.
--
-- This replaces the lifecycle function with guarded transitions:
--   requested -> assigned -> in_progress -> completed -> verified
-- and keeps housekeeping_staff.current_assignment in step.

create or replace function public.advance_cleaning_request(
  p_request_id uuid,
  p_action text,
  p_staff_id uuid default null,
  p_method text default null,
  p_chemical text default null,
  p_contact_minutes integer default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.cleaning_requests%rowtype;
  v_staff public.housekeeping_staff%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('housekeeping.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_request
  from public.cleaning_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Cleaning request not found' using errcode = '22023';
  end if;

  if v_request.status in ('verified', 'cancelled') then
    raise exception 'This request is already closed' using errcode = '22023';
  end if;

  if p_action = 'assign' then
    if v_request.status <> 'requested' or v_request.assigned_staff_id is not null then
      raise exception 'This request is already assigned' using errcode = '22023';
    end if;

    if p_staff_id is null then
      raise exception 'Select a housekeeping staff member' using errcode = '22023';
    end if;

    select * into v_staff
    from public.housekeeping_staff
    where id = p_staff_id
    for update;

    if not found then
      raise exception 'Select a housekeeping staff member' using errcode = '22023';
    end if;

    if v_staff.status = 'off_duty' then
      raise exception 'This staff member is off duty' using errcode = '22023';
    end if;

    if v_staff.current_assignment is not null then
      raise exception 'This staff member already has an active assignment'
        using errcode = '22023';
    end if;

    update public.cleaning_requests
    set assigned_staff_id = p_staff_id,
        status = 'assigned',
        updated_by = v_actor
    where id = p_request_id;

    update public.housekeeping_staff
    set current_assignment = p_request_id,
        updated_at = now()
    where id = p_staff_id;

  elsif p_action = 'start' then
    if v_request.assigned_staff_id is null then
      raise exception 'Assign the request before starting it' using errcode = '22023';
    end if;

    if v_request.status <> 'assigned' then
      raise exception 'Only assigned requests can be started' using errcode = '22023';
    end if;

    update public.cleaning_requests
    set status = 'in_progress',
        started_at = coalesce(started_at, now()),
        updated_by = v_actor
    where id = p_request_id;

  elsif p_action = 'complete' then
    if v_request.status <> 'in_progress' then
      raise exception 'Only in-progress requests can be completed' using errcode = '22023';
    end if;

    if btrim(coalesce(p_method, '')) = ''
      or btrim(coalesce(p_chemical, '')) = ''
      or p_contact_minutes is null
      or p_contact_minutes <= 0 then
      raise exception 'A disinfection method, chemical and contact time are required'
        using errcode = '22023';
    end if;

    insert into public.disinfection_records (
      request_id, method, chemical, contact_time_minutes, performed_by, notes
    )
    values (
      p_request_id,
      btrim(p_method),
      btrim(p_chemical),
      p_contact_minutes,
      v_actor,
      nullif(btrim(coalesce(p_notes, '')), '')
    )
    on conflict (request_id) do update
    set method = excluded.method,
        chemical = excluded.chemical,
        contact_time_minutes = excluded.contact_time_minutes,
        performed_by = excluded.performed_by,
        notes = excluded.notes;

    update public.cleaning_requests
    set status = 'completed',
        completed_at = now(),
        disinfection_used = btrim(p_chemical),
        updated_by = v_actor
    where id = p_request_id;

    update public.housekeeping_staff
    set completed_today = completed_today + 1,
        current_assignment = null,
        updated_at = now()
    where id = v_request.assigned_staff_id;

  elsif p_action = 'verify' then
    if v_request.status <> 'completed' then
      raise exception 'Only completed requests can be verified' using errcode = '22023';
    end if;

    update public.cleaning_requests
    set status = 'verified',
        verified_at = now(),
        verified_by = v_actor,
        updated_by = v_actor
    where id = p_request_id;

  elsif p_action = 'cancel' then
    update public.cleaning_requests
    set status = 'cancelled',
        updated_by = v_actor
    where id = p_request_id;

    if v_request.assigned_staff_id is not null then
      update public.housekeeping_staff
      set current_assignment = null,
          updated_at = now()
      where id = v_request.assigned_staff_id
        and current_assignment = p_request_id;
    end if;

  else
    raise exception 'Unsupported cleaning action' using errcode = '22023';
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'housekeeping.request.' || p_action,
    'cleaning_request',
    p_request_id,
    'Updated a cleaning request.',
    jsonb_build_object(
      'source', 'advance_cleaning_request',
      'action', p_action,
      'staff_id', p_staff_id
    )
  );

  return p_request_id;
end;
$$;

revoke all on function public.advance_cleaning_request(
  uuid, text, uuid, text, text, integer, text
) from public;
grant execute on function public.advance_cleaning_request(
  uuid, text, uuid, text, text, integer, text
) to authenticated, service_role;

-- ============================================================================
-- HR employee intake and payroll runs (20261119001600_hr_payroll.sql)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — employee intake and payroll runs
-- Migration 20261119001600. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- HR had no salary column and no way to process a period, so "Run Payroll" and
-- "Add Employee" could not be real. This adds an explicit monthly rate, records
-- the deduction rate used for each run, and creates both RPCs.
--
-- Deductions are a single rate supplied by the administrator for that run. The
-- database does not invent statutory contribution tables: the rate is stored on
-- the period so a payslip can be explained after the fact.

alter table public.hr_employee_details
  add column if not exists monthly_rate numeric(12,2) not null default 0;

alter table public.hr_employee_details
  drop constraint if exists hr_employee_details_monthly_rate_check;

alter table public.hr_employee_details
  add constraint hr_employee_details_monthly_rate_check
  check (monthly_rate >= 0);

alter table public.hr_payroll_periods
  add column if not exists deduction_rate numeric(5,2) not null default 0;

alter table public.hr_payroll_periods
  drop constraint if exists hr_payroll_periods_deduction_rate_check;

alter table public.hr_payroll_periods
  add constraint hr_payroll_periods_deduction_rate_check
  check (deduction_rate between 0 and 100);

-- ----------------------------------------------------------------------------
-- Create an employee: staff record plus HR details in one transaction
-- ----------------------------------------------------------------------------
create or replace function public.create_employee_record(
  p_user_id uuid,
  p_staff_number text,
  p_first_name text,
  p_last_name text,
  p_position text,
  p_hire_date date,
  p_middle_name text default null,
  p_department_id uuid default null,
  p_employment_type text default null,
  p_professional_license_number text default null,
  p_role_id uuid default null,
  p_monthly_rate numeric default 0,
  p_license_expiry date default null,
  p_leave_balance numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_staff_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if btrim(coalesce(p_position, '')) = '' then
    raise exception 'Enter the employee position' using errcode = '22023';
  end if;

  if p_hire_date is null then
    raise exception 'Select the hire date' using errcode = '22023';
  end if;

  if coalesce(p_monthly_rate, 0) < 0 or coalesce(p_leave_balance, 0) < 0 then
    raise exception 'Salary and leave balance cannot be negative'
      using errcode = '22023';
  end if;

  v_staff_id := public.create_staff_record(
    p_user_id,
    p_staff_number,
    p_first_name,
    p_last_name,
    p_middle_name,
    p_department_id,
    p_employment_type,
    p_professional_license_number,
    p_role_id
  );

  insert into public.hr_employee_details (
    staff_profile_id, position, hire_date, monthly_rate,
    license_expiry, leave_balance, created_by
  )
  values (
    v_staff_id,
    btrim(p_position),
    p_hire_date,
    coalesce(p_monthly_rate, 0),
    p_license_expiry,
    coalesce(p_leave_balance, 0),
    v_actor
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'hr.employee.create', 'staff_profile', v_staff_id,
    'Created an employee record.',
    jsonb_build_object(
      'source', 'create_employee_record',
      'position', btrim(p_position),
      'monthly_rate', coalesce(p_monthly_rate, 0)
    )
  );

  return v_staff_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Run payroll for a period
-- ----------------------------------------------------------------------------
create or replace function public.run_payroll(
  p_period_start date,
  p_period_end date,
  p_pay_date date,
  p_deduction_rate numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_days integer;
  v_rate numeric := coalesce(p_deduction_rate, 0);
  v_entries integer;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.payroll') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_period_start is null or p_period_end is null or p_pay_date is null then
    raise exception 'Select the period dates and pay date' using errcode = '22023';
  end if;

  if p_period_end < p_period_start then
    raise exception 'The period end cannot be before the start' using errcode = '22023';
  end if;

  if v_rate < 0 or v_rate > 100 then
    raise exception 'The deduction rate must be between 0 and 100'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.hr_payroll_periods
    where status <> 'paid'
      and period_start <= p_period_end
      and period_end >= p_period_start
  ) then
    raise exception 'A payroll period overlaps an existing run'
      using errcode = '22023';
  end if;

  v_days := (p_period_end - p_period_start) + 1;

  insert into public.hr_payroll_periods (
    period_start, period_end, pay_date, status, deduction_rate, created_by
  )
  values (
    p_period_start, p_period_end, p_pay_date, 'processing', v_rate, v_actor
  )
  returning id into v_id;

  with base as (
    select
      d.staff_profile_id,
      d.position,
      round(d.monthly_rate / 30.0 * v_days, 2) as basic_pay,
      round(
        coalesce((
          select sum(a.overtime_minutes)
          from public.hr_attendance a
          where a.staff_profile_id = d.staff_profile_id
            and a.attendance_date between p_period_start and p_period_end
        ), 0) / 60.0 * (d.monthly_rate / 30.0 / 8.0) * 1.25,
        2
      ) as overtime_pay
    from public.hr_employee_details d
    join public.staff_profiles sp on sp.id = d.staff_profile_id
    where d.employment_status = 'active'
      and sp.is_active
      and d.monthly_rate > 0
  )
  insert into public.hr_payroll_entries (
    payroll_period_id, staff_profile_id, position,
    basic_pay, allowances, overtime_pay, gross_pay, deductions, net_pay
  )
  select
    v_id,
    staff_profile_id,
    position,
    basic_pay,
    0,
    overtime_pay,
    basic_pay + overtime_pay,
    round((basic_pay + overtime_pay) * v_rate / 100.0, 2),
    (basic_pay + overtime_pay)
      - round((basic_pay + overtime_pay) * v_rate / 100.0, 2)
  from base;

  get diagnostics v_entries = row_count;

  if v_entries = 0 then
    raise exception 'No active employee has a monthly rate. Set salaries before running payroll.'
      using errcode = '22023';
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'hr.payroll.run', 'hr_payroll_period', v_id,
    'Ran payroll for a period.',
    jsonb_build_object(
      'source', 'run_payroll',
      'period_start', p_period_start,
      'period_end', p_period_end,
      'employees', v_entries,
      'deduction_rate', v_rate
    )
  );

  return v_id;
end;
$$;

revoke all on function public.create_employee_record(
  uuid, text, text, text, text, date, text, uuid, text, text, uuid, numeric, date, numeric
) from public;
grant execute on function public.create_employee_record(
  uuid, text, text, text, text, date, text, uuid, text, text, uuid, numeric, date, numeric
) to authenticated, service_role;

revoke all on function public.run_payroll(date, date, date, numeric) from public;
grant execute on function public.run_payroll(date, date, date, numeric)
  to authenticated, service_role;

-- ============================================================================
-- Attendance capture and employee salary (20261119001700_hr_attendance_salary.sql)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — attendance capture and employee salary
-- Migration 20261119001700. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- hr_attendance had no insert policy and no RPC, so overtime could never reach
-- payroll, and salaries could only be set while creating an employee. This adds
-- both write paths with explicit permission checks and audit rows.

create or replace function public.record_attendance(
  p_staff_profile_id uuid,
  p_attendance_date date,
  p_status text default 'present',
  p_time_in time default null,
  p_time_out time default null,
  p_overtime_minutes integer default 0,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status text := coalesce(nullif(btrim(p_status), ''), 'present');
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_attendance_date is null then
    raise exception 'Select the attendance date' using errcode = '22023';
  end if;

  if not exists (select 1 from public.staff_profiles where id = p_staff_profile_id) then
    raise exception 'Staff record not found' using errcode = '22023';
  end if;

  if v_status not in ('present', 'late', 'absent', 'leave', 'holiday') then
    raise exception 'Unsupported attendance status' using errcode = '22023';
  end if;

  if coalesce(p_overtime_minutes, 0) < 0 or coalesce(p_overtime_minutes, 0) > 1440 then
    raise exception 'Overtime must be between 0 and 1440 minutes'
      using errcode = '22023';
  end if;

  if p_time_in is not null and p_time_out is not null and p_time_out <= p_time_in then
    raise exception 'Time out must be after time in' using errcode = '22023';
  end if;

  insert into public.hr_attendance (
    staff_profile_id, attendance_date, time_in, time_out,
    status, overtime_minutes, note
  )
  values (
    p_staff_profile_id,
    p_attendance_date,
    p_time_in,
    p_time_out,
    v_status,
    coalesce(p_overtime_minutes, 0),
    nullif(btrim(coalesce(p_note, '')), '')
  )
  on conflict (staff_profile_id, attendance_date) do update
  set time_in = excluded.time_in,
      time_out = excluded.time_out,
      status = excluded.status,
      overtime_minutes = excluded.overtime_minutes,
      note = excluded.note
  returning id into v_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'hr.attendance.record', 'staff_profile', p_staff_profile_id,
    'Recorded employee attendance.',
    jsonb_build_object(
      'source', 'record_attendance',
      'date', p_attendance_date,
      'status', v_status,
      'overtime_minutes', coalesce(p_overtime_minutes, 0)
    )
  );

  return v_id;
end;
$$;

create or replace function public.set_employee_salary(
  p_staff_profile_id uuid,
  p_monthly_rate numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_old numeric;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.payroll') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_monthly_rate is null or p_monthly_rate < 0 then
    raise exception 'The monthly rate cannot be negative' using errcode = '22023';
  end if;

  select monthly_rate into v_old
  from public.hr_employee_details
  where staff_profile_id = p_staff_profile_id
  for update;

  if not found then
    raise exception 'Create the employee record before setting a salary'
      using errcode = '22023';
  end if;

  update public.hr_employee_details
  set monthly_rate = p_monthly_rate,
      updated_by = v_actor,
      updated_at = now()
  where staff_profile_id = p_staff_profile_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'hr.employee.salary', 'staff_profile', p_staff_profile_id,
    'Updated an employee monthly rate.',
    jsonb_build_object(
      'source', 'set_employee_salary',
      'previous_rate', v_old,
      'monthly_rate', p_monthly_rate
    )
  );

  return p_staff_profile_id;
end;
$$;

revoke all on function public.record_attendance(
  uuid, date, text, time, time, integer, text
) from public;
grant execute on function public.record_attendance(
  uuid, date, text, time, time, integer, text
) to authenticated, service_role;

revoke all on function public.set_employee_salary(uuid, numeric) from public;
grant execute on function public.set_employee_salary(uuid, numeric)
  to authenticated, service_role;

-- ============================================================================
-- Ambulance maintenance and fuel (20261119001800_ambulance_maintenance_fuel.sql)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — ambulance maintenance and fuel
-- Migration 20261119001800. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- ambulance_maintenance and ambulance_fuel_records existed with read access
-- only. Fleet records could be displayed but never written, so the maintenance
-- tab was a dead end and the odometer never moved. These RPCs add the writes.

create or replace function public.record_ambulance_maintenance(
  p_vehicle_id uuid,
  p_maintenance_type text,
  p_performed_at timestamptz default now(),
  p_cost numeric default 0,
  p_notes text default null,
  p_next_due_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_type text := btrim(coalesce(p_maintenance_type, ''));
  v_performed timestamptz := coalesce(p_performed_at, now());
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('ambulance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_type = '' then
    raise exception 'Enter the maintenance type' using errcode = '22023';
  end if;

  if coalesce(p_cost, 0) < 0 then
    raise exception 'Cost cannot be negative' using errcode = '22023';
  end if;

  if p_next_due_date is not null and p_next_due_date < v_performed::date then
    raise exception 'The next service date cannot be before the service date'
      using errcode = '22023';
  end if;

  if not exists (select 1 from public.ambulance_vehicles where id = p_vehicle_id) then
    raise exception 'Ambulance not found' using errcode = '22023';
  end if;

  insert into public.ambulance_maintenance (
    vehicle_id, maintenance_type, performed_at, performed_by,
    cost, notes, next_due_date
  )
  values (
    p_vehicle_id,
    v_type,
    v_performed,
    v_actor,
    coalesce(p_cost, 0),
    nullif(btrim(coalesce(p_notes, '')), ''),
    p_next_due_date
  )
  returning id into v_id;

  update public.ambulance_vehicles
  set last_service_date = v_performed::date,
      next_service_due = coalesce(p_next_due_date, next_service_due),
      updated_by = v_actor,
      updated_at = now()
  where id = p_vehicle_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'ambulance.maintenance.record', 'ambulance_vehicle', p_vehicle_id,
    'Recorded ambulance maintenance.',
    jsonb_build_object(
      'source', 'record_ambulance_maintenance',
      'maintenance_type', v_type,
      'cost', coalesce(p_cost, 0),
      'next_due_date', p_next_due_date
    )
  );

  return v_id;
end;
$$;

create or replace function public.record_ambulance_fuel(
  p_vehicle_id uuid,
  p_liters numeric,
  p_cost numeric default 0,
  p_odometer_km numeric default null,
  p_fuel_level numeric default null,
  p_fueled_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_vehicle public.ambulance_vehicles%rowtype;
  v_odometer numeric;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('ambulance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_vehicle
  from public.ambulance_vehicles
  where id = p_vehicle_id
  for update;

  if not found then
    raise exception 'Ambulance not found' using errcode = '22023';
  end if;

  if p_liters is null or p_liters <= 0 then
    raise exception 'Enter the liters purchased' using errcode = '22023';
  end if;

  if coalesce(p_cost, 0) < 0 then
    raise exception 'Cost cannot be negative' using errcode = '22023';
  end if;

  v_odometer := coalesce(p_odometer_km, v_vehicle.odometer_km);

  if v_odometer < v_vehicle.odometer_km then
    raise exception 'The odometer cannot go backwards from % km', v_vehicle.odometer_km
      using errcode = '22023';
  end if;

  if p_fuel_level is not null and (p_fuel_level < 0 or p_fuel_level > 100) then
    raise exception 'The fuel level must be between 0 and 100' using errcode = '22023';
  end if;

  insert into public.ambulance_fuel_records (
    vehicle_id, fueled_at, liters, cost, odometer_km, recorded_by
  )
  values (
    p_vehicle_id,
    coalesce(p_fueled_at, now()),
    p_liters,
    coalesce(p_cost, 0),
    v_odometer,
    v_actor
  )
  returning id into v_id;

  update public.ambulance_vehicles
  set odometer_km = v_odometer,
      fuel_level = coalesce(p_fuel_level, fuel_level),
      updated_by = v_actor,
      updated_at = now()
  where id = p_vehicle_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'ambulance.fuel.record', 'ambulance_vehicle', p_vehicle_id,
    'Recorded ambulance fuel purchase.',
    jsonb_build_object(
      'source', 'record_ambulance_fuel',
      'liters', p_liters,
      'cost', coalesce(p_cost, 0),
      'odometer_km', v_odometer,
      'fuel_level', p_fuel_level
    )
  );

  return v_id;
end;
$$;

revoke all on function public.record_ambulance_maintenance(
  uuid, text, timestamptz, numeric, text, date
) from public;
grant execute on function public.record_ambulance_maintenance(
  uuid, text, timestamptz, numeric, text, date
) to authenticated, service_role;

revoke all on function public.record_ambulance_fuel(
  uuid, numeric, numeric, numeric, numeric, timestamptz
) from public;
grant execute on function public.record_ambulance_fuel(
  uuid, numeric, numeric, numeric, numeric, timestamptz
) to authenticated, service_role;

-- ============================================================================
-- Housekeeping cancel comparison fix (20261119001900_housekeeping_cancel_fix.sql)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — fix cleaning assignment cancel comparison
-- Migration 20261119001900. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- db lint caught `current_assignment = p_request_id` comparing text to uuid
-- (42883). Cancelling a request that already had an assignee would have thrown.
-- The column stores the request id as text, so cast the parameter explicitly.

create or replace function public.advance_cleaning_request(
  p_request_id uuid,
  p_action text,
  p_staff_id uuid default null,
  p_method text default null,
  p_chemical text default null,
  p_contact_minutes integer default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.cleaning_requests%rowtype;
  v_staff public.housekeeping_staff%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('housekeeping.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_request
  from public.cleaning_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Cleaning request not found' using errcode = '22023';
  end if;

  if v_request.status in ('verified', 'cancelled') then
    raise exception 'This request is already closed' using errcode = '22023';
  end if;

  if p_action = 'assign' then
    if v_request.status <> 'requested' or v_request.assigned_staff_id is not null then
      raise exception 'This request is already assigned' using errcode = '22023';
    end if;

    if p_staff_id is null then
      raise exception 'Select a housekeeping staff member' using errcode = '22023';
    end if;

    select * into v_staff
    from public.housekeeping_staff
    where id = p_staff_id
    for update;

    if not found then
      raise exception 'Select a housekeeping staff member' using errcode = '22023';
    end if;

    if v_staff.status = 'off_duty' then
      raise exception 'This staff member is off duty' using errcode = '22023';
    end if;

    if v_staff.current_assignment is not null then
      raise exception 'This staff member already has an active assignment'
        using errcode = '22023';
    end if;

    update public.cleaning_requests
    set assigned_staff_id = p_staff_id,
        status = 'assigned',
        updated_by = v_actor
    where id = p_request_id;

    update public.housekeeping_staff
    set current_assignment = p_request_id::text,
        updated_at = now()
    where id = p_staff_id;

  elsif p_action = 'start' then
    if v_request.assigned_staff_id is null then
      raise exception 'Assign the request before starting it' using errcode = '22023';
    end if;

    if v_request.status <> 'assigned' then
      raise exception 'Only assigned requests can be started' using errcode = '22023';
    end if;

    update public.cleaning_requests
    set status = 'in_progress',
        started_at = coalesce(started_at, now()),
        updated_by = v_actor
    where id = p_request_id;

  elsif p_action = 'complete' then
    if v_request.status <> 'in_progress' then
      raise exception 'Only in-progress requests can be completed' using errcode = '22023';
    end if;

    if btrim(coalesce(p_method, '')) = ''
      or btrim(coalesce(p_chemical, '')) = ''
      or p_contact_minutes is null
      or p_contact_minutes <= 0 then
      raise exception 'A disinfection method, chemical and contact time are required'
        using errcode = '22023';
    end if;

    insert into public.disinfection_records (
      request_id, method, chemical, contact_time_minutes, performed_by, notes
    )
    values (
      p_request_id,
      btrim(p_method),
      btrim(p_chemical),
      p_contact_minutes,
      v_actor,
      nullif(btrim(coalesce(p_notes, '')), '')
    )
    on conflict (request_id) do update
    set method = excluded.method,
        chemical = excluded.chemical,
        contact_time_minutes = excluded.contact_time_minutes,
        performed_by = excluded.performed_by,
        notes = excluded.notes;

    update public.cleaning_requests
    set status = 'completed',
        completed_at = now(),
        disinfection_used = btrim(p_chemical),
        updated_by = v_actor
    where id = p_request_id;

    update public.housekeeping_staff
    set completed_today = completed_today + 1,
        current_assignment = null,
        updated_at = now()
    where id = v_request.assigned_staff_id;

  elsif p_action = 'verify' then
    if v_request.status <> 'completed' then
      raise exception 'Only completed requests can be verified' using errcode = '22023';
    end if;

    update public.cleaning_requests
    set status = 'verified',
        verified_at = now(),
        verified_by = v_actor,
        updated_by = v_actor
    where id = p_request_id;

  elsif p_action = 'cancel' then
    update public.cleaning_requests
    set status = 'cancelled',
        updated_by = v_actor
    where id = p_request_id;

    if v_request.assigned_staff_id is not null then
      update public.housekeeping_staff
      set current_assignment = null,
          updated_at = now()
      where id = v_request.assigned_staff_id
        and current_assignment = p_request_id::text;
    end if;

  else
    raise exception 'Unsupported cleaning action' using errcode = '22023';
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'housekeeping.request.' || p_action,
    'cleaning_request',
    p_request_id,
    'Updated a cleaning request.',
    jsonb_build_object(
      'source', 'advance_cleaning_request',
      'action', p_action,
      'staff_id', p_staff_id
    )
  );

  return p_request_id;
end;
$$;

revoke all on function public.advance_cleaning_request(
  uuid, text, uuid, text, text, integer, text
) from public;
grant execute on function public.advance_cleaning_request(
  uuid, text, uuid, text, text, integer, text
) to authenticated, service_role;

-- ============================================================================
-- Clear db lint warnings (20261119002000_lint_warnings.sql)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — clear remaining db lint warnings
-- Migration 20261119002000. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- db lint reported:
--   verify_coverage: variable "v_policy" is never read (only used for FOUND)
--   record_blood_donation: loop variable "v_index" shadows the declared one
-- Both are behaviour-preserving rewrites.

create or replace function public.verify_coverage(
  p_policy_id uuid,
  p_status text,
  p_reference_number text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_verification_id uuid;
  v_reference text := btrim(coalesce(p_reference_number, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('insurance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_status not in ('verified', 'failed') then
    raise exception 'Unsupported verification status' using errcode = '22023';
  end if;

  if v_reference = '' then
    raise exception 'A payer reference number is required'
      using errcode = '22023';
  end if;

  perform 1
  from public.insurance_policies
  where id = p_policy_id
  for update;

  if not found then
    raise exception 'Insurance policy not found' using errcode = '22023';
  end if;

  insert into public.coverage_verifications (
    policy_id, status, reference_number, verified_by, notes
  )
  values (
    p_policy_id,
    p_status,
    v_reference,
    v_actor,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_verification_id;

  update public.insurance_policies
  set verification_status = p_status,
      last_verified_at = now(),
      updated_by = v_actor
  where id = p_policy_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'insurance.coverage.verify',
    'insurance_policy',
    p_policy_id,
    'Recorded a coverage verification.',
    jsonb_build_object(
      'source', 'verify_coverage',
      'status', p_status,
      'reference_number', v_reference
    )
  );

  return v_verification_id;
end;
$$;

create or replace function public.record_blood_donation(
  p_donor_id uuid,
  p_units integer default 1,
  p_collection_site text default 'Blood bank',
  p_component text default 'whole_blood',
  p_expiry_days integer default 35
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_donor public.blood_donors%rowtype;
  v_donation_id uuid;
  v_donation_number text;
  v_unit_number text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('blood_bank.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_donor
  from public.blood_donors
  where id = p_donor_id
  for update;

  if not found then
    raise exception 'Blood donor not found' using errcode = '22023';
  end if;

  if v_donor.eligibility_status <> 'eligible' then
    raise exception 'Only eligible donors can donate' using errcode = '22023';
  end if;

  if p_units is null or p_units < 1 or p_units > 4 then
    raise exception 'Units collected must be between 1 and 4'
      using errcode = '22023';
  end if;

  if p_component not in (
    'whole_blood', 'packed_rbc', 'plasma', 'platelets', 'cryoprecipitate'
  ) then
    raise exception 'Unsupported blood component' using errcode = '22023';
  end if;

  if p_expiry_days is null or p_expiry_days < 1 then
    raise exception 'Expiry days must be at least 1' using errcode = '22023';
  end if;

  v_donation_number := public.generate_reference_number('BDN');

  insert into public.blood_donations (
    donation_number, donor_id, blood_type, units_collected,
    collection_site, status, created_by
  )
  values (
    v_donation_number, p_donor_id, v_donor.blood_type, p_units,
    coalesce(nullif(btrim(p_collection_site), ''), 'Blood bank'),
    'collected', v_actor
  )
  returning id into v_donation_id;

  for v_unit_seq in 1..p_units loop
    v_unit_number := public.generate_reference_number('BU');

    insert into public.blood_units (
      unit_number, donation_id, donor_id, blood_type, component,
      collection_date, expiry_date, status, screening_status
    )
    values (
      v_unit_number,
      v_donation_id,
      p_donor_id,
      v_donor.blood_type,
      p_component::text,
      current_date,
      current_date + p_expiry_days,
      'available',
      'pending'
    );
  end loop;

  update public.blood_donors
  set last_donation_date = current_date,
      total_donations = total_donations + 1,
      updated_by = v_actor
  where id = p_donor_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'blood_bank.donation.record',
    'blood_donation',
    v_donation_id,
    'Recorded a blood donation.',
    jsonb_build_object(
      'source', 'record_blood_donation',
      'donation_number', v_donation_number,
      'units', p_units,
      'component', p_component
    )
  );

  return v_donation_id;
end;
$$;

-- ============================================================================
-- Remaining private buckets and policies (20261119002100_storage_buckets_complete.sql)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — remaining private buckets and path-scoped storage policies
-- Migration 20261119002100. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Migration 041 created three buckets with permission-only policies that are
-- already verified in use, so they stay untouched. This adds the five remaining
-- private buckets and scopes each new bucket to the patient (or user) id in the
-- first path segment.

-- Safe cast for path segments: an invalid folder name yields null instead of
-- raising inside a policy comparison.
create or replace function public.try_uuid(p_value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p_value::uuid;
exception when others then
  return null;
end;
$$;

revoke all on function public.try_uuid(text) from public;
grant execute on function public.try_uuid(text) to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    false,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'medical-record-files',
    'medical-record-files',
    false,
    26214400,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'prescription-files',
    'prescription-files',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'billing-documents',
    'billing-documents',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'hospital-documents',
    'hospital-documents',
    false,
    26214400,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Avatars: one folder per user id
-- ----------------------------------------------------------------------------
drop policy if exists "avatars_select" on storage.objects;
create policy "avatars_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_insert" on storage.objects;
create policy "avatars_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_update" on storage.objects;
create policy "avatars_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_delete" on storage.objects;
create policy "avatars_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ----------------------------------------------------------------------------
-- Medical record files: patient-scoped
-- ----------------------------------------------------------------------------
drop policy if exists "medical_record_files_select" on storage.objects;
create policy "medical_record_files_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'medical-record-files'
  and public.has_permission('medical_record.view')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

drop policy if exists "medical_record_files_insert" on storage.objects;
create policy "medical_record_files_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'medical-record-files'
  and public.has_permission('medical_record.create')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

drop policy if exists "medical_record_files_delete" on storage.objects;
create policy "medical_record_files_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'medical-record-files'
  and public.has_permission('medical_record.update')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

-- ----------------------------------------------------------------------------
-- Prescription files: patient-scoped
-- ----------------------------------------------------------------------------
drop policy if exists "prescription_files_select" on storage.objects;
create policy "prescription_files_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'prescription-files'
  and public.has_permission('prescription.view')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

drop policy if exists "prescription_files_insert" on storage.objects;
create policy "prescription_files_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'prescription-files'
  and public.has_permission('prescription.create')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

drop policy if exists "prescription_files_delete" on storage.objects;
create policy "prescription_files_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'prescription-files'
  and public.has_permission('prescription.create')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

-- ----------------------------------------------------------------------------
-- Billing documents: patient-scoped
-- ----------------------------------------------------------------------------
drop policy if exists "billing_documents_select" on storage.objects;
create policy "billing_documents_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'billing-documents'
  and public.has_permission('billing.view')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

drop policy if exists "billing_documents_insert" on storage.objects;
create policy "billing_documents_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'billing-documents'
  and public.has_permission('billing.invoice.create')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

drop policy if exists "billing_documents_delete" on storage.objects;
create policy "billing_documents_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'billing-documents'
  and public.has_permission('billing.invoice.update')
  and public.can_access_patient(
    public.try_uuid((storage.foldername(name))[1])
  )
);

-- ----------------------------------------------------------------------------
-- Hospital documents: administrators only
-- ----------------------------------------------------------------------------
drop policy if exists "hospital_documents_select" on storage.objects;
create policy "hospital_documents_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'hospital-documents' and public.is_admin());

drop policy if exists "hospital_documents_insert" on storage.objects;
create policy "hospital_documents_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'hospital-documents' and public.is_admin());

drop policy if exists "hospital_documents_update" on storage.objects;
create policy "hospital_documents_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'hospital-documents' and public.is_admin())
with check (bucket_id = 'hospital-documents' and public.is_admin());

drop policy if exists "hospital_documents_delete" on storage.objects;
create policy "hospital_documents_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'hospital-documents' and public.is_admin());

-- ============================================================================
-- Duplicate patient registration guard (20261119002200_patient_duplicate_guard.sql)
-- ============================================================================
-- ============================================================================
-- SPMC HMS — reject duplicate patient registration
-- Migration 20261119002200. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- MRNs are generated, so the identifier alone can never collide. The practical
-- duplicate is the same person registered twice: identical first and last name
-- and date of birth. The RPC raises a readable error and a unique expression
-- index closes the race between two simultaneous registrations.

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
  v_existing_mrn text;
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

  select medical_record_number
  into v_existing_mrn
  from public.patients
  where lower(btrim(first_name)) = lower(btrim(p_first_name))
    and lower(btrim(last_name)) = lower(btrim(p_last_name))
    and date_of_birth = p_date_of_birth
  limit 1;

  if v_existing_mrn is not null then
    raise exception 'A patient with this name and date of birth is already registered (MRN %)',
      v_existing_mrn
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

-- Two operators registering the same person at the same moment still collide.
create unique index if not exists idx_patients_identity_unique
  on public.patients (
    lower(btrim(first_name)),
    lower(btrim(last_name)),
    date_of_birth
  );

-- Historical and newly recorded observations start unverified. Existing vitals
-- writers can continue to omit this field.
alter table public.vital_signs
  add column verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified'));

-- A user recording an observation cannot also assert that it was verified.
alter policy vital_signs_insert_authorized on public.vital_signs
with check (
  public.has_permission('vital_signs.record')
  and public.can_access_patient(patient_id)
  and recorded_by = auth.uid()
  and verification_status = 'unverified'
);

-- Link the medication catalogue to inventory by stable IDs. Stock balances
-- stay in inventory_batches, where dispensing and inventory adjustments
-- already serialize changes and write the stock transaction ledger.
create table public.medication_stock (
  medication_id uuid primary key references public.medications(id) on delete cascade,
  inventory_item_id uuid not null unique references public.inventory_items(id) on delete restrict
);

insert into public.medication_stock (medication_id, inventory_item_id)
select medication.id, item.id
from public.medications as medication
join public.inventory_items as item on item.item_code = medication.medication_code;

alter table public.medication_stock enable row level security;
revoke all on public.medication_stock from anon, authenticated;
grant select on public.medication_stock to authenticated;
grant select, insert, update, delete on public.medication_stock to service_role;

create policy medication_stock_select on public.medication_stock
for select to authenticated
using (public.has_permission('pharmacy.view'));

create view public.medication_stock_balances
with (security_invoker = true) as
select
  medication.id,
  medication.medication_code,
  medication.generic_name,
  medication.brand_name,
  medication.strength,
  medication.dosage_form,
  medication.unit,
  coalesce(sum(batch.quantity_remaining), 0) as quantity_on_hand,
  item.reorder_level,
  min(batch.expiration_date) filter (where batch.quantity_remaining > 0) as nearest_expiration
from public.medication_stock as stock
join public.medications as medication on medication.id = stock.medication_id
join public.inventory_items as item on item.id = stock.inventory_item_id
left join public.inventory_batches as batch on batch.item_id = item.id
where medication.is_active and item.is_active
group by medication.id, item.id;

revoke all on public.medication_stock_balances from anon, authenticated;
grant select on public.medication_stock_balances to authenticated, service_role;

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

    select item.id
    into v_inventory_item_id
    from public.medication_stock as stock
    join public.inventory_items as item on item.id = stock.inventory_item_id
    where stock.medication_id = v_item.medication_id
      and item.is_active;

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

create or replace function public.update_bed_status(
  p_bed_id uuid,
  p_expected_status public.bed_status,
  p_status public.bed_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_previous_status public.bed_status;
begin
  if v_actor is null or not public.has_permission('bed.manage') then
    raise exception 'Bed management permission required' using errcode = '42501';
  end if;

  if p_expected_status is null or p_status is null or p_status = 'occupied' then
    raise exception 'Invalid manual bed status' using errcode = '22023';
  end if;

  -- Admission and transfer also lock the bed before assigning a patient.
  select status into v_previous_status
  from public.beds
  where id = p_bed_id
  for update;

  if not found then
    raise exception 'Bed not found' using errcode = 'P0002';
  end if;

  if v_previous_status <> p_expected_status then
    raise exception 'Bed status changed' using errcode = '40001';
  end if;

  if v_previous_status = 'occupied' or exists (
    select 1
    from public.admission_bed_assignments
    where bed_id = p_bed_id and released_at is null
  ) then
    raise exception 'Bed has a patient assignment' using errcode = '23514';
  end if;

  if v_previous_status = p_status then
    return;
  end if;

  update public.beds
  set status = p_status, updated_by = v_actor
  where id = p_bed_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  ) values (
    v_actor, 'bed.status.update', 'bed', p_bed_id, 'Changed bed status.',
    jsonb_build_object('previous_status', v_previous_status, 'status', p_status)
  );
end;
$$;

revoke all on function public.update_bed_status(uuid, public.bed_status, public.bed_status)
  from public, anon;
grant execute on function public.update_bed_status(uuid, public.bed_status, public.bed_status)
  to authenticated;

-- Complete HR setup for a staff profile that already has a sign-in account.
create or replace function public.create_hr_employee_details(
  p_staff_profile_id uuid,
  p_position text,
  p_hire_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_is_active boolean;
  v_position text := btrim(coalesce(p_position, ''));
begin
  if v_actor is null or not public.has_permission('hr.manage') then
    raise exception 'HR management permission required' using errcode = '42501';
  end if;

  if char_length(v_position) not between 2 and 120 or p_hire_date is null then
    raise exception 'Enter a valid position and hire date' using errcode = '22023';
  end if;

  select is_active into v_is_active
  from public.staff_profiles
  where id = p_staff_profile_id
  for key share;

  if not found then
    raise exception 'Staff record not found' using errcode = 'P0002';
  end if;

  insert into public.hr_employee_details (
    staff_profile_id, position, hire_date, employment_status, created_by
  ) values (
    p_staff_profile_id, v_position, p_hire_date,
    case when v_is_active then 'active' else 'inactive' end, v_actor
  )
  on conflict (staff_profile_id) do nothing;

  if not found then
    raise exception 'An HR employee record already exists for this staff member'
      using errcode = '23505';
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  ) values (
    v_actor, 'hr.employee.create', 'staff_profile', p_staff_profile_id,
    'Created an employee record for existing staff.',
    jsonb_build_object('source', 'create_hr_employee_details')
  );

  return p_staff_profile_id;
end;
$$;

revoke all on function public.create_hr_employee_details(uuid, text, date)
  from public, anon;
grant execute on function public.create_hr_employee_details(uuid, text, date)
  to authenticated;

-- ============================================================================
-- Transactional prescription creation (create_prescription)
-- ============================================================================

-- Creates a prescription, its medication items, and an audit entry in one
-- transaction. SECURITY DEFINER because audit_logs has no authenticated insert
-- policy; the function checks auth.uid(), prescription.create, and patient
-- access explicitly before writing.

create or replace function public.create_prescription(
  p_patient_id uuid,
  p_encounter_id uuid,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_prescription_id uuid;
  v_number text;
  v_item jsonb;
  v_medication_id uuid;
  v_dosage text;
  v_frequency text;
  v_duration integer;
  v_quantity numeric;
  v_instructions text;
  v_count integer := 0;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('prescription.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_patient_id is null or p_encounter_id is null then
    raise exception 'Patient and encounter are required' using errcode = '22023';
  end if;

  if not public.can_access_patient(p_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.encounters e
    where e.id = p_encounter_id
      and e.patient_id = p_patient_id
      and e.clinical_status in ('open', 'in_progress')
  ) then
    raise exception 'Select an active encounter for this patient'
      using errcode = '22023';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one medication is required'
      using errcode = '22023';
  end if;

  if char_length(coalesce(p_notes, '')) > 1000 then
    raise exception 'Notes must be 1000 characters or fewer'
      using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) > 20 then
    raise exception 'A prescription cannot exceed 20 medications'
      using errcode = '22023';
  end if;

  v_number := public.generate_reference_number('RX');

  insert into public.prescriptions (
    prescription_number,
    patient_id,
    encounter_id,
    prescribed_by,
    updated_by,
    notes
  )
  values (
    v_number,
    p_patient_id,
    p_encounter_id,
    v_actor,
    v_actor,
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning id into v_prescription_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_dosage := btrim(coalesce(v_item ->> 'dosage', ''));
    v_frequency := btrim(coalesce(v_item ->> 'frequency', ''));
    v_instructions := nullif(
      btrim(coalesce(v_item ->> 'instructions', '')),
      ''
    );

    if v_dosage = '' or v_frequency = '' then
      raise exception 'Dosage and frequency are required for every medication'
        using errcode = '22023';
    end if;

    if char_length(v_dosage) > 120 or char_length(v_frequency) > 120 then
      raise exception 'Dosage and frequency must be 120 characters or fewer'
        using errcode = '22023';
    end if;

    if char_length(coalesce(v_instructions, '')) > 500 then
      raise exception 'Instructions must be 500 characters or fewer'
        using errcode = '22023';
    end if;

    if coalesce(v_item ->> 'quantity', '') !~ '^[0-9]+(\.[0-9]+)?$' then
      raise exception 'Quantity must be a positive number'
        using errcode = '22023';
    end if;

    v_quantity := (v_item ->> 'quantity')::numeric;

    if v_quantity <= 0 then
      raise exception 'Quantity must be greater than zero'
        using errcode = '22023';
    end if;

    if v_quantity > 100000 then
      raise exception 'Quantity is too large'
        using errcode = '22023';
    end if;

    v_duration := null;

    if nullif(btrim(coalesce(v_item ->> 'duration_days', '')), '') is not null then
      if (v_item ->> 'duration_days') !~ '^[0-9]+$' then
        raise exception 'Duration must be a whole number of days'
          using errcode = '22023';
      end if;

      v_duration := (v_item ->> 'duration_days')::integer;

      if v_duration <= 0 or v_duration > 3650 then
        raise exception 'Duration must be between 1 and 3650 days'
          using errcode = '22023';
      end if;
    end if;

    select m.id
    into v_medication_id
    from public.medications m
    where m.id::text = v_item ->> 'medication_id'
      and m.is_active;

    if v_medication_id is null then
      raise exception 'Select a valid active medication'
        using errcode = '22023';
    end if;

    insert into public.prescription_items (
      prescription_id,
      medication_id,
      dosage,
      frequency,
      duration_days,
      quantity,
      instructions
    )
    values (
      v_prescription_id,
      v_medication_id,
      v_dosage,
      v_frequency,
      v_duration,
      v_quantity,
      v_instructions
    );

    v_count := v_count + 1;
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
    'prescription.create',
    'prescription',
    v_prescription_id,
    'Issued a prescription.',
    jsonb_build_object(
      'source', 'create_prescription',
      'encounter_id', p_encounter_id,
      'item_count', v_count
    )
  );

  return v_prescription_id;
end;
$$;

revoke all on function public.create_prescription(uuid, uuid, text, jsonb) from public;
grant execute on function public.create_prescription(uuid, uuid, text, jsonb)
  to authenticated, service_role;

-- ============================================================================
-- Database change alerts for administrators (audit_change_alert)
-- ============================================================================

-- Every tracked table change writes an immutable audit entry and fans out an
-- in-app notification to active Super Administrators and Hospital
-- Administrators (excluding the actor). Clinical values are not copied into the
-- alert; only the table, operation, and changed field names are recorded.

create or replace function public.audit_change_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_source text;
  v_actor_label text;
  v_entity_type text := tg_table_name;
  v_entity_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_changed jsonb := '[]'::jsonb;
  v_changed_text text;
  v_changed_suffix text := '';
  v_operation text := lower(tg_op);
  v_verb text;
  v_severity text;
  v_description text;
  v_title text;
  v_message text;
begin
  if tg_op <> 'INSERT' then
    v_before := to_jsonb(old);
  end if;

  if tg_op <> 'DELETE' then
    v_after := to_jsonb(new);
  end if;

  v_entity_id := public.try_uuid(
    coalesce(v_after ->> 'id', v_before ->> 'id')
  );

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(j.key order by j.key), '[]'::jsonb)
    into v_changed
    from jsonb_object_keys(v_after) as j(key)
    where v_after -> j.key is distinct from v_before -> j.key
      and j.key not in ('updated_at', 'updated_by');

    select string_agg(value, ', ' order by value)
    into v_changed_text
    from jsonb_array_elements_text(v_changed) as t(value);
  end if;

  if coalesce(v_changed_text, '') <> '' then
    v_changed_suffix := format(' (%s)', v_changed_text);
  end if;

  if v_actor is not null then
    select p.full_name
    into v_actor_label
    from public.profiles p
    where p.id = v_actor;

    v_actor_source := 'app_user';
    v_actor_label := coalesce(v_actor_label, 'Unregistered user');
  elsif auth.role() = 'service_role' then
    v_actor_source := 'service_role';
    v_actor_label := 'System service role';
  else
    v_actor_source := 'direct_database';
    v_actor_label := 'Direct database';
  end if;

  v_verb := case
    when v_operation = 'insert' then 'created'
    when v_operation = 'update' then 'updated'
    else 'deleted'
  end;

  v_description := case v_actor_source
    when 'direct_database' then
      format('Direct database %s on a %s record.', v_operation, v_entity_type)
    else
      format(
        '%s %s a %s record.',
        case when v_actor_source = 'service_role' then 'System' else v_actor_label end,
        v_verb,
        v_entity_type
      )
  end;

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
    format('%s.%s', v_entity_type, v_operation),
    v_entity_type,
    v_entity_id,
    v_description,
    jsonb_build_object(
      'source', 'audit_change_alert',
      'operation', upper(v_operation),
      'actor_source', v_actor_source,
      'actor_label', v_actor_label,
      'is_direct_db', v_actor_source = 'direct_database',
      'outcome', case
        when v_actor_source = 'direct_database' then 'critical'
        when v_operation = 'delete' then 'warning'
        else 'success'
      end,
      'changed_fields', v_changed
    )
  );

  v_severity := case
    when v_actor_source = 'direct_database' then 'critical'
    when v_operation = 'delete' then 'warning'
    else 'info'
  end;

  v_title := case
    when v_actor_source = 'direct_database'
      then format('Direct database change: %s', v_entity_type)
    else format('Database change: %s', v_entity_type)
  end;

  v_message := case v_actor_source
    when 'direct_database' then
      format(
        'Direct database %s on %s%s.',
        v_operation,
        v_entity_type,
        v_changed_suffix
      )
    when 'service_role' then
      format(
        'Service-role %s on %s%s.',
        v_operation,
        v_entity_type,
        v_changed_suffix
      )
    else
      format(
        '%s %s a %s record%s.',
        v_actor_label,
        v_verb,
        v_entity_type,
        v_changed_suffix
      )
  end;

  insert into public.notifications (
    user_id,
    title,
    message,
    notification_type,
    severity,
    related_entity_type,
    related_entity_id
  )
  select
    p.id,
    v_title,
    v_message,
    'system',
    v_severity,
    v_entity_type,
    v_entity_id
  from public.profiles p
  where p.is_active
    and (v_actor is null or p.id <> v_actor)
    and exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p.id
        and r.slug in ('super_admin', 'hospital_admin')
    )
    and not exists (
      select 1
      from public.notification_preferences np
      where np.user_id = p.id
        and np.category = 'system'
        and np.in_app = false
    );

  return null;
end;
$$;

revoke all on function public.audit_change_alert() from public;

revoke all on function public.audit_change_alert() from public;

revoke all on function public.audit_change_alert() from public;

revoke all on function public.audit_change_alert() from public;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'patients',
    'encounters',
    'prescriptions',
    'invoices',
    'payments',
    'admissions',
    'beds',
    'staff_profiles',
    'profiles',
    'user_roles',
    'medications',
    'inventory_items',
    'laboratory_results',
    'radiology_reports',
    'surgery_cases',
    'blood_units',
    'blood_requests',
    'insurance_providers',
    'departments'
  ] loop
    if to_regclass(format('public.%I', v_table)) is null then
      continue;
    end if;

    execute format(
      'drop trigger if exists trg_audit_change_alert on public.%I',
      v_table
    );
    execute format(
      'create trigger trg_audit_change_alert
         after insert or update or delete on public.%I
         for each row execute function public.audit_change_alert()',
      v_table
    );
  end loop;
end;
$$;

-- ============================================================================
-- SPMC HMS — module view permissions
-- Migration: 20261126000100_module_view_permissions.sql
-- Mirrors supabase/migrations/20261126000100_module_view_permissions.sql;
-- keep both in sync.
-- ============================================================================

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

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'insurance.view', 'ambulance.view', 'notification.view', 'reports.view'
])
where r.slug = 'receptionist'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'blood_bank.view', 'ambulance.view', 'dietary.view', 'mortuary.view',
  'notification.view', 'reports.view'
])
where r.slug = 'physician'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'blood_bank.view', 'ambulance.view', 'dietary.view', 'housekeeping.view',
  'equipment.view', 'mortuary.view', 'notification.view', 'reports.view'
])
where r.slug = 'nurse'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'blood_bank.view', 'notification.view', 'reports.view'
])
where r.slug = 'laboratory_staff'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'notification.view', 'reports.view'
])
where r.slug = 'radiology_staff'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'notification.view', 'reports.view'
])
where r.slug = 'pharmacist'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'insurance.view', 'notification.view', 'reports.view'
])
where r.slug = 'billing_staff'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = any (array[
  'equipment.view', 'notification.view', 'reports.view'
])
where r.slug = 'inventory_staff'
on conflict do nothing;

-- ============================================================================
-- SPMC HMS — bed management per room
-- Migration: 20261126000200_bed_management.sql
-- Mirrors supabase/migrations/20261126000200_bed_management.sql;
-- keep both in sync.
-- ============================================================================

alter table public.beds
  add column if not exists is_active boolean not null default true;

create index if not exists idx_beds_room_active
  on public.beds(room_id)
  where is_active;

create or replace function public.add_bed(
  p_room_id uuid,
  p_bed_number text,
  p_status text default 'available'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_bed_number text := btrim(coalesce(p_bed_number, ''));
  v_bed_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('bed.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.rooms where id = p_room_id
  ) then
    raise exception 'Room not found' using errcode = '22023';
  end if;

  if v_bed_number = '' then
    raise exception 'A bed number is required' using errcode = '22023';
  end if;

  if p_status not in ('available', 'reserved', 'maintenance') then
    raise exception 'Unsupported bed status' using errcode = '22023';
  end if;

  -- Re-adding a previously retired bed number reactivates the same row so
  -- history stays attached and the (room_id, bed_number) unique key holds.
  select id into v_bed_id
  from public.beds
  where room_id = p_room_id
    and bed_number = v_bed_number
    and is_active = false;

  if found then
    update public.beds
    set
      is_active = true,
      status = p_status::public.bed_status,
      updated_by = v_actor
    where id = v_bed_id;
  else
    insert into public.beds (
      room_id, bed_number, status, created_by
    )
    values (
      p_room_id,
      v_bed_number,
      p_status::public.bed_status,
      v_actor
    )
    returning id into v_bed_id;
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'bed.add',
    'bed',
    v_bed_id,
    'Added a bed to a room.',
    jsonb_build_object(
      'source', 'add_bed',
      'room_id', p_room_id,
      'bed_number', v_bed_number,
      'status', p_status
    )
  );

  return v_bed_id;
end;
$$;

create or replace function public.remove_bed(p_bed_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_bed public.beds;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('bed.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_bed from public.beds where id = p_bed_id;

  if not found then
    raise exception 'Bed not found' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.admission_bed_assignments
    where bed_id = p_bed_id and released_at is null
  ) then
    raise exception 'Bed has an active patient assignment'
      using errcode = '23514';
  end if;

  if v_bed.status = 'occupied' then
    raise exception 'Bed is occupied; discharge or transfer the patient first'
      using errcode = '23514';
  end if;

  update public.beds
  set is_active = false, updated_by = v_actor
  where id = p_bed_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'bed.remove',
    'bed',
    p_bed_id,
    'Retired a bed.',
    jsonb_build_object(
      'source', 'remove_bed',
      'room_id', v_bed.room_id,
      'bed_number', v_bed.bed_number
    )
  );
end;
$$;

revoke all on function public.add_bed(uuid, text, text) from public;
revoke all on function public.remove_bed(uuid) from public;

grant execute on function public.add_bed(uuid, text, text)
  to authenticated, service_role;
grant execute on function public.remove_bed(uuid)
  to authenticated, service_role;


-- ============================================================================
-- SPMC HMS — nurse assignment and nursing assessments
-- Migration: 20261126000300_nursing_assignment.sql
-- Mirrors supabase/migrations/20261126000300_nursing_assignment.sql;
-- keep both in sync.
-- ============================================================================

-- ============================================================================
-- SPMC HMS — nurse assignment and nursing assessments
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Permission
-- ----------------------------------------------------------------------------
insert into public.permissions (slug)
values ('nursing.assign')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'nursing.assign'
where r.slug in ('nurse', 'physician')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- Let nursing staff read care assignments (previously admin/physician only)
-- ----------------------------------------------------------------------------
drop policy if exists "patient_care_assignments_select_admin_or_physician"
  on public.patient_care_assignments;

create policy "patient_care_assignments_select_participants"
on public.patient_care_assignments
for select
to authenticated
using (
  public.is_admin()
  or public.has_role('physician')
  or public.has_permission('nursing.view')
  or exists (
    select 1
    from public.staff_profiles sp
    where sp.id = patient_care_assignments.staff_id
      and sp.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- Active nurses for the assignment picker
-- ----------------------------------------------------------------------------
create or replace function public.list_nurses()
returns table (id uuid, full_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_permission('nursing.assign') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  return query
    select
      sp.id,
      btrim(concat_ws(' ', sp.first_name, sp.middle_name, sp.last_name))::text
    from public.staff_profiles sp
    join public.profiles pr on pr.id = sp.user_id
    join public.user_roles ur on ur.user_id = sp.user_id
    join public.roles r on r.id = ur.role_id
    where r.slug = 'nurse'
      and sp.is_active
      and pr.is_active
    order by sp.last_name, sp.first_name;
end;
$$;

-- ----------------------------------------------------------------------------
-- Assign a patient to a nurse
-- ----------------------------------------------------------------------------
create or replace function public.assign_nurse(
  p_patient_id uuid,
  p_staff_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_assignment_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('nursing.assign') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.patients where id = p_patient_id
  ) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.staff_profiles sp
    join public.profiles pr on pr.id = sp.user_id
    join public.user_roles ur on ur.user_id = sp.user_id
    join public.roles r on r.id = ur.role_id
    where sp.id = p_staff_id
      and sp.is_active
      and pr.is_active
      and r.slug = 'nurse'
  ) then
    raise exception 'Selected staff is not an active nurse'
      using errcode = '22023';
  end if;

  update public.patient_care_assignments
  set ended_at = now()
  where patient_id = p_patient_id
    and ended_at is null
    and assignment_type ilike '%nurse%';

  insert into public.patient_care_assignments (
    patient_id, staff_id, assignment_type, assigned_by
  )
  values (
    p_patient_id, p_staff_id, 'primary_nurse', v_actor
  )
  returning id into v_assignment_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'care.assign_nurse',
    'patient',
    p_patient_id,
    'Assigned a nurse to a patient.',
    jsonb_build_object(
      'source', 'assign_nurse',
      'staff_id', p_staff_id,
      'assignment_id', v_assignment_id
    )
  );

  return v_assignment_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Remove the active nurse assignment for a patient
-- ----------------------------------------------------------------------------
create or replace function public.unassign_nurse(p_patient_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('nursing.assign') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.patients where id = p_patient_id
  ) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  update public.patient_care_assignments
  set ended_at = now()
  where patient_id = p_patient_id
    and ended_at is null
    and assignment_type ilike '%nurse%';

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'care.unassign_nurse',
    'patient',
    p_patient_id,
    'Removed the nurse assignment for a patient.',
    jsonb_build_object('source', 'unassign_nurse')
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- Record a nursing assessment
-- ----------------------------------------------------------------------------
create or replace function public.record_nursing_assessment(
  p_patient_id uuid,
  p_encounter_id uuid,
  p_assessment_type text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_type text := btrim(coalesce(p_assessment_type, ''));
  v_assessment_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('nursing.assessment.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not public.can_access_patient(p_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_type = '' then
    raise exception 'An assessment type is required' using errcode = '22023';
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

  insert into public.nursing_assessments (
    patient_id, encounter_id, assessment_type, notes, assessed_by
  )
  values (
    p_patient_id,
    p_encounter_id,
    v_type,
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_assessment_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'nursing.assessment.create',
    'patient',
    p_patient_id,
    'Recorded a nursing assessment.',
    jsonb_build_object(
      'source', 'record_nursing_assessment',
      'assessment_type', v_type,
      'assessment_id', v_assessment_id
    )
  );

  return v_assessment_id;
end;
$$;

revoke all on function public.list_nurses() from public;
revoke all on function public.assign_nurse(uuid, uuid) from public;
revoke all on function public.unassign_nurse(uuid) from public;
revoke all on function public.record_nursing_assessment(uuid, uuid, text, text)
  from public;

grant execute on function public.list_nurses()
  to authenticated, service_role;
grant execute on function public.assign_nurse(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.unassign_nurse(uuid)
  to authenticated, service_role;
grant execute on function public.record_nursing_assessment(uuid, uuid, text, text)
  to authenticated, service_role;


-- ============================================================================
-- SPMC HMS — nurse least-privilege cleanup
-- Migration: 20261126000400_nurse_least_privilege.sql
-- Mirrors supabase/migrations/20261126000400_nurse_least_privilege.sql;
-- keep both in sync.
-- ============================================================================

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


-- ============================================================================
-- SPMC HMS — nurses cannot self-assign patients
-- Migration: 20261126000500_nurse_no_self_assign.sql
-- Mirrors supabase/migrations/20261126000500_nurse_no_self_assign.sql;
-- keep both in sync.
-- ============================================================================

-- ============================================================================
-- SPMC HMS — nurses cannot self-assign patients
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Assigning a patient is a clinical allocation made by a physician or an
-- administrator. Nurses receive assignments; they do not assign themselves.

delete from public.role_permissions rp
using public.roles r, public.permissions p
where rp.role_id = r.id
  and rp.permission_id = p.id
  and r.slug = 'nurse'
  and p.slug = 'nursing.assign';


-- ============================================================================
-- SPMC HMS — only administrators assign nurses to patients
-- Migration: 20261126000600_admin_only_nurse_assignment.sql
-- Mirrors supabase/migrations/20261126000600_admin_only_nurse_assignment.sql;
-- keep both in sync.
-- ============================================================================

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


-- ============================================================================
-- SPMC HMS — remove nursing.assign; administrator-only assignment
-- Migration: 20261126000700_drop_nursing_assign_permission.sql
-- Mirrors supabase/migrations/20261126000700_drop_nursing_assign_permission.sql;
-- keep both in sync.
-- ============================================================================

-- ============================================================================
-- SPMC HMS — remove nursing.assign; administrator-only assignment
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Assignment is a hospital-administration action. The permission slug is
-- removed entirely; the RPCs gate on public.is_admin().

create or replace function public.list_nurses()
returns table (id uuid, full_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  return query
    select
      sp.id,
      btrim(concat_ws(' ', sp.first_name, sp.middle_name, sp.last_name))::text
    from public.staff_profiles sp
    join public.profiles pr on pr.id = sp.user_id
    join public.user_roles ur on ur.user_id = sp.user_id
    join public.roles r on r.id = ur.role_id
    where r.slug = 'nurse'
      and sp.is_active
      and pr.is_active
    order by sp.last_name, sp.first_name;
end;
$$;

create or replace function public.assign_nurse(
  p_patient_id uuid,
  p_staff_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_assignment_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.patients where id = p_patient_id
  ) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.staff_profiles sp
    join public.profiles pr on pr.id = sp.user_id
    join public.user_roles ur on ur.user_id = sp.user_id
    join public.roles r on r.id = ur.role_id
    where sp.id = p_staff_id
      and sp.is_active
      and pr.is_active
      and r.slug = 'nurse'
  ) then
    raise exception 'Selected staff is not an active nurse'
      using errcode = '22023';
  end if;

  update public.patient_care_assignments
  set ended_at = now()
  where patient_id = p_patient_id
    and ended_at is null
    and assignment_type ilike '%nurse%';

  insert into public.patient_care_assignments (
    patient_id, staff_id, assignment_type, assigned_by
  )
  values (
    p_patient_id, p_staff_id, 'primary_nurse', v_actor
  )
  returning id into v_assignment_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'care.assign_nurse',
    'patient',
    p_patient_id,
    'Assigned a nurse to a patient.',
    jsonb_build_object(
      'source', 'assign_nurse',
      'staff_id', p_staff_id,
      'assignment_id', v_assignment_id
    )
  );

  return v_assignment_id;
end;
$$;

create or replace function public.unassign_nurse(p_patient_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.patients where id = p_patient_id
  ) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  update public.patient_care_assignments
  set ended_at = now()
  where patient_id = p_patient_id
    and ended_at is null
    and assignment_type ilike '%nurse%';

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'care.unassign_nurse',
    'patient',
    p_patient_id,
    'Removed the nurse assignment for a patient.',
    jsonb_build_object('source', 'unassign_nurse')
  );
end;
$$;

revoke all on function public.list_nurses() from public;
revoke all on function public.assign_nurse(uuid, uuid) from public;
revoke all on function public.unassign_nurse(uuid) from public;

grant execute on function public.list_nurses()
  to authenticated, service_role;
grant execute on function public.assign_nurse(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.unassign_nurse(uuid)
  to authenticated, service_role;

-- Drop the permission slug and any lingering grants.
delete from public.role_permissions rp
using public.permissions p
where rp.permission_id = p.id
  and p.slug = 'nursing.assign';

delete from public.permissions where slug = 'nursing.assign';

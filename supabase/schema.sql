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
--   [ ] Row Level Security policies  -> separate migration
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

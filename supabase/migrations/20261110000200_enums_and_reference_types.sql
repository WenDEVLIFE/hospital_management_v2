-- ============================================================================
-- SPMC HMS — enums and reference types
-- Migration 002 of 22. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

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

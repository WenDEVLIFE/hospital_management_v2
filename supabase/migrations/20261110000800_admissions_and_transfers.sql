-- ============================================================================
-- SPMC HMS — admissions and transfers
-- Migration 008 of 22. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

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

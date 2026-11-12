-- ============================================================================
-- SPMC HMS — appointments
-- Migration 006 of 22. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

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

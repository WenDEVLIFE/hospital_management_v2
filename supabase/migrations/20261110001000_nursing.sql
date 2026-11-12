-- ============================================================================
-- SPMC HMS — nursing
-- Migration 010 of 22. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

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

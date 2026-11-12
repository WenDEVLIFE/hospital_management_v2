-- ============================================================================
-- SPMC HMS — radiology
-- Migration 012 of 22. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

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

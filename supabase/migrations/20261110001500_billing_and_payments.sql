-- ============================================================================
-- SPMC HMS — billing and payments
-- Migration 015 of 22. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

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

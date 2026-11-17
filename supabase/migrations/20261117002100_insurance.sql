-- ============================================================================
-- SPMC HMS — insurance and PhilHealth
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

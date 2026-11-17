-- ============================================================================
-- SPMC HMS — blood bank
-- Migration 045. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Donor → donation → unit → screening → request → crossmatch → issue →
-- transfusion. Issuing a unit requires a compatible crossmatch, passed
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

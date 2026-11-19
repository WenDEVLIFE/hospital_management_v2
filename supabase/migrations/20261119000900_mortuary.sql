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

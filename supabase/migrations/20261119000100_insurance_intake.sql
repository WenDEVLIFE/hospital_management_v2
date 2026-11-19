-- ============================================================================
-- SPMC HMS — insurance intake
-- Migration 047. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- The insurance module could verify coverage and prepare claims, but there was
-- no way to register a payer or a patient policy, so every policy had to be
-- inserted by hand.

create or replace function public.create_insurance_provider(
  p_name text,
  p_code text,
  p_type text,
  p_contact_number text default null,
  p_integration_status text default 'manual'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_provider_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_code text := upper(btrim(coalesce(p_code, '')));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('insurance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_name = '' or v_code = '' then
    raise exception 'Provider name and code are required'
      using errcode = '22023';
  end if;

  if p_type not in ('philhealth', 'private_hmo', 'private_insurer', 'government') then
    raise exception 'Unsupported provider type' using errcode = '22023';
  end if;

  if p_integration_status not in ('not_connected', 'manual', 'connected') then
    raise exception 'Unsupported integration status' using errcode = '22023';
  end if;

  insert into public.insurance_providers (
    name, code, type, contact_number, integration_status, created_by
  )
  values (
    v_name,
    v_code,
    p_type,
    nullif(btrim(coalesce(p_contact_number, '')), ''),
    p_integration_status,
    v_actor
  )
  returning id into v_provider_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'insurance.provider.create',
    'insurance_provider',
    v_provider_id,
    'Registered an insurance provider.',
    jsonb_build_object('source', 'create_insurance_provider', 'code', v_code)
  );

  return v_provider_id;
end;
$$;

create or replace function public.create_insurance_policy(
  p_patient_id uuid,
  p_provider_id uuid,
  p_policy_number text,
  p_member_number text,
  p_coverage_type text,
  p_effective_date date,
  p_expiry_date date,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_policy_id uuid;
  v_policy_number text := btrim(coalesce(p_policy_number, ''));
  v_member_number text := btrim(coalesce(p_member_number, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('insurance.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (select 1 from public.patients where id = p_patient_id) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.insurance_providers where id = p_provider_id
  ) then
    raise exception 'Insurance provider not found' using errcode = '22023';
  end if;

  if v_policy_number = '' or v_member_number = '' then
    raise exception 'Policy and member numbers are required'
      using errcode = '22023';
  end if;

  if p_effective_date is null
    or p_expiry_date is null
    or p_expiry_date <= p_effective_date then
    raise exception 'The expiry date must be after the effective date'
      using errcode = '22023';
  end if;

  insert into public.insurance_policies (
    patient_id, provider_id, policy_number, member_number,
    coverage_type, effective_date, expiry_date, notes, created_by
  )
  values (
    p_patient_id,
    p_provider_id,
    v_policy_number,
    v_member_number,
    coalesce(nullif(btrim(p_coverage_type), ''), 'Standard coverage'),
    p_effective_date,
    p_expiry_date,
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_policy_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'insurance.policy.create',
    'insurance_policy',
    v_policy_id,
    'Registered an insurance policy.',
    jsonb_build_object(
      'source', 'create_insurance_policy',
      'policy_number', v_policy_number,
      'provider_id', p_provider_id
    )
  );

  return v_policy_id;
end;
$$;

revoke all on function public.create_insurance_provider(
  text, text, text, text, text
) from public;
revoke all on function public.create_insurance_policy(
  uuid, uuid, text, text, text, date, date, text
) from public;

grant execute on function public.create_insurance_provider(
  text, text, text, text, text
) to authenticated, service_role;
grant execute on function public.create_insurance_policy(
  uuid, uuid, text, text, text, date, date, text
) to authenticated, service_role;

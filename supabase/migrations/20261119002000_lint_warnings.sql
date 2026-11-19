-- ============================================================================
-- SPMC HMS — clear remaining db lint warnings
-- Migration 20261119002000. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- db lint reported:
--   verify_coverage: variable "v_policy" is never read (only used for FOUND)
--   record_blood_donation: loop variable "v_index" shadows the declared one
-- Both are behaviour-preserving rewrites.

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

  perform 1
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

  for v_unit_seq in 1..p_units loop
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

-- ============================================================================
-- SPMC HMS — reject claims against expired policies
-- Migration 20261119000300. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- create_claim checked the policy status but not its expiry date, so a policy
-- that ended last year could still be claimed against.

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

  if v_policy.expiry_date < current_date then
    raise exception 'The policy has expired' using errcode = '22023';
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

revoke all on function public.create_claim(
  uuid, text, text, numeric, numeric, jsonb
) from public;

grant execute on function public.create_claim(
  uuid, text, text, numeric, numeric, jsonb
) to authenticated, service_role;

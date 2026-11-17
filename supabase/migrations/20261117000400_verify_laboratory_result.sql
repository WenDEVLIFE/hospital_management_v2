-- ============================================================================
-- SPMC HMS — verify laboratory result
-- Migration 027. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

create or replace function public.verify_laboratory_result(
  p_result_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_order_item_id uuid;
  v_order_id uuid;
  v_patient_id uuid;
  v_status public.laboratory_verification_status;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('laboratory.result.verify') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select order_item_id, verification_status
  into v_order_item_id, v_status
  from public.laboratory_results
  where id = p_result_id
  for update;

  if not found then
    raise exception 'Laboratory result not found' using errcode = '22023';
  end if;

  if v_status = 'verified' then
    raise exception 'Laboratory result is already verified'
      using errcode = '22023';
  end if;

  select order_id
  into v_order_id
  from public.laboratory_order_items
  where id = v_order_item_id;

  select patient_id
  into v_patient_id
  from public.laboratory_orders
  where id = v_order_id;

  if not public.can_access_patient(v_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  update public.laboratory_results
  set verification_status = 'verified',
      verified_by = v_actor,
      verified_at = now(),
      updated_by = v_actor
  where id = p_result_id;

  update public.laboratory_order_items
  set status = 'completed'
  where id = v_order_item_id;

  -- Complete the order only when every item has a verified result.
  if not exists (
    select 1
    from public.laboratory_order_items i
    where i.order_id = v_order_id
      and not exists (
        select 1
        from public.laboratory_results r
        where r.order_item_id = i.id
          and r.verification_status = 'verified'
      )
  ) then
    update public.laboratory_orders
    set status = 'completed'
    where id = v_order_id;
  end if;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_actor,
    'laboratory_result.verify',
    'laboratory_result',
    p_result_id,
    'Verified a laboratory result.',
    '{"source":"verify_laboratory_result"}'::jsonb
  );

  return p_result_id;
end;
$$;

revoke all on function public.verify_laboratory_result(uuid) from public;

grant execute on function public.verify_laboratory_result(uuid)
  to authenticated, service_role;

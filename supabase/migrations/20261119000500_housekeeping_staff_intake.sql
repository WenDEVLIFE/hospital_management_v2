-- ============================================================================
-- SPMC HMS — housekeeping staff intake
-- Migration 20261119000500. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Cleaning requests can only be assigned to a housekeeping staff row, but there
-- was no way to create one without SQL access.

create or replace function public.create_housekeeping_staff(
  p_name text,
  p_role text default 'Housekeeper',
  p_contact_number text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_staff_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('housekeeping.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_name = '' then
    raise exception 'A staff name is required' using errcode = '22023';
  end if;

  insert into public.housekeeping_staff (
    name, role, contact_number, status
  )
  values (
    v_name,
    coalesce(nullif(btrim(p_role), ''), 'Housekeeper'),
    nullif(btrim(coalesce(p_contact_number, '')), ''),
    'on_duty'
  )
  returning id into v_staff_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'housekeeping.staff.create',
    'housekeeping_staff',
    v_staff_id,
    'Added a housekeeping staff member.',
    jsonb_build_object('source', 'create_housekeeping_staff')
  );

  return v_staff_id;
end;
$$;

create or replace function public.set_housekeeping_staff_status(
  p_staff_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('housekeeping.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_status not in ('on_duty', 'off_duty', 'on_break') then
    raise exception 'Unsupported staff status' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.housekeeping_staff where id = p_staff_id
  ) then
    raise exception 'Housekeeping staff not found' using errcode = '22023';
  end if;

  update public.housekeeping_staff
  set status = p_status,
      updated_at = now()
  where id = p_staff_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'housekeeping.staff.status',
    'housekeeping_staff',
    p_staff_id,
    'Updated a housekeeping staff status.',
    jsonb_build_object('source', 'set_housekeeping_staff_status', 'status', p_status)
  );

  return p_staff_id;
end;
$$;

revoke all on function public.create_housekeeping_staff(text, text, text)
  from public;
revoke all on function public.set_housekeeping_staff_status(uuid, text)
  from public;

grant execute on function public.create_housekeeping_staff(text, text, text)
  to authenticated, service_role;
grant execute on function public.set_housekeeping_staff_status(uuid, text)
  to authenticated, service_role;

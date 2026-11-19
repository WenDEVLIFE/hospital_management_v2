-- ============================================================================
-- SPMC HMS — fix cleaning assignment cancel comparison
-- Migration 20261119001900. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- db lint caught `current_assignment = p_request_id` comparing text to uuid
-- (42883). Cancelling a request that already had an assignee would have thrown.
-- The column stores the request id as text, so cast the parameter explicitly.

create or replace function public.advance_cleaning_request(
  p_request_id uuid,
  p_action text,
  p_staff_id uuid default null,
  p_method text default null,
  p_chemical text default null,
  p_contact_minutes integer default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.cleaning_requests%rowtype;
  v_staff public.housekeeping_staff%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('housekeeping.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_request
  from public.cleaning_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Cleaning request not found' using errcode = '22023';
  end if;

  if v_request.status in ('verified', 'cancelled') then
    raise exception 'This request is already closed' using errcode = '22023';
  end if;

  if p_action = 'assign' then
    if v_request.status <> 'requested' or v_request.assigned_staff_id is not null then
      raise exception 'This request is already assigned' using errcode = '22023';
    end if;

    if p_staff_id is null then
      raise exception 'Select a housekeeping staff member' using errcode = '22023';
    end if;

    select * into v_staff
    from public.housekeeping_staff
    where id = p_staff_id
    for update;

    if not found then
      raise exception 'Select a housekeeping staff member' using errcode = '22023';
    end if;

    if v_staff.status = 'off_duty' then
      raise exception 'This staff member is off duty' using errcode = '22023';
    end if;

    if v_staff.current_assignment is not null then
      raise exception 'This staff member already has an active assignment'
        using errcode = '22023';
    end if;

    update public.cleaning_requests
    set assigned_staff_id = p_staff_id,
        status = 'assigned',
        updated_by = v_actor
    where id = p_request_id;

    update public.housekeeping_staff
    set current_assignment = p_request_id::text,
        updated_at = now()
    where id = p_staff_id;

  elsif p_action = 'start' then
    if v_request.assigned_staff_id is null then
      raise exception 'Assign the request before starting it' using errcode = '22023';
    end if;

    if v_request.status <> 'assigned' then
      raise exception 'Only assigned requests can be started' using errcode = '22023';
    end if;

    update public.cleaning_requests
    set status = 'in_progress',
        started_at = coalesce(started_at, now()),
        updated_by = v_actor
    where id = p_request_id;

  elsif p_action = 'complete' then
    if v_request.status <> 'in_progress' then
      raise exception 'Only in-progress requests can be completed' using errcode = '22023';
    end if;

    if btrim(coalesce(p_method, '')) = ''
      or btrim(coalesce(p_chemical, '')) = ''
      or p_contact_minutes is null
      or p_contact_minutes <= 0 then
      raise exception 'A disinfection method, chemical and contact time are required'
        using errcode = '22023';
    end if;

    insert into public.disinfection_records (
      request_id, method, chemical, contact_time_minutes, performed_by, notes
    )
    values (
      p_request_id,
      btrim(p_method),
      btrim(p_chemical),
      p_contact_minutes,
      v_actor,
      nullif(btrim(coalesce(p_notes, '')), '')
    )
    on conflict (request_id) do update
    set method = excluded.method,
        chemical = excluded.chemical,
        contact_time_minutes = excluded.contact_time_minutes,
        performed_by = excluded.performed_by,
        notes = excluded.notes;

    update public.cleaning_requests
    set status = 'completed',
        completed_at = now(),
        disinfection_used = btrim(p_chemical),
        updated_by = v_actor
    where id = p_request_id;

    update public.housekeeping_staff
    set completed_today = completed_today + 1,
        current_assignment = null,
        updated_at = now()
    where id = v_request.assigned_staff_id;

  elsif p_action = 'verify' then
    if v_request.status <> 'completed' then
      raise exception 'Only completed requests can be verified' using errcode = '22023';
    end if;

    update public.cleaning_requests
    set status = 'verified',
        verified_at = now(),
        verified_by = v_actor,
        updated_by = v_actor
    where id = p_request_id;

  elsif p_action = 'cancel' then
    update public.cleaning_requests
    set status = 'cancelled',
        updated_by = v_actor
    where id = p_request_id;

    if v_request.assigned_staff_id is not null then
      update public.housekeeping_staff
      set current_assignment = null,
          updated_at = now()
      where id = v_request.assigned_staff_id
        and current_assignment = p_request_id::text;
    end if;

  else
    raise exception 'Unsupported cleaning action' using errcode = '22023';
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'housekeeping.request.' || p_action,
    'cleaning_request',
    p_request_id,
    'Updated a cleaning request.',
    jsonb_build_object(
      'source', 'advance_cleaning_request',
      'action', p_action,
      'staff_id', p_staff_id
    )
  );

  return p_request_id;
end;
$$;

revoke all on function public.advance_cleaning_request(
  uuid, text, uuid, text, text, integer, text
) from public;
grant execute on function public.advance_cleaning_request(
  uuid, text, uuid, text, text, integer, text
) to authenticated, service_role;

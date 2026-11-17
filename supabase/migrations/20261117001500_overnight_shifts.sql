-- ============================================================================
-- SPMC HMS — overnight shifts
-- Migration 038. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- A 23:00-07:00 night shift ends before it starts on the clock, so the original
-- ordering check rejected every overnight roster entry.

create or replace function public.schedule_shift(
  p_staff_profile_id uuid,
  p_shift_date date,
  p_shift_type text,
  p_start_time time,
  p_end_time time
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_shift_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.staff_profiles where id = p_staff_profile_id
  ) then
    raise exception 'Staff record not found' using errcode = '22023';
  end if;

  if p_shift_type not in ('morning', 'afternoon', 'night', 'off', 'on_call') then
    raise exception 'Unsupported shift type' using errcode = '22023';
  end if;

  if p_start_time is null or p_end_time is null then
    raise exception 'Shift start and end times are required'
      using errcode = '22023';
  end if;

  -- An end time earlier than the start time is a shift that crosses midnight.
  if p_end_time = p_start_time then
    raise exception 'Shift start and end times cannot be the same'
      using errcode = '22023';
  end if;

  insert into public.hr_shifts (
    staff_profile_id, shift_date, shift_type, start_time, end_time, created_by
  )
  values (
    p_staff_profile_id, p_shift_date, p_shift_type,
    p_start_time, p_end_time, v_actor
  )
  returning id into v_shift_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'hr.shift.schedule',
    'hr_shift',
    v_shift_id,
    'Scheduled a staff shift.',
    jsonb_build_object(
      'source', 'schedule_shift',
      'shift_date', p_shift_date,
      'shift_type', p_shift_type,
      'overnight', p_end_time < p_start_time
    )
  );

  return v_shift_id;
end;
$$;

revoke all on function public.schedule_shift(uuid, date, text, time, time)
  from public;

grant execute on function public.schedule_shift(uuid, date, text, time, time)
  to authenticated, service_role;

-- ============================================================================
-- SPMC HMS — attendance capture and employee salary
-- Migration 20261119001700. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- hr_attendance had no insert policy and no RPC, so overtime could never reach
-- payroll, and salaries could only be set while creating an employee. This adds
-- both write paths with explicit permission checks and audit rows.

create or replace function public.record_attendance(
  p_staff_profile_id uuid,
  p_attendance_date date,
  p_status text default 'present',
  p_time_in time default null,
  p_time_out time default null,
  p_overtime_minutes integer default 0,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status text := coalesce(nullif(btrim(p_status), ''), 'present');
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_attendance_date is null then
    raise exception 'Select the attendance date' using errcode = '22023';
  end if;

  if not exists (select 1 from public.staff_profiles where id = p_staff_profile_id) then
    raise exception 'Staff record not found' using errcode = '22023';
  end if;

  if v_status not in ('present', 'late', 'absent', 'leave', 'holiday') then
    raise exception 'Unsupported attendance status' using errcode = '22023';
  end if;

  if coalesce(p_overtime_minutes, 0) < 0 or coalesce(p_overtime_minutes, 0) > 1440 then
    raise exception 'Overtime must be between 0 and 1440 minutes'
      using errcode = '22023';
  end if;

  if p_time_in is not null and p_time_out is not null and p_time_out <= p_time_in then
    raise exception 'Time out must be after time in' using errcode = '22023';
  end if;

  insert into public.hr_attendance (
    staff_profile_id, attendance_date, time_in, time_out,
    status, overtime_minutes, note
  )
  values (
    p_staff_profile_id,
    p_attendance_date,
    p_time_in,
    p_time_out,
    v_status,
    coalesce(p_overtime_minutes, 0),
    nullif(btrim(coalesce(p_note, '')), '')
  )
  on conflict (staff_profile_id, attendance_date) do update
  set time_in = excluded.time_in,
      time_out = excluded.time_out,
      status = excluded.status,
      overtime_minutes = excluded.overtime_minutes,
      note = excluded.note
  returning id into v_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'hr.attendance.record', 'staff_profile', p_staff_profile_id,
    'Recorded employee attendance.',
    jsonb_build_object(
      'source', 'record_attendance',
      'date', p_attendance_date,
      'status', v_status,
      'overtime_minutes', coalesce(p_overtime_minutes, 0)
    )
  );

  return v_id;
end;
$$;

create or replace function public.set_employee_salary(
  p_staff_profile_id uuid,
  p_monthly_rate numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_old numeric;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.payroll') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_monthly_rate is null or p_monthly_rate < 0 then
    raise exception 'The monthly rate cannot be negative' using errcode = '22023';
  end if;

  select monthly_rate into v_old
  from public.hr_employee_details
  where staff_profile_id = p_staff_profile_id
  for update;

  if not found then
    raise exception 'Create the employee record before setting a salary'
      using errcode = '22023';
  end if;

  update public.hr_employee_details
  set monthly_rate = p_monthly_rate,
      updated_by = v_actor,
      updated_at = now()
  where staff_profile_id = p_staff_profile_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'hr.employee.salary', 'staff_profile', p_staff_profile_id,
    'Updated an employee monthly rate.',
    jsonb_build_object(
      'source', 'set_employee_salary',
      'previous_rate', v_old,
      'monthly_rate', p_monthly_rate
    )
  );

  return p_staff_profile_id;
end;
$$;

revoke all on function public.record_attendance(
  uuid, date, text, time, time, integer, text
) from public;
grant execute on function public.record_attendance(
  uuid, date, text, time, time, integer, text
) to authenticated, service_role;

revoke all on function public.set_employee_salary(uuid, numeric) from public;
grant execute on function public.set_employee_salary(uuid, numeric)
  to authenticated, service_role;

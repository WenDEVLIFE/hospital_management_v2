-- Complete HR setup for a staff profile that already has a sign-in account.
create or replace function public.create_hr_employee_details(
  p_staff_profile_id uuid,
  p_position text,
  p_hire_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_is_active boolean;
  v_position text := btrim(coalesce(p_position, ''));
begin
  if v_actor is null or not public.has_permission('hr.manage') then
    raise exception 'HR management permission required' using errcode = '42501';
  end if;

  if char_length(v_position) not between 2 and 120 or p_hire_date is null then
    raise exception 'Enter a valid position and hire date' using errcode = '22023';
  end if;

  select is_active into v_is_active
  from public.staff_profiles
  where id = p_staff_profile_id
  for key share;

  if not found then
    raise exception 'Staff record not found' using errcode = 'P0002';
  end if;

  insert into public.hr_employee_details (
    staff_profile_id, position, hire_date, employment_status, created_by
  ) values (
    p_staff_profile_id, v_position, p_hire_date,
    case when v_is_active then 'active' else 'inactive' end, v_actor
  )
  on conflict (staff_profile_id) do nothing;

  if not found then
    raise exception 'An HR employee record already exists for this staff member'
      using errcode = '23505';
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  ) values (
    v_actor, 'hr.employee.create', 'staff_profile', p_staff_profile_id,
    'Created an employee record for existing staff.',
    jsonb_build_object('source', 'create_hr_employee_details')
  );

  return p_staff_profile_id;
end;
$$;

revoke all on function public.create_hr_employee_details(uuid, text, date)
  from public, anon;
grant execute on function public.create_hr_employee_details(uuid, text, date)
  to authenticated;

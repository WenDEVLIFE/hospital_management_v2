-- ============================================================================
-- SPMC HMS — departments, rooms, and staff administration
-- Migration 034. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Create a department
-- ----------------------------------------------------------------------------
create or replace function public.create_department(
  p_code text,
  p_name text,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_name text := btrim(coalesce(p_name, ''));
  v_department_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_code = '' or v_name = '' then
    raise exception 'Department code and name are required'
      using errcode = '22023';
  end if;

  insert into public.departments (code, name, description, created_by)
  values (
    v_code,
    v_name,
    nullif(btrim(coalesce(p_description, '')), ''),
    v_actor
  )
  returning id into v_department_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'department.create',
    'department',
    v_department_id,
    'Created a department.',
    jsonb_build_object('source', 'create_department', 'code', v_code)
  );

  return v_department_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Create a room
-- ----------------------------------------------------------------------------
create or replace function public.create_room(
  p_department_id uuid,
  p_room_number text,
  p_room_type text default null,
  p_floor_number text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_room_number text := btrim(coalesce(p_room_number, ''));
  v_room_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('bed.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.departments where id = p_department_id
  ) then
    raise exception 'Department not found' using errcode = '22023';
  end if;

  if v_room_number = '' then
    raise exception 'A room number is required' using errcode = '22023';
  end if;

  insert into public.rooms (
    room_number,
    department_id,
    room_type,
    floor_number,
    created_by
  )
  values (
    v_room_number,
    p_department_id,
    nullif(btrim(coalesce(p_room_type, '')), ''),
    nullif(btrim(coalesce(p_floor_number, '')), ''),
    v_actor
  )
  returning id into v_room_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'room.create',
    'room',
    v_room_id,
    'Created a room.',
    jsonb_build_object(
      'source', 'create_room',
      'room_number', v_room_number,
      'department_id', p_department_id
    )
  );

  return v_room_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Update a staff record (including deactivation)
-- ----------------------------------------------------------------------------
create or replace function public.update_staff(
  p_staff_id uuid,
  p_patch jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_staff public.staff_profiles%rowtype;
  v_first_name text;
  v_last_name text;
  v_is_active boolean;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select *
  into v_staff
  from public.staff_profiles
  where id = p_staff_id
  for update;

  if not found then
    raise exception 'Staff record not found' using errcode = '22023';
  end if;

  v_first_name := case
    when p_patch ? 'first_name'
      then nullif(btrim(p_patch->>'first_name'), '')
    else v_staff.first_name
  end;

  v_last_name := case
    when p_patch ? 'last_name'
      then nullif(btrim(p_patch->>'last_name'), '')
    else v_staff.last_name
  end;

  if v_first_name is null or v_last_name is null then
    raise exception 'First name and last name are required'
      using errcode = '22023';
  end if;

  v_is_active := coalesce((p_patch->>'is_active')::boolean, v_staff.is_active);

  update public.staff_profiles
  set
    first_name = v_first_name,
    last_name = v_last_name,
    middle_name = case
      when p_patch ? 'middle_name'
        then nullif(btrim(p_patch->>'middle_name'), '')
      else middle_name
    end,
    department_id = case
      when p_patch ? 'department_id'
        then nullif(btrim(p_patch->>'department_id'), '')::uuid
      else department_id
    end,
    employment_type = case
      when p_patch ? 'employment_type'
        then nullif(btrim(p_patch->>'employment_type'), '')
      else employment_type
    end,
    professional_license_number = case
      when p_patch ? 'professional_license_number'
        then nullif(btrim(p_patch->>'professional_license_number'), '')
      else professional_license_number
    end,
    is_active = v_is_active,
    updated_by = v_actor
  where id = p_staff_id;

  -- Keep the account state aligned with the employment record so a
  -- deactivated staff member cannot keep signing in.
  update public.profiles
  set is_active = v_is_active,
      updated_at = now()
  where id = v_staff.user_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    case when v_is_active then 'staff.update' else 'staff.deactivate' end,
    'staff_profile',
    p_staff_id,
    case
      when v_is_active then 'Updated a staff record.'
      else 'Deactivated a staff account.'
    end,
    jsonb_build_object(
      'source', 'update_staff',
      'fields', (
        select coalesce(jsonb_agg(key), '[]'::jsonb)
        from jsonb_object_keys(p_patch) as key
      )
    )
  );

  return p_staff_id;
end;
$$;

revoke all on function public.create_department(text, text, text) from public;
revoke all on function public.create_room(uuid, text, text, text) from public;
revoke all on function public.update_staff(uuid, jsonb) from public;

grant execute on function public.create_department(text, text, text)
  to authenticated, service_role;
grant execute on function public.create_room(uuid, text, text, text)
  to authenticated, service_role;
grant execute on function public.update_staff(uuid, jsonb)
  to authenticated, service_role;

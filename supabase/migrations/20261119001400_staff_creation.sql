-- ============================================================================
-- SPMC HMS — staff record creation after an Auth account exists
-- Migration 20261119001400. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- The admin-users Edge Function creates the Auth account with the service role.
-- This function writes the employment record and assigns the first role in one
-- transaction, so a half-created staff member cannot be committed.

create or replace function public.create_staff_record(
  p_user_id uuid,
  p_staff_number text,
  p_first_name text,
  p_last_name text,
  p_middle_name text default null,
  p_department_id uuid default null,
  p_employment_type text default null,
  p_professional_license_number text default null,
  p_role_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_staff_number text := upper(btrim(coalesce(p_staff_number, '')));
  v_first_name text := btrim(coalesce(p_first_name, ''));
  v_last_name text := btrim(coalesce(p_last_name, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_staff_number = '' or v_first_name = '' or v_last_name = '' then
    raise exception 'Staff number, first name and last name are required'
      using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Account not found' using errcode = '22023';
  end if;

  if exists (select 1 from public.staff_profiles where user_id = p_user_id) then
    raise exception 'This account already has a staff record'
      using errcode = '22023';
  end if;

  insert into public.staff_profiles (
    user_id, staff_number, first_name, middle_name, last_name,
    department_id, employment_type, professional_license_number, created_by
  )
  values (
    p_user_id,
    v_staff_number,
    v_first_name,
    nullif(btrim(coalesce(p_middle_name, '')), ''),
    v_last_name,
    p_department_id,
    nullif(btrim(coalesce(p_employment_type, '')), ''),
    nullif(btrim(coalesce(p_professional_license_number, '')), ''),
    v_actor
  )
  returning id into v_id;

  if p_role_id is not null then
    perform public.set_edge_user_role(p_user_id, p_role_id, true);
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'staff.create', 'staff_profile', v_id,
    'Created a staff employment record.',
    jsonb_build_object(
      'source', 'create_staff_record',
      'staff_number', v_staff_number,
      'user_id', p_user_id,
      'role_id', p_role_id
    )
  );

  return v_id;
end;
$$;

revoke all on function public.create_staff_record(
  uuid, text, text, text, text, uuid, text, text, uuid
) from public;
grant execute on function public.create_staff_record(
  uuid, text, text, text, text, uuid, text, text, uuid
) to authenticated, service_role;

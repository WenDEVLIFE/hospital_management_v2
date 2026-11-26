-- ============================================================================
-- SPMC HMS — remove nursing.assign; administrator-only assignment
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Assignment is a hospital-administration action. The permission slug is
-- removed entirely; the RPCs gate on public.is_admin().

create or replace function public.list_nurses()
returns table (id uuid, full_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  return query
    select
      sp.id,
      btrim(concat_ws(' ', sp.first_name, sp.middle_name, sp.last_name))::text
    from public.staff_profiles sp
    join public.profiles pr on pr.id = sp.user_id
    join public.user_roles ur on ur.user_id = sp.user_id
    join public.roles r on r.id = ur.role_id
    where r.slug = 'nurse'
      and sp.is_active
      and pr.is_active
    order by sp.last_name, sp.first_name;
end;
$$;

create or replace function public.assign_nurse(
  p_patient_id uuid,
  p_staff_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_assignment_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.patients where id = p_patient_id
  ) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.staff_profiles sp
    join public.profiles pr on pr.id = sp.user_id
    join public.user_roles ur on ur.user_id = sp.user_id
    join public.roles r on r.id = ur.role_id
    where sp.id = p_staff_id
      and sp.is_active
      and pr.is_active
      and r.slug = 'nurse'
  ) then
    raise exception 'Selected staff is not an active nurse'
      using errcode = '22023';
  end if;

  update public.patient_care_assignments
  set ended_at = now()
  where patient_id = p_patient_id
    and ended_at is null
    and assignment_type ilike '%nurse%';

  insert into public.patient_care_assignments (
    patient_id, staff_id, assignment_type, assigned_by
  )
  values (
    p_patient_id, p_staff_id, 'primary_nurse', v_actor
  )
  returning id into v_assignment_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'care.assign_nurse',
    'patient',
    p_patient_id,
    'Assigned a nurse to a patient.',
    jsonb_build_object(
      'source', 'assign_nurse',
      'staff_id', p_staff_id,
      'assignment_id', v_assignment_id
    )
  );

  return v_assignment_id;
end;
$$;

create or replace function public.unassign_nurse(p_patient_id uuid)
returns void
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

  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.patients where id = p_patient_id
  ) then
    raise exception 'Patient not found' using errcode = '22023';
  end if;

  update public.patient_care_assignments
  set ended_at = now()
  where patient_id = p_patient_id
    and ended_at is null
    and assignment_type ilike '%nurse%';

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'care.unassign_nurse',
    'patient',
    p_patient_id,
    'Removed the nurse assignment for a patient.',
    jsonb_build_object('source', 'unassign_nurse')
  );
end;
$$;

revoke all on function public.list_nurses() from public;
revoke all on function public.assign_nurse(uuid, uuid) from public;
revoke all on function public.unassign_nurse(uuid) from public;

grant execute on function public.list_nurses()
  to authenticated, service_role;
grant execute on function public.assign_nurse(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.unassign_nurse(uuid)
  to authenticated, service_role;

-- Drop the permission slug and any lingering grants.
delete from public.role_permissions rp
using public.permissions p
where rp.permission_id = p.id
  and p.slug = 'nursing.assign';

delete from public.permissions where slug = 'nursing.assign';

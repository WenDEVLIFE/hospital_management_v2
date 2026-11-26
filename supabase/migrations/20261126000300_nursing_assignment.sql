-- ============================================================================
-- SPMC HMS — nurse assignment and nursing assessments
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Assignment is administrator-only (public.is_admin()); no permission slug.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Let nursing staff read care assignments (previously admin/physician only)
-- ----------------------------------------------------------------------------
drop policy if exists "patient_care_assignments_select_admin_or_physician"
  on public.patient_care_assignments;

create policy "patient_care_assignments_select_participants"
on public.patient_care_assignments
for select
to authenticated
using (
  public.is_admin()
  or public.has_role('physician')
  or public.has_permission('nursing.view')
  or exists (
    select 1
    from public.staff_profiles sp
    where sp.id = patient_care_assignments.staff_id
      and sp.user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------------------
-- Active nurses for the assignment picker
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Assign a patient to a nurse
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Remove the active nurse assignment for a patient
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Record a nursing assessment
-- ----------------------------------------------------------------------------
create or replace function public.record_nursing_assessment(
  p_patient_id uuid,
  p_encounter_id uuid,
  p_assessment_type text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_type text := btrim(coalesce(p_assessment_type, ''));
  v_assessment_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('nursing.assessment.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not public.can_access_patient(p_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_type = '' then
    raise exception 'An assessment type is required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.encounters
    where id = p_encounter_id
      and patient_id = p_patient_id
  ) then
    raise exception 'Encounter not found for this patient'
      using errcode = '22023';
  end if;

  insert into public.nursing_assessments (
    patient_id, encounter_id, assessment_type, notes, assessed_by
  )
  values (
    p_patient_id,
    p_encounter_id,
    v_type,
    nullif(btrim(coalesce(p_notes, '')), ''),
    v_actor
  )
  returning id into v_assessment_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'nursing.assessment.create',
    'patient',
    p_patient_id,
    'Recorded a nursing assessment.',
    jsonb_build_object(
      'source', 'record_nursing_assessment',
      'assessment_type', v_type,
      'assessment_id', v_assessment_id
    )
  );

  return v_assessment_id;
end;
$$;

revoke all on function public.list_nurses() from public;
revoke all on function public.assign_nurse(uuid, uuid) from public;
revoke all on function public.unassign_nurse(uuid) from public;
revoke all on function public.record_nursing_assessment(uuid, uuid, text, text)
  from public;

grant execute on function public.list_nurses()
  to authenticated, service_role;
grant execute on function public.assign_nurse(uuid, uuid)
  to authenticated, service_role;
grant execute on function public.unassign_nurse(uuid)
  to authenticated, service_role;
grant execute on function public.record_nursing_assessment(uuid, uuid, text, text)
  to authenticated, service_role;

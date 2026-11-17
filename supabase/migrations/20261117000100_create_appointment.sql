-- ============================================================================
-- SPMC HMS — transactional appointment creation
-- Migration 024. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Validates the patient, active department, optional physician, and physician
-- schedule, then creates the appointment and audit entry atomically.

create or replace function public.create_appointment(
  p_patient_id uuid,
  p_department_id uuid,
  p_physician_id uuid,
  p_scheduled_at timestamptz,
  p_duration_minutes integer,
  p_appointment_type text,
  p_reason_for_visit text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_appointment_id uuid;
  v_appointment_number text;
  v_duration integer := coalesce(p_duration_minutes, 30);
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('appointment.create') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_patient_id is null
     or not exists (
       select 1
       from public.patients
       where id = p_patient_id
         and registration_status = 'active'
     ) then
    raise exception 'Active patient not found' using errcode = '22023';
  end if;

  if p_department_id is null
     or not exists (
       select 1
       from public.departments
       where id = p_department_id
         and is_active
     ) then
    raise exception 'Active department not found' using errcode = '22023';
  end if;

  if p_scheduled_at is null then
    raise exception 'Scheduled time is required' using errcode = '22023';
  end if;

  if v_duration <= 0 or v_duration > 480 then
    raise exception 'Duration must be between 1 and 480 minutes'
      using errcode = '22023';
  end if;

  if p_physician_id is not null then
    if not exists (
      select 1 from public.physicians where id = p_physician_id
    ) then
      raise exception 'Physician not found' using errcode = '22023';
    end if;

    if exists (
      select 1
      from public.appointments a
      where a.physician_id = p_physician_id
        and a.status not in ('cancelled', 'no_show')
        and a.scheduled_at < p_scheduled_at + make_interval(mins => v_duration)
        and a.scheduled_at + make_interval(mins => a.duration_minutes)
            > p_scheduled_at
    ) then
      raise exception 'Physician has a scheduling conflict'
        using errcode = '23P01';
    end if;
  end if;

  v_appointment_number := public.generate_reference_number('APT');

  insert into public.appointments (
    appointment_number,
    patient_id,
    department_id,
    physician_id,
    scheduled_at,
    duration_minutes,
    appointment_type,
    reason_for_visit,
    status,
    notes,
    created_by
  )
  values (
    v_appointment_number,
    p_patient_id,
    p_department_id,
    p_physician_id,
    p_scheduled_at,
    v_duration,
    nullif(btrim(p_appointment_type), ''),
    nullif(btrim(p_reason_for_visit), ''),
    'scheduled',
    nullif(btrim(p_notes), ''),
    v_actor
  )
  returning id into v_appointment_id;

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
    'appointment.create',
    'appointment',
    v_appointment_id,
    'Created an appointment.',
    '{"source":"create_appointment"}'::jsonb
  );

  return v_appointment_id;
end;
$$;

revoke all on function public.create_appointment(
  uuid, uuid, uuid, timestamptz, integer, text, text, text
) from public;

grant execute on function public.create_appointment(
  uuid, uuid, uuid, timestamptz, integer, text, text, text
) to authenticated, service_role;

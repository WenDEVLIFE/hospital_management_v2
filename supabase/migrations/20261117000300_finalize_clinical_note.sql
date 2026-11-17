-- ============================================================================
-- SPMC HMS — finalize clinical note
-- Migration 026. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

create or replace function public.finalize_clinical_note(
  p_note_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status public.clinical_note_status;
  v_patient_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('medical_record.finalize') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status, patient_id
  into v_status, v_patient_id
  from public.clinical_notes
  where id = p_note_id
  for update;

  if not found then
    raise exception 'Clinical note not found' using errcode = '22023';
  end if;

  if not public.can_access_patient(v_patient_id) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if v_status <> 'draft' then
    raise exception 'Only draft notes can be finalized' using errcode = '22023';
  end if;

  update public.clinical_notes
  set status = 'finalized',
      finalized_at = now(),
      updated_by = v_actor
  where id = p_note_id;

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
    'clinical_note.finalize',
    'clinical_note',
    p_note_id,
    'Finalized a clinical note.',
    '{"source":"finalize_clinical_note"}'::jsonb
  );

  return p_note_id;
end;
$$;

revoke all on function public.finalize_clinical_note(uuid) from public;

grant execute on function public.finalize_clinical_note(uuid)
  to authenticated, service_role;

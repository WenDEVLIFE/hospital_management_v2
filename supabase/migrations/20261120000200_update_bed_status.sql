create or replace function public.update_bed_status(
  p_bed_id uuid,
  p_expected_status public.bed_status,
  p_status public.bed_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_previous_status public.bed_status;
begin
  if v_actor is null or not public.has_permission('bed.manage') then
    raise exception 'Bed management permission required' using errcode = '42501';
  end if;

  if p_expected_status is null or p_status is null or p_status = 'occupied' then
    raise exception 'Invalid manual bed status' using errcode = '22023';
  end if;

  -- Admission and transfer also lock the bed before assigning a patient.
  select status into v_previous_status
  from public.beds
  where id = p_bed_id
  for update;

  if not found then
    raise exception 'Bed not found' using errcode = 'P0002';
  end if;

  if v_previous_status <> p_expected_status then
    raise exception 'Bed status changed' using errcode = '40001';
  end if;

  if v_previous_status = 'occupied' or exists (
    select 1
    from public.admission_bed_assignments
    where bed_id = p_bed_id and released_at is null
  ) then
    raise exception 'Bed has a patient assignment' using errcode = '23514';
  end if;

  if v_previous_status = p_status then
    return;
  end if;

  update public.beds
  set status = p_status, updated_by = v_actor
  where id = p_bed_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  ) values (
    v_actor, 'bed.status.update', 'bed', p_bed_id, 'Changed bed status.',
    jsonb_build_object('previous_status', v_previous_status, 'status', p_status)
  );
end;
$$;

revoke all on function public.update_bed_status(uuid, public.bed_status, public.bed_status)
  from public, anon;
grant execute on function public.update_bed_status(uuid, public.bed_status, public.bed_status)
  to authenticated;

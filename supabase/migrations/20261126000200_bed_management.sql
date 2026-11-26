-- ============================================================================
-- SPMC HMS — bed management per room
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- Beds are retired (is_active = false) instead of hard-deleted because
-- admission_bed_assignments and patient_transfers reference beds with
-- on delete restrict, and history must be preserved.

alter table public.beds
  add column if not exists is_active boolean not null default true;

create index if not exists idx_beds_room_active
  on public.beds(room_id)
  where is_active;

-- ----------------------------------------------------------------------------
-- Add a bed to a room
-- ----------------------------------------------------------------------------
create or replace function public.add_bed(
  p_room_id uuid,
  p_bed_number text,
  p_status text default 'available'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_bed_number text := btrim(coalesce(p_bed_number, ''));
  v_bed_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('bed.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.rooms where id = p_room_id
  ) then
    raise exception 'Room not found' using errcode = '22023';
  end if;

  if v_bed_number = '' then
    raise exception 'A bed number is required' using errcode = '22023';
  end if;

  if p_status not in ('available', 'reserved', 'maintenance') then
    raise exception 'Unsupported bed status' using errcode = '22023';
  end if;

  -- Re-adding a previously retired bed number reactivates the same row so
  -- history stays attached and the (room_id, bed_number) unique key holds.
  select id into v_bed_id
  from public.beds
  where room_id = p_room_id
    and bed_number = v_bed_number
    and is_active = false;

  if found then
    update public.beds
    set
      is_active = true,
      status = p_status::public.bed_status,
      updated_by = v_actor
    where id = v_bed_id;
  else
    insert into public.beds (
      room_id, bed_number, status, created_by
    )
    values (
      p_room_id,
      v_bed_number,
      p_status::public.bed_status,
      v_actor
    )
    returning id into v_bed_id;
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'bed.add',
    'bed',
    v_bed_id,
    'Added a bed to a room.',
    jsonb_build_object(
      'source', 'add_bed',
      'room_id', p_room_id,
      'bed_number', v_bed_number,
      'status', p_status
    )
  );

  return v_bed_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Retire a bed
-- ----------------------------------------------------------------------------
create or replace function public.remove_bed(p_bed_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_bed public.beds;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('bed.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_bed from public.beds where id = p_bed_id;

  if not found then
    raise exception 'Bed not found' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.admission_bed_assignments
    where bed_id = p_bed_id and released_at is null
  ) then
    raise exception 'Bed has an active patient assignment'
      using errcode = '23514';
  end if;

  if v_bed.status = 'occupied' then
    raise exception 'Bed is occupied; discharge or transfer the patient first'
      using errcode = '23514';
  end if;

  update public.beds
  set is_active = false, updated_by = v_actor
  where id = p_bed_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'bed.remove',
    'bed',
    p_bed_id,
    'Retired a bed.',
    jsonb_build_object(
      'source', 'remove_bed',
      'room_id', v_bed.room_id,
      'bed_number', v_bed.bed_number
    )
  );
end;
$$;

revoke all on function public.add_bed(uuid, text, text) from public;
revoke all on function public.remove_bed(uuid) from public;

grant execute on function public.add_bed(uuid, text, text)
  to authenticated, service_role;
grant execute on function public.remove_bed(uuid)
  to authenticated, service_role;

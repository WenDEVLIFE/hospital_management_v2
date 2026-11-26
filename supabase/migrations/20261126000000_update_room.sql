-- ============================================================================
-- SPMC HMS — update room details
-- Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================

create or replace function public.update_room(
  p_room_id uuid,
  p_department_id uuid,
  p_room_number text,
  p_room_type text default null,
  p_floor_number text default null,
  p_is_active boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_room_number text := btrim(coalesce(p_room_number, ''));
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

  if not exists (
    select 1 from public.departments where id = p_department_id
  ) then
    raise exception 'Department not found' using errcode = '22023';
  end if;

  if v_room_number = '' then
    raise exception 'A room number is required' using errcode = '22023';
  end if;

  update public.rooms
  set
    room_number = v_room_number,
    department_id = p_department_id,
    room_type = nullif(btrim(coalesce(p_room_type, '')), ''),
    floor_number = nullif(btrim(coalesce(p_floor_number, '')), ''),
    is_active = p_is_active,
    updated_by = v_actor
  where id = p_room_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'room.update',
    'room',
    p_room_id,
    'Updated a room.',
    jsonb_build_object(
      'source', 'update_room',
      'room_number', v_room_number,
      'department_id', p_department_id,
      'is_active', p_is_active
    )
  );
end;
$$;

revoke all on function public.update_room(uuid, uuid, text, text, text, boolean)
  from public;

grant execute on function public.update_room(uuid, uuid, text, text, text, boolean)
  to authenticated, service_role;

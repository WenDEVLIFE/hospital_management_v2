-- Privileged Edge Function operations and their transactional audit records.
create function public.check_edge_account_target(p_actor uuid, p_target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_super boolean;
begin
  -- Serialize account and role changes issued through the administrative APIs.
  perform pg_catalog.pg_advisory_xact_lock(618371524);

  select pg_catalog.bool_or(r.slug = 'super_admin')
  into v_super
  from public.profiles p
  join public.user_roles ur on ur.user_id = p.id
  join public.roles r on r.id = ur.role_id
  where p.id = p_actor and p.is_active
    and r.slug in ('super_admin', 'hospital_admin');

  if v_super is null or p_target = p_actor then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_target is null then
    return;
  end if;

  if not exists (select 1 from public.profiles where id = p_target) then
    raise exception 'Account not found' using errcode = 'P0002';
  end if;

  if not v_super and exists (
    select 1 from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_target and r.slug in ('super_admin', 'hospital_admin')
  ) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;
end;
$$;

create function public.audit_edge_auth_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_active boolean;
  v_profile_active boolean;
begin
  if tg_name = 'audit_edge_auth_creation' and new.raw_app_meta_data ? 'hms_create_actor' then
    v_actor := (new.raw_app_meta_data->>'hms_create_actor')::uuid;
    perform public.check_edge_account_target(v_actor, null);
    new.raw_app_meta_data := new.raw_app_meta_data - 'hms_create_actor';

    insert into public.audit_logs (actor_id, action, entity_type, entity_id)
    values (v_actor, 'user.create', 'profile', new.id);
  elsif tg_name = 'audit_edge_auth_status' and new.raw_app_meta_data ? 'hms_status_actor' then
    v_actor := (new.raw_app_meta_data->>'hms_status_actor')::uuid;
    perform public.check_edge_account_target(v_actor, new.id);
    new.raw_app_meta_data := new.raw_app_meta_data - 'hms_status_actor';
    v_active := not coalesce(new.banned_until > now(), false);

    select is_active into v_profile_active from public.profiles where id = new.id for update;
    if v_active = v_profile_active
      and v_active = not coalesce(old.banned_until > now(), false) then
      -- A deactivation retry does not extend an already recorded ban.
      new.banned_until := old.banned_until;
      return new;
    end if;

    update public.profiles set is_active = v_active where id = new.id;
    insert into public.audit_logs (actor_id, action, entity_type, entity_id)
    values (
      v_actor,
      case when v_active then 'user.activate' else 'user.deactivate' end,
      'profile',
      new.id
    );
  end if;

  return new;
end;
$$;

-- GoTrue writes administrative app metadata separately from the insert and ban.
create trigger audit_edge_auth_creation
before insert or update of raw_app_meta_data on auth.users
for each row execute function public.audit_edge_auth_change();

create trigger audit_edge_auth_status
before update of banned_until on auth.users
for each row execute function public.audit_edge_auth_change();

create function public.protect_profile_active()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated' and new.is_active is distinct from old.is_active then
    raise exception 'Use the administrative account operation' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger protect_profile_active
before update of is_active on public.profiles
for each row execute function public.protect_profile_active();

create function public.set_edge_user_role(p_target uuid, p_role uuid, p_grant boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_changed boolean;
begin
  if p_target is null or p_role is null or p_grant is null then
    raise exception 'Invalid role assignment' using errcode = '22023';
  end if;

  perform public.check_edge_account_target(v_actor, p_target);
  select slug into v_role from public.roles where id = p_role for share;
  if not found then
    raise exception 'Role not found' using errcode = 'P0002';
  end if;

  if v_role in ('super_admin', 'hospital_admin') and not public.has_role('super_admin') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_grant then
    insert into public.user_roles (user_id, role_id, granted_by)
    values (p_target, p_role, v_actor)
    on conflict (user_id, role_id) do nothing;
  else
    delete from public.user_roles where user_id = p_target and role_id = p_role;
  end if;
  v_changed := found;

  if v_changed then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (
      v_actor,
      case when p_grant then 'role.grant' else 'role.revoke' end,
      'profile',
      p_target,
      jsonb_build_object('role_id', p_role, 'role_slug', v_role)
    );
  end if;

  return v_changed;
end;
$$;

create function public.expire_insurance_policies()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.insurance_policies
  set status = 'expired'
  where status = 'active' and expiry_date < (now() at time zone 'Asia/Manila')::date;
  get diagnostics v_count = row_count;

  if v_count > 0 then
    insert into public.audit_logs (action, entity_type, metadata)
    values ('insurance.expire', 'insurance_policy', jsonb_build_object('count', v_count));
  end if;

  return v_count;
end;
$$;

revoke all on function public.check_edge_account_target(uuid, uuid) from public, anon, authenticated;
grant execute on function public.check_edge_account_target(uuid, uuid) to service_role;

revoke all on function public.audit_edge_auth_change() from public, anon, authenticated;
revoke all on function public.protect_profile_active() from public, anon, authenticated;

revoke insert, update, delete on public.user_roles from public, anon, authenticated;
revoke all on function public.set_edge_user_role(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.set_edge_user_role(uuid, uuid, boolean) to authenticated;

revoke all on function public.expire_insurance_policies() from public, anon, authenticated;
grant execute on function public.expire_insurance_policies() to service_role;

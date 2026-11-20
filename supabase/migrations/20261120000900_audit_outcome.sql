-- ============================================================================
-- SPMC HMS — record the audit outcome for change alerts
-- ============================================================================
-- Audit Logs previously rendered every trigger entry as "Success" because the
-- metadata had no outcome. Direct database edits are now recorded as
-- 'critical' and deletions as 'warning'; ordinary application changes remain
-- 'success'. The audit table maps this to a Critical/Warning badge.

create or replace function public.audit_change_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_source text;
  v_actor_label text;
  v_entity_type text := tg_table_name;
  v_entity_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_changed jsonb := '[]'::jsonb;
  v_changed_text text;
  v_changed_suffix text := '';
  v_operation text := lower(tg_op);
  v_verb text;
  v_severity text;
  v_description text;
  v_title text;
  v_message text;
begin
  if tg_op <> 'INSERT' then
    v_before := to_jsonb(old);
  end if;

  if tg_op <> 'DELETE' then
    v_after := to_jsonb(new);
  end if;

  v_entity_id := public.try_uuid(
    coalesce(v_after ->> 'id', v_before ->> 'id')
  );

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(j.key order by j.key), '[]'::jsonb)
    into v_changed
    from jsonb_object_keys(v_after) as j(key)
    where v_after -> j.key is distinct from v_before -> j.key
      and j.key not in ('updated_at', 'updated_by');

    select string_agg(value, ', ' order by value)
    into v_changed_text
    from jsonb_array_elements_text(v_changed) as t(value);
  end if;

  if coalesce(v_changed_text, '') <> '' then
    v_changed_suffix := format(' (%s)', v_changed_text);
  end if;

  if v_actor is not null then
    select p.full_name
    into v_actor_label
    from public.profiles p
    where p.id = v_actor;

    v_actor_source := 'app_user';
    v_actor_label := coalesce(v_actor_label, 'Unregistered user');
  elsif auth.role() = 'service_role' then
    v_actor_source := 'service_role';
    v_actor_label := 'System service role';
  else
    v_actor_source := 'direct_database';
    v_actor_label := 'Direct database';
  end if;

  v_verb := case
    when v_operation = 'insert' then 'created'
    when v_operation = 'update' then 'updated'
    else 'deleted'
  end;

  v_description := case v_actor_source
    when 'direct_database' then
      format('Direct database %s on a %s record.', v_operation, v_entity_type)
    else
      format(
        '%s %s a %s record.',
        case when v_actor_source = 'service_role' then 'System' else v_actor_label end,
        v_verb,
        v_entity_type
      )
  end;

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
    format('%s.%s', v_entity_type, v_operation),
    v_entity_type,
    v_entity_id,
    v_description,
    jsonb_build_object(
      'source', 'audit_change_alert',
      'operation', upper(v_operation),
      'actor_source', v_actor_source,
      'actor_label', v_actor_label,
      'is_direct_db', v_actor_source = 'direct_database',
      'outcome', case
        when v_actor_source = 'direct_database' then 'critical'
        when v_operation = 'delete' then 'warning'
        else 'success'
      end,
      'changed_fields', v_changed
    )
  );

  v_severity := case
    when v_actor_source = 'direct_database' then 'critical'
    when v_operation = 'delete' then 'warning'
    else 'info'
  end;

  v_title := case
    when v_actor_source = 'direct_database'
      then format('Direct database change: %s', v_entity_type)
    else format('Database change: %s', v_entity_type)
  end;

  v_message := case v_actor_source
    when 'direct_database' then
      format(
        'Direct database %s on %s%s.',
        v_operation,
        v_entity_type,
        v_changed_suffix
      )
    when 'service_role' then
      format(
        'Service-role %s on %s%s.',
        v_operation,
        v_entity_type,
        v_changed_suffix
      )
    else
      format(
        '%s %s a %s record%s.',
        v_actor_label,
        v_verb,
        v_entity_type,
        v_changed_suffix
      )
  end;

  insert into public.notifications (
    user_id,
    title,
    message,
    notification_type,
    severity,
    related_entity_type,
    related_entity_id
  )
  select
    p.id,
    v_title,
    v_message,
    'system',
    v_severity,
    v_entity_type,
    v_entity_id
  from public.profiles p
  where p.is_active
    and (v_actor is null or p.id <> v_actor)
    and exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p.id
        and r.slug in ('super_admin', 'hospital_admin')
    )
    and not exists (
      select 1
      from public.notification_preferences np
      where np.user_id = p.id
        and np.category = 'system'
        and np.in_app = false
    );

  return null;
end;
$$;

revoke all on function public.audit_change_alert() from public;

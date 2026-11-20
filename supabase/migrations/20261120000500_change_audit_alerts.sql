-- ============================================================================
-- SPMC HMS — database change alerts for administrators
-- ============================================================================
-- Every tracked table change writes an immutable audit entry and fans out an
-- in-app notification to active Super Administrators and Hospital
-- Administrators (excluding the actor). Clinical values are not copied into the
-- alert; only the table, operation, and changed field names are recorded.

create or replace function public.audit_change_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_name text;
  v_entity_type text := tg_table_name;
  v_entity_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_changed jsonb := '[]'::jsonb;
  v_changed_text text;
  v_operation text := lower(tg_op);
  v_severity text;
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
      and j.key <> 'updated_at';

    select string_agg(value, ', ' order by value)
    into v_changed_text
    from jsonb_array_elements_text(v_changed) as t(value);
  end if;

  if v_actor is not null then
    select p.full_name
    into v_actor_name
    from public.profiles p
    where p.id = v_actor;
  end if;

  v_actor_name := coalesce(v_actor_name, 'System');

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
    case v_operation
      when 'insert' then format('Created a %s record.', v_entity_type)
      when 'update' then format('Updated a %s record.', v_entity_type)
      else format('Deleted a %s record.', v_entity_type)
    end,
    jsonb_build_object(
      'source', 'audit_change_alert',
      'operation', upper(v_operation),
      'changed_fields', v_changed
    )
  );

  v_severity := case when v_operation = 'delete' then 'warning' else 'info' end;

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
    format('Database change: %s', v_entity_type),
    format(
      '%s %s a %s record%s.',
      v_actor_name,
      case
        when v_operation = 'insert' then 'created'
        when v_operation = 'update' then 'updated'
        else 'deleted'
      end,
      v_entity_type,
      case
        when coalesce(v_changed_text, '') <> ''
          then format(' (%s)', v_changed_text)
        else ''
      end
    ),
    'system',
    v_severity,
    v_entity_type,
    v_entity_id
  from public.profiles p
  join public.user_roles ur on ur.user_id = p.id
  join public.roles r on r.id = ur.role_id
  where r.slug in ('super_admin', 'hospital_admin')
    and p.is_active
    and (v_actor is null or p.id <> v_actor)
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

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'patients',
    'encounters',
    'prescriptions',
    'invoices',
    'payments',
    'admissions',
    'beds',
    'staff_profiles',
    'profiles',
    'user_roles',
    'medications',
    'inventory_items',
    'laboratory_results',
    'radiology_reports',
    'surgery_cases',
    'blood_units',
    'blood_requests',
    'insurance_providers',
    'departments'
  ] loop
    if to_regclass(format('public.%I', v_table)) is null then
      continue;
    end if;

    execute format(
      'drop trigger if exists trg_audit_change_alert on public.%I',
      v_table
    );
    execute format(
      'create trigger trg_audit_change_alert
         after insert or update or delete on public.%I
         for each row execute function public.audit_change_alert()',
      v_table
    );
  end loop;
end;
$$;

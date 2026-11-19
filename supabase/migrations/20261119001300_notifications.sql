-- ============================================================================
-- SPMC HMS — notifications, announcements and preferences
-- Migration 20261119001300. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- The notifications table already existed and the send-notification function
-- reads it, so this migration extends it instead of replacing it. Delivery
-- status is not modelled: a row is in-app and read or unread. Email delivery is
-- tracked separately by notification_email_deliveries (service role only).

alter table public.notifications
  add column if not exists severity text not null default 'info';

alter table public.notifications
  drop constraint if exists notifications_severity_check;

alter table public.notifications
  add constraint notifications_severity_check
  check (severity in ('info', 'success', 'warning', 'critical'));

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, is_read, created_at desc);

create table if not exists public.staff_announcements (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  body text not null,

  audience text not null default 'all_staff'
    check (audience in ('all_staff', 'physicians', 'nurses', 'department')),
  department_id uuid references public.departments(id) on delete restrict,

  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),

  pinned boolean not null default false,
  expires_at timestamptz,

  published_by uuid references public.profiles(id) on delete restrict,
  published_at timestamptz,

  created_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_staff_announcements_status
  on public.staff_announcements(status, published_at desc);

create table if not exists public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,

  category text not null check (category in (
    'appointment', 'queue', 'admission', 'discharge', 'laboratory',
    'radiology', 'prescription', 'billing', 'inventory', 'maintenance',
    'announcement', 'system'
  )),

  in_app boolean not null default true,

  updated_at timestamptz not null default now(),

  primary key (user_id, category)
);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('notification.manage', 'Publish staff announcements and review all notifications.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug = 'notification.manage'
where r.slug = 'hospital_admin'
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.staff_announcements enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists staff_announcements_select_visible
  on public.staff_announcements;
create policy staff_announcements_select_visible
  on public.staff_announcements
  for select to authenticated
  using (
    status = 'published'
    or public.has_permission('notification.manage')
  );

drop policy if exists notifications_select_managers
  on public.notifications;
create policy notifications_select_managers
  on public.notifications
  for select to authenticated
  using (public.has_permission('notification.manage'));

drop policy if exists notification_preferences_select_owner
  on public.notification_preferences;
create policy notification_preferences_select_owner
  on public.notification_preferences
  for select to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Mark one notification read
-- ----------------------------------------------------------------------------
create or replace function public.mark_notification_read(
  p_notification_id uuid
)
returns uuid
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

  update public.notifications
  set is_read = true,
      read_at = coalesce(read_at, now())
  where id = p_notification_id
    and user_id = v_actor;

  if not found then
    raise exception 'Notification not found' using errcode = '22023';
  end if;

  return p_notification_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Mark every notification read
-- ----------------------------------------------------------------------------
create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_count integer;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  update public.notifications
  set is_read = true,
      read_at = now()
  where user_id = v_actor
    and is_read = false;

  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- Publish an announcement and fan it out to the audience
-- ----------------------------------------------------------------------------
create or replace function public.publish_staff_announcement(
  p_announcement_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_announcement public.staff_announcements%rowtype;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('notification.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select * into v_announcement
  from public.staff_announcements
  where id = p_announcement_id
  for update;

  if not found then
    raise exception 'Announcement not found' using errcode = '22023';
  end if;

  if v_announcement.status = 'published' then
    raise exception 'This announcement is already published'
      using errcode = '22023';
  end if;

  if v_announcement.status = 'archived' then
    raise exception 'Archived announcements cannot be published'
      using errcode = '22023';
  end if;

  if v_announcement.audience = 'department'
     and v_announcement.department_id is null then
    raise exception 'Select the department for this audience'
      using errcode = '22023';
  end if;

  update public.staff_announcements
  set status = 'published',
      published_by = v_actor,
      published_at = now(),
      updated_at = now()
  where id = p_announcement_id;

  insert into public.notifications (
    user_id, title, message, notification_type, severity,
    related_entity_type, related_entity_id
  )
  select
    sp.user_id,
    v_announcement.title,
    v_announcement.body,
    'announcement',
    'info',
    'staff_announcement',
    p_announcement_id
  from public.staff_profiles sp
  join public.profiles p on p.id = sp.user_id and p.is_active
  where sp.is_active
    and (
      v_announcement.audience = 'all_staff'
      or (
        v_announcement.audience = 'physicians'
        and exists (
          select 1
          from public.user_roles ur
          join public.roles r on r.id = ur.role_id
          where ur.user_id = sp.user_id and r.slug = 'physician'
        )
      )
      or (
        v_announcement.audience = 'nurses'
        and exists (
          select 1
          from public.user_roles ur
          join public.roles r on r.id = ur.role_id
          where ur.user_id = sp.user_id and r.slug = 'nurse'
        )
      )
      or (
        v_announcement.audience = 'department'
        and sp.department_id = v_announcement.department_id
      )
    )
    and not exists (
      select 1
      from public.notification_preferences np
      where np.user_id = sp.user_id
        and np.category = 'announcement'
        and np.in_app = false
    );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'notification.announcement.publish', 'staff_announcement',
    p_announcement_id, 'Published a staff announcement.',
    jsonb_build_object(
      'source', 'publish_staff_announcement',
      'audience', v_announcement.audience
    )
  );

  return p_announcement_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Create an announcement (draft or published)
-- ----------------------------------------------------------------------------
create or replace function public.create_staff_announcement(
  p_title text,
  p_body text,
  p_audience text default 'all_staff',
  p_department_id uuid default null,
  p_pinned boolean default false,
  p_expires_at timestamptz default null,
  p_publish boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_audience text := coalesce(nullif(btrim(p_audience), ''), 'all_staff');
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('notification.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if btrim(coalesce(p_title, '')) = '' or btrim(coalesce(p_body, '')) = '' then
    raise exception 'A title and body are required' using errcode = '22023';
  end if;

  if v_audience not in ('all_staff', 'physicians', 'nurses', 'department') then
    raise exception 'Unsupported announcement audience' using errcode = '22023';
  end if;

  if v_audience = 'department' and p_department_id is null then
    raise exception 'Select the department for this audience'
      using errcode = '22023';
  end if;

  insert into public.staff_announcements (
    title, body, audience, department_id, pinned, expires_at, created_by
  )
  values (
    btrim(p_title),
    btrim(p_body),
    v_audience,
    case when v_audience = 'department' then p_department_id else null end,
    coalesce(p_pinned, false),
    p_expires_at,
    v_actor
  )
  returning id into v_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'notification.announcement.create', 'staff_announcement', v_id,
    'Created a staff announcement.',
    jsonb_build_object('source', 'create_staff_announcement', 'audience', v_audience)
  );

  if coalesce(p_publish, false) then
    perform public.publish_staff_announcement(v_id);
  end if;

  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Archive an announcement
-- ----------------------------------------------------------------------------
create or replace function public.archive_staff_announcement(
  p_announcement_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_status text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('notification.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select status into v_status
  from public.staff_announcements
  where id = p_announcement_id
  for update;

  if not found then
    raise exception 'Announcement not found' using errcode = '22023';
  end if;

  if v_status = 'archived' then
    raise exception 'This announcement is already archived' using errcode = '22023';
  end if;

  update public.staff_announcements
  set status = 'archived',
      updated_at = now()
  where id = p_announcement_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'notification.announcement.archive', 'staff_announcement',
    p_announcement_id, 'Archived a staff announcement.',
    jsonb_build_object('source', 'archive_staff_announcement')
  );

  return p_announcement_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Save the caller's in-app notification preferences
-- ----------------------------------------------------------------------------
create or replace function public.save_notification_preferences(
  p_preferences jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_count integer;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_preferences is null or jsonb_typeof(p_preferences) <> 'array' then
    raise exception 'Preferences must be a JSON array' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_preferences) as item
    where coalesce(item->>'category', '') not in (
      'appointment', 'queue', 'admission', 'discharge', 'laboratory',
      'radiology', 'prescription', 'billing', 'inventory', 'maintenance',
      'announcement', 'system'
    )
  ) then
    raise exception 'Unsupported notification category' using errcode = '22023';
  end if;

  insert into public.notification_preferences (user_id, category, in_app)
  select
    v_actor,
    item->>'category',
    coalesce((item->>'in_app')::boolean, true)
  from jsonb_array_elements(p_preferences) as item
  on conflict (user_id, category) do update
  set in_app = excluded.in_app,
      updated_at = now();

  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

revoke all on function public.mark_notification_read(uuid) from public;
revoke all on function public.mark_all_notifications_read() from public;
revoke all on function public.create_staff_announcement(
  text, text, text, uuid, boolean, timestamptz, boolean
) from public;
revoke all on function public.publish_staff_announcement(uuid) from public;
revoke all on function public.archive_staff_announcement(uuid) from public;
revoke all on function public.save_notification_preferences(jsonb) from public;

grant execute on function public.mark_notification_read(uuid) to authenticated, service_role;
grant execute on function public.mark_all_notifications_read() to authenticated, service_role;
grant execute on function public.create_staff_announcement(
  text, text, text, uuid, boolean, timestamptz, boolean
) to authenticated, service_role;
grant execute on function public.publish_staff_announcement(uuid) to authenticated, service_role;
grant execute on function public.archive_staff_announcement(uuid) to authenticated, service_role;
grant execute on function public.save_notification_preferences(jsonb) to authenticated, service_role;

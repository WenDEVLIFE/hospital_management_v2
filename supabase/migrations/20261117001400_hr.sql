-- ============================================================================
-- SPMC HMS — human resources
-- Migration 037. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- HR extends staff_profiles rather than duplicating it: identity, department
-- and employment type stay in the staff record, HR adds position, credentials,
-- shifts, attendance, leave and payroll.

create table if not exists public.hr_employee_details (
  staff_profile_id uuid primary key
    references public.staff_profiles(id) on delete cascade,

  position text not null,
  employment_status text not null default 'active'
    check (employment_status in ('active', 'on_leave', 'inactive', 'separated')),
  hire_date date not null,
  license_expiry date,
  leave_balance numeric(6,2) not null default 0 check (leave_balance >= 0),

  created_by uuid references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete restrict,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_credentials (
  id uuid primary key default gen_random_uuid(),

  staff_profile_id uuid not null
    references public.staff_profiles(id) on delete cascade,

  credential_type text not null,
  credential_number text not null,
  issued_at date not null,
  expires_at date,
  status text not null default 'valid'
    check (status in ('valid', 'expiring', 'expired', 'revoked')),

  created_at timestamptz not null default now()
);

create table if not exists public.hr_shifts (
  id uuid primary key default gen_random_uuid(),

  staff_profile_id uuid not null
    references public.staff_profiles(id) on delete cascade,

  shift_date date not null,
  shift_type text not null
    check (shift_type in ('morning', 'afternoon', 'night', 'off', 'on_call')),
  start_time time not null,
  end_time time not null,
  published boolean not null default true,

  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_attendance (
  id uuid primary key default gen_random_uuid(),

  staff_profile_id uuid not null
    references public.staff_profiles(id) on delete cascade,

  attendance_date date not null,
  time_in time,
  time_out time,
  status text not null default 'present'
    check (status in ('present', 'late', 'absent', 'leave', 'holiday')),
  overtime_minutes integer not null default 0 check (overtime_minutes >= 0),
  note text,

  created_at timestamptz not null default now(),

  unique (staff_profile_id, attendance_date)
);

create table if not exists public.hr_leave_requests (
  id uuid primary key default gen_random_uuid(),

  staff_profile_id uuid not null
    references public.staff_profiles(id) on delete cascade,

  leave_type text not null
    check (leave_type in ('vacation', 'sick', 'maternity', 'paternity', 'emergency', 'study')),
  start_date date not null,
  end_date date not null,
  days numeric(5,1) not null check (days > 0),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reason text not null,

  requested_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),

  check (end_date >= start_date)
);

create table if not exists public.hr_payroll_periods (
  id uuid primary key default gen_random_uuid(),

  period_start date not null,
  period_end date not null,
  pay_date date not null,
  status text not null default 'draft'
    check (status in ('draft', 'processing', 'approved', 'paid')),

  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),

  check (period_end >= period_start)
);

create table if not exists public.hr_payroll_entries (
  id uuid primary key default gen_random_uuid(),

  payroll_period_id uuid not null
    references public.hr_payroll_periods(id) on delete cascade,
  staff_profile_id uuid not null
    references public.staff_profiles(id) on delete cascade,

  position text not null,
  basic_pay numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  overtime_pay numeric(12,2) not null default 0,
  gross_pay numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_pay numeric(12,2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'paid')),

  created_at timestamptz not null default now(),

  unique (payroll_period_id, staff_profile_id)
);

create index if not exists idx_hr_shifts_date
  on public.hr_shifts(shift_date, staff_profile_id);
create index if not exists idx_hr_attendance_date
  on public.hr_attendance(attendance_date, staff_profile_id);
create index if not exists idx_hr_leave_status
  on public.hr_leave_requests(status, start_date desc);

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
insert into public.permissions (slug, description)
values
  ('hr.view', 'View employee records, attendance, leave and payroll.'),
  ('hr.manage', 'Schedule shifts and process leave requests.'),
  ('hr.payroll', 'Prepare and approve payroll.')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug in ('hr.view', 'hr.manage', 'hr.payroll')
where r.slug = 'hospital_admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.slug = 'hr.view'
where r.slug in ('physician', 'nurse')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'hr_employee_details',
    'hr_credentials',
    'hr_shifts',
    'hr_attendance',
    'hr_leave_requests',
    'hr_payroll_periods',
    'hr_payroll_entries'
  ]
  loop
    execute format('alter table public.%I enable row level security', v_table);
    execute format(
      'drop policy if exists %I on public.%I',
      v_table || '_select_authorized',
      v_table
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_permission(''hr.view''))',
      v_table || '_select_authorized',
      v_table
    );
  end loop;
end;
$$;

drop policy if exists "hr_shifts_insert_authorized" on public.hr_shifts;
create policy "hr_shifts_insert_authorized"
on public.hr_shifts
for insert
to authenticated
with check (
  public.has_permission('hr.manage')
  and created_by = auth.uid()
);

drop policy if exists "hr_leave_insert_authorized" on public.hr_leave_requests;
create policy "hr_leave_insert_authorized"
on public.hr_leave_requests
for insert
to authenticated
with check (
  public.has_permission('hr.manage')
  and requested_by = auth.uid()
);

drop policy if exists "hr_leave_update_authorized" on public.hr_leave_requests;
create policy "hr_leave_update_authorized"
on public.hr_leave_requests
for update
to authenticated
using (public.has_permission('hr.manage'))
with check (public.has_permission('hr.manage'));

-- ----------------------------------------------------------------------------
-- Schedule a shift
-- ----------------------------------------------------------------------------
create or replace function public.schedule_shift(
  p_staff_profile_id uuid,
  p_shift_date date,
  p_shift_type text,
  p_start_time time,
  p_end_time time
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_shift_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.staff_profiles where id = p_staff_profile_id
  ) then
    raise exception 'Staff record not found' using errcode = '22023';
  end if;

  if p_shift_type not in ('morning', 'afternoon', 'night', 'off', 'on_call') then
    raise exception 'Unsupported shift type' using errcode = '22023';
  end if;

  if p_start_time is null or p_end_time is null or p_end_time <= p_start_time then
    raise exception 'The shift end time must be after the start time'
      using errcode = '22023';
  end if;

  insert into public.hr_shifts (
    staff_profile_id, shift_date, shift_type, start_time, end_time, created_by
  )
  values (
    p_staff_profile_id, p_shift_date, p_shift_type,
    p_start_time, p_end_time, v_actor
  )
  returning id into v_shift_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'hr.shift.schedule',
    'hr_shift',
    v_shift_id,
    'Scheduled a staff shift.',
    jsonb_build_object(
      'source', 'schedule_shift',
      'shift_date', p_shift_date,
      'shift_type', p_shift_type
    )
  );

  return v_shift_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- File a leave request
-- ----------------------------------------------------------------------------
create or replace function public.file_leave_request(
  p_staff_profile_id uuid,
  p_leave_type text,
  p_start_date date,
  p_end_date date,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_leave_id uuid;
  v_days numeric(5,1);
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.staff_profiles where id = p_staff_profile_id
  ) then
    raise exception 'Staff record not found' using errcode = '22023';
  end if;

  if p_leave_type not in (
    'vacation', 'sick', 'maternity', 'paternity', 'emergency', 'study'
  ) then
    raise exception 'Unsupported leave type' using errcode = '22023';
  end if;

  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'The leave end date must be on or after the start date'
      using errcode = '22023';
  end if;

  if v_reason = '' then
    raise exception 'A leave reason is required' using errcode = '22023';
  end if;

  v_days := (p_end_date - p_start_date) + 1;

  insert into public.hr_leave_requests (
    staff_profile_id, leave_type, start_date, end_date, days, reason, requested_by
  )
  values (
    p_staff_profile_id, p_leave_type, p_start_date, p_end_date,
    v_days, v_reason, v_actor
  )
  returning id into v_leave_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'hr.leave.file',
    'hr_leave_request',
    v_leave_id,
    'Filed a leave request.',
    jsonb_build_object(
      'source', 'file_leave_request',
      'leave_type', p_leave_type,
      'days', v_days
    )
  );

  return v_leave_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Review a leave request
-- ----------------------------------------------------------------------------
create or replace function public.review_leave_request(
  p_leave_id uuid,
  p_decision text
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

  if not public.has_permission('hr.manage') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Unsupported leave decision' using errcode = '22023';
  end if;

  select status
  into v_status
  from public.hr_leave_requests
  where id = p_leave_id
  for update;

  if not found then
    raise exception 'Leave request not found' using errcode = '22023';
  end if;

  if v_status <> 'pending' then
    raise exception 'Only pending leave requests can be reviewed'
      using errcode = '22023';
  end if;

  update public.hr_leave_requests
  set status = p_decision,
      reviewed_by = v_actor,
      reviewed_at = now()
  where id = p_leave_id;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor,
    'hr.leave.review',
    'hr_leave_request',
    p_leave_id,
    'Reviewed a leave request.',
    jsonb_build_object('source', 'review_leave_request', 'decision', p_decision)
  );

  return p_leave_id;
end;
$$;

revoke all on function public.schedule_shift(uuid, date, text, time, time)
  from public;
revoke all on function public.file_leave_request(uuid, text, date, date, text)
  from public;
revoke all on function public.review_leave_request(uuid, text) from public;

grant execute on function public.schedule_shift(uuid, date, text, time, time)
  to authenticated, service_role;
grant execute on function public.file_leave_request(uuid, text, date, date, text)
  to authenticated, service_role;
grant execute on function public.review_leave_request(uuid, text)
  to authenticated, service_role;

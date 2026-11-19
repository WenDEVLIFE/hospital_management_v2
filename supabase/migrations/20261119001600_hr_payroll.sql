-- ============================================================================
-- SPMC HMS — employee intake and payroll runs
-- Migration 20261119001600. Mirrors supabase/schema.sql; keep both in sync.
-- ============================================================================
-- HR had no salary column and no way to process a period, so "Run Payroll" and
-- "Add Employee" could not be real. This adds an explicit monthly rate, records
-- the deduction rate used for each run, and creates both RPCs.
--
-- Deductions are a single rate supplied by the administrator for that run. The
-- database does not invent statutory contribution tables: the rate is stored on
-- the period so a payslip can be explained after the fact.

alter table public.hr_employee_details
  add column if not exists monthly_rate numeric(12,2) not null default 0;

alter table public.hr_employee_details
  drop constraint if exists hr_employee_details_monthly_rate_check;

alter table public.hr_employee_details
  add constraint hr_employee_details_monthly_rate_check
  check (monthly_rate >= 0);

alter table public.hr_payroll_periods
  add column if not exists deduction_rate numeric(5,2) not null default 0;

alter table public.hr_payroll_periods
  drop constraint if exists hr_payroll_periods_deduction_rate_check;

alter table public.hr_payroll_periods
  add constraint hr_payroll_periods_deduction_rate_check
  check (deduction_rate between 0 and 100);

-- ----------------------------------------------------------------------------
-- Create an employee: staff record plus HR details in one transaction
-- ----------------------------------------------------------------------------
create or replace function public.create_employee_record(
  p_user_id uuid,
  p_staff_number text,
  p_first_name text,
  p_last_name text,
  p_position text,
  p_hire_date date,
  p_middle_name text default null,
  p_department_id uuid default null,
  p_employment_type text default null,
  p_professional_license_number text default null,
  p_role_id uuid default null,
  p_monthly_rate numeric default 0,
  p_license_expiry date default null,
  p_leave_balance numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_staff_id uuid;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.is_admin() then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if btrim(coalesce(p_position, '')) = '' then
    raise exception 'Enter the employee position' using errcode = '22023';
  end if;

  if p_hire_date is null then
    raise exception 'Select the hire date' using errcode = '22023';
  end if;

  if coalesce(p_monthly_rate, 0) < 0 or coalesce(p_leave_balance, 0) < 0 then
    raise exception 'Salary and leave balance cannot be negative'
      using errcode = '22023';
  end if;

  v_staff_id := public.create_staff_record(
    p_user_id,
    p_staff_number,
    p_first_name,
    p_last_name,
    p_middle_name,
    p_department_id,
    p_employment_type,
    p_professional_license_number,
    p_role_id
  );

  insert into public.hr_employee_details (
    staff_profile_id, position, hire_date, monthly_rate,
    license_expiry, leave_balance, created_by
  )
  values (
    v_staff_id,
    btrim(p_position),
    p_hire_date,
    coalesce(p_monthly_rate, 0),
    p_license_expiry,
    coalesce(p_leave_balance, 0),
    v_actor
  );

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'hr.employee.create', 'staff_profile', v_staff_id,
    'Created an employee record.',
    jsonb_build_object(
      'source', 'create_employee_record',
      'position', btrim(p_position),
      'monthly_rate', coalesce(p_monthly_rate, 0)
    )
  );

  return v_staff_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Run payroll for a period
-- ----------------------------------------------------------------------------
create or replace function public.run_payroll(
  p_period_start date,
  p_period_end date,
  p_pay_date date,
  p_deduction_rate numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_days integer;
  v_rate numeric := coalesce(p_deduction_rate, 0);
  v_entries integer;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not public.has_permission('hr.payroll') then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_period_start is null or p_period_end is null or p_pay_date is null then
    raise exception 'Select the period dates and pay date' using errcode = '22023';
  end if;

  if p_period_end < p_period_start then
    raise exception 'The period end cannot be before the start' using errcode = '22023';
  end if;

  if v_rate < 0 or v_rate > 100 then
    raise exception 'The deduction rate must be between 0 and 100'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.hr_payroll_periods
    where status <> 'paid'
      and period_start <= p_period_end
      and period_end >= p_period_start
  ) then
    raise exception 'A payroll period overlaps an existing run'
      using errcode = '22023';
  end if;

  v_days := (p_period_end - p_period_start) + 1;

  insert into public.hr_payroll_periods (
    period_start, period_end, pay_date, status, deduction_rate, created_by
  )
  values (
    p_period_start, p_period_end, p_pay_date, 'processing', v_rate, v_actor
  )
  returning id into v_id;

  with base as (
    select
      d.staff_profile_id,
      d.position,
      round(d.monthly_rate / 30.0 * v_days, 2) as basic_pay,
      round(
        coalesce((
          select sum(a.overtime_minutes)
          from public.hr_attendance a
          where a.staff_profile_id = d.staff_profile_id
            and a.attendance_date between p_period_start and p_period_end
        ), 0) / 60.0 * (d.monthly_rate / 30.0 / 8.0) * 1.25,
        2
      ) as overtime_pay
    from public.hr_employee_details d
    join public.staff_profiles sp on sp.id = d.staff_profile_id
    where d.employment_status = 'active'
      and sp.is_active
      and d.monthly_rate > 0
  )
  insert into public.hr_payroll_entries (
    payroll_period_id, staff_profile_id, position,
    basic_pay, allowances, overtime_pay, gross_pay, deductions, net_pay
  )
  select
    v_id,
    staff_profile_id,
    position,
    basic_pay,
    0,
    overtime_pay,
    basic_pay + overtime_pay,
    round((basic_pay + overtime_pay) * v_rate / 100.0, 2),
    (basic_pay + overtime_pay)
      - round((basic_pay + overtime_pay) * v_rate / 100.0, 2)
  from base;

  get diagnostics v_entries = row_count;

  if v_entries = 0 then
    raise exception 'No active employee has a monthly rate. Set salaries before running payroll.'
      using errcode = '22023';
  end if;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, description, metadata
  )
  values (
    v_actor, 'hr.payroll.run', 'hr_payroll_period', v_id,
    'Ran payroll for a period.',
    jsonb_build_object(
      'source', 'run_payroll',
      'period_start', p_period_start,
      'period_end', p_period_end,
      'employees', v_entries,
      'deduction_rate', v_rate
    )
  );

  return v_id;
end;
$$;

revoke all on function public.create_employee_record(
  uuid, text, text, text, text, date, text, uuid, text, text, uuid, numeric, date, numeric
) from public;
grant execute on function public.create_employee_record(
  uuid, text, text, text, text, date, text, uuid, text, text, uuid, numeric, date, numeric
) to authenticated, service_role;

revoke all on function public.run_payroll(date, date, date, numeric) from public;
grant execute on function public.run_payroll(date, date, date, numeric)
  to authenticated, service_role;

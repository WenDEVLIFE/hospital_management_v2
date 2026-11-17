import type {
  AttendanceEntry,
  AttendanceListRow,
  Credential,
  Employee,
  EmployeeDetail,
  EmployeeListRow,
  EmployeeStatus,
  EmploymentType,
  HrStats,
  LeaveRequest,
  PayrollEntry,
  PayrollPeriod,
  PayrollStatus,
  Shift,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate, pageSlice, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const EMPLOYEE_COLUMNS =
  "*, profiles!staff_profiles_user_id_fkey(email, contact_number, is_active), departments(name), hr_employee_details(position, employment_status, hire_date, license_expiry, leave_balance)";

const LEAVE_COLUMNS =
  "*, staff_profiles!hr_leave_requests_staff_profile_id_fkey(first_name, middle_name, last_name, staff_number)";

type Relation<T> = T | T[] | null;

type EmployeeJoinRow = {
  id: string;
  user_id: string;
  staff_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  department_id: string | null;
  employment_type: string | null;
  professional_license_number: string | null;
  is_active: boolean;
  created_at: string;
  profiles: Relation<{
    email: string;
    contact_number: string | null;
    is_active: boolean;
  }>;
  departments: Relation<{ name: string }>;
  hr_employee_details: Relation<{
    position: string;
    employment_status: string;
    hire_date: string;
    license_expiry: string | null;
    leave_balance: number;
  }>;
};

type LeaveJoinRow = {
  id: string;
  staff_profile_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason: string;
  requested_by: string;
  reviewed_by: string | null;
  created_at: string;
  staff_profiles: Relation<{
    first_name: string;
    middle_name: string | null;
    last_name: string;
    staff_number: string;
  }>;
};

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested employee could not be found.",
} as const;

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function fullName(row: {
  first_name: string;
  middle_name: string | null;
  last_name: string;
}): string {
  return [row.first_name, row.middle_name, row.last_name]
    .filter(Boolean)
    .join(" ");
}

function daysUntil(date: string | null): number | null {
  if (!date) {
    return null;
  }

  const target = new Date(`${date}T00:00:00+08:00`).getTime();

  if (Number.isNaN(target)) {
    return null;
  }

  return Math.round((target - Date.now()) / 86_400_000);
}

function licenseStatus(
  expiry: string | null
): Employee["license_status"] {
  const remaining = daysUntil(expiry);

  if (remaining === null) {
    return "none";
  }

  if (remaining < 0) {
    return "expired";
  }

  if (remaining <= 60) {
    return "expiring";
  }

  return "valid";
}

function normalizeEmploymentType(value: string | null): EmploymentType {
  const normalized = (value ?? "regular").toLowerCase().replace(/\s+/g, "_");

  if (
    normalized === "probationary" ||
    normalized === "contractual" ||
    normalized === "part_time" ||
    normalized === "consultant"
  ) {
    return normalized;
  }

  return "regular";
}

function toEmployee(row: EmployeeJoinRow): Employee {
  const profile = firstRelation(row.profiles);
  const department = firstRelation(row.departments);
  const details = firstRelation(row.hr_employee_details);
  const status = (details?.employment_status ?? "active") as EmployeeStatus;

  return {
    id: row.id,
    employee_number: row.staff_number,
    user_id: row.user_id,
    first_name: row.first_name,
    middle_name: row.middle_name,
    last_name: row.last_name,
    full_name: fullName(row),
    email: profile?.email ?? "",
    contact_number: profile?.contact_number ?? null,
    department_id: row.department_id,
    department_name: department?.name ?? null,
    position: details?.position ?? "Staff",
    employment_type: normalizeEmploymentType(row.employment_type),
    status,
    hire_date: details?.hire_date ?? row.created_at.slice(0, 10),
    license_number: row.professional_license_number,
    license_expiry: details?.license_expiry ?? null,
    license_status: licenseStatus(details?.license_expiry ?? null),
    is_active: row.is_active && (profile?.is_active ?? true),
    created_at: row.created_at,
  };
}

async function loadEmployees(): Promise<DataResult<EmployeeJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff_profiles")
    .select(EMPLOYEE_COLUMNS)
    .order("last_name", { ascending: true });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as EmployeeJoinRow[], error: null };
}

async function loadShiftsByEmployee(
  date?: string
): Promise<Map<string, Shift[]>> {
  const supabase = await getSupabaseServerClient();
  let query = supabase.from("hr_shifts").select("*").order("start_time");

  if (date) {
    query = query.eq("shift_date", date);
  }

  const { data, error } = await query;
  const shifts = new Map<string, Shift[]>();

  if (error) {
    return shifts;
  }

  for (const row of (data ?? []) as Array<{
    id: string;
    staff_profile_id: string;
    shift_date: string;
    shift_type: string;
    start_time: string;
    end_time: string;
  }>) {
    const list = shifts.get(row.staff_profile_id) ?? [];
    list.push({
      id: row.id,
      employee_id: row.staff_profile_id,
      date: row.shift_date,
      shift_type: row.shift_type as Shift["shift_type"],
      start_time: row.start_time,
      end_time: row.end_time,
      department_name: null,
      role: "",
    });
    shifts.set(row.staff_profile_id, list);
  }

  return shifts;
}

async function loadAttendance(): Promise<AttendanceEntry[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("hr_attendance")
    .select("*")
    .order("attendance_date", { ascending: false })
    .limit(1000);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<{
    id: string;
    staff_profile_id: string;
    attendance_date: string;
    time_in: string | null;
    time_out: string | null;
    status: string;
    overtime_minutes: number;
    note: string | null;
  }>).map((row) => ({
    id: row.id,
    employee_id: row.staff_profile_id,
    date: row.attendance_date,
    time_in: row.time_in,
    time_out: row.time_out,
    status: row.status as AttendanceEntry["status"],
    overtime_minutes: row.overtime_minutes,
    note: row.note,
  }));
}

export async function listEmployees(
  params: {
    q?: string;
    department?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<EmployeeListRow>> {
  const employeeResult = await loadEmployees();

  if (employeeResult.error) {
    return { data: null, error: employeeResult.error };
  }

  const today = manilaDate(new Date().toISOString());
  const [todayShifts, attendance] = await Promise.all([
    loadShiftsByEmployee(today),
    loadAttendance(),
  ]);

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows: EmployeeListRow[] = (employeeResult.data ?? [])
    .map(toEmployee)
    .filter((employee) => {
      if (params.department && employee.department_id !== params.department) {
        return false;
      }

      if (params.status && employee.status !== params.status) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        employee.full_name,
        employee.employee_number,
        employee.email,
        employee.position,
        employee.department_name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    })
    .map((employee) => {
      const employeeAttendance = attendance.filter(
        (entry) => entry.employee_id === employee.id
      );
      const present = employeeAttendance.filter(
        (entry) => entry.status === "present" || entry.status === "late"
      ).length;
      const shift = todayShifts.get(employee.id)?.[0] ?? null;
      const details = (employeeResult.data ?? []).find(
        (row) => row.id === employee.id
      );
      const detail = details ? firstRelation(details.hr_employee_details) : null;

      return {
        ...employee,
        current_shift: shift ? shift.shift_type : null,
        attendance_rate:
          employeeAttendance.length > 0
            ? Math.round((present / employeeAttendance.length) * 100)
            : 0,
        leave_balance: Number(detail?.leave_balance ?? 0),
      };
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function getEmployeeDetails(): Promise<
  DataResult<Record<string, EmployeeDetail>>
> {
  const employeeResult = await loadEmployees();

  if (employeeResult.error) {
    return { data: null, error: employeeResult.error };
  }

  const supabase = await getSupabaseServerClient();
  const employees = (employeeResult.data ?? []).map(toEmployee);
  const [attendance, shifts, leaveResult, credentialResult, payrollResult] =
    await Promise.all([
      loadAttendance(),
      loadShiftsByEmployee(),
      supabase
        .from("hr_leave_requests")
        .select(LEAVE_COLUMNS)
        .order("created_at", { ascending: false }),
      supabase.from("hr_credentials").select("*"),
      supabase
        .from("hr_payroll_entries")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  const leaveByEmployee = new Map<string, LeaveRequest[]>();

  for (const row of (leaveResult.data ?? []) as LeaveJoinRow[]) {
    const staff = firstRelation(row.staff_profiles);
    const list = leaveByEmployee.get(row.staff_profile_id) ?? [];
    list.push({
      id: row.id,
      employee_id: row.staff_profile_id,
      employee_name: staff ? fullName(staff) : "Unknown employee",
      leave_type: row.leave_type as LeaveRequest["leave_type"],
      start_date: row.start_date,
      end_date: row.end_date,
      days: Number(row.days),
      status: row.status as LeaveRequest["status"],
      reason: row.reason,
      requested_at: row.created_at,
      reviewed_by_name: null,
    });
    leaveByEmployee.set(row.staff_profile_id, list);
  }

  const credentialsByEmployee = new Map<string, Credential[]>();

  for (const row of (credentialResult.data ?? []) as Array<{
    id: string;
    staff_profile_id: string;
    credential_type: string;
    credential_number: string;
    issued_at: string;
    expires_at: string | null;
    status: string;
  }>) {
    const list = credentialsByEmployee.get(row.staff_profile_id) ?? [];
    list.push({
      id: row.id,
      employee_id: row.staff_profile_id,
      credential_type: row.credential_type,
      credential_number: row.credential_number,
      issued_at: row.issued_at,
      expires_at: row.expires_at,
      status: row.status as Credential["status"],
    });
    credentialsByEmployee.set(row.staff_profile_id, list);
  }

  const payslipByEmployee = new Map<string, PayrollEntry>();

  for (const row of (payrollResult.data ?? []) as Array<{
    id: string;
    payroll_period_id: string;
    staff_profile_id: string;
    position: string;
    basic_pay: number;
    allowances: number;
    overtime_pay: number;
    gross_pay: number;
    deductions: number;
    net_pay: number;
    status: string;
  }>) {
    if (payslipByEmployee.has(row.staff_profile_id)) {
      continue;
    }

    const employee = employees.find((entry) => entry.id === row.staff_profile_id);
    payslipByEmployee.set(row.staff_profile_id, {
      id: row.id,
      payroll_period_id: row.payroll_period_id,
      employee_id: row.staff_profile_id,
      employee_name: employee?.full_name ?? "Unknown employee",
      position: row.position,
      basic_pay: Number(row.basic_pay),
      allowances: Number(row.allowances),
      overtime_pay: Number(row.overtime_pay),
      gross_pay: Number(row.gross_pay),
      deductions: Number(row.deductions),
      net_pay: Number(row.net_pay),
      status: row.status as PayrollStatus,
    });
  }

  const details: Record<string, EmployeeDetail> = {};

  for (const employee of employees) {
    details[employee.id] = {
      employee,
      credentials: credentialsByEmployee.get(employee.id) ?? [],
      attendance: attendance
        .filter((entry) => entry.employee_id === employee.id)
        .slice(0, 30),
      shifts: shifts.get(employee.id) ?? [],
      leave_requests: leaveByEmployee.get(employee.id) ?? [],
      latest_payslip: payslipByEmployee.get(employee.id) ?? null,
    };
  }

  return { data: details, error: null };
}

export async function getEmployeeDetail(
  id: string
): Promise<DataResult<EmployeeDetail>> {
  const detailsResult = await getEmployeeDetails();

  if (detailsResult.error) {
    return { data: null, error: detailsResult.error };
  }

  const detail = detailsResult.data?.[id];

  if (!detail) {
    return { data: null, error: NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function listTodayAttendance(
  params: { page?: number; pageSize?: number } = {}
): Promise<PagedResult<AttendanceListRow>> {
  const today = manilaDate(new Date().toISOString());
  const employeeResult = await loadEmployees();

  if (employeeResult.error) {
    return { data: null, error: employeeResult.error };
  }

  const supabase = await getSupabaseServerClient();
  const [attendanceResult, shiftResult] = await Promise.all([
    supabase.from("hr_attendance").select("*").eq("attendance_date", today),
    supabase.from("hr_shifts").select("*").eq("shift_date", today),
  ]);

  const shiftByEmployee = new Map<string, string>();

  for (const row of (shiftResult.data ?? []) as Array<{
    staff_profile_id: string;
    shift_type: string;
  }>) {
    shiftByEmployee.set(row.staff_profile_id, row.shift_type);
  }

  const attendanceByEmployee = new Map<
    string,
    {
      id: string;
      time_in: string | null;
      time_out: string | null;
      status: string;
      overtime_minutes: number;
      note: string | null;
    }
  >();

  for (const row of (attendanceResult.data ?? []) as Array<{
    id: string;
    staff_profile_id: string;
    time_in: string | null;
    time_out: string | null;
    status: string;
    overtime_minutes: number;
    note: string | null;
  }>) {
    attendanceByEmployee.set(row.staff_profile_id, row);
  }

  const rows: AttendanceListRow[] = (employeeResult.data ?? [])
    .map(toEmployee)
    .map((employee) => {
      const attendance = attendanceByEmployee.get(employee.id);
      const shift = shiftByEmployee.get(employee.id) ?? null;

      return {
        id: attendance?.id ?? employee.id,
        employee_id: employee.id,
        date: today,
        time_in: attendance?.time_in ?? null,
        time_out: attendance?.time_out ?? null,
        status: (attendance?.status ?? "absent") as AttendanceEntry["status"],
        overtime_minutes: attendance?.overtime_minutes ?? 0,
        note: attendance?.note ?? null,
        employee_name: employee.full_name,
        employee_number: employee.employee_number,
        department_name: employee.department_name,
        position: employee.position,
        shift_label: shift ? shift.replace(/_/g, " ") : "No shift",
      };
    });

  return {
    data: pageSlice(rows, params.page, params.pageSize),
    error: null,
  };
}

export async function listLeaveRequests(
  params: {
    q?: string;
    status?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<LeaveRequest>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("hr_leave_requests")
    .select(LEAVE_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = ((data ?? []) as LeaveJoinRow[])
    .map((row) => {
      const staff = firstRelation(row.staff_profiles);

      return {
        id: row.id,
        employee_id: row.staff_profile_id,
        employee_name: staff ? fullName(staff) : "Unknown employee",
        leave_type: row.leave_type as LeaveRequest["leave_type"],
        start_date: row.start_date,
        end_date: row.end_date,
        days: Number(row.days),
        status: row.status as LeaveRequest["status"],
        reason: row.reason,
        requested_at: row.created_at,
        reviewed_by_name: null,
      } satisfies LeaveRequest;
    })
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (params.type && row.leave_type !== params.type) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [row.employee_name, row.leave_type, row.reason]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function listPayrollPeriods(): Promise<
  DataResult<PayrollPeriod[]>
> {
  const supabase = await getSupabaseServerClient();
  const [periodResult, entryResult] = await Promise.all([
    supabase
      .from("hr_payroll_periods")
      .select("*")
      .order("period_start", { ascending: false }),
    supabase.from("hr_payroll_entries").select("*"),
  ]);

  if (periodResult.error) {
    return { data: null, error: toDataError(periodResult.error) };
  }

  const entries = (entryResult.data ?? []) as Array<{
    payroll_period_id: string;
    gross_pay: number;
    deductions: number;
    net_pay: number;
  }>;

  const periods: PayrollPeriod[] = ((periodResult.data ?? []) as Array<{
    id: string;
    period_start: string;
    period_end: string;
    pay_date: string;
    status: string;
  }>).map((row) => {
    const periodEntries = entries.filter(
      (entry) => entry.payroll_period_id === row.id
    );

    return {
      id: row.id,
      period_start: row.period_start,
      period_end: row.period_end,
      pay_date: row.pay_date,
      status: row.status as PayrollStatus,
      employee_count: periodEntries.length,
      gross_pay: periodEntries.reduce(
        (total, entry) => total + Number(entry.gross_pay),
        0
      ),
      total_deductions: periodEntries.reduce(
        (total, entry) => total + Number(entry.deductions),
        0
      ),
      net_pay: periodEntries.reduce(
        (total, entry) => total + Number(entry.net_pay),
        0
      ),
    };
  });

  return { data: periods, error: null };
}

export async function getPayrollEntries(): Promise<
  DataResult<Record<string, PayrollEntry[]>>
> {
  const employeeResult = await loadEmployees();

  if (employeeResult.error) {
    return { data: null, error: employeeResult.error };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("hr_payroll_entries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const employees = new Map(
    (employeeResult.data ?? []).map((row) => [row.id, toEmployee(row)])
  );

  const entries: Record<string, PayrollEntry[]> = {};

  for (const row of (data ?? []) as Array<{
    id: string;
    payroll_period_id: string;
    staff_profile_id: string;
    position: string;
    basic_pay: number;
    allowances: number;
    overtime_pay: number;
    gross_pay: number;
    deductions: number;
    net_pay: number;
    status: string;
  }>) {
    const employee = employees.get(row.staff_profile_id);
    const list = entries[row.payroll_period_id] ?? [];
    list.push({
      id: row.id,
      payroll_period_id: row.payroll_period_id,
      employee_id: row.staff_profile_id,
      employee_name: employee?.full_name ?? "Unknown employee",
      position: row.position,
      basic_pay: Number(row.basic_pay),
      allowances: Number(row.allowances),
      overtime_pay: Number(row.overtime_pay),
      gross_pay: Number(row.gross_pay),
      deductions: Number(row.deductions),
      net_pay: Number(row.net_pay),
      status: row.status as PayrollStatus,
    });
    entries[row.payroll_period_id] = list;
  }

  return { data: entries, error: null };
}

export async function getHrStats(): Promise<DataResult<HrStats>> {
  const employeeResult = await loadEmployees();

  if (employeeResult.error) {
    return { data: null, error: employeeResult.error };
  }

  const supabase = await getSupabaseServerClient();
  const [leaveResult, payrollResult] = await Promise.all([
    supabase.from("hr_leave_requests").select("status"),
    supabase
      .from("hr_payroll_periods")
      .select("status, id")
      .order("period_start", { ascending: false })
      .limit(1),
  ]);

  const employees = (employeeResult.data ?? []).map(toEmployee);

  const stats: HrStats = {
    totalEmployees: employees.length,
    active: employees.filter((employee) => employee.status === "active").length,
    onLeave: employees.filter((employee) => employee.status === "on_leave").length,
    expiringLicenses: employees.filter(
      (employee) =>
        employee.license_status === "expiring" ||
        employee.license_status === "expired"
    ).length,
    pendingLeave: 0,
    payrollNet: 0,
    payrollStatus: null,
  };

  for (const row of (leaveResult.data ?? []) as Array<{ status: string }>) {
    if (row.status === "pending") {
      stats.pendingLeave += 1;
    }
  }

  const latestPeriod = (
    (payrollResult.data ?? []) as Array<{ id: string; status: string }>
  )[0];

  if (latestPeriod) {
    stats.payrollStatus = latestPeriod.status as PayrollStatus;

    const { data: entries } = await supabase
      .from("hr_payroll_entries")
      .select("net_pay")
      .eq("payroll_period_id", latestPeriod.id);

    stats.payrollNet = ((entries ?? []) as Array<{ net_pay: number }>).reduce(
      (total, entry) => total + Number(entry.net_pay),
      0
    );
  }

  return { data: stats, error: null };
}

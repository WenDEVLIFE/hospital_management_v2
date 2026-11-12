import type {
  AttendanceListRow,
  EmployeeDetail,
  EmployeeListRow,
  HrStats,
  LeaveRequest,
  PayrollEntry,
  PayrollPeriod,
} from "@/types/hospital";
import {
  employeeDetailById,
  employeeListRows,
  hrStats,
  leaveRequests,
  payrollEntriesByPeriodId,
  payrollPeriods,
  todayAttendanceRows,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested employee record could not be found.",
} as const;

function emptyStats(): HrStats {
  return {
    totalEmployees: 0,
    active: 0,
    onLeave: 0,
    expiringLicenses: 0,
    pendingLeave: 0,
    payrollNet: 0,
    payrollStatus: null,
  };
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
  // TODO(supabase): replace with supabase.from("staff_profiles").select("*")
  if (!isPreviewMode) {
    return emptyPage<EmployeeListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = employeeListRows.filter((employee) => {
    if (params.department && employee.department_name !== params.department) {
      return false;
    }

    if (params.status && employee.status !== params.status) {
      return false;
    }

    return matchesQuery(params.q, [
      employee.employee_number,
      employee.full_name,
      employee.email,
      employee.position,
      employee.department_name,
      employee.license_number,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getEmployeeDetails(): Promise<
  DataResult<Record<string, EmployeeDetail>>
> {
  // TODO(supabase): replace with a single employee detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(employeeDetailById),
    error: null,
  };
}

export async function getEmployeeDetail(
  id: string
): Promise<DataResult<EmployeeDetail>> {
  // TODO(supabase): replace with supabase.from("staff_profiles").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: NOT_FOUND };
  }

  await Promise.resolve();

  const detail = employeeDetailById.get(id);

  if (!detail) {
    return { data: null, error: NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function listTodayAttendance(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AttendanceListRow>> {
  // TODO(supabase): replace with an attendance query for the current date
  if (!isPreviewMode) {
    return emptyPage<AttendanceListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = todayAttendanceRows.filter((entry) => {
    if (params.status && entry.status !== params.status) {
      return false;
    }

    return matchesQuery(params.q, [
      entry.employee_name,
      entry.employee_number,
      entry.department_name,
      entry.position,
      entry.shift_label,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
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
  // TODO(supabase): replace with supabase.from("leave_requests").select("*")
  if (!isPreviewMode) {
    return emptyPage<LeaveRequest>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = leaveRequests.filter((request) => {
    if (params.status && request.status !== params.status) {
      return false;
    }

    if (params.type && request.leave_type !== params.type) {
      return false;
    }

    return matchesQuery(params.q, [
      request.employee_name,
      request.leave_type,
      request.reason,
      request.reviewed_by_name,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listPayrollPeriods(): Promise<
  DataResult<PayrollPeriod[]>
> {
  // TODO(supabase): replace with supabase.from("payroll_periods").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  const rows = [...payrollPeriods].sort((a, b) =>
    a.period_start === b.period_start
      ? 0
      : a.period_start < b.period_start
        ? 1
        : -1
  );

  return { data: rows, error: null };
}

export async function getPayrollEntries(): Promise<
  DataResult<Record<string, PayrollEntry[]>>
> {
  // TODO(supabase): replace with supabase.from("payroll_entries").select("*")
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(payrollEntriesByPeriodId),
    error: null,
  };
}

export async function getHrStats(): Promise<DataResult<HrStats>> {
  // TODO(supabase): replace with aggregate queries over staff and payroll
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  return { data: hrStats, error: null };
}

"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { invokeEdgeFunction } from "@/lib/supabase/functions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createEmployeeSchema,
  fileLeaveSchema,
  recordAttendanceSchema,
  runPayrollSchema,
  scheduleShiftSchema,
  setSalarySchema,
  type CreateEmployeeInput,
  type FileLeaveInput,
  type RecordAttendanceInput,
  type RunPayrollInput,
  type ScheduleShiftInput,
  type SetSalaryInput,
} from "@/lib/validations/hr";

export type HrWriteResult = { ok: true; id?: string } | { ok: false; formError: string };

function hrErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("staff record not found")) {
    return "The employee record could not be found.";
  }

  if (message.includes("unsupported shift type")) {
    return "Select a supported shift type.";
  }

  if (message.includes("unsupported leave type")) {
    return "Select a supported leave type.";
  }

  if (message.includes("shift start and end times cannot be the same")) {
    return "The shift start and end times cannot be the same.";
  }

  if (message.includes("start and end times are required")) {
    return "Enter the shift start and end times.";
  }

  if (message.includes("leave end date")) {
    return "The leave end date must be on or after the start date.";
  }

  if (message.includes("leave reason is required")) {
    return "Record the reason for leave.";
  }

  if (message.includes("only pending leave requests")) {
    return "Only pending leave requests can be reviewed.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateHr() {
  revalidatePath("/hr");
  revalidatePath("/staff");
  revalidatePath("/dashboard");
}

export async function scheduleShiftAction(
  input: ScheduleShiftInput
): Promise<HrWriteResult> {
  const parsed = scheduleShiftSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the shift details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("schedule_shift", {
    p_staff_profile_id: value.employeeId,
    p_shift_date: value.shiftDate,
    p_shift_type: value.shiftType,
    p_start_time: `${value.startTime}:00`,
    p_end_time: `${value.endTime}:00`,
  });

  if (error) {
    return { ok: false, formError: hrErrorMessage(error) };
  }

  revalidateHr();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function fileLeaveAction(
  input: FileLeaveInput
): Promise<HrWriteResult> {
  const parsed = fileLeaveSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the leave details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("file_leave_request", {
    p_staff_profile_id: value.employeeId,
    p_leave_type: value.leaveType,
    p_start_date: value.startDate,
    p_end_date: value.endDate,
    p_reason: value.reason,
  });

  if (error) {
    return { ok: false, formError: hrErrorMessage(error) };
  }

  revalidateHr();

  return { ok: true, id: data ? String(data) : undefined };
}

function accountErrorMessage(status: number, code: string): string {
  if (status === 401) {
    return "Your session expired. Sign in again.";
  }

  if (status === 403 || code === "forbidden") {
    return "Only a hospital administrator can create employee accounts.";
  }

  if (status === 409 || code === "account_exists") {
    return "An account with that email already exists.";
  }

  if (status === 400 || code === "invalid_account") {
    return "Use a valid email and a password of at least 12 characters.";
  }

  return "The account could not be created. Try again.";
}

export async function createEmployeeAction(
  input: CreateEmployeeInput
): Promise<HrWriteResult> {
  const parsed = createEmployeeSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the employee details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, formError: "Your session expired. Sign in again." };
  }

  const account = await invokeEdgeFunction(
    "admin-users",
    {
      action: "create",
      email: value.email,
      password: value.password,
      fullName: value.fullName,
    },
    session.access_token
  );

  if (!account.ok) {
    return {
      ok: false,
      formError: accountErrorMessage(account.status, account.code),
    };
  }

  const userId = String(account.data.userId ?? "");

  if (!userId) {
    return {
      ok: false,
      formError:
        "The account was created but no user id was returned. Check Settings → Users.",
    };
  }

  const { data: staffId, error } = await supabase.rpc("create_employee_record", {
    p_user_id: userId,
    p_staff_number: value.staffNumber,
    p_first_name: value.firstName,
    p_last_name: value.lastName,
    p_position: value.position,
    p_hire_date: value.hireDate,
    p_middle_name: value.middleName || null,
    p_department_id: value.departmentId || null,
    p_employment_type: value.employmentType || null,
    p_professional_license_number: value.licenseNumber || null,
    p_role_id: value.roleId || null,
    p_monthly_rate: Number(value.monthlyRate),
    p_license_expiry: value.licenseExpiry || null,
    p_leave_balance: value.leaveBalance === "" ? 0 : Number(value.leaveBalance),
  });

  if (error) {
    await invokeEdgeFunction(
      "admin-users",
      { action: "set-active", userId, active: false },
      session.access_token
    );

    const message = (error.message ?? "").toLowerCase();

    if (error.code === "42501" && value.roleId) {
      return {
        ok: false,
        formError:
          "That role cannot be assigned by you. Administrator roles require a super administrator. The account was created and deactivated.",
      };
    }

    if (message.includes("already has a staff record")) {
      return {
        ok: false,
        formError:
          "That account already has a staff record. The account was created and deactivated.",
      };
    }

    if (message.includes("enter the employee position")) {
      return { ok: false, formError: "Enter the employee position." };
    }

    return {
      ok: false,
      formError:
        error.code === "23505"
          ? "That employee number is already in use. The account was created and deactivated."
          : `${pgErrorMessage(error.code ?? "UNKNOWN")} The account was created and deactivated.`,
    };
  }

  revalidateHr();
  revalidatePath("/settings/users");

  return { ok: true, id: staffId ? String(staffId) : userId };
}

export async function runPayrollAction(
  input: RunPayrollInput
): Promise<HrWriteResult> {
  const parsed = runPayrollSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the payroll details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("run_payroll", {
    p_period_start: value.periodStart,
    p_period_end: value.periodEnd,
    p_pay_date: value.payDate,
    p_deduction_rate: Number(value.deductionRate),
  });

  if (error) {
    const message = (error.message ?? "").toLowerCase();

    if (message.includes("overlaps an existing run")) {
      return {
        ok: false,
        formError: "A payroll period overlaps an existing run.",
      };
    }

    if (message.includes("no active employee has a monthly rate")) {
      return {
        ok: false,
        formError:
          "No active employee has a monthly rate. Add a salary to an employee before running payroll.",
      };
    }

    if (message.includes("period end cannot be before")) {
      return {
        ok: false,
        formError: "The period end cannot be before the start.",
      };
    }

    if (message.includes("deduction rate")) {
      return {
        ok: false,
        formError: "Enter a deduction rate between 0 and 100.",
      };
    }

    return { ok: false, formError: hrErrorMessage(error) };
  }

  revalidatePath("/hr");
  revalidatePath("/dashboard");

  return { ok: true, id: data ? String(data) : undefined };
}

export async function recordAttendanceAction(
  input: RecordAttendanceInput
): Promise<HrWriteResult> {
  const parsed = recordAttendanceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the attendance details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("record_attendance", {
    p_staff_profile_id: value.staffProfileId,
    p_attendance_date: value.attendanceDate,
    p_status: value.status,
    p_time_in: value.timeIn || null,
    p_time_out: value.timeOut || null,
    p_overtime_minutes:
      value.overtimeMinutes === "" ? 0 : Number(value.overtimeMinutes),
    p_note: value.note || null,
  });

  if (error) {
    const message = (error.message ?? "").toLowerCase();

    if (message.includes("time out must be after")) {
      return { ok: false, formError: "Time out must be after time in." };
    }

    if (message.includes("staff record not found")) {
      return { ok: false, formError: "The employee record could not be found." };
    }

    if (message.includes("overtime must be")) {
      return {
        ok: false,
        formError: "Overtime must be between 0 and 1440 minutes.",
      };
    }

    return { ok: false, formError: hrErrorMessage(error) };
  }

  revalidateHr();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function setEmployeeSalaryAction(
  input: SetSalaryInput
): Promise<HrWriteResult> {
  const parsed = setSalarySchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the salary details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("set_employee_salary", {
    p_staff_profile_id: value.staffProfileId,
    p_monthly_rate: Number(value.monthlyRate),
  });

  if (error) {
    if (error.code === "42501") {
      return {
        ok: false,
        formError: "Only payroll staff can set a monthly rate.",
      };
    }

    const message = (error.message ?? "").toLowerCase();

    if (message.includes("create the employee record")) {
      return {
        ok: false,
        formError: "Create the employee record before setting a salary.",
      };
    }

    if (message.includes("cannot be negative")) {
      return { ok: false, formError: "The monthly rate cannot be negative." };
    }

    return { ok: false, formError: hrErrorMessage(error) };
  }

  revalidateHr();

  return { ok: true, id: data ? String(data) : undefined };
}

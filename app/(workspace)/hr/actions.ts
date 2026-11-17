"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  fileLeaveSchema,
  scheduleShiftSchema,
  type FileLeaveInput,
  type ScheduleShiftInput,
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

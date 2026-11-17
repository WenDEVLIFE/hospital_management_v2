"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  appointmentSchema,
  type AppointmentInput,
} from "@/lib/validations/appointment";

export type CreateAppointmentFieldErrors = Partial<
  Record<keyof AppointmentInput, string>
>;

export type CreateAppointmentResult =
  | { ok: true; appointmentId: string }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: CreateAppointmentFieldErrors;
    };

export async function createAppointmentAction(
  input: AppointmentInput
): Promise<CreateAppointmentResult> {
  const parsed = appointmentSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: CreateAppointmentFieldErrors = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (
        typeof field === "string" &&
        !fieldErrors[field as keyof AppointmentInput]
      ) {
        fieldErrors[field as keyof AppointmentInput] = issue.message;
      }
    }

    return { ok: false, fieldErrors };
  }

  const value = parsed.data;
  const scheduledAt = new Date(`${value.scheduled_at}:00+08:00`);

  if (Number.isNaN(scheduledAt.getTime())) {
    return {
      ok: false,
      fieldErrors: { scheduled_at: "Select a valid date and time." },
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_appointment", {
    p_patient_id: value.patient_id,
    p_department_id: value.department_id,
    p_physician_id: value.physician_id || null,
    p_scheduled_at: scheduledAt.toISOString(),
    p_duration_minutes: Number(value.duration_minutes),
    p_appointment_type: value.appointment_type || null,
    p_reason_for_visit: value.reason_for_visit || null,
    p_notes: value.notes || null,
  });

  if (error) {
    return { ok: false, formError: pgErrorMessage(error.code) };
  }

  if (!data) {
    return {
      ok: false,
      formError: "The appointment was created but no identifier was returned.",
    };
  }

  revalidatePath("/appointments");
  revalidatePath("/dashboard");

  return { ok: true, appointmentId: String(data) };
}

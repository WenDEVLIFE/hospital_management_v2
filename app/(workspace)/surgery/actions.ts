"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  registerRoomSchema,
  scheduleSurgerySchema,
  type RegisterRoomInput,
  type ScheduleSurgeryInput,
} from "@/lib/validations/surgery";

export type SurgeryWriteResult =
  | { ok: true; id?: string }
  | { ok: false; formError: string };

function surgeryErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (error.code === "23505" && message.includes("room_name")) {
    return "An operating room with that name already exists.";
  }

  if (error.code === "23P01" || message.includes("already booked")) {
    return "That operating room is already booked for the selected slot.";
  }

  if (message.includes("under maintenance")) {
    return "That operating room is under maintenance.";
  }

  if (message.includes("room not found")) {
    return "The operating room could not be found.";
  }

  if (message.includes("department not found")) {
    return "The selected department could not be found.";
  }

  if (message.includes("patient not found")) {
    return "The patient could not be found.";
  }

  if (message.includes("end time must be after")) {
    return "The end time must be after the start time.";
  }

  if (message.includes("procedure code and name")) {
    return "Procedure code and name are required.";
  }

  if (message.includes("room name is required")) {
    return "Enter a room name.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateSurgery() {
  revalidatePath("/surgery");
  revalidatePath("/dashboard");
}

export async function registerOperatingRoomAction(
  input: RegisterRoomInput
): Promise<SurgeryWriteResult> {
  const parsed = registerRoomSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the operating room details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("register_operating_room", {
    p_room_name: value.roomName,
    p_department_id: value.departmentId,
    p_status: value.status,
    p_notes: value.notes?.trim() ? value.notes.trim() : null,
  });

  if (error) {
    return { ok: false, formError: surgeryErrorMessage(error) };
  }

  revalidateSurgery();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function scheduleSurgeryAction(
  input: ScheduleSurgeryInput
): Promise<SurgeryWriteResult> {
  const parsed = scheduleSurgerySchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the surgical case details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("schedule_surgery_case", {
    p_patient_id: value.patientId,
    p_room_id: value.roomId,
    p_procedure_code: value.procedureCode,
    p_procedure_name: value.procedureName,
    p_scheduled_start: value.scheduledStart,
    p_scheduled_end: value.scheduledEnd,
    p_priority: value.priority,
    p_surgeon_id: value.surgeonId,
    p_anesthesia_type: value.anesthesiaType?.trim()
      ? value.anesthesiaType.trim()
      : null,
    p_notes: value.notes?.trim() ? value.notes.trim() : null,
  });

  if (error) {
    return { ok: false, formError: surgeryErrorMessage(error) };
  }

  revalidateSurgery();

  return { ok: true, id: data ? String(data) : undefined };
}

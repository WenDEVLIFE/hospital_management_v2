"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  startEmergencyVisitSchema,
  type StartEmergencyVisitInput,
} from "@/lib/validations/emergency";

export type StartEmergencyVisitResult =
  | { ok: true; visitId: string }
  | { ok: false; formError: string };

function emergencyErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("already has an active emergency visit")) {
    return "This patient already has an active emergency visit.";
  }

  if (message.includes("chief complaint")) {
    return "Record the chief complaint.";
  }

  if (message.includes("unsupported triage level")) {
    return "Select a supported triage level.";
  }

  if (message.includes("unsupported arrival mode")) {
    return "Select a supported arrival mode.";
  }

  if (message.includes("patient not found")) {
    return "The patient could not be found.";
  }

  if (message.includes("emergency department is not configured")) {
    return "The emergency department is not configured.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

export async function startEmergencyVisitAction(
  input: StartEmergencyVisitInput
): Promise<StartEmergencyVisitResult> {
  const parsed = startEmergencyVisitSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the triage details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("start_emergency_visit", {
    p_patient_id: value.patientId,
    p_chief_complaint: value.chiefComplaint,
    p_triage_level: value.triageLevel,
    p_arrival_mode: value.arrivalMode,
    p_triage_note: value.triageNote?.trim() ? value.triageNote.trim() : null,
  });

  if (error) {
    return { ok: false, formError: emergencyErrorMessage(error) };
  }

  if (!data) {
    return {
      ok: false,
      formError: "The visit was created but no identifier was returned.",
    };
  }

  revalidatePath("/emergency");
  revalidatePath("/medical-records");
  revalidatePath("/dashboard");

  return { ok: true, visitId: String(data) };
}

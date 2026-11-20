"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createPrescriptionSchema,
  type CreatePrescriptionInput,
} from "@/lib/validations/prescription";

export type CreatePrescriptionResult =
  | { ok: true; prescriptionId: string }
  | { ok: false; formError: string };

function createErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("insufficient permission")) {
    return "You do not have permission to issue prescriptions.";
  }

  if (message.includes("authentication required")) {
    return "Your session has expired. Sign in again to continue.";
  }

  if (message.includes("active encounter")) {
    return "Select an active encounter that belongs to this patient.";
  }

  if (message.includes("at least one medication")) {
    return "Add at least one medication to the prescription.";
  }

  if (message.includes("dosage and frequency")) {
    return "Enter a dosage and frequency for every medication.";
  }

  if (message.includes("quantity")) {
    return "Enter a quantity greater than zero for every medication.";
  }

  if (message.includes("duration")) {
    return "Enter a valid duration between 1 and 3650 days.";
  }

  if (message.includes("active medication")) {
    return "One of the selected medications is no longer available.";
  }

  if (message.includes("cannot exceed")) {
    return "A prescription cannot contain more than 20 medications.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

export async function createPrescriptionAction(
  input: CreatePrescriptionInput
): Promise<CreatePrescriptionResult> {
  const parsed = createPrescriptionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ??
        "Check the prescription details and try again.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_prescription", {
    p_patient_id: parsed.data.patientId,
    p_encounter_id: parsed.data.encounterId,
    p_notes: parsed.data.notes ?? null,
    p_items: parsed.data.items.map((item) => ({
      medication_id: item.medicationId,
      dosage: item.dosage,
      frequency: item.frequency,
      duration_days: item.durationDays ?? null,
      quantity: item.quantity,
      instructions: item.instructions ?? null,
    })),
  });

  if (error) {
    return { ok: false, formError: createErrorMessage(error) };
  }

  if (!data) {
    return {
      ok: false,
      formError:
        "The prescription was created but no identifier was returned. Refresh and verify the record.",
    };
  }

  revalidatePath("/prescriptions");
  revalidatePath("/pharmacy");
  revalidatePath("/dashboard");

  return { ok: true, prescriptionId: String(data) };
}

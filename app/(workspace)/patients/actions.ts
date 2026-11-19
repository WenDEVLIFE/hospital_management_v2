"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  patientAllergySchema,
  patientBackfillSchema,
  patientUpdateSchema,
  type PatientAllergyInput,
  type PatientUpdateInput,
} from "@/lib/validations/patient-records";

export type PatientWriteResult =
  | { ok: true }
  | { ok: false; formError: string };

function patientErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("patient not found")) {
    return "The patient record could not be found.";
  }

  if (message.includes("first name and last name")) {
    return "First name and last name are required.";
  }

  if (message.includes("unsupported registration status")) {
    return "Select a supported registration status.";
  }

  if (message.includes("unsupported allergy severity")) {
    return "Select a supported allergy severity.";
  }

  if (message.includes("allergen is required")) {
    return "Enter the allergen.";
  }

  if (message.includes("encounter not found")) {
    return "The selected encounter does not belong to this patient.";
  }

  if (message.includes("invalid input syntax for type date")) {
    return "Enter a valid date of birth.";
  }

  if (
    message.includes("already registered") ||
    message.includes("idx_patients_identity_unique")
  ) {
    return "A patient with this name and date of birth is already registered.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidatePatient(patientId: string) {
  revalidatePath("/patients");
  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/medical-records");
  revalidatePath("/dashboard");
}

export async function updatePatientAction(
  input: PatientUpdateInput
): Promise<PatientWriteResult> {
  const parsed = patientUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the patient details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("update_patient", {
    p_patient_id: value.patientId,
    p_patch: {
      first_name: value.first_name,
      middle_name: value.middle_name,
      last_name: value.last_name,
      suffix: value.suffix,
      date_of_birth: value.date_of_birth,
      sex: value.sex,
      civil_status: value.civil_status,
      nationality: value.nationality,
      contact_number: value.contact_number,
      email: value.email,
      address_line: value.address_line,
      city: value.city,
      province: value.province,
      registration_status: value.registration_status,
    },
  });

  if (error) {
    return { ok: false, formError: patientErrorMessage(error) };
  }

  revalidatePatient(value.patientId);

  return { ok: true };
}

export async function setPatientStatusAction(input: {
  patientId: string;
  status: "active" | "inactive" | "archived";
}): Promise<PatientWriteResult> {
  const parsed = patientBackfillSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Select a valid patient.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("update_patient", {
    p_patient_id: parsed.data.patientId,
    p_patch: { registration_status: input.status },
  });

  if (error) {
    return { ok: false, formError: patientErrorMessage(error) };
  }

  revalidatePatient(parsed.data.patientId);

  return { ok: true };
}

export async function recordPatientAllergyAction(
  input: PatientAllergyInput
): Promise<PatientWriteResult> {
  const parsed = patientAllergySchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the allergy details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("record_patient_allergy", {
    p_patient_id: value.patientId,
    p_allergen: value.allergen,
    p_reaction: value.reaction?.trim() ? value.reaction.trim() : null,
    p_severity: value.severity?.trim() ? value.severity.trim() : null,
    p_notes: value.notes?.trim() ? value.notes.trim() : null,
  });

  if (error) {
    return { ok: false, formError: patientErrorMessage(error) };
  }

  revalidatePatient(value.patientId);

  return { ok: true };
}

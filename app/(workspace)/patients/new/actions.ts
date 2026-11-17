"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  patientRegistrationSchema,
  type PatientRegistrationInput,
} from "@/lib/validations/patient";

export type RegisterPatientFieldErrors = Partial<
  Record<keyof PatientRegistrationInput, string>
>;

export type RegisterPatientResult =
  | { ok: true; patientId: string }
  | { ok: false; formError?: string; fieldErrors?: RegisterPatientFieldErrors };

export async function registerPatientAction(
  input: PatientRegistrationInput
): Promise<RegisterPatientResult> {
  const parsed = patientRegistrationSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: RegisterPatientFieldErrors = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (
        typeof field === "string" &&
        !fieldErrors[field as keyof PatientRegistrationInput]
      ) {
        fieldErrors[field as keyof PatientRegistrationInput] = issue.message;
      }
    }

    return { ok: false, fieldErrors };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.rpc("register_patient", {
    p_first_name: value.first_name,
    p_middle_name: value.middle_name || null,
    p_last_name: value.last_name,
    p_suffix: value.suffix || null,
    p_date_of_birth: value.date_of_birth,
    p_sex: value.sex,
    p_civil_status: value.civil_status || null,
    p_nationality: value.nationality || null,
    p_contact_number: value.contact_number || null,
    p_email: value.email || null,
    p_address_line: value.address_line || null,
    p_barangay: value.barangay || null,
    p_city: value.city || null,
    p_province: value.province || null,
    p_postal_code: value.postal_code || null,
    p_emergency_full_name: value.emergency_full_name,
    p_emergency_relationship: value.emergency_relationship || null,
    p_emergency_contact_number: value.emergency_contact_number,
    p_emergency_is_primary: value.emergency_is_primary,
  });

  if (error) {
    return { ok: false, formError: pgErrorMessage(error.code) };
  }

  if (!data) {
    return {
      ok: false,
      formError: "The patient was created but no identifier was returned.",
    };
  }

  revalidatePath("/patients");
  revalidatePath("/dashboard");

  return { ok: true, patientId: String(data) };
}

"use server";

import { revalidatePath } from "next/cache";

import { admissionErrorMessage } from "@/lib/data/admission-errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  admissionSchema,
  type AdmissionInput,
} from "@/lib/validations/admission";

export type CreateAdmissionFieldErrors = Partial<
  Record<keyof AdmissionInput, string>
>;

export type CreateAdmissionResult =
  | { ok: true; admissionId: string }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: CreateAdmissionFieldErrors;
    };

export async function createAdmissionAction(
  input: AdmissionInput
): Promise<CreateAdmissionResult> {
  const parsed = admissionSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: CreateAdmissionFieldErrors = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (
        typeof field === "string" &&
        !fieldErrors[field as keyof AdmissionInput]
      ) {
        fieldErrors[field as keyof AdmissionInput] = issue.message;
      }
    }

    return { ok: false, fieldErrors };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_admission", {
    p_patient_id: value.patient_id,
    p_department_id: value.department_id,
    p_attending_physician_id: value.attending_physician_id || null,
    p_bed_id: value.bed_id,
    p_admission_type: value.admission_type || null,
    p_admission_notes: value.admission_notes || null,
  });

  if (error) {
    return { ok: false, formError: admissionErrorMessage(error) };
  }

  if (!data) {
    return {
      ok: false,
      formError: "The admission was created but no identifier was returned.",
    };
  }

  revalidatePath("/admissions");
  revalidatePath("/discharges");
  revalidatePath("/rooms-beds");
  revalidatePath("/dashboard");

  return { ok: true, admissionId: String(data) };
}

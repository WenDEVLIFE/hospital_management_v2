"use server";

import { revalidatePath } from "next/cache";

import { admissionErrorMessage } from "@/lib/data/admission-errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  dischargeSchema,
  type DischargeInput,
} from "@/lib/validations/admission";

export type DischargeFieldErrors = Partial<
  Record<keyof DischargeInput, string>
>;

export type DischargeResult =
  | { ok: true; admissionId: string }
  | { ok: false; formError?: string; fieldErrors?: DischargeFieldErrors };

export async function dischargePatientAction(
  input: DischargeInput
): Promise<DischargeResult> {
  const parsed = dischargeSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: DischargeFieldErrors = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (
        typeof field === "string" &&
        !fieldErrors[field as keyof DischargeInput]
      ) {
        fieldErrors[field as keyof DischargeInput] = issue.message;
      }
    }

    return { ok: false, fieldErrors };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("discharge_patient", {
    p_admission_id: value.admission_id,
    p_discharge_notes: value.discharge_notes || null,
  });

  if (error) {
    return { ok: false, formError: admissionErrorMessage(error) };
  }

  revalidatePath("/admissions");
  revalidatePath("/discharges");
  revalidatePath("/rooms-beds");
  revalidatePath("/dashboard");

  return { ok: true, admissionId: String(data ?? value.admission_id) };
}

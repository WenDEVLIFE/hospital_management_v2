"use server";

import { revalidatePath } from "next/cache";

import { admissionErrorMessage } from "@/lib/data/admission-errors";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  transferSchema,
  type TransferInput,
} from "@/lib/validations/admission";

export type TransferFieldErrors = Partial<Record<keyof TransferInput, string>>;

export type TransferResult =
  | { ok: true; admissionId: string }
  | { ok: false; formError?: string; fieldErrors?: TransferFieldErrors };

export async function transferPatientAction(
  input: TransferInput
): Promise<TransferResult> {
  const parsed = transferSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: TransferFieldErrors = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (
        typeof field === "string" &&
        !fieldErrors[field as keyof TransferInput]
      ) {
        fieldErrors[field as keyof TransferInput] = issue.message;
      }
    }

    return { ok: false, fieldErrors };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("transfer_patient", {
    p_admission_id: value.admission_id,
    p_to_bed_id: value.to_bed_id,
    p_transfer_reason: value.transfer_reason || null,
  });

  if (error) {
    return { ok: false, formError: admissionErrorMessage(error) };
  }

  revalidatePath("/admissions");
  revalidatePath("/rooms-beds");
  revalidatePath("/dashboard");

  return { ok: true, admissionId: String(data ?? value.admission_id) };
}

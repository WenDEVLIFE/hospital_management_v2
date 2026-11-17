"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  dispensePrescriptionSchema,
  type DispensePrescriptionInput,
} from "@/lib/validations/dispensing";

export type DispensePrescriptionResult =
  | { ok: true; prescriptionId: string }
  | { ok: false; formError: string };

function dispenseErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("insufficient stock")) {
    return "One or more medications have insufficient stock.";
  }

  if (message.includes("stock is not configured")) {
    return "Medication stock is not configured for one or more items.";
  }

  if (message.includes("already dispensed")) {
    return "This prescription has already been dispensed.";
  }

  if (message.includes("cancelled")) {
    return "This prescription is cancelled.";
  }

  if (message.includes("no items")) {
    return "This prescription has no items to dispense.";
  }

  if (message.includes("not found")) {
    return "The prescription could not be found.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

export async function dispensePrescriptionAction(
  input: DispensePrescriptionInput
): Promise<DispensePrescriptionResult> {
  const parsed = dispensePrescriptionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Select a valid prescription.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("dispense_prescription", {
    p_prescription_id: parsed.data.prescriptionId,
  });

  if (error) {
    return { ok: false, formError: dispenseErrorMessage(error) };
  }

  if (!data) {
    return {
      ok: false,
      formError: "The prescription was updated but no identifier was returned.",
    };
  }

  revalidatePath("/pharmacy");
  revalidatePath("/prescriptions");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");

  return { ok: true, prescriptionId: String(data) };
}

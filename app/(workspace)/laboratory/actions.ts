"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  verifyLaboratoryOrderSchema,
  type VerifyLaboratoryOrderInput,
} from "@/lib/validations/laboratory";

export type VerifyLaboratoryOrderResult =
  | { ok: true; verified: number }
  | { ok: false; formError: string };

type OrderItemResultRow = {
  id: string;
  laboratory_results:
    | Array<{ id: string; verification_status: string }>
    | null;
};

export async function verifyLaboratoryOrderAction(
  input: VerifyLaboratoryOrderInput
): Promise<VerifyLaboratoryOrderResult> {
  const parsed = verifyLaboratoryOrderSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Select a valid laboratory request.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("laboratory_order_items")
    .select("id, laboratory_results(id, verification_status)")
    .eq("order_id", parsed.data.orderId);

  if (error) {
    return { ok: false, formError: pgErrorMessage(error.code) };
  }

  const pendingResultIds = ((data ?? []) as OrderItemResultRow[]).flatMap(
    (item) =>
      (item.laboratory_results ?? [])
        .filter((result) => result.verification_status === "pending")
        .map((result) => result.id)
  );

  if (pendingResultIds.length === 0) {
    return {
      ok: false,
      formError: "There are no pending results for this request.",
    };
  }

  for (const resultId of pendingResultIds) {
    const { error: verifyError } = await supabase.rpc(
      "verify_laboratory_result",
      { p_result_id: resultId }
    );

    if (verifyError) {
      return { ok: false, formError: pgErrorMessage(verifyError.code) };
    }
  }

  revalidatePath("/laboratory");
  revalidatePath("/dashboard");

  return { ok: true, verified: pendingResultIds.length };
}

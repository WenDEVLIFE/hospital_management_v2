"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  recordPaymentSchema,
  refundPaymentSchema,
  type RecordPaymentInput,
  type RefundPaymentInput,
} from "@/lib/validations/payment";

type RpcError = { code?: string | null; message?: string | null };

export type RecordPaymentResult =
  | { ok: true; paymentId: string }
  | { ok: false; formError: string };

export type RefundPaymentResult =
  | { ok: true; paymentId: string }
  | { ok: false; formError: string };

function recordPaymentErrorMessage(error: RpcError): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("already fully paid") || message.includes("already paid")) {
    return "This invoice is already fully paid.";
  }

  if (message.includes("not payable")) {
    return "This invoice cannot accept payments because it is cancelled or refunded.";
  }

  if (message.includes("exceeds the outstanding balance")) {
    return "The amount exceeds the outstanding balance.";
  }

  if (message.includes("unsupported payment method")) {
    return "Select a supported payment method.";
  }

  if (message.includes("greater than zero")) {
    return "Enter a payment amount greater than zero.";
  }

  if (message.includes("invoice not found")) {
    return "The invoice could not be found.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function refundPaymentErrorMessage(error: RpcError): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("only completed payments")) {
    return "Only completed payments can be refunded.";
  }

  if (message.includes("exceeds the recorded amount paid")) {
    return "This refund exceeds the recorded amount paid on the invoice.";
  }

  if (message.includes("payment not found")) {
    return "The payment could not be found.";
  }

  if (message.includes("invoice not found")) {
    return "The related invoice could not be found.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateBilling() {
  revalidatePath("/billing");
  revalidatePath("/dashboard");
}

export async function recordPaymentAction(
  input: RecordPaymentInput
): Promise<RecordPaymentResult> {
  const parsed = recordPaymentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the payment details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("record_payment", {
    p_invoice_id: value.invoiceId,
    p_amount: value.amount,
    p_payment_method: value.paymentMethod,
    p_notes: value.notes?.trim() ? value.notes.trim() : null,
  });

  if (error) {
    return { ok: false, formError: recordPaymentErrorMessage(error) };
  }

  if (!data) {
    return {
      ok: false,
      formError: "The payment was recorded but no identifier was returned.",
    };
  }

  revalidateBilling();

  return { ok: true, paymentId: String(data) };
}

export async function refundPaymentAction(
  input: RefundPaymentInput
): Promise<RefundPaymentResult> {
  const parsed = refundPaymentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Select a valid payment to refund.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("refund_payment", {
    p_payment_id: value.paymentId,
    p_reason: value.reason?.trim() ? value.reason.trim() : null,
  });

  if (error) {
    return { ok: false, formError: refundPaymentErrorMessage(error) };
  }

  if (!data) {
    return {
      ok: false,
      formError: "The refund was recorded but no identifier was returned.",
    };
  }

  revalidateBilling();

  return { ok: true, paymentId: String(data) };
}

"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createClaimSchema,
  verifyCoverageSchema,
  type CreateClaimInput,
  type VerifyCoverageInput,
} from "@/lib/validations/insurance";

export type InsuranceWriteResult =
  | { ok: true; id?: string }
  | { ok: false; formError: string };

function insuranceErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("policy not found")) {
    return "The insurance policy could not be found.";
  }

  if (message.includes("only active policies")) {
    return "Only active policies can be claimed against.";
  }

  if (message.includes("policy has expired")) {
    return "This policy has expired and cannot receive new claims.";
  }

  if (message.includes("claimed amount cannot exceed")) {
    return "The claimed amount cannot exceed the total charged.";
  }

  if (message.includes("claim type and diagnosis")) {
    return "Claim type and diagnosis are required.";
  }

  if (message.includes("amounts must be greater than zero")) {
    return "Claim amounts must be greater than zero.";
  }

  if (message.includes("reference number is required")) {
    return "Enter the payer reference number.";
  }

  if (message.includes("unsupported verification status")) {
    return "Select a verification result.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateInsurance() {
  revalidatePath("/insurance");
  revalidatePath("/billing");
  revalidatePath("/dashboard");
}

export async function verifyCoverageAction(
  input: VerifyCoverageInput
): Promise<InsuranceWriteResult> {
  const parsed = verifyCoverageSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the verification details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("verify_coverage", {
    p_policy_id: value.policyId,
    p_status: value.status,
    p_reference_number: value.referenceNumber,
    p_notes: value.notes?.trim() ? value.notes.trim() : null,
  });

  if (error) {
    return { ok: false, formError: insuranceErrorMessage(error) };
  }

  revalidateInsurance();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function createClaimAction(
  input: CreateClaimInput
): Promise<InsuranceWriteResult> {
  const parsed = createClaimSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the claim details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_claim", {
    p_policy_id: value.policyId,
    p_claim_type: value.claimType,
    p_diagnosis: value.diagnosis,
    p_total_charged: value.totalCharged,
    p_amount_claimed: value.amountClaimed,
  });

  if (error) {
    return { ok: false, formError: insuranceErrorMessage(error) };
  }

  revalidateInsurance();

  return { ok: true, id: data ? String(data) : undefined };
}

"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  policySchema,
  providerSchema,
  type PolicyInput,
  type ProviderInput,
} from "@/lib/validations/insurance-intake";

export type InsuranceIntakeResult =
  | { ok: true; id?: string }
  | { ok: false; formError: string };

function intakeErrorMessage(
  error: { code?: string | null; message?: string | null },
  entity: "provider" | "policy"
): string {
  const message = (error.message ?? "").toLowerCase();

  if (error.code === "23505") {
    return entity === "provider"
      ? "A provider with that name or code already exists."
      : "That policy number is already registered for this provider.";
  }

  if (message.includes("patient not found")) {
    return "The patient could not be found.";
  }

  if (message.includes("provider not found")) {
    return "The insurance provider could not be found.";
  }

  if (message.includes("policy and member numbers")) {
    return "Policy and member numbers are required.";
  }

  if (message.includes("expiry date must be after")) {
    return "The expiry date must be after the effective date.";
  }

  if (message.includes("provider name and code")) {
    return "Provider name and code are required.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateInsurance() {
  revalidatePath("/insurance");
  revalidatePath("/billing");
}

export async function createProviderAction(
  input: ProviderInput
): Promise<InsuranceIntakeResult> {
  const parsed = providerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the provider details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_insurance_provider", {
    p_name: value.name,
    p_code: value.code,
    p_type: value.type,
    p_contact_number: value.contactNumber?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: intakeErrorMessage(error, "provider") };
  }

  revalidateInsurance();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function createPolicyAction(
  input: PolicyInput
): Promise<InsuranceIntakeResult> {
  const parsed = policySchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the policy details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_insurance_policy", {
    p_patient_id: value.patientId,
    p_provider_id: value.providerId,
    p_policy_number: value.policyNumber,
    p_member_number: value.memberNumber,
    p_coverage_type: value.coverageType?.trim() || "Standard coverage",
    p_effective_date: value.effectiveDate,
    p_expiry_date: value.expiryDate,
    p_notes: value.notes?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: intakeErrorMessage(error, "policy") };
  }

  revalidateInsurance();

  return { ok: true, id: data ? String(data) : undefined };
}

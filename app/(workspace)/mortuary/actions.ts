"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  admitMortuarySchema,
  releaseMortuarySchema,
  type AdmitMortuaryInput,
  type ReleaseMortuaryInput,
} from "@/lib/validations/mortuary";

export type MortuaryWriteResult =
  | { ok: true; id?: string }
  | { ok: false; formError: string };

function mortuaryErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("body tag is already in use")) {
    return "That body tag is already in use.";
  }

  if (message.includes("no storage unit is available")) {
    return "No storage unit is available.";
  }

  if (message.includes("storage unit is not available")) {
    return "That storage unit is not available.";
  }

  if (message.includes("already been released")) {
    return "This body has already been released.";
  }

  if (message.includes("identification discrepancy")) {
    return "Resolve the identification discrepancy before release.";
  }

  if (message.includes("release document reference")) {
    return "A release document reference is required.";
  }

  if (message.includes("record who received")) {
    return "Record who received the body.";
  }

  if (message.includes("patient not found")) {
    return "The patient could not be found.";
  }

  if (message.includes("mortuary record not found")) {
    return "The mortuary case could not be found.";
  }

  if (message.includes("body tag number is required")) {
    return "Enter the body tag number.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateMortuary() {
  revalidatePath("/mortuary");
  revalidatePath("/dashboard");
}

export async function admitMortuaryCaseAction(
  input: AdmitMortuaryInput
): Promise<MortuaryWriteResult> {
  const parsed = admitMortuarySchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the admission details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("admit_mortuary_case", {
    p_patient_id: value.patientId,
    p_body_tag_number: value.bodyTagNumber,
    p_place_of_death: value.placeOfDeath?.trim() || "SPMC",
    p_identification_status: value.identificationStatus,
    p_storage_unit_id: null,
    p_next_of_kin_name: value.nextOfKinName?.trim() || null,
    p_next_of_kin_relationship: value.nextOfKinRelationship?.trim() || null,
    p_next_of_kin_contact: value.nextOfKinContact?.trim() || null,
    p_notes: value.notes?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: mortuaryErrorMessage(error) };
  }

  revalidateMortuary();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function releaseMortuaryCaseAction(
  input: ReleaseMortuaryInput
): Promise<MortuaryWriteResult> {
  const parsed = releaseMortuarySchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the release details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("release_mortuary_case", {
    p_record_id: value.recordId,
    p_released_to: value.releasedTo,
    p_relationship: value.relationship?.trim() || null,
    p_document_reference: value.documentReference,
    p_notes: value.notes?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: mortuaryErrorMessage(error) };
  }

  revalidateMortuary();

  return { ok: true, id: data ? String(data) : undefined };
}

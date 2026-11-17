"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createBloodRequestSchema,
  crossmatchSchema,
  issueUnitSchema,
  recordDonationSchema,
  registerDonorSchema,
  screenUnitSchema,
  type CreateBloodRequestInput,
  type CrossmatchInput,
  type IssueUnitInput,
  type RecordDonationInput,
  type RegisterDonorInput,
  type ScreenUnitInput,
} from "@/lib/validations/blood-bank";

export type BloodBankWriteResult =
  | { ok: true; id?: string }
  | { ok: false; formError: string };

function bloodBankErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("donor not found")) {
    return "The blood donor could not be found.";
  }

  if (message.includes("only eligible donors")) {
    return "Only eligible donors can donate.";
  }

  if (message.includes("unit must pass screening")) {
    return "The unit must pass screening before it can be used.";
  }

  if (message.includes("compatible crossmatch is required")) {
    return "A compatible crossmatch is required before issuing the unit.";
  }

  if (message.includes("unit has expired")) {
    return "This unit has expired.";
  }

  if (message.includes("cannot be issued") || message.includes("already closed")) {
    return "This unit can no longer be used.";
  }

  if (message.includes("request is closed")) {
    return "This request is already closed.";
  }

  if (message.includes("patient not found")) {
    return "The patient could not be found.";
  }

  if (message.includes("units collected")) {
    return "Collect between 1 and 4 units.";
  }

  if (message.includes("units requested")) {
    return "Request between 1 and 10 units.";
  }

  if (message.includes("donor name is required")) {
    return "Enter the donor's full name.";
  }

  if (message.includes("date of birth")) {
    return "Enter a valid date of birth.";
  }

  if (message.includes("blood type") || message.includes("component")) {
    return "Select a supported blood type and component.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateBloodBank() {
  revalidatePath("/blood-bank");
  revalidatePath("/dashboard");
}

export async function registerDonorAction(
  input: RegisterDonorInput
): Promise<BloodBankWriteResult> {
  const parsed = registerDonorSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the donor details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("register_blood_donor", {
    p_full_name: value.fullName,
    p_date_of_birth: value.dateOfBirth,
    p_sex: value.sex,
    p_blood_type: value.bloodType,
    p_contact_number: value.contactNumber?.trim() || null,
    p_address: value.address?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: bloodBankErrorMessage(error) };
  }

  revalidateBloodBank();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function createBloodRequestAction(
  input: CreateBloodRequestInput
): Promise<BloodBankWriteResult> {
  const parsed = createBloodRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the request details.",
    };
  }

  const value = parsed.data;
  const requiredBy = new Date(value.requiredBy);

  if (Number.isNaN(requiredBy.getTime())) {
    return { ok: false, formError: "Select a valid required time." };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_blood_request", {
    p_patient_id: value.patientId,
    p_blood_type: value.bloodType,
    p_component: value.component,
    p_units_requested: value.unitsRequested,
    p_priority: value.priority,
    p_required_by: requiredBy.toISOString(),
    p_department_id: null,
    p_notes: value.notes?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: bloodBankErrorMessage(error) };
  }

  revalidateBloodBank();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function recordDonationAction(
  input: RecordDonationInput
): Promise<BloodBankWriteResult> {
  const parsed = recordDonationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the donation details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("record_blood_donation", {
    p_donor_id: value.donorId,
    p_units: value.units,
    p_collection_site: value.collectionSite,
    p_component: value.component,
    p_expiry_days: value.expiryDays,
  });

  if (error) {
    return { ok: false, formError: bloodBankErrorMessage(error) };
  }

  revalidateBloodBank();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function screenUnitAction(
  input: ScreenUnitInput
): Promise<BloodBankWriteResult> {
  const parsed = screenUnitSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the screening result.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("screen_blood_unit", {
    p_unit_id: value.unitId,
    p_result: value.result,
    p_notes: value.notes?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: bloodBankErrorMessage(error) };
  }

  revalidateBloodBank();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function crossmatchUnitAction(
  input: CrossmatchInput
): Promise<BloodBankWriteResult> {
  const parsed = crossmatchSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the crossmatch details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("crossmatch_blood_unit", {
    p_request_id: value.requestId,
    p_unit_id: value.unitId,
    p_result: value.result,
  });

  if (error) {
    return { ok: false, formError: bloodBankErrorMessage(error) };
  }

  revalidateBloodBank();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function issueUnitAction(
  input: IssueUnitInput
): Promise<BloodBankWriteResult> {
  const parsed = issueUnitSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the issue details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("issue_blood_unit", {
    p_request_id: value.requestId,
    p_unit_id: value.unitId,
    p_received_by: value.receivedBy,
    p_notes: value.notes?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: bloodBankErrorMessage(error) };
  }

  revalidateBloodBank();

  return { ok: true, id: data ? String(data) : undefined };
}

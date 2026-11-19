"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  advanceCleaningRequestSchema,
  createCleaningRequestSchema,
  housekeepingStaffSchema,
  type AdvanceCleaningRequestInput,
  type CreateCleaningRequestInput,
  type HousekeepingStaffInput,
} from "@/lib/validations/housekeeping";

export type HousekeepingWriteResult =
  | { ok: true; id?: string }
  | { ok: false; formError: string };

function housekeepingErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("already closed")) {
    return "This request is already closed.";
  }

  if (message.includes("assign the request before starting")) {
    return "Assign the request before starting it.";
  }

  if (message.includes("only completed requests")) {
    return "Only completed requests can be verified.";
  }

  if (message.includes("disinfection method")) {
    return "A disinfection method, chemical and contact time are required.";
  }

  if (message.includes("select a housekeeping staff")) {
    return "Select a housekeeping staff member.";
  }

  if (message.includes("cleaning request not found")) {
    return "The cleaning request could not be found.";
  }

  if (message.includes("location is required")) {
    return "Enter the location.";
  }

  if (message.includes("unsupported")) {
    return "Select a supported value.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateHousekeeping() {
  revalidatePath("/housekeeping");
  revalidatePath("/rooms-beds");
  revalidatePath("/dashboard");
}

export async function createCleaningRequestAction(
  input: CreateCleaningRequestInput
): Promise<HousekeepingWriteResult> {
  const parsed = createCleaningRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the request details.",
    };
  }

  const value = parsed.data;
  const dueAt = new Date(value.dueAt);

  if (Number.isNaN(dueAt.getTime())) {
    return { ok: false, formError: "Select a valid due time." };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_cleaning_request", {
    p_location_type: value.locationType,
    p_location_label: value.locationLabel,
    p_request_type: value.requestType,
    p_priority: value.priority,
    p_due_at: dueAt.toISOString(),
    p_notes: value.notes?.trim() || null,
    p_department_id: null,
  });

  if (error) {
    return { ok: false, formError: housekeepingErrorMessage(error) };
  }

  revalidateHousekeeping();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function advanceCleaningRequestAction(
  input: AdvanceCleaningRequestInput
): Promise<HousekeepingWriteResult> {
  const parsed = advanceCleaningRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the action details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("advance_cleaning_request", {
    p_request_id: value.requestId,
    p_action: value.action,
    p_staff_id: value.staffId ? value.staffId : null,
    p_method: value.method?.trim() || null,
    p_chemical: value.chemical?.trim() || null,
    p_contact_minutes: value.contactMinutes
      ? Number(value.contactMinutes)
      : null,
    p_notes: value.notes?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: housekeepingErrorMessage(error) };
  }

  revalidateHousekeeping();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function createHousekeepingStaffAction(
  input: HousekeepingStaffInput
): Promise<HousekeepingWriteResult> {
  const parsed = housekeepingStaffSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the staff details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_housekeeping_staff", {
    p_name: value.name,
    p_role: value.role?.trim() || "Housekeeper",
    p_contact_number: value.contactNumber?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: housekeepingErrorMessage(error) };
  }

  revalidateHousekeeping();

  return { ok: true, id: data ? String(data) : undefined };
}

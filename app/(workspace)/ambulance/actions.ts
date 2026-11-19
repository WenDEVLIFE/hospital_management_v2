"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  advanceAmbulanceTripSchema,
  dispatchAmbulanceSchema,
  registerAmbulanceSchema,
  type AdvanceAmbulanceTripInput,
  type DispatchAmbulanceInput,
  type RegisterAmbulanceInput,
} from "@/lib/validations/ambulance";

export type AmbulanceWriteResult =
  | { ok: true; id?: string }
  | { ok: false; formError: string };

function ambulanceErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (error.code === "23505") {
    return "That vehicle number or plate number is already registered.";
  }

  if (message.includes("not available")) {
    return "That ambulance is not available.";
  }

  if (message.includes("assign an ambulance first")) {
    return "Assign an ambulance before moving the dispatch forward.";
  }

  if (message.includes("already closed")) {
    return "This dispatch is already closed.";
  }

  if (message.includes("patient not found")) {
    return "The patient could not be found.";
  }

  if (message.includes("pickup and destination")) {
    return "Pickup and destination are required.";
  }

  if (message.includes("vehicle number and plate")) {
    return "Vehicle number and plate number are required.";
  }

  if (message.includes("not found")) {
    return "The record could not be found.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateAmbulance() {
  revalidatePath("/ambulance");
  revalidatePath("/emergency");
  revalidatePath("/dashboard");
}

export async function registerAmbulanceAction(
  input: RegisterAmbulanceInput
): Promise<AmbulanceWriteResult> {
  const parsed = registerAmbulanceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the vehicle details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("register_ambulance_vehicle", {
    p_vehicle_number: value.vehicleNumber,
    p_plate_number: value.plateNumber,
    p_type: value.type,
    p_location: value.location?.trim() || "Station",
    p_next_service_due: value.nextServiceDue?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: ambulanceErrorMessage(error) };
  }

  revalidateAmbulance();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function dispatchAmbulanceAction(
  input: DispatchAmbulanceInput
): Promise<AmbulanceWriteResult> {
  const parsed = dispatchAmbulanceSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the dispatch details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_ambulance_trip", {
    p_patient_id: value.patientId,
    p_pickup_location: value.pickupLocation,
    p_destination: value.destination,
    p_priority: value.priority,
    p_notes: value.notes?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: ambulanceErrorMessage(error) };
  }

  revalidateAmbulance();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function advanceAmbulanceTripAction(
  input: AdvanceAmbulanceTripInput
): Promise<AmbulanceWriteResult> {
  const parsed = advanceAmbulanceTripSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the dispatch action.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("advance_ambulance_trip", {
    p_trip_id: value.tripId,
    p_action: value.action,
    p_vehicle_id: value.vehicleId ? value.vehicleId : null,
  });

  if (error) {
    return { ok: false, formError: ambulanceErrorMessage(error) };
  }

  revalidateAmbulance();

  return { ok: true, id: data ? String(data) : undefined };
}

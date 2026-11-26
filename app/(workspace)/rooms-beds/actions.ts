"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  bedCreateSchema,
  bedRemoveSchema,
  bedStatusSchema,
  roomUpdateSchema,
  type BedCreateInput,
  type BedRemoveInput,
  type BedStatusInput,
  type RoomUpdateInput,
} from "@/lib/validations/organisation";

function bedErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (error.code === "23505") {
    return "That bed number already exists in this room.";
  }

  if (message.includes("bed not found")) {
    return "The bed could not be found.";
  }

  if (message.includes("room not found")) {
    return "The room could not be found.";
  }

  if (message.includes("bed number is required")) {
    return "Enter a bed number.";
  }

  if (
    message.includes("active patient assignment") ||
    message.includes("bed is occupied")
  ) {
    return "This bed has a patient. Discharge or transfer the patient first.";
  }

  if (message.includes("unsupported bed status")) {
    return "Select a valid bed status.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

export async function addBedAction(input: BedCreateInput) {
  const parsed = bedCreateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the bed details.",
    } as const;
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("add_bed", {
    p_room_id: value.roomId,
    p_bed_number: value.bedNumber,
    p_status: value.status,
  });

  if (error) {
    return { ok: false, formError: bedErrorMessage(error) } as const;
  }

  revalidatePath("/rooms-beds");
  revalidatePath("/admissions/new");
  revalidatePath("/admissions/transfer");
  revalidatePath("/dashboard");

  return { ok: true } as const;
}

export async function removeBedAction(input: BedRemoveInput) {
  const parsed = bedRemoveSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Select a valid bed.",
    } as const;
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("remove_bed", {
    p_bed_id: parsed.data.bedId,
  });

  if (error) {
    return { ok: false, formError: bedErrorMessage(error) } as const;
  }

  revalidatePath("/rooms-beds");
  revalidatePath("/admissions/new");
  revalidatePath("/admissions/transfer");
  revalidatePath("/dashboard");

  return { ok: true } as const;
}

function roomErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (error.code === "23505") {
    return "That room number already exists in the selected department.";
  }

  if (message.includes("room not found")) {
    return "The room could not be found.";
  }

  if (message.includes("department not found")) {
    return "The selected department could not be found.";
  }

  if (message.includes("room number is required")) {
    return "Enter a room number.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

export async function updateRoomAction(input: RoomUpdateInput) {
  const parsed = roomUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the room details.",
    } as const;
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("update_room", {
    p_room_id: value.roomId,
    p_department_id: value.departmentId,
    p_room_number: value.roomNumber,
    p_room_type: value.roomType?.trim() || null,
    p_floor_number: value.floorNumber?.trim() || null,
    p_is_active: value.isActive,
  });

  if (error) {
    return { ok: false, formError: roomErrorMessage(error) } as const;
  }

  revalidatePath("/rooms-beds");
  revalidatePath("/admissions/new");
  revalidatePath("/admissions/transfer");
  revalidatePath("/dashboard");

  return { ok: true } as const;
}

export async function updateBedStatusAction(input: BedStatusInput) {
  const parsed = bedStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, formError: "Select a valid bed and status." } as const;
  }

  const { bedId, expectedStatus, status } = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("update_bed_status", {
    p_bed_id: bedId,
    p_expected_status: expectedStatus,
    p_status: status,
  });

  if (error) {
    if (error.code === "40001") {
      revalidatePath("/rooms-beds");
      return {
        ok: false,
        formError: "This bed’s status changed. Close this dialog and reopen it to see the current status.",
      } as const;
    }

    const formError =
      error.code === "P0002" ? "This bed could not be found."
      : error.code === "23514" ? "This bed has an active patient assignment. Use transfer or discharge to release it."
      : pgErrorMessage(error.code);

    return { ok: false, formError } as const;
  }

  revalidatePath("/rooms-beds");
  revalidatePath("/admissions");
  revalidatePath("/admissions/new");
  revalidatePath("/admissions/transfer");
  revalidatePath("/dashboard");

  return { ok: true } as const;
}

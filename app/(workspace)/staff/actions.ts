"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  departmentSchema,
  roomSchema,
  staffUpdateSchema,
  type DepartmentInput,
  type RoomInput,
  type StaffUpdateInput,
} from "@/lib/validations/organisation";

export type OrganisationWriteResult =
  | { ok: true; id?: string }
  | { ok: false; formError: string };

function organisationErrorMessage(
  error: { code?: string | null; message?: string | null },
  entity: "department" | "room" | "staff"
): string {
  const message = (error.message ?? "").toLowerCase();

  if (error.code === "23505") {
    return entity === "department"
      ? "A department with that code or name already exists."
      : entity === "room"
        ? "That room number already exists in the selected department."
        : "That record already exists.";
  }

  if (message.includes("department not found")) {
    return "The selected department could not be found.";
  }

  if (message.includes("staff record not found")) {
    return "The staff record could not be found.";
  }

  if (message.includes("code and name are required")) {
    return "Department code and name are required.";
  }

  if (message.includes("room number is required")) {
    return "Enter a room number.";
  }

  if (message.includes("first name and last name")) {
    return "First name and last name are required.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

export async function createDepartmentAction(
  input: DepartmentInput
): Promise<OrganisationWriteResult> {
  const parsed = departmentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the department details.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_department", {
    p_code: parsed.data.code,
    p_name: parsed.data.name,
    p_description: parsed.data.description?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: organisationErrorMessage(error, "department") };
  }

  revalidatePath("/departments");
  revalidatePath("/staff");
  revalidatePath("/rooms-beds");

  return { ok: true, id: data ? String(data) : undefined };
}

export async function createRoomAction(
  input: RoomInput
): Promise<OrganisationWriteResult> {
  const parsed = roomSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the room details.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_room", {
    p_department_id: parsed.data.departmentId,
    p_room_number: parsed.data.roomNumber,
    p_room_type: parsed.data.roomType?.trim() || null,
    p_floor_number: parsed.data.floorNumber?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: organisationErrorMessage(error, "room") };
  }

  revalidatePath("/rooms-beds");
  revalidatePath("/departments");

  return { ok: true, id: data ? String(data) : undefined };
}

export async function updateStaffAction(
  input: StaffUpdateInput
): Promise<OrganisationWriteResult> {
  const parsed = staffUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the staff details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("update_staff", {
    p_staff_id: value.staffId,
    p_patch: {
      first_name: value.firstName,
      middle_name: value.middleName,
      last_name: value.lastName,
      department_id: value.departmentId,
      employment_type: value.employmentType,
      professional_license_number: value.licenseNumber,
    },
  });

  if (error) {
    return { ok: false, formError: organisationErrorMessage(error, "staff") };
  }

  revalidatePath("/staff");
  revalidatePath("/settings/users");
  revalidatePath("/departments");

  return { ok: true };
}

export async function setStaffActiveAction(input: {
  staffId: string;
  isActive: boolean;
}): Promise<OrganisationWriteResult> {
  const parsed = staffUpdateSchema.pick({ staffId: true }).safeParse({
    staffId: input.staffId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Select a valid staff record.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("update_staff", {
    p_staff_id: parsed.data.staffId,
    p_patch: { is_active: input.isActive },
  });

  if (error) {
    return { ok: false, formError: organisationErrorMessage(error, "staff") };
  }

  revalidatePath("/staff");
  revalidatePath("/settings/users");

  return { ok: true };
}

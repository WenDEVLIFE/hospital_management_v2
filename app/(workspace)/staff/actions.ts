"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  departmentSchema,
  roomSchema,
  staffCreateSchema,
  staffUpdateSchema,
  type DepartmentInput,
  type RoomInput,
  type StaffCreateInput,
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

async function callAdminUsers(
  body: Record<string, unknown>,
  accessToken: string
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; status: number; code: string }> {
  const { url, publishableKey } = getSupabaseEnv();
  const response = await fetch(`${url}/functions/v1/admin-users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const rawError = payload.error;
    const code =
      typeof rawError === "string"
        ? rawError
        : rawError && typeof rawError === "object" && "code" in rawError
          ? String((rawError as { code?: unknown }).code ?? "request_failed")
          : "request_failed";

    return { ok: false, status: response.status, code };
  }

  return { ok: true, data: payload };
}

function accountErrorMessage(status: number, code: string): string {
  if (status === 401) {
    return "Your session expired. Sign in again.";
  }

  if (status === 403 || code === "forbidden") {
    return "Only a hospital administrator can create staff accounts.";
  }

  if (status === 409 || code === "account_exists") {
    return "An account with that email already exists.";
  }

  if (status === 400 || code === "invalid_account") {
    return "Use a valid email and a password of at least 12 characters.";
  }

  return "The account could not be created. Try again.";
}

export async function createStaffAction(
  input: StaffCreateInput
): Promise<OrganisationWriteResult> {
  const parsed = staffCreateSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the staff details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      ok: false,
      formError: "Your session expired. Sign in again.",
    };
  }

  const account = await callAdminUsers(
    {
      action: "create",
      email: value.email,
      password: value.password,
      fullName: value.fullName,
    },
    session.access_token
  );

  if (!account.ok) {
    return {
      ok: false,
      formError: accountErrorMessage(account.status, account.code),
    };
  }

  const userId = String(account.data.userId ?? "");

  if (!userId) {
    return {
      ok: false,
      formError: "The account was created but no user id was returned. Check Settings → Users.",
    };
  }

  const { data: staffId, error } = await supabase.rpc("create_staff_record", {
    p_user_id: userId,
    p_staff_number: value.staffNumber,
    p_first_name: value.firstName,
    p_last_name: value.lastName,
    p_middle_name: value.middleName || null,
    p_department_id: value.departmentId || null,
    p_employment_type: value.employmentType || null,
    p_professional_license_number: value.licenseNumber || null,
    p_role_id: value.roleId || null,
  });

  if (error) {
    // The Auth account already exists, so deactivate it rather than leave an
    // active account with no staff record. The transaction rolled the record back.
    await callAdminUsers(
      { action: "set-active", userId, active: false },
      session.access_token
    );

    const message = (error.message ?? "").toLowerCase();

    if (message.includes("already has a staff record")) {
      return {
        ok: false,
        formError: "That account already has a staff record.",
      };
    }

    if (message.includes("staff number, first name and last name")) {
      return {
        ok: false,
        formError: "Staff number, first name and last name are required.",
      };
    }

    if (error.code === "42501" && value.roleId) {
      return {
        ok: false,
        formError:
          "That role cannot be assigned by you. Administrator roles require a super administrator. The account was created and deactivated.",
      };
    }

    return {
      ok: false,
      formError:
        error.code === "23505"
          ? "That staff number is already in use. The account was created and deactivated."
          : `${pgErrorMessage(error.code ?? "UNKNOWN")} The account was created and deactivated.`,
    };
  }

  revalidatePath("/staff");
  revalidatePath("/settings/users");

  return { ok: true, id: staffId ? String(staffId) : userId };
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { invokeEdgeFunction } from "@/lib/supabase/functions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type UserWriteResult =
  | { ok: true }
  | { ok: false; formError: string };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const userIdSchema = z
  .string()
  .trim()
  .regex(UUID_PATTERN, "Select a valid account.");

const manageUserSchema = z.object({
  userId: userIdSchema,
  roleIds: z
    .array(z.string().trim().regex(UUID_PATTERN, "Select a valid role."))
    .max(10, "Too many roles selected."),
  departmentId: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || UUID_PATTERN.test(value),
      "Select a valid department."
    ),
  active: z.boolean(),
});

export type ManageUserInput = z.infer<typeof manageUserSchema>;

function revalidateUsers() {
  revalidatePath("/settings/users");
  revalidatePath("/staff");
  revalidatePath("/dashboard");
}

function edgeMessage(status: number, code: string, action: "role" | "status"): string {
  if (status === 401) {
    return "Your session expired. Sign in again.";
  }

  if (status === 403 || code === "forbidden") {
    return action === "role"
      ? "You cannot change this role. Administrator roles require a super administrator."
      : "You cannot change this account status.";
  }

  if (status === 404 || code === "user_not_found" || code === "user_or_role_not_found") {
    return "The account or role could not be found.";
  }

  return action === "role"
    ? "The role change could not be saved."
    : "The account status could not be saved.";
}

export async function updateManagedUserAction(
  input: ManageUserInput
): Promise<UserWriteResult> {
  const parsed = manageUserSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the account changes.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, formError: "Your session expired. Sign in again." };
  }

  const [profileResult, rolesResult, staffResult] = await Promise.all([
    supabase.from("profiles").select("is_active").eq("id", value.userId).maybeSingle(),
    supabase.from("user_roles").select("role_id").eq("user_id", value.userId),
    supabase
      .from("staff_profiles")
      .select("id, department_id")
      .eq("user_id", value.userId)
      .maybeSingle(),
  ]);

  if (!profileResult.data) {
    return { ok: false, formError: "The account could not be found." };
  }

  const applied: string[] = [];
  const failures: string[] = [];

  if (profileResult.data.is_active !== value.active) {
    const result = await invokeEdgeFunction(
      "admin-users",
      { action: "set-active", userId: value.userId, active: value.active },
      session.access_token
    );

    if (!result.ok) {
      return {
        ok: false,
        formError: edgeMessage(result.status, result.code, "status"),
      };
    }

    applied.push("account status");
  }

  const currentRoleIds = new Set(
    (rolesResult.data ?? []).map((row) => row.role_id as string)
  );
  const nextRoleIds = new Set(value.roleIds);
  const toGrant = [...nextRoleIds].filter((id) => !currentRoleIds.has(id));
  const toRevoke = [...currentRoleIds].filter((id) => !nextRoleIds.has(id));

  for (const roleId of toGrant) {
    const result = await invokeEdgeFunction(
      "admin-role-assignment",
      { action: "grant", userId: value.userId, roleId },
      session.access_token
    );

    if (!result.ok) {
      failures.push(edgeMessage(result.status, result.code, "role"));
      break;
    }
  }

  if (failures.length === 0) {
    for (const roleId of toRevoke) {
      const result = await invokeEdgeFunction(
        "admin-role-assignment",
        { action: "revoke", userId: value.userId, roleId },
        session.access_token
      );

      if (!result.ok) {
        failures.push(edgeMessage(result.status, result.code, "role"));
        break;
      }
    }
  }

  if (failures.length === 0 && (toGrant.length > 0 || toRevoke.length > 0)) {
    applied.push("roles");
  }

  const staff = staffResult.data;

  if (
    staff &&
    (staff.department_id ?? "") !== value.departmentId
  ) {
    const { error } = await supabase.rpc("update_staff", {
      p_staff_id: staff.id,
      p_patch: { department_id: value.departmentId || null },
    });

    if (error) {
      failures.push(
        error.code === "42501"
          ? "You cannot change this staff department."
          : "The department could not be saved."
      );
    } else {
      applied.push("department");
    }
  }

  if (failures.length > 0) {
    revalidateUsers();

    return {
      ok: false,
      formError:
        applied.length > 0
          ? `Saved ${applied.join(", ")}. ${failures[0]}`
          : failures[0]!,
    };
  }

  revalidateUsers();

  return { ok: true };
}

export async function deleteUserAccountAction(
  userId: string
): Promise<UserWriteResult> {
  const parsed = userIdSchema.safeParse(userId);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Select a valid account.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, formError: "Your session expired. Sign in again." };
  }

  const result = await invokeEdgeFunction(
    "admin-users",
    { action: "delete", userId: parsed.data },
    session.access_token
  );

  if (!result.ok) {
    if (result.status === 409 || result.code === "user_has_records") {
      return {
        ok: false,
        formError:
          "This account created or approved hospital records, so it cannot be deleted. Deactivate it instead to preserve the audit trail.",
      };
    }

    if (result.status === 403 || result.code === "forbidden") {
      return {
        ok: false,
        formError: "Only a hospital administrator can delete accounts.",
      };
    }

    if (result.status === 404 || result.code === "user_not_found") {
      return { ok: false, formError: "The account could not be found." };
    }

    return {
      ok: false,
      formError: "The account could not be deleted. Try again.",
    };
  }

  revalidateUsers();

  return { ok: true };
}

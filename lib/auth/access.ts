import { getSupabaseServerClient } from "@/lib/supabase/server";

export type UserAccess = {
  userId: string | null;
  isAdmin: boolean;
  permissions: string[];
};

export const EMPTY_ACCESS: UserAccess = {
  userId: null,
  isAdmin: false,
  permissions: [],
};

/**
 * Effective permissions for the signed-in user, used only to decide what the UI
 * offers. Every action is still authorized by RLS and the RPC permission checks.
 */
export async function getCurrentUserAccess(): Promise<UserAccess> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_ACCESS;
  }

  const [adminResult, permissionResult] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase.rpc("current_permissions"),
  ]);

  return {
    userId: user.id,
    isAdmin: Boolean(adminResult.data),
    permissions: Array.isArray(permissionResult.data)
      ? (permissionResult.data as string[])
      : [],
  };
}

export function accessCan(
  access: UserAccess,
  permission: string | undefined
): boolean {
  if (!permission) {
    return true;
  }

  return access.isAdmin || access.permissions.includes(permission);
}

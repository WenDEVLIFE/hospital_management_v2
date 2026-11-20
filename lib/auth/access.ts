import { cache } from "react";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type UserAccess = {
  userId: string | null;
  profileStatus: "missing" | "disabled" | "active";
  isAdmin: boolean;
  permissions: string[];
};

export const EMPTY_ACCESS: UserAccess = {
  userId: null,
  profileStatus: "missing",
  isAdmin: false,
  permissions: [],
};

/**
 * Share authentication, profile status, and UI permissions within one render
 * request. This result never enters the cross-request Next.js cache.
 */
export const getCurrentUserAccess = cache(async (): Promise<UserAccess> => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY_ACCESS;
  }

  const [profileResult, adminResult, permissionResult] = await Promise.all([
    supabase.from("profiles").select("is_active").eq("id", user.id).maybeSingle(),
    supabase.rpc("is_admin"),
    supabase.rpc("current_permissions"),
  ]);

  const profile = profileResult.data;
  if (!profile || profile.is_active === false) {
    return {
      ...EMPTY_ACCESS,
      userId: user.id,
      profileStatus: profile ? "disabled" : "missing",
    };
  }

  return {
    userId: user.id,
    profileStatus: "active",
    isAdmin: Boolean(adminResult.data),
    permissions: Array.isArray(permissionResult.data)
      ? (permissionResult.data as string[])
      : [],
  };
});

export function accessCan(
  access: UserAccess,
  permission: string | undefined
): boolean {
  if (!permission) {
    return true;
  }

  return access.isAdmin || access.permissions.includes(permission);
}

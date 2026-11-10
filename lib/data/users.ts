import type { Role, UserListRow, UserStats } from "@/types/hospital";
import { roles, userListRows } from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

function emptyStats(): UserStats {
  return {
    total: 0,
    active: 0,
    inactive: 0,
    byRole: [],
  };
}

export async function listUsers(
  params: {
    q?: string;
    role?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<UserListRow>> {
  // TODO(supabase): replace with supabase.from("profiles").select("*")
  if (!isPreviewMode) {
    return emptyPage<UserListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const roleFilter = params.role?.toLowerCase();

  const filtered = userListRows.filter((user) => {
    if (roleFilter) {
      const matchesRole =
        user.role_slugs.some((slug) => slug.toLowerCase() === roleFilter) ||
        user.role_names.some((name) => name.toLowerCase() === roleFilter);

      if (!matchesRole) {
        return false;
      }
    }

    return matchesQuery(params.q, [
      user.email,
      user.full_name,
      user.contact_number,
      user.role_names.join(" "),
      user.department_name,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listRoles(): Promise<DataResult<Role[]>> {
  // TODO(supabase): replace with supabase.from("roles").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: roles, error: null };
}

export async function getUserStats(): Promise<DataResult<UserStats>> {
  // TODO(supabase): replace with supabase.from("user_roles").select("role_id")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const stats = emptyStats();
  const byRole = new Map<string, number>();

  for (const user of userListRows) {
    stats.total += 1;

    if (user.is_active) {
      stats.active += 1;
    } else {
      stats.inactive += 1;
    }

    for (const role of user.role_names) {
      byRole.set(role, (byRole.get(role) ?? 0) + 1);
    }
  }

  stats.byRole = [...byRole.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => a.role.localeCompare(b.role));

  return { data: stats, error: null };
}

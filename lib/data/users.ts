import type { Role, UserListRow, UserStats } from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePagination, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const PROFILE_COLUMNS =
  "id, email, full_name, avatar_path, contact_number, is_active, created_at, updated_at, user_roles!user_roles_user_id_fkey(roles(id, slug, name)), staff_profiles!staff_profiles_user_id_fkey(departments(name))";

type Relation<T> = T | T[] | null;

type ProfileJoinRow = {
  id: string;
  email: string;
  full_name: string;
  avatar_path: string | null;
  contact_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_roles: Array<{
    roles: Relation<{ id: string; slug: string; name: string }>;
  }> | null;
  staff_profiles: Relation<{
    departments: Relation<{ name: string }>;
  }>;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function emptyStats(): UserStats {
  return {
    total: 0,
    active: 0,
    inactive: 0,
    byRole: [],
  };
}

function toUserListRow(row: ProfileJoinRow): UserListRow {
  const staff = firstRelation(row.staff_profiles);
  const department = staff ? firstRelation(staff.departments) : null;
  const roles = (row.user_roles ?? [])
    .map((userRole) => firstRelation(userRole.roles))
    .filter(
      (role): role is { id: string; slug: string; name: string } =>
        Boolean(role)
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    avatar_path: row.avatar_path,
    contact_number: row.contact_number,
    role_slugs: roles.map((role) => role.slug),
    role_names: roles.map((role) => role.name),
    department_name: department?.name ?? null,
    is_active: row.is_active,
    // Auth last_sign_in_at is not exposed through the public schema.
    last_activity: null,
    created_at: row.created_at,
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
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("profiles")
    .select(PROFILE_COLUMNS, { count: "exact" });

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      [
        `email.ilike.${term}`,
        `full_name.ilike.${term}`,
        `contact_number.ilike.${term}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query
    .order("full_name", { ascending: true })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  let rows = ((data ?? []) as ProfileJoinRow[]).map(toUserListRow);
  const roleFilter = params.role?.toLowerCase();

  if (roleFilter) {
    rows = rows.filter(
      (row) =>
        row.role_slugs.some((slug) => slug.toLowerCase() === roleFilter) ||
        row.role_names.some((name) => name.toLowerCase() === roleFilter)
    );
  }

  return {
    data: {
      rows,
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function listRoles(): Promise<DataResult<Role[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id, slug, name, description, is_system, created_at")
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as Role[], error: null };
}

export async function getUserStats(): Promise<DataResult<UserStats>> {
  const supabase = await getSupabaseServerClient();

  const [profilesResult, rolesResult] = await Promise.all([
    supabase.from("profiles").select("is_active"),
    supabase.from("user_roles").select("roles(name)"),
  ]);

  if (profilesResult.error) {
    return { data: null, error: toDataError(profilesResult.error) };
  }

  if (rolesResult.error) {
    return { data: null, error: toDataError(rolesResult.error) };
  }

  const stats = emptyStats();
  const byRole = new Map<string, number>();

  for (const profile of (profilesResult.data ?? []) as Array<{
    is_active: boolean;
  }>) {
    stats.total += 1;

    if (profile.is_active) {
      stats.active += 1;
    } else {
      stats.inactive += 1;
    }
  }

  for (const userRole of (rolesResult.data ?? []) as Array<{
    roles: Relation<{ name: string }>;
  }>) {
    const role = firstRelation(userRole.roles);

    if (!role?.name) {
      continue;
    }

    byRole.set(role.name, (byRole.get(role.name) ?? 0) + 1);
  }

  stats.byRole = [...byRole.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((left, right) => left.role.localeCompare(right.role));

  return { data: stats, error: null };
}

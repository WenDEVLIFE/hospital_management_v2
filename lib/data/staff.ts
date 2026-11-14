import type { StaffListRow, StaffStats } from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePagination, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const STAFF_COLUMNS =
  "id, user_id, staff_number, first_name, middle_name, last_name, department_id, employment_type, professional_license_number, is_active, departments(name), profiles!staff_profiles_user_id_fkey(email, contact_number, is_active), physicians(specialty, license_number)";

type Relation<T> = T | T[] | null;

type StaffJoinRow = {
  id: string;
  user_id: string;
  staff_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  department_id: string | null;
  employment_type: string | null;
  professional_license_number: string | null;
  is_active: boolean;
  departments: Relation<{ name: string }>;
  profiles: Relation<{
    email: string;
    contact_number: string | null;
    is_active: boolean;
  }>;
  physicians: Relation<{
    specialty: string | null;
    license_number: string;
  }>;
};

type RoleJoinRow = {
  user_id: string;
  roles: Relation<{ name: string }>;
};

type StaffStatsJoinRow = {
  id: string;
  department_id: string | null;
  is_active: boolean;
  departments: Relation<{ name: string }>;
  profiles: Relation<{ is_active: boolean }>;
  physicians: Relation<{ id: string }>;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function emptyStats(): StaffStats {
  return {
    total: 0,
    active: 0,
    inactive: 0,
    physicians: 0,
    byDepartment: [],
  };
}

function fullName(row: {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
}): string {
  return [row.first_name, row.middle_name, row.last_name]
    .filter(Boolean)
    .join(" ");
}

function isAccountActive(row: StaffJoinRow): boolean {
  const profile = firstRelation(row.profiles);

  return row.is_active && (profile?.is_active ?? true);
}

export async function listStaff(
  params: {
    q?: string;
    departmentId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<StaffListRow>> {
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("staff_profiles")
    .select(STAFF_COLUMNS, { count: "exact" });

  if (params.departmentId) {
    query = query.eq("department_id", params.departmentId);
  }

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      [
        `staff_number.ilike.${term}`,
        `first_name.ilike.${term}`,
        `middle_name.ilike.${term}`,
        `last_name.ilike.${term}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const staffRows = (data ?? []) as StaffJoinRow[];
  const userIds = Array.from(new Set(staffRows.map((row) => row.user_id)));
  const roleNamesByUser = new Map<string, Set<string>>();

  if (userIds.length > 0) {
    const { data: roleRows, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id, roles(name)")
      .in("user_id", userIds);

    // A user who cannot read all role links still gets the directory; role
    // badges simply remain empty for records outside their scope.
    if (!roleError) {
      for (const roleRow of (roleRows ?? []) as RoleJoinRow[]) {
        const role = firstRelation(roleRow.roles);

        if (!role?.name) {
          continue;
        }

        const names = roleNamesByUser.get(roleRow.user_id) ?? new Set<string>();
        names.add(role.name);
        roleNamesByUser.set(roleRow.user_id, names);
      }
    }
  }

  const rows: StaffListRow[] = staffRows.map((row) => {
    const profile = firstRelation(row.profiles);
    const department = firstRelation(row.departments);
    const physician = firstRelation(row.physicians);
    const roleNames = [...(roleNamesByUser.get(row.user_id) ?? [])].sort(
      (left, right) => left.localeCompare(right)
    );

    return {
      id: row.id,
      staff_number: row.staff_number,
      user_id: row.user_id,
      first_name: row.first_name,
      middle_name: row.middle_name,
      last_name: row.last_name,
      full_name: fullName(row),
      email: profile?.email ?? "",
      contact_number: profile?.contact_number ?? null,
      role_names: roleNames,
      department_id: row.department_id,
      department_name: department?.name ?? null,
      employment_type: row.employment_type,
      professional_license_number:
        row.professional_license_number ?? physician?.license_number ?? null,
      specialty: physician?.specialty ?? null,
      is_physician: Boolean(physician),
      is_active: isAccountActive(row),
    };
  });

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

export async function getStaffStats(): Promise<DataResult<StaffStats>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff_profiles")
    .select(
      "id, department_id, is_active, departments(name), profiles!staff_profiles_user_id_fkey(is_active), physicians(id)"
    );

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const stats = emptyStats();
  const byDepartment = new Map<
    string,
    { department_id: string; department_name: string; count: number }
  >();

  for (const staff of (data ?? []) as StaffStatsJoinRow[]) {
    stats.total += 1;

    const profile = firstRelation(staff.profiles);
    const active = staff.is_active && (profile?.is_active ?? true);

    if (active) {
      stats.active += 1;
    } else {
      stats.inactive += 1;
    }

    if (firstRelation(staff.physicians)) {
      stats.physicians += 1;
    }

    if (staff.department_id) {
      const department = firstRelation(staff.departments);
      const entry = byDepartment.get(staff.department_id) ?? {
        department_id: staff.department_id,
        department_name: department?.name ?? "Unassigned",
        count: 0,
      };
      entry.count += 1;
      byDepartment.set(staff.department_id, entry);
    }
  }

  stats.byDepartment = [...byDepartment.values()].sort((left, right) =>
    left.department_name.localeCompare(right.department_name)
  );

  return { data: stats, error: null };
}

import type { Department, DepartmentStats } from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePagination, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const DEPARTMENT_COLUMNS =
  "id, code, name, description, is_active, created_at, updated_at";

function emptyStats(): DepartmentStats {
  return {
    total: 0,
    active: 0,
    inactive: 0,
    staffCount: 0,
  };
}

export async function listDepartments(
  params: {
    q?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<Department>> {
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("departments")
    .select(DEPARTMENT_COLUMNS, { count: "exact" });

  if (typeof params.isActive === "boolean") {
    query = query.eq("is_active", params.isActive);
  }

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      [
        `code.ilike.${term}`,
        `name.ilike.${term}`,
        `description.ilike.${term}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query
    .order("name", { ascending: true })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: {
      rows: (data ?? []) as Department[],
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function getDepartmentStats(): Promise<
  DataResult<DepartmentStats>
> {
  const supabase = await getSupabaseServerClient();

  const [departmentResult, staffCountResult] = await Promise.all([
    supabase.from("departments").select("is_active"),
    supabase
      .from("staff_profiles")
      .select("id", { count: "exact", head: true }),
  ]);

  if (departmentResult.error) {
    return { data: null, error: toDataError(departmentResult.error) };
  }

  const stats = emptyStats();

  for (const department of (departmentResult.data ?? []) as Array<
    Pick<Department, "is_active">
  >) {
    stats.total += 1;

    if (department.is_active) {
      stats.active += 1;
    } else {
      stats.inactive += 1;
    }
  }

  // Staff count is secondary; keep department counts visible if the staff
  // query is blocked by row-level security.
  stats.staffCount = staffCountResult.error
    ? 0
    : staffCountResult.count ?? 0;

  return { data: stats, error: null };
}

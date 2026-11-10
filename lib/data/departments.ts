import type { Department, DepartmentStats } from "@/types/hospital";
import { departments, staffProfiles } from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

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
  // TODO(supabase): replace with supabase.from("departments").select("*")
  if (!isPreviewMode) {
    return emptyPage<Department>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = departments
    .filter((department) => {
      if (
        typeof params.isActive === "boolean" &&
        department.is_active !== params.isActive
      ) {
        return false;
      }

      return matchesQuery(params.q, [
        department.code,
        department.name,
        department.description,
      ]);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getDepartmentStats(): Promise<
  DataResult<DepartmentStats>
> {
  // TODO(supabase): replace with supabase.from("departments").select("is_active")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const stats = emptyStats();
  stats.total = departments.length;
  stats.staffCount = staffProfiles.length;

  for (const department of departments) {
    if (department.is_active) {
      stats.active += 1;
    } else {
      stats.inactive += 1;
    }
  }

  return { data: stats, error: null };
}

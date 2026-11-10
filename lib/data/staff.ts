import type { StaffListRow, StaffStats } from "@/types/hospital";
import { staffListRows } from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

function emptyStats(): StaffStats {
  return {
    total: 0,
    active: 0,
    inactive: 0,
    physicians: 0,
    byDepartment: [],
  };
}

export async function listStaff(
  params: {
    q?: string;
    departmentId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<StaffListRow>> {
  // TODO(supabase): replace with supabase.from("staff_profiles").select("*")
  if (!isPreviewMode) {
    return emptyPage<StaffListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = staffListRows.filter((staff) => {
    if (params.departmentId && staff.department_id !== params.departmentId) {
      return false;
    }

    return matchesQuery(params.q, [
      staff.staff_number,
      staff.first_name,
      staff.middle_name,
      staff.last_name,
      staff.email,
      staff.role_names.join(" "),
      staff.department_name,
      staff.specialty,
      staff.professional_license_number,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getStaffStats(): Promise<DataResult<StaffStats>> {
  // TODO(supabase): replace with supabase.from("staff_profiles").select("department_id, is_active")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const stats = emptyStats();
  const byDepartment = new Map<
    string,
    { department_id: string; department_name: string; count: number }
  >();

  for (const staff of staffListRows) {
    stats.total += 1;

    if (staff.is_active) {
      stats.active += 1;
    } else {
      stats.inactive += 1;
    }

    if (staff.is_physician) {
      stats.physicians += 1;
    }

    if (staff.department_id) {
      const entry = byDepartment.get(staff.department_id) ?? {
        department_id: staff.department_id,
        department_name: staff.department_name ?? "Unassigned",
        count: 0,
      };
      entry.count += 1;
      byDepartment.set(staff.department_id, entry);
    }
  }

  stats.byDepartment = [...byDepartment.values()].sort((a, b) =>
    a.department_name.localeCompare(b.department_name)
  );

  return { data: stats, error: null };
}

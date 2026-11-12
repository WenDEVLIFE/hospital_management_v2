import type {
  CleaningRequestDetail,
  CleaningRequestListRow,
  DisinfectionRecord,
  HousekeepingStaff,
  HousekeepingStats,
} from "@/types/hospital";
import {
  cleaningRequestDetailById,
  cleaningRequestListRows,
  disinfectionRecords,
  housekeepingStaff,
  housekeepingStats,
  todayCleaningRequests,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested cleaning request could not be found.",
} as const;

function emptyStats(): HousekeepingStats {
  return {
    openRequests: 0,
    inProgress: 0,
    completedToday: 0,
    overdue: 0,
    roomsWaiting: 0,
    staffOnDuty: 0,
  };
}

export async function listCleaningRequests(
  params: {
    q?: string;
    status?: string;
    priority?: string;
    requestType?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<CleaningRequestListRow>> {
  // TODO(supabase): replace with supabase.from("cleaning_requests").select("*")
  if (!isPreviewMode) {
    return emptyPage<CleaningRequestListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = cleaningRequestListRows
    .filter((request) => {
      if (params.status && request.status !== params.status) {
        return false;
      }

      if (params.priority && request.priority !== params.priority) {
        return false;
      }

      if (params.requestType && request.request_type !== params.requestType) {
        return false;
      }

      return matchesQuery(params.q, [
        request.request_number,
        request.location_label,
        request.department_name,
        request.request_type,
        request.assigned_staff_name,
        request.notes,
      ]);
    })
    .sort((a, b) =>
      a.due_at === b.due_at ? 0 : a.due_at < b.due_at ? -1 : 1
    );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getCleaningRequestDetails(): Promise<
  DataResult<Record<string, CleaningRequestDetail>>
> {
  // TODO(supabase): replace with a joined cleaning request detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(cleaningRequestDetailById),
    error: null,
  };
}

export async function getCleaningRequestDetail(
  id: string
): Promise<DataResult<CleaningRequestDetail>> {
  // TODO(supabase): replace with supabase.from("cleaning_requests").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: NOT_FOUND };
  }

  await Promise.resolve();

  const detail = cleaningRequestDetailById.get(id);

  if (!detail) {
    return { data: null, error: NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function listTodayCleaningSchedule(): Promise<
  DataResult<CleaningRequestListRow[]>
> {
  // TODO(supabase): replace with a cleaning request query for the current date
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: todayCleaningRequests, error: null };
}

export async function listHousekeepingStaff(): Promise<
  DataResult<HousekeepingStaff[]>
> {
  // TODO(supabase): replace with supabase.from("housekeeping_staff").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: housekeepingStaff, error: null };
}

export async function listDisinfectionRecords(): Promise<
  DataResult<DisinfectionRecord[]>
> {
  // TODO(supabase): replace with supabase.from("disinfection_records").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: disinfectionRecords, error: null };
}

export async function getHousekeepingStats(): Promise<
  DataResult<HousekeepingStats>
> {
  // TODO(supabase): replace with aggregate queries over cleaning requests
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  return { data: housekeepingStats, error: null };
}

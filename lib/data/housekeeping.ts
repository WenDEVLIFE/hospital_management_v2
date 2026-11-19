import type {
  CleaningPriority,
  CleaningRequest,
  CleaningRequestDetail,
  CleaningRequestListRow,
  CleaningRequestType,
  CleaningStatus,
  DisinfectionRecord,
  HousekeepingStaff,
  HousekeepingStats,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate, pageSlice, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const REQUEST_COLUMNS =
  "*, departments(name), housekeeping_staff!cleaning_requests_assigned_staff_id_fkey(name), profiles!cleaning_requests_verified_by_fkey(full_name)";

type Relation<T> = T | T[] | null;

type RequestJoinRow = CleaningRequest & {
  departments: Relation<{ name: string }>;
  housekeeping_staff: Relation<{ name: string }>;
  profiles: Relation<{ full_name: string }>;
};

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested cleaning request could not be found.",
} as const;

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function toRequestRow(row: RequestJoinRow): CleaningRequestListRow {
  const department = firstRelation(row.departments);
  const staff = firstRelation(row.housekeeping_staff);
  const verifier = firstRelation(row.profiles);

  return {
    id: row.id,
    request_number: row.request_number,
    location_type: row.location_type,
    location_label: row.location_label,
    department_name: department?.name ?? "Unassigned",
    request_type: row.request_type as CleaningRequestType,
    priority: row.priority as CleaningPriority,
    status: row.status as CleaningStatus,
    requested_at: row.requested_at,
    due_at: row.due_at,
    scheduled_for: row.scheduled_for,
    assigned_staff_id: row.assigned_staff_id,
    started_at: row.started_at,
    completed_at: row.completed_at,
    verified_at: row.verified_at,
    verified_by_name: verifier?.full_name ?? null,
    disinfection_used: row.disinfection_used,
    notes: row.notes,
    assigned_staff_name: staff?.name ?? null,
  };
}

async function loadRequests(): Promise<DataResult<RequestJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("cleaning_requests")
    .select(REQUEST_COLUMNS)
    .order("due_at", { ascending: true });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as RequestJoinRow[], error: null };
}

export async function listCleaningRequests(
  params: {
    q?: string;
    status?: string;
    type?: string;
    priority?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<CleaningRequestListRow>> {
  const requestResult = await loadRequests();

  if (requestResult.error) {
    return { data: null, error: requestResult.error };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = requestResult.data
    .map(toRequestRow)
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (params.type && row.request_type !== params.type) {
        return false;
      }

      if (params.priority && row.priority !== params.priority) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        row.request_number,
        row.location_label,
        row.department_name,
        row.assigned_staff_name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function listTodayCleaningSchedule(): Promise<
  DataResult<CleaningRequestListRow[]>
> {
  const requestResult = await loadRequests();

  if (requestResult.error) {
    return { data: null, error: requestResult.error };
  }

  const today = manilaDate(new Date().toISOString());
  const rows = requestResult.data
    .map(toRequestRow)
    .filter((row) => manilaDate(row.scheduled_for) === today);

  return { data: rows, error: null };
}

export async function listHousekeepingStaff(): Promise<
  DataResult<HousekeepingStaff[]>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("housekeeping_staff")
    .select(
      "id, name, role, status, contact_number, current_assignment, completed_today"
    )
    .order("name");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as HousekeepingStaff[], error: null };
}

export async function listDisinfectionRecords(): Promise<
  DataResult<DisinfectionRecord[]>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("disinfection_records")
    .select(
      "id, request_id, method, chemical, contact_time_minutes, performed_at, notes, profiles!disinfection_records_performed_by_fkey(full_name)"
    )
    .order("performed_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: ((data ?? []) as Array<
      Omit<DisinfectionRecord, "performed_by_name"> & {
        profiles: Relation<{ full_name: string }>;
      }
    >).map((row) => ({
      id: row.id,
      request_id: row.request_id,
      method: row.method,
      chemical: row.chemical,
      contact_time_minutes: row.contact_time_minutes,
      performed_at: row.performed_at,
      notes: row.notes,
      performed_by_name:
        firstRelation(row.profiles)?.full_name ?? "Unknown staff",
    })),
    error: null,
  };
}

export async function getCleaningRequestDetail(
  id: string
): Promise<DataResult<CleaningRequestDetail>> {
  const requestResult = await loadRequests();

  if (requestResult.error) {
    return { data: null, error: requestResult.error };
  }

  const row = requestResult.data.find((request) => request.id === id);

  if (!row) {
    return { data: null, error: NOT_FOUND };
  }

  const supabase = await getSupabaseServerClient();
  const [staffResult, disinfectionResult] = await Promise.all([
    row.assigned_staff_id
      ? supabase
          .from("housekeeping_staff")
          .select(
            "id, name, role, status, contact_number, current_assignment, completed_today"
          )
          .eq("id", row.assigned_staff_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("disinfection_records")
      .select(
        "id, request_id, method, chemical, contact_time_minutes, performed_at, notes, profiles!disinfection_records_performed_by_fkey(full_name)"
      )
      .eq("request_id", id)
      .maybeSingle(),
  ]);

  const disinfectionRow = disinfectionResult.data as
    | (Omit<DisinfectionRecord, "performed_by_name"> & {
        profiles: Relation<{ full_name: string }>;
      })
    | null;

  return {
    data: {
      request: toRequestRow(row),
      staff: (staffResult.data as HousekeepingStaff | null) ?? null,
      disinfection: disinfectionRow
        ? {
            id: disinfectionRow.id,
            request_id: disinfectionRow.request_id,
            method: disinfectionRow.method,
            chemical: disinfectionRow.chemical,
            contact_time_minutes: disinfectionRow.contact_time_minutes,
            performed_at: disinfectionRow.performed_at,
            notes: disinfectionRow.notes,
            performed_by_name:
              firstRelation(disinfectionRow.profiles)?.full_name ??
              "Unknown staff",
          }
        : null,
    },
    error: null,
  };
}

export async function getCleaningRequestDetails(): Promise<
  DataResult<Record<string, CleaningRequestDetail>>
> {
  const requestResult = await loadRequests();

  if (requestResult.error) {
    return { data: null, error: requestResult.error };
  }

  const details: Record<string, CleaningRequestDetail> = {};

  for (const row of requestResult.data.slice(0, 200)) {
    const detail = await getCleaningRequestDetail(row.id);

    if (detail.data) {
      details[row.id] = detail.data;
    }
  }

  return { data: details, error: null };
}

export async function getHousekeepingStats(): Promise<
  DataResult<HousekeepingStats>
> {
  const requestResult = await loadRequests();

  if (requestResult.error) {
    return { data: null, error: requestResult.error };
  }

  const today = manilaDate(new Date().toISOString());
  const stats: HousekeepingStats = {
    openRequests: 0,
    inProgress: 0,
    completedToday: 0,
    overdue: 0,
    roomsWaiting: 0,
    staffOnDuty: 0,
  };

  for (const row of requestResult.data) {
    const request = toRequestRow(row);

    if (request.status === "requested" || request.status === "assigned") {
      stats.openRequests += 1;
    }

    if (request.status === "in_progress") {
      stats.inProgress += 1;
    }

    if (
      (request.status === "completed" || request.status === "verified") &&
      request.completed_at &&
      manilaDate(request.completed_at) === today
    ) {
      stats.completedToday += 1;
    }

    if (
      request.status !== "completed" &&
      request.status !== "verified" &&
      request.status !== "cancelled" &&
      new Date(request.due_at).getTime() < Date.now()
    ) {
      stats.overdue += 1;
    }

    if (request.location_type === "room" || request.location_type === "isolation_room") {
      if (request.status !== "verified" && request.status !== "cancelled") {
        stats.roomsWaiting += 1;
      }
    }
  }

  const staffResult = await listHousekeepingStaff();

  if (!staffResult.error) {
    stats.staffOnDuty = staffResult.data.filter(
      (staff) => staff.status === "on_duty"
    ).length;
  }

  return { data: stats, error: null };
}

import type {
  Appointment,
  AppointmentListRow,
  AppointmentStats,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate, normalizePagination, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const APPOINTMENT_COLUMNS =
  "*, patients(first_name, middle_name, last_name, suffix, medical_record_number), departments(name), physicians(staff_profiles(first_name, last_name))";

type AppointmentJoinRow = Appointment & {
  patients: {
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    medical_record_number: string;
  } | null;
  departments: { name: string } | null;
  physicians: {
    staff_profiles: { first_name: string; last_name: string } | null;
  } | null;
};

function emptyStats(): AppointmentStats {
  return {
    total: 0,
    today: 0,
    scheduled: 0,
    confirmed: 0,
    waiting: 0,
    inConsultation: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
  };
}

function fullName(row: {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
}): string {
  return [row.first_name, row.middle_name, row.last_name, row.suffix]
    .filter(Boolean)
    .join(" ");
}

/**
 * Convert a Manila calendar date (YYYY-MM-DD) into the UTC half-open range
 * that PostgREST needs for a timestamptz comparison.
 */
function manilaDayRange(
  date: string
): { start: string; end: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const start = new Date(`${date}T00:00:00+08:00`);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start: start.toISOString(), end: end.toISOString() };
}

function toAppointmentListRow(row: AppointmentJoinRow): AppointmentListRow {
  return {
    id: row.id,
    appointment_number: row.appointment_number,
    patient_id: row.patient_id,
    patient_name: row.patients
      ? fullName(row.patients)
      : "Unknown patient",
    patient_mrn: row.patients?.medical_record_number ?? "\u2014",
    department_id: row.department_id,
    department_name: row.departments?.name ?? "Unknown department",
    physician_id: row.physician_id,
    physician_name: row.physicians?.staff_profiles
      ? fullName(row.physicians.staff_profiles)
      : null,
    scheduled_at: row.scheduled_at,
    duration_minutes: row.duration_minutes,
    appointment_type: row.appointment_type,
    reason_for_visit: row.reason_for_visit,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
  };
}

export async function listAppointments(
  params: {
    q?: string;
    status?: string;
    date?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AppointmentListRow>> {
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_COLUMNS, { count: "exact" });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.date) {
    const range = manilaDayRange(params.date);

    if (range) {
      query = query
        .gte("scheduled_at", range.start)
        .lt("scheduled_at", range.end);
    }
  }

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      [
        `appointment_number.ilike.${term}`,
        `appointment_type.ilike.${term}`,
        `reason_for_visit.ilike.${term}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query
    .order("scheduled_at", { ascending: true })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: {
      rows: ((data ?? []) as AppointmentJoinRow[]).map(
        toAppointmentListRow
      ),
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function getAppointmentStats(): Promise<
  DataResult<AppointmentStats>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("status, scheduled_at");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const today = manilaDate(new Date().toISOString());
  const stats = emptyStats();

  for (const appointment of (data ?? []) as Array<
    Pick<Appointment, "status" | "scheduled_at">
  >) {
    stats.total += 1;

    switch (appointment.status) {
      case "scheduled":
        stats.scheduled += 1;
        break;
      case "confirmed":
        stats.confirmed += 1;
        break;
      case "waiting":
        stats.waiting += 1;
        break;
      case "in_consultation":
        stats.inConsultation += 1;
        break;
      case "completed":
        stats.completed += 1;
        break;
      case "cancelled":
        stats.cancelled += 1;
        break;
      case "no_show":
        stats.noShow += 1;
        break;
    }

    if (manilaDate(appointment.scheduled_at) === today) {
      stats.today += 1;
    }
  }

  return { data: stats, error: null };
}

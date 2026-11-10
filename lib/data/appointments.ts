import type {
  AppointmentListRow,
  AppointmentStats,
} from "@/types/hospital";
import { PREVIEW_NOW, appointmentListRows } from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import {
  emptyPage,
  manilaDate,
  matchesQuery,
  pageSlice,
} from "./query";
import type { DataResult, PagedResult } from "./result";

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

export async function listAppointments(
  params: {
    q?: string;
    status?: string;
    date?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AppointmentListRow>> {
  // TODO(supabase): replace with supabase.from("appointments").select("*")
  if (!isPreviewMode) {
    return emptyPage<AppointmentListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = appointmentListRows.filter((appointment) => {
    if (params.status && appointment.status !== params.status) {
      return false;
    }

    if (params.date && manilaDate(appointment.scheduled_at) !== params.date) {
      return false;
    }

    return matchesQuery(params.q, [
      appointment.appointment_number,
      appointment.patient_name,
      appointment.patient_mrn,
      appointment.department_name,
      appointment.physician_name,
      appointment.appointment_type,
      appointment.reason_for_visit,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getAppointmentStats(): Promise<
  DataResult<AppointmentStats>
> {
  // TODO(supabase): replace with supabase.from("appointments").select("status")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const today = manilaDate(PREVIEW_NOW);
  const stats = emptyStats();

  for (const appointment of appointmentListRows) {
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

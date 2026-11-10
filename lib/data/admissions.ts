import type {
  AdmissionListRow,
  AdmissionStats,
  BedBoardRow,
} from "@/types/hospital";
import {
  PREVIEW_NOW,
  admissionListRows,
  bedBoardRows,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import {
  emptyPage,
  manilaDate,
  matchesQuery,
  pageSlice,
  sortByDateDesc,
} from "./query";
import type { DataResult, PagedResult } from "./result";

function emptyStats(): AdmissionStats {
  return {
    total: 0,
    admitted: 0,
    transferred: 0,
    discharged: 0,
    cancelled: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    maintenanceBeds: 0,
    reservedBeds: 0,
    dischargesToday: 0,
  };
}

export async function listAdmissions(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AdmissionListRow>> {
  // TODO(supabase): replace with supabase.from("admissions").select("*")
  if (!isPreviewMode) {
    return emptyPage<AdmissionListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = admissionListRows.filter((admission) => {
    if (params.status && admission.status !== params.status) {
      return false;
    }

    return matchesQuery(params.q, [
      admission.admission_number,
      admission.patient_name,
      admission.patient_mrn,
      admission.department_name,
      admission.attending_physician_name,
      admission.admission_type,
      admission.room_number,
      admission.bed_number,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listDischarges(
  params: {
    q?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AdmissionListRow>> {
  // TODO(supabase): replace with supabase.from("admissions").select("*").eq("status", "discharged")
  if (!isPreviewMode) {
    return emptyPage<AdmissionListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = sortByDateDesc(
    admissionListRows.filter((admission) => {
      if (admission.status !== "discharged") {
        return false;
      }

      return matchesQuery(params.q, [
        admission.admission_number,
        admission.patient_name,
        admission.patient_mrn,
        admission.department_name,
        admission.attending_physician_name,
      ]);
    }),
    (admission) => admission.discharge_date ?? admission.admission_date
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getBedBoard(): Promise<DataResult<BedBoardRow[]>> {
  // TODO(supabase): replace with supabase.from("v_bed_availability").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  const rows = [...bedBoardRows].sort((a, b) => {
    const left = `${a.department_name}:${a.room_number}:${a.bed_number}`;
    const right = `${b.department_name}:${b.room_number}:${b.bed_number}`;

    return left.localeCompare(right);
  });

  return { data: rows, error: null };
}

export async function getAdmissionStats(): Promise<DataResult<AdmissionStats>> {
  // TODO(supabase): replace with supabase.from("admissions").select("status")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const stats = emptyStats();
  const today = manilaDate(PREVIEW_NOW);

  for (const admission of admissionListRows) {
    stats.total += 1;

    switch (admission.status) {
      case "admitted":
        stats.admitted += 1;
        break;
      case "transferred":
        stats.transferred += 1;
        break;
      case "discharged":
        stats.discharged += 1;
        break;
      case "cancelled":
        stats.cancelled += 1;
        break;
    }

    if (admission.discharge_date && manilaDate(admission.discharge_date) === today) {
      stats.dischargesToday += 1;
    }
  }

  for (const bed of bedBoardRows) {
    switch (bed.status) {
      case "available":
        stats.availableBeds += 1;
        break;
      case "occupied":
        stats.occupiedBeds += 1;
        break;
      case "maintenance":
        stats.maintenanceBeds += 1;
        break;
      case "reserved":
        stats.reservedBeds += 1;
        break;
    }
  }

  return { data: stats, error: null };
}

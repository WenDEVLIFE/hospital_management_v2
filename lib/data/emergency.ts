import type {
  EmergencyStats,
  EmergencyVisitDetail,
  EmergencyVisitListRow,
} from "@/types/hospital";
import {
  emergencyStats,
  emergencyVisitDetailById,
  emergencyVisitListRows,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested emergency visit could not be found.",
} as const;

function emptyStats(): EmergencyStats {
  return {
    total: 0,
    waiting: 0,
    triage: 0,
    inTreatment: 0,
    observation: 0,
    critical: 0,
    admitted: 0,
    transferred: 0,
    discharged: 0,
    averageWaitMinutes: 0,
  };
}

export async function listEmergencyVisits(
  params: {
    q?: string;
    status?: string;
    triage?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<EmergencyVisitListRow>> {
  // TODO(supabase): replace with supabase.from("emergency_visits").select("*")
  if (!isPreviewMode) {
    return emptyPage<EmergencyVisitListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = emergencyVisitListRows.filter((visit) => {
    if (params.status && visit.status !== params.status) {
      return false;
    }

    if (params.triage && visit.triage_level !== params.triage) {
      return false;
    }

    return matchesQuery(params.q, [
      visit.visit_number,
      visit.patient_name,
      visit.patient_mrn,
      visit.chief_complaint,
      visit.attending_physician_name,
      visit.triage_nurse_name,
      visit.treatment_area,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getEmergencyVisitDetails(): Promise<
  DataResult<Record<string, EmergencyVisitDetail>>
> {
  // TODO(supabase): replace with a single list query joined to encounter details
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(emergencyVisitDetailById),
    error: null,
  };
}

export async function getEmergencyVisit(
  id: string
): Promise<DataResult<EmergencyVisitDetail>> {
  // TODO(supabase): replace with supabase.from("emergency_visits").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: NOT_FOUND };
  }

  await Promise.resolve();

  const detail = emergencyVisitDetailById.get(id);

  if (!detail) {
    return { data: null, error: NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function getEmergencyStats(): Promise<
  DataResult<EmergencyStats>
> {
  // TODO(supabase): replace with supabase.from("emergency_visits").select("status, triage_level")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  return { data: emergencyStats, error: null };
}

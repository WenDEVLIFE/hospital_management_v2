import type {
  EncounterDetail,
  EncounterListRow,
  EncounterStats,
} from "@/types/hospital";
import {
  PREVIEW_NOW,
  clinicalNotes,
  diagnoses,
  encounterById,
  encounterListRows,
  encounters,
  patientById,
  vitalSigns,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import {
  emptyPage,
  manilaDate,
  matchesQuery,
  pageSlice,
} from "./query";
import type { DataResult, PagedResult } from "./result";

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested encounter could not be found.",
} as const;

function emptyStats(): EncounterStats {
  return {
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
  };
}

export async function listEncounters(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<EncounterListRow>> {
  // TODO(supabase): replace with supabase.from("encounters").select("*")
  if (!isPreviewMode) {
    return emptyPage<EncounterListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = encounterListRows.filter((encounter) => {
    if (params.status && encounter.clinical_status !== params.status) {
      return false;
    }

    return matchesQuery(params.q, [
      encounter.encounter_number,
      encounter.patient_name,
      encounter.patient_mrn,
      encounter.department_name,
      encounter.physician_name,
      encounter.encounter_type,
      encounter.chief_complaint,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getEncounter(
  id: string
): Promise<DataResult<EncounterDetail>> {
  // TODO(supabase): replace with supabase.from("encounters").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: NOT_FOUND };
  }

  await Promise.resolve();

  const encounter = encounterById.get(id);

  if (!encounter) {
    return { data: null, error: NOT_FOUND };
  }

  const patient = patientById.get(encounter.patient_id);

  if (!patient) {
    return { data: null, error: NOT_FOUND };
  }

  return {
    data: {
      encounter,
      patient,
      vitals: vitalSigns.filter((vital) => vital.encounter_id === id),
      diagnoses: diagnoses.filter((diagnosis) => diagnosis.encounter_id === id),
      clinical_notes: clinicalNotes.filter((note) => note.encounter_id === id),
    },
    error: null,
  };
}

export async function getEncounterStats(): Promise<
  DataResult<EncounterStats>
> {
  // TODO(supabase): replace with supabase.from("encounters").select("clinical_status")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const stats = emptyStats();
  const today = manilaDate(PREVIEW_NOW);

  for (const encounter of encounters) {
    stats.total += 1;

    switch (encounter.clinical_status) {
      case "open":
        stats.open += 1;
        break;
      case "in_progress":
        stats.inProgress += 1;
        break;
      case "completed":
        stats.completed += 1;
        break;
      case "cancelled":
        stats.cancelled += 1;
        break;
    }

    if (manilaDate(encounter.started_at) === today) {
      stats.today += 1;
    }
  }

  return { data: stats, error: null };
}

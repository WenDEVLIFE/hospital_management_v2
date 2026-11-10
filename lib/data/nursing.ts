import type {
  NursingAssignmentRow,
  NursingStats,
} from "@/types/hospital";
import { PREVIEW_NOW, nursingAssignmentRows } from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { manilaDate } from "./query";
import type { DataResult } from "./result";

function emptyStats(): NursingStats {
  return {
    assignedPatients: 0,
    pendingAssessments: 0,
    vitalsToday: 0,
    activeTasks: 0,
  };
}

export async function listNursingAssignments(): Promise<
  DataResult<NursingAssignmentRow[]>
> {
  // TODO(supabase): replace with supabase.from("patient_care_assignments").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: nursingAssignmentRows, error: null };
}

export async function getNursingStats(): Promise<DataResult<NursingStats>> {
  // TODO(supabase): replace with supabase.from("nursing_assessments").select("*")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const stats = emptyStats();
  const today = manilaDate(PREVIEW_NOW);

  stats.assignedPatients = nursingAssignmentRows.length;

  for (const assignment of nursingAssignmentRows) {
    stats.pendingAssessments += assignment.pending_assessments;
    stats.activeTasks += assignment.active_tasks;

    if (
      assignment.latest_vitals &&
      manilaDate(assignment.latest_vitals.recorded_at) === today
    ) {
      stats.vitalsToday += 1;
    }
  }

  return { data: stats, error: null };
}

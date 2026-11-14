import { cache } from "react";

import type {
  NursingAssignmentRow,
  NursingStats,
  VitalSigns,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate } from "./query";
import { toDataError, type DataResult } from "./result";

const ADMISSION_COLUMNS =
  "id, admission_number, patient_id, department_id, admission_date, patients(first_name, middle_name, last_name, suffix, medical_record_number), departments(name), admission_bed_assignments(released_at, beds(bed_number, rooms(room_number)))";

type Relation<T> = T | T[] | null;

type AdmissionJoinRow = {
  id: string;
  admission_number: string;
  patient_id: string;
  department_id: string;
  admission_date: string;
  patients: Relation<{
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    medical_record_number: string;
  }>;
  departments: Relation<{ name: string }>;
  admission_bed_assignments: Array<{
    released_at: string | null;
    beds: Relation<{
      bed_number: string;
      rooms: Relation<{ room_number: string }>;
    }>;
  }> | null;
};

type CareAssignmentJoinRow = {
  patient_id: string;
  assigned_at: string;
  staff_profiles: Relation<{
    profiles: Relation<{ full_name: string }>;
  }>;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function emptyStats(): NursingStats {
  return {
    assignedPatients: 0,
    pendingAssessments: 0,
    vitalsToday: 0,
    activeTasks: 0,
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
 * Loads the active inpatient assignments once per request. React cache keeps
 * listNursingAssignments() and getNursingStats() from repeating the same
 * queries when a page calls both.
 */
const loadNursingAssignments = cache(
  async (): Promise<DataResult<NursingAssignmentRow[]>> => {
    const supabase = await getSupabaseServerClient();

    const { data: admissionRows, error: admissionError } = await supabase
      .from("admissions")
      .select(ADMISSION_COLUMNS)
      .eq("status", "admitted")
      .order("admission_date", { ascending: false });

    if (admissionError) {
      return { data: null, error: toDataError(admissionError) };
    }

    const admissions = (admissionRows ?? []) as AdmissionJoinRow[];
    const patientIds = Array.from(
      new Set(admissions.map((admission) => admission.patient_id))
    );

    if (patientIds.length === 0) {
      return { data: [], error: null };
    }

    const [vitalsResult, assessmentsResult, careResult] = await Promise.all([
      supabase
        .from("vital_signs")
        .select("*")
        .in("patient_id", patientIds)
        .order("recorded_at", { ascending: false }),
      supabase
        .from("nursing_assessments")
        .select("patient_id, assessed_at")
        .in("patient_id", patientIds),
      supabase
        .from("patient_care_assignments")
        .select(
          "patient_id, assigned_at, staff_profiles!inner(profiles!staff_profiles_user_id_fkey(full_name))"
        )
        .is("ended_at", null)
        .ilike("assignment_type", "%nurse%")
        .in("patient_id", patientIds)
        .order("assigned_at", { ascending: false }),
    ]);

    // Latest vitals: rows are ordered newest first, so the first row per
    // patient wins. A dedicated latest-per-patient view would be cheaper at
    // production volume.
    const latestVitalsByPatient = new Map<string, VitalSigns>();

    if (!vitalsResult.error) {
      for (const vital of (vitalsResult.data ?? []) as VitalSigns[]) {
        if (!latestVitalsByPatient.has(vital.patient_id)) {
          latestVitalsByPatient.set(vital.patient_id, vital);
        }
      }
    }

    const today = manilaDate(new Date().toISOString());
    const assessedToday = new Set<string>();

    if (!assessmentsResult.error) {
      for (const assessment of (assessmentsResult.data ?? []) as Array<{
        patient_id: string;
        assessed_at: string;
      }>) {
        if (manilaDate(assessment.assessed_at) === today) {
          assessedToday.add(assessment.patient_id);
        }
      }
    }

    const nurseByPatient = new Map<string, string>();

    if (!careResult.error) {
      for (const care of (careResult.data ?? []) as CareAssignmentJoinRow[]) {
        if (nurseByPatient.has(care.patient_id)) {
          continue;
        }

        const staff = firstRelation(care.staff_profiles);
        const profile = staff ? firstRelation(staff.profiles) : null;

        if (profile?.full_name) {
          nurseByPatient.set(care.patient_id, profile.full_name);
        }
      }
    }

    const rows: NursingAssignmentRow[] = admissions.map((admission) => {
      const patient = firstRelation(admission.patients);
      const department = firstRelation(admission.departments);
      const assignments = admission.admission_bed_assignments ?? [];
      const activeAssignment =
        assignments.find((assignment) => assignment.released_at === null) ??
        assignments[0] ??
        null;
      const bed = activeAssignment?.beds
        ? firstRelation(activeAssignment.beds)
        : null;
      const room = bed ? firstRelation(bed.rooms) : null;

      return {
        patient_id: admission.patient_id,
        patient_name: patient ? fullName(patient) : "Unknown patient",
        patient_mrn: patient?.medical_record_number ?? "\u2014",
        admission_id: admission.id,
        admission_number: admission.admission_number,
        department_name: department?.name ?? "Unknown department",
        room_number: room?.room_number ?? null,
        bed_number: bed?.bed_number ?? null,
        assigned_staff_name: nurseByPatient.get(admission.patient_id) ?? null,
        latest_vitals:
          latestVitalsByPatient.get(admission.patient_id) ?? null,
        // No nursing task table exists yet. The schema records completed
        // assessments and notes, so "pending" means no assessment today.
        pending_assessments: assessedToday.has(admission.patient_id) ? 0 : 1,
        active_tasks: 0,
      };
    });

    return { data: rows, error: null };
  }
);

export async function listNursingAssignments(): Promise<
  DataResult<NursingAssignmentRow[]>
> {
  return loadNursingAssignments();
}

export async function getNursingStats(): Promise<DataResult<NursingStats>> {
  const assignments = await loadNursingAssignments();

  if (assignments.error) {
    return { data: null, error: assignments.error };
  }

  const rows = assignments.data ?? [];
  const stats = emptyStats();
  const today = manilaDate(new Date().toISOString());

  stats.assignedPatients = rows.length;

  for (const row of rows) {
    stats.pendingAssessments += row.pending_assessments;
    stats.activeTasks += row.active_tasks;

    if (
      row.latest_vitals &&
      manilaDate(row.latest_vitals.recorded_at) === today
    ) {
      stats.vitalsToday += 1;
    }
  }

  return { data: stats, error: null };
}

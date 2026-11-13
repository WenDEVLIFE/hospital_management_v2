import type {
  ClinicalNote,
  Diagnosis,
  Encounter,
  EncounterDetail,
  EncounterListRow,
  EncounterStats,
  Patient,
  VitalSigns,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate, normalizePagination, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const ENCOUNTER_LIST_COLUMNS =
  "*, patients(first_name, middle_name, last_name, suffix, medical_record_number), departments(name), physicians(staff_profiles(first_name, last_name))";

const ENCOUNTER_DETAIL_COLUMNS =
  "*, patients(*), vital_signs(*), diagnoses(*), clinical_notes(*)";

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested encounter could not be found.",
} as const;

type Relation<T> = T | T[] | null;

type EncounterListJoinRow = Encounter & {
  patients: Relation<{
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    medical_record_number: string;
  }>;
  departments: Relation<{ name: string }>;
  physicians: Relation<{
    staff_profiles: Relation<{
      first_name: string;
      last_name: string;
    }>;
  }>;
};

type EncounterDetailJoinRow = Encounter & {
  patients: Relation<Patient>;
  vital_signs: VitalSigns[] | null;
  diagnoses: Diagnosis[] | null;
  clinical_notes: ClinicalNote[] | null;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

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

function toEncounter(row: Encounter): Encounter {
  return {
    id: row.id,
    encounter_number: row.encounter_number,
    patient_id: row.patient_id,
    appointment_id: row.appointment_id,
    admission_id: row.admission_id,
    physician_id: row.physician_id,
    department_id: row.department_id,
    encounter_type: row.encounter_type,
    chief_complaint: row.chief_complaint,
    clinical_status: row.clinical_status,
    started_at: row.started_at,
    completed_at: row.completed_at,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toEncounterListRow(row: EncounterListJoinRow): EncounterListRow {
  const patient = firstRelation(row.patients);
  const department = firstRelation(row.departments);
  const physician = firstRelation(row.physicians);
  const staff = physician ? firstRelation(physician.staff_profiles) : null;

  return {
    id: row.id,
    encounter_number: row.encounter_number,
    patient_id: row.patient_id,
    patient_name: patient ? fullName(patient) : "Unknown patient",
    patient_mrn: patient?.medical_record_number ?? "\u2014",
    department_id: row.department_id,
    department_name: department?.name ?? "Unknown department",
    physician_id: row.physician_id,
    physician_name: staff ? fullName(staff) : null,
    encounter_type: row.encounter_type,
    chief_complaint: row.chief_complaint,
    clinical_status: row.clinical_status,
    started_at: row.started_at,
    completed_at: row.completed_at,
  };
}

function toEncounterDetail(
  row: EncounterDetailJoinRow
): EncounterDetail | null {
  const patient = firstRelation(row.patients);

  if (!patient) {
    return null;
  }

  return {
    encounter: toEncounter(row),
    patient,
    vitals: [...(row.vital_signs ?? [])].sort((left, right) =>
      left.recorded_at.localeCompare(right.recorded_at)
    ),
    diagnoses: row.diagnoses ?? [],
    clinical_notes: [...(row.clinical_notes ?? [])].sort((left, right) =>
      left.created_at.localeCompare(right.created_at)
    ),
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
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("encounters")
    .select(ENCOUNTER_LIST_COLUMNS, { count: "exact" });

  if (params.status) {
    query = query.eq("clinical_status", params.status);
  }

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      [
        `encounter_number.ilike.${term}`,
        `encounter_type.ilike.${term}`,
        `chief_complaint.ilike.${term}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query
    .order("started_at", { ascending: false })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: {
      rows: ((data ?? []) as EncounterListJoinRow[]).map(toEncounterListRow),
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function getEncounter(
  id: string
): Promise<DataResult<EncounterDetail>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("encounters")
    .select(ENCOUNTER_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  if (!data) {
    return { data: null, error: NOT_FOUND };
  }

  const detail = toEncounterDetail(data as EncounterDetailJoinRow);

  if (!detail) {
    return { data: null, error: NOT_FOUND };
  }

  return { data: detail, error: null };
}

/**
 * Bulk detail loader used by the medical records page. Avoids one query per
 * encounter row while keeping the same EncounterDetail shape.
 */
export async function getEncounterDetails(
  ids: string[]
): Promise<DataResult<Record<string, EncounterDetail>>> {
  if (ids.length === 0) {
    return { data: {}, error: null };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("encounters")
    .select(ENCOUNTER_DETAIL_COLUMNS)
    .in("id", ids);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const details: Record<string, EncounterDetail> = {};

  for (const row of (data ?? []) as EncounterDetailJoinRow[]) {
    const detail = toEncounterDetail(row);

    if (detail) {
      details[detail.encounter.id] = detail;
    }
  }

  return { data: details, error: null };
}

export async function getEncounterStats(): Promise<
  DataResult<EncounterStats>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("encounters")
    .select("clinical_status, started_at");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const stats = emptyStats();
  const today = manilaDate(new Date().toISOString());

  for (const encounter of (data ?? []) as Array<
    Pick<Encounter, "clinical_status" | "started_at">
  >) {
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

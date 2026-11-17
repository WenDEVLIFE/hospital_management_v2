import type {
  ClinicalNote,
  Diagnosis,
  EmergencyNoteSummary,
  EmergencyOrderSummary,
  EmergencyStats,
  EmergencyVisit,
  EmergencyVisitDetail,
  EmergencyVisitListRow,
  Encounter,
  Patient,
  VitalSigns,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { pageSlice, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const VISIT_COLUMNS =
  "*, patients(id, medical_record_number, first_name, middle_name, last_name, suffix, date_of_birth, sex, civil_status, nationality, contact_number, email, address_line, barangay, city, province, postal_code, registration_date, registration_status, created_by, created_at, updated_at), physicians!emergency_visits_attending_physician_id_fkey(id, profiles(full_name)), staff_profiles!emergency_visits_triage_nurse_id_fkey(id, profiles(full_name))";

type Relation<T> = T | T[] | null;

type VisitJoinRow = EmergencyVisit & {
  patients: Relation<Patient>;
  physicians: Relation<{ id: string; profiles: Relation<{ full_name: string }> }>;
  staff_profiles: Relation<{
    id: string;
    profiles: Relation<{ full_name: string }>;
  }>;
};

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested emergency visit could not be found.",
} as const;

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

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

function minutesSince(isoDate: string): number {
  const started = new Date(isoDate).getTime();

  if (Number.isNaN(started)) {
    return 0;
  }

  return Math.max(Math.round((Date.now() - started) / 60000), 0);
}

function fullName(row: {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
}): string {
  return [row.first_name, row.middle_name, row.last_name, row.suffix]
    .filter(Boolean)
    .join(" ");
}

async function loadVisits(): Promise<DataResult<VisitJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("emergency_visits")
    .select(VISIT_COLUMNS)
    .order("arrival_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as VisitJoinRow[], error: null };
}

async function loadLatestVitals(
  patientIds: string[]
): Promise<Map<string, VitalSigns>> {
  const latest = new Map<string, VitalSigns>();

  if (patientIds.length === 0) {
    return latest;
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("vital_signs")
    .select("*")
    .in("patient_id", patientIds)
    .order("recorded_at", { ascending: false });

  if (error) {
    return latest;
  }

  for (const vital of (data ?? []) as VitalSigns[]) {
    if (!latest.has(vital.patient_id)) {
      latest.set(vital.patient_id, vital);
    }
  }

  return latest;
}

function toListRow(
  visit: VisitJoinRow,
  latestVitals: Map<string, VitalSigns>
): EmergencyVisitListRow | null {
  const patient = firstRelation(visit.patients);

  if (!patient) {
    return null;
  }

  const physician = firstRelation(visit.physicians);
  const physicianProfile = physician ? firstRelation(physician.profiles) : null;
  const nurse = firstRelation(visit.staff_profiles);
  const nurseProfile = nurse ? firstRelation(nurse.profiles) : null;

  return {
    id: visit.id,
    visit_number: visit.visit_number,
    encounter_id: visit.encounter_id,
    patient_id: visit.patient_id,
    patient_name: fullName(patient),
    patient_mrn: patient.medical_record_number,
    arrival_at: visit.arrival_at,
    arrival_mode: visit.arrival_mode,
    triage_level: visit.triage_level,
    chief_complaint: visit.chief_complaint,
    status: visit.status,
    attending_physician_id: visit.attending_physician_id,
    attending_physician_name: physicianProfile?.full_name ?? null,
    triage_nurse_name: nurseProfile?.full_name ?? null,
    treatment_area: visit.treatment_area,
    wait_minutes: minutesSince(visit.arrival_at),
    latest_vitals: latestVitals.get(visit.patient_id) ?? null,
    disposition: visit.disposition,
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
  const visitResult = await loadVisits();

  if (visitResult.error) {
    return { data: null, error: visitResult.error };
  }

  const visits = visitResult.data ?? [];
  const latestVitals = await loadLatestVitals(
    Array.from(new Set(visits.map((visit) => visit.patient_id)))
  );

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = visits
    .map((visit) => toListRow(visit, latestVitals))
    .filter((row): row is EmergencyVisitListRow => row !== null)
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (params.triage && row.triage_level !== params.triage) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [row.visit_number, row.patient_name, row.patient_mrn, row.chief_complaint]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function getEmergencyVisitDetails(): Promise<
  DataResult<Record<string, EmergencyVisitDetail>>
> {
  const visitResult = await loadVisits();

  if (visitResult.error) {
    return { data: null, error: visitResult.error };
  }

  const visits = visitResult.data ?? [];

  if (visits.length === 0) {
    return { data: {}, error: null };
  }

  const supabase = await getSupabaseServerClient();
  const encounterIds = visits.map((visit) => visit.encounter_id);
  const patientIds = Array.from(
    new Set(visits.map((visit) => visit.patient_id))
  );

  const [encountersResult, vitalsResult, notesResult, diagnosesResult] =
    await Promise.all([
      supabase.from("encounters").select("*").in("id", encounterIds),
      supabase
        .from("vital_signs")
        .select("*")
        .in("patient_id", patientIds)
        .order("recorded_at", { ascending: false }),
      supabase
        .from("clinical_notes")
        .select("*")
        .in("encounter_id", encounterIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("diagnoses")
        .select("*")
        .in("encounter_id", encounterIds)
        .order("recorded_at", { ascending: false }),
    ]);

  const [labOrdersResult, radiologyOrdersResult, authorsResult] =
    await Promise.all([
      supabase
        .from("laboratory_orders")
        .select("id, order_number, status, ordered_at, encounter_id, ordered_by")
        .in("encounter_id", encounterIds),
      supabase
        .from("radiology_orders")
        .select(
          "id, order_number, status, ordered_at, encounter_id, ordered_by, examination_type"
        )
        .in("encounter_id", encounterIds),
      supabase.from("profiles").select("id, full_name"),
    ]);

  const encountersById = new Map<string, Encounter>(
    ((encountersResult.data ?? []) as Encounter[]).map((encounter) => [
      encounter.id,
      encounter,
    ])
  );

  const vitalsByEncounter = new Map<string, VitalSigns[]>();

  for (const vital of (vitalsResult.data ?? []) as VitalSigns[]) {
    const list = vitalsByEncounter.get(vital.encounter_id) ?? [];
    list.push(vital);
    vitalsByEncounter.set(vital.encounter_id, list);
  }

  const notesByEncounter = new Map<string, ClinicalNote[]>();

  for (const note of (notesResult.data ?? []) as ClinicalNote[]) {
    const list = notesByEncounter.get(note.encounter_id) ?? [];
    list.push(note);
    notesByEncounter.set(note.encounter_id, list);
  }

  const diagnosesByEncounter = new Map<string, Diagnosis[]>();

  for (const diagnosis of (diagnosesResult.data ?? []) as Diagnosis[]) {
    const list = diagnosesByEncounter.get(diagnosis.encounter_id) ?? [];
    list.push(diagnosis);
    diagnosesByEncounter.set(diagnosis.encounter_id, list);
  }

  const staffNames = new Map<string, string>(
    ((authorsResult.data ?? []) as Array<{ id: string; full_name: string }>).map(
      (profile) => [profile.id, profile.full_name]
    )
  );

  const ordersByEncounter = new Map<string, EmergencyOrderSummary[]>();

  for (const order of (labOrdersResult.data ?? []) as Array<{
    id: string;
    order_number: string;
    status: string;
    ordered_at: string;
    encounter_id: string;
    ordered_by: string;
  }>) {
    const list = ordersByEncounter.get(order.encounter_id) ?? [];
    list.push({
      id: order.id,
      kind: "laboratory",
      label: order.order_number,
      status: order.status,
      ordered_at: order.ordered_at,
      ordered_by_name: staffNames.get(order.ordered_by) ?? "Unknown staff",
    });
    ordersByEncounter.set(order.encounter_id, list);
  }

  for (const order of (radiologyOrdersResult.data ?? []) as Array<{
    id: string;
    order_number: string;
    status: string;
    ordered_at: string;
    encounter_id: string;
    ordered_by: string;
    examination_type: string;
  }>) {
    const list = ordersByEncounter.get(order.encounter_id) ?? [];
    list.push({
      id: order.id,
      kind: "radiology",
      label: `${order.examination_type} · ${order.order_number}`,
      status: order.status,
      ordered_at: order.ordered_at,
      ordered_by_name: staffNames.get(order.ordered_by) ?? "Unknown staff",
    });
    ordersByEncounter.set(order.encounter_id, list);
  }

  const details: Record<string, EmergencyVisitDetail> = {};

  for (const visit of visits) {
    const patient = firstRelation(visit.patients);
    const encounter = encountersById.get(visit.encounter_id);

    if (!patient || !encounter) {
      continue;
    }

    const physician = firstRelation(visit.physicians);
    const physicianProfile = physician ? firstRelation(physician.profiles) : null;
    const nurse = firstRelation(visit.staff_profiles);
    const nurseProfile = nurse ? firstRelation(nurse.profiles) : null;

    const notes: EmergencyNoteSummary[] = (
      notesByEncounter.get(visit.encounter_id) ?? []
    ).map((note) => ({
      ...note,
      author_name: staffNames.get(note.authored_by) ?? "Unknown staff",
      author_role: "Clinical staff",
    }));

    details[visit.id] = {
      visit: {
        id: visit.id,
        visit_number: visit.visit_number,
        encounter_id: visit.encounter_id,
        patient_id: visit.patient_id,
        arrival_at: visit.arrival_at,
        arrival_mode: visit.arrival_mode,
        triage_level: visit.triage_level,
        triage_note: visit.triage_note,
        chief_complaint: visit.chief_complaint,
        status: visit.status,
        attending_physician_id: visit.attending_physician_id,
        triage_nurse_id: visit.triage_nurse_id,
        treatment_area: visit.treatment_area,
        disposition: visit.disposition,
        disposition_at: visit.disposition_at,
        created_by: visit.created_by,
        created_at: visit.created_at,
        updated_at: visit.updated_at,
      },
      patient,
      encounter,
      attending_physician_name: physicianProfile?.full_name ?? null,
      triage_nurse_name: nurseProfile?.full_name ?? null,
      vitals: vitalsByEncounter.get(visit.encounter_id) ?? [],
      notes,
      diagnoses: diagnosesByEncounter.get(visit.encounter_id) ?? [],
      orders: ordersByEncounter.get(visit.encounter_id) ?? [],
      procedures: [],
      monitoring: [],
    };
  }

  return { data: details, error: null };
}

export async function getEmergencyVisit(
  id: string
): Promise<DataResult<EmergencyVisitDetail>> {
  const detailsResult = await getEmergencyVisitDetails();

  if (detailsResult.error) {
    return { data: null, error: detailsResult.error };
  }

  const detail = detailsResult.data?.[id];

  if (!detail) {
    return { data: null, error: NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function getEmergencyStats(): Promise<
  DataResult<EmergencyStats>
> {
  const visitResult = await loadVisits();

  if (visitResult.error) {
    return { data: null, error: visitResult.error };
  }

  const stats = emptyStats();
  const visits = visitResult.data ?? [];
  let waitTotal = 0;
  let waitCount = 0;

  for (const visit of visits) {
    stats.total += 1;

    switch (visit.status) {
      case "waiting":
        stats.waiting += 1;
        waitTotal += minutesSince(visit.arrival_at);
        waitCount += 1;
        break;
      case "triage":
        stats.triage += 1;
        waitTotal += minutesSince(visit.arrival_at);
        waitCount += 1;
        break;
      case "in_treatment":
        stats.inTreatment += 1;
        break;
      case "observation":
        stats.observation += 1;
        break;
      case "admitted":
        stats.admitted += 1;
        break;
      case "transferred":
        stats.transferred += 1;
        break;
      case "discharged":
        stats.discharged += 1;
        break;
    }

    if (
      visit.triage_level === "critical" &&
      visit.status !== "discharged" &&
      visit.status !== "transferred"
    ) {
      stats.critical += 1;
    }
  }

  stats.averageWaitMinutes =
    waitCount > 0 ? Math.round(waitTotal / waitCount) : 0;

  return { data: stats, error: null };
}

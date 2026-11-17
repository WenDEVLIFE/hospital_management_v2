import type {
  OperatingRoom,
  OperatingRoomBoardRow,
  Patient,
  SurgeryCase,
  SurgeryDetail,
  SurgeryListRow,
  SurgeryStats,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate, pageSlice, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const CASE_COLUMNS =
  "*, patients(id, medical_record_number, first_name, middle_name, last_name, suffix, date_of_birth, sex, civil_status, nationality, contact_number, email, address_line, barangay, city, province, postal_code, registration_date, registration_status, created_by, created_at, updated_at), operating_rooms(id, room_name, status, department_id, notes), physicians!surgery_cases_surgeon_id_fkey(id, profiles(full_name)), anesthesiologist:physicians!surgery_cases_anesthesiologist_id_fkey(id, profiles(full_name))";

const ROOM_COLUMNS = "id, room_name, status, department_id, notes";

type Relation<T> = T | T[] | null;

type CaseJoinRow = SurgeryCase & {
  patients: Relation<Patient>;
  operating_rooms: Relation<OperatingRoom>;
  physicians: Relation<{ id: string; profiles: Relation<{ full_name: string }> }>;
  anesthesiologist: Relation<{
    id: string;
    profiles: Relation<{ full_name: string }>;
  }>;
};

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested surgical case could not be found.",
} as const;

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function emptyStats(): SurgeryStats {
  return {
    total: 0,
    requested: 0,
    scheduled: 0,
    preOp: 0,
    inProgress: 0,
    recovery: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
    orUtilization: 0,
  };
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

function surgeonName(row: CaseJoinRow): string | null {
  const physician = firstRelation(row.physicians);
  const profile = physician ? firstRelation(physician.profiles) : null;

  return profile?.full_name ?? null;
}

function anesthesiologistName(row: CaseJoinRow): string | null {
  const physician = firstRelation(row.anesthesiologist);
  const profile = physician ? firstRelation(physician.profiles) : null;

  return profile?.full_name ?? null;
}

function toListRow(row: CaseJoinRow): SurgeryListRow | null {
  const patient = firstRelation(row.patients);
  const room = firstRelation(row.operating_rooms);

  if (!patient || !room) {
    return null;
  }

  const surgeon = surgeonName(row) ?? "Unassigned surgeon";
  const anesthesiologist = anesthesiologistName(row);
  const team = [surgeon, anesthesiologist].filter(Boolean).join(" · ");

  return {
    id: row.id,
    case_number: row.case_number,
    patient_id: row.patient_id,
    patient_name: fullName(patient),
    patient_mrn: patient.medical_record_number,
    procedure_name: row.procedure_name,
    procedure_code: row.procedure_code,
    room_id: row.room_id,
    room_name: room.room_name,
    scheduled_start: row.scheduled_start,
    scheduled_end: row.scheduled_end,
    status: row.status,
    priority: row.priority,
    surgeon_id: row.surgeon_id,
    surgeon_name: surgeon,
    anesthesiologist_name: anesthesiologist,
    team_summary: team,
    pre_op_ready:
      row.pre_op_completed && row.consent_signed && row.safety_checklist_completed,
    recovery_status: row.status === "recovery" ? "In recovery" : null,
  };
}

async function loadCases(): Promise<DataResult<CaseJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("surgery_cases")
    .select(CASE_COLUMNS)
    .order("scheduled_start", { ascending: true });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as CaseJoinRow[], error: null };
}

export async function listSurgeryCases(
  params: {
    q?: string;
    status?: string;
    priority?: string;
    room?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<SurgeryListRow>> {
  const caseResult = await loadCases();

  if (caseResult.error) {
    return { data: null, error: caseResult.error };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = (caseResult.data ?? [])
    .map(toListRow)
    .filter((row): row is SurgeryListRow => row !== null)
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (params.priority && row.priority !== params.priority) {
        return false;
      }

      if (params.room && row.room_name !== params.room) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        row.case_number,
        row.patient_name,
        row.patient_mrn,
        row.procedure_name,
        row.procedure_code,
        row.room_name,
        row.surgeon_name,
        row.anesthesiologist_name,
        row.team_summary,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function getSurgeryDetails(): Promise<
  DataResult<Record<string, SurgeryDetail>>
> {
  const caseResult = await loadCases();

  if (caseResult.error) {
    return { data: null, error: caseResult.error };
  }

  const details: Record<string, SurgeryDetail> = {};

  for (const row of caseResult.data ?? []) {
    const patient = firstRelation(row.patients);
    const room = firstRelation(row.operating_rooms);

    if (!patient || !room) {
      continue;
    }

    details[row.id] = {
      surgery: {
        id: row.id,
        case_number: row.case_number,
        patient_id: row.patient_id,
        procedure_code: row.procedure_code,
        procedure_name: row.procedure_name,
        room_id: row.room_id,
        scheduled_start: row.scheduled_start,
        scheduled_end: row.scheduled_end,
        actual_start: row.actual_start,
        actual_end: row.actual_end,
        status: row.status,
        priority: row.priority,
        surgeon_id: row.surgeon_id,
        anesthesiologist_id: row.anesthesiologist_id,
        scrub_nurse_id: row.scrub_nurse_id,
        circulating_nurse_id: row.circulating_nurse_id,
        anesthesia_type: row.anesthesia_type,
        pre_op_completed: row.pre_op_completed,
        consent_signed: row.consent_signed,
        safety_checklist_completed: row.safety_checklist_completed,
        notes: row.notes,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      patient,
      room: {
        id: room.id,
        room_name: room.room_name,
        status: room.status,
        department_id: room.department_id,
        utilization_today: 0,
        notes: room.notes,
      },
      checklist: [
        {
          key: "pre_op",
          label: "Pre-operative assessment completed",
          completed: row.pre_op_completed,
          note: null,
        },
        {
          key: "consent",
          label: "Informed consent signed",
          completed: row.consent_signed,
          note: null,
        },
        {
          key: "safety",
          label: "Surgical safety checklist completed",
          completed: row.safety_checklist_completed,
          note: null,
        },
      ],
      notes: [],
      supplies: [],
      anesthesia_record: row.anesthesia_type
        ? `Anesthesia: ${row.anesthesia_type}`
        : null,
      intra_op_notes: row.notes,
      post_op_monitoring: [],
      billing: {
        or_fee: 0,
        professional_fee: 0,
        supplies_total: 0,
        estimated_total: 0,
        invoice_status: "not_billed",
      },
    };
  }

  return { data: details, error: null };
}

export async function getSurgeryCase(
  id: string
): Promise<DataResult<SurgeryDetail>> {
  const detailsResult = await getSurgeryDetails();

  if (detailsResult.error) {
    return { data: null, error: detailsResult.error };
  }

  const detail = detailsResult.data?.[id];

  if (!detail) {
    return { data: null, error: NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function getOperatingRoomBoard(): Promise<
  DataResult<OperatingRoomBoardRow[]>
> {
  const supabase = await getSupabaseServerClient();
  const [roomResult, caseResult] = await Promise.all([
    supabase.from("operating_rooms").select(ROOM_COLUMNS).order("room_name"),
    loadCases(),
  ]);

  if (roomResult.error) {
    return { data: null, error: toDataError(roomResult.error) };
  }

  if (caseResult.error) {
    return { data: null, error: caseResult.error };
  }

  const rows = (caseResult.data ?? [])
    .map(toListRow)
    .filter((row): row is SurgeryListRow => row !== null);

  const board: OperatingRoomBoardRow[] = ((roomResult.data ?? []) as OperatingRoom[]).map(
    (room) => {
      const roomCases = rows.filter((row) => row.room_id === room.id);
      const current =
        roomCases.find(
          (row) => row.status === "in_progress" || row.status === "pre_op"
        ) ?? null;
      const next =
        roomCases.find(
          (row) => row.status === "scheduled" || row.status === "requested"
        ) ?? null;

      return {
        id: room.id,
        room_name: room.room_name,
        status: room.status,
        department_id: room.department_id,
        utilization_today: roomCases.filter(
          (row) => row.status === "in_progress" || row.status === "completed"
        ).length,
        notes: room.notes,
        current_case: current,
        next_case: next,
      };
    }
  );

  return { data: board, error: null };
}

export async function getSurgeryStats(): Promise<DataResult<SurgeryStats>> {
  const caseResult = await loadCases();

  if (caseResult.error) {
    return { data: null, error: caseResult.error };
  }

  const stats = emptyStats();
  const cases = caseResult.data ?? [];
  const today = manilaDate(new Date().toISOString());

  for (const surgery of cases) {
    stats.total += 1;

    switch (surgery.status) {
      case "requested":
        stats.requested += 1;
        break;
      case "scheduled":
        stats.scheduled += 1;
        break;
      case "pre_op":
        stats.preOp += 1;
        break;
      case "in_progress":
        stats.inProgress += 1;
        break;
      case "recovery":
        stats.recovery += 1;
        break;
      case "completed":
        stats.completed += 1;
        break;
      case "cancelled":
        stats.cancelled += 1;
        break;
    }

    if (manilaDate(surgery.scheduled_start) === today) {
      stats.today += 1;
    }
  }

  return { data: stats, error: null };
}

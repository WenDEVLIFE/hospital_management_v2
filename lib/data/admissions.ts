import type {
  Admission,
  AdmissionListRow,
  AdmissionStats,
  BedBoardRow,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate, normalizePagination, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const ADMISSION_COLUMNS =
  "*, patients(first_name, middle_name, last_name, suffix, medical_record_number), departments(name), physicians(staff_profiles(first_name, last_name)), admission_bed_assignments(released_at, beds(bed_number, rooms(room_number)))";

type AdmissionJoinRow = Admission & {
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
  admission_bed_assignments: Array<{
    released_at: string | null;
    beds: {
      bed_number: string;
      rooms: { room_number: string } | null;
    } | null;
  }> | null;
};

type Relation<T> = T | T[] | null;

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

type BedRoomJoin = {
  room_number: string;
  room_type: string | null;
  floor_number: string | null;
  department_id: string;
  departments: Relation<{ name: string }>;
};

type BedJoinRow = {
  id: string;
  bed_number: string;
  status: BedBoardRow["status"];
  room_id: string;
  rooms: Relation<BedRoomJoin>;
};

type ActiveAssignmentRow = {
  bed_id: string;
  admission_id: string;
  admissions: Relation<{
    id: string;
    patient_id: string;
    status: string;
    patients: Relation<{
      first_name: string;
      middle_name: string | null;
      last_name: string;
      suffix: string | null;
    }>;
  }>;
};

type ActiveBedOccupant = {
  admission_id: string;
  patient_id: string;
  patient_name: string;
};

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

function toAdmissionListRow(row: AdmissionJoinRow): AdmissionListRow {
  const assignments = row.admission_bed_assignments ?? [];
  const activeAssignment =
    assignments.find((assignment) => assignment.released_at === null) ??
    assignments[0] ??
    null;

  return {
    id: row.id,
    admission_number: row.admission_number,
    patient_id: row.patient_id,
    patient_name: row.patients ? fullName(row.patients) : "Unknown patient",
    patient_mrn: row.patients?.medical_record_number ?? "\u2014",
    department_id: row.department_id,
    department_name: row.departments?.name ?? "Unknown department",
    attending_physician_id: row.attending_physician_id,
    attending_physician_name: row.physicians?.staff_profiles
      ? fullName(row.physicians.staff_profiles)
      : null,
    admission_date: row.admission_date,
    discharge_date: row.discharge_date,
    admission_type: row.admission_type,
    status: row.status,
    room_number: activeAssignment?.beds?.rooms?.room_number ?? null,
    bed_number: activeAssignment?.beds?.bed_number ?? null,
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
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("admissions")
    .select(ADMISSION_COLUMNS, { count: "exact" });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      [
        `admission_number.ilike.${term}`,
        `admission_type.ilike.${term}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query
    .order("admission_date", { ascending: false })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: {
      rows: ((data ?? []) as AdmissionJoinRow[]).map(toAdmissionListRow),
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
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
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("admissions")
    .select(ADMISSION_COLUMNS, { count: "exact" })
    .eq("status", "discharged");

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      [
        `admission_number.ilike.${term}`,
        `admission_type.ilike.${term}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query
    .order("discharge_date", { ascending: false })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: {
      rows: ((data ?? []) as AdmissionJoinRow[]).map(toAdmissionListRow),
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function getBedBoard(): Promise<DataResult<BedBoardRow[]>> {
  const supabase = await getSupabaseServerClient();

  const { data: bedRows, error: bedError } = await supabase
    .from("beds")
    .select(
      "id, bed_number, status, room_id, rooms(room_number, room_type, floor_number, department_id, departments(name))"
    );

  if (bedError) {
    return { data: null, error: toDataError(bedError) };
  }

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("admission_bed_assignments")
    .select(
      "bed_id, admission_id, admissions!inner(id, patient_id, status, patients(first_name, middle_name, last_name, suffix))"
    )
    .is("released_at", null)
    .eq("admissions.status", "admitted");

  // A user may be able to see beds without seeing admissions. Degrade to bed
  // statuses instead of failing the whole board.
  const assignmentByBed = new Map<string, ActiveBedOccupant>();

  if (!assignmentError) {
    for (const assignment of (assignmentRows ?? []) as ActiveAssignmentRow[]) {
      const admission = firstRelation(assignment.admissions);

      if (!admission) {
        continue;
      }

      const patient = firstRelation(admission.patients);

      assignmentByBed.set(assignment.bed_id, {
        admission_id: assignment.admission_id,
        patient_id: admission.patient_id,
        patient_name: patient
          ? fullName(patient)
          : "Patient not recorded",
      });
    }
  }

  const rows: BedBoardRow[] = ((bedRows ?? []) as BedJoinRow[]).map((bed) => {
    const room = firstRelation(bed.rooms);
    const department = firstRelation(room?.departments ?? null);
    const occupant = assignmentByBed.get(bed.id);

    return {
      bed_id: bed.id,
      bed_number: bed.bed_number,
      status: bed.status,
      room_id: bed.room_id,
      room_number: room?.room_number ?? "Unknown room",
      room_type: room?.room_type ?? null,
      floor_number: room?.floor_number ?? null,
      department_id: room?.department_id ?? "",
      department_name: department?.name ?? "Unknown department",
      patient_id: occupant?.patient_id ?? null,
      patient_name: occupant?.patient_name ?? null,
      admission_id: occupant?.admission_id ?? null,
    };
  });

  rows.sort((left, right) => {
    const leftKey = `${left.department_name}:${left.room_number}:${left.bed_number}`;
    const rightKey = `${right.department_name}:${right.room_number}:${right.bed_number}`;

    return leftKey.localeCompare(rightKey);
  });

  return { data: rows, error: null };
}

export async function getAdmissionStats(): Promise<DataResult<AdmissionStats>> {
  const supabase = await getSupabaseServerClient();

  const [admissionsResult, bedsResult] = await Promise.all([
    supabase.from("admissions").select("status, discharge_date"),
    supabase.from("beds").select("status"),
  ]);

  if (admissionsResult.error) {
    return { data: null, error: toDataError(admissionsResult.error) };
  }

  if (bedsResult.error) {
    return { data: null, error: toDataError(bedsResult.error) };
  }

  const stats = emptyStats();
  const today = manilaDate(new Date().toISOString());

  for (const admission of (admissionsResult.data ?? []) as Array<
    Pick<Admission, "status" | "discharge_date">
  >) {
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

    if (
      admission.discharge_date &&
      manilaDate(admission.discharge_date) === today
    ) {
      stats.dischargesToday += 1;
    }
  }

  for (const bed of (bedsResult.data ?? []) as Array<{
    status: BedBoardRow["status"];
  }>) {
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

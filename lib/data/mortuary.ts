import type {
  MortuaryAccessLog,
  MortuaryRecord,
  MortuaryRecordDetail,
  MortuaryRecordListRow,
  MortuaryRelease,
  MortuaryReleaseListRow,
  MortuaryStats,
  MortuaryStorageUnit,
  MortuaryStorageUnitListRow,
  Patient,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate, pageSlice, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const RECORD_COLUMNS =
  "*, patients(id, medical_record_number, first_name, middle_name, last_name, suffix), mortuary_storage_units!mortuary_records_storage_unit_id_fkey(unit_number, location)";

type Relation<T> = T | T[] | null;

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
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

type RecordJoinRow = MortuaryRecord & {
  patients: Relation<{
    id: string;
    medical_record_number: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
  }>;
  mortuary_storage_units: Relation<{ unit_number: string; location: string }>;
};

function toRecordRow(row: RecordJoinRow): MortuaryRecordListRow | null {
  const patient = firstRelation(row.patients);
  const unit = firstRelation(row.mortuary_storage_units);

  if (!patient) {
    return null;
  }

  return {
    id: row.id,
    case_number: row.case_number,
    patient_id: row.patient_id,
    declared_at: row.declared_at,
    place_of_death: row.place_of_death,
    body_tag_number: row.body_tag_number,
    identification_status: row.identification_status,
    storage_unit_id: row.storage_unit_id,
    status: row.status,
    next_of_kin_name: row.next_of_kin_name,
    next_of_kin_relationship: row.next_of_kin_relationship,
    next_of_kin_contact: row.next_of_kin_contact,
    next_of_kin_verified: row.next_of_kin_verified,
    admitted_at: row.admitted_at,
    released_at: row.released_at,
    released_to_name: row.released_to_name,
    release_authorized_by_name: null,
    release_document_reference: row.release_document_reference,
    notes: row.notes,
    patient_name: fullName(patient),
    patient_mrn: patient.medical_record_number,
    storage_unit_label: unit
      ? `${unit.unit_number} · ${unit.location}`
      : null,
  } as MortuaryRecordListRow;
}

async function loadRecords(): Promise<DataResult<RecordJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("mortuary_records")
    .select(RECORD_COLUMNS)
    .order("declared_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as RecordJoinRow[], error: null };
}

export async function listMortuaryRecords(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<MortuaryRecordListRow>> {
  const recordResult = await loadRecords();

  if (recordResult.error) {
    return { data: null, error: recordResult.error };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = recordResult.data
    .map(toRecordRow)
    .filter((row): row is MortuaryRecordListRow => row !== null)
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [row.case_number, row.patient_name, row.patient_mrn, row.body_tag_number]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function listMortuaryStorageUnits(): Promise<
  DataResult<MortuaryStorageUnitListRow[]>
> {
  const supabase = await getSupabaseServerClient();
  const [unitResult, recordResult] = await Promise.all([
    supabase.from("mortuary_storage_units").select("*").order("unit_number"),
    loadRecords(),
  ]);

  if (unitResult.error) {
    return { data: null, error: toDataError(unitResult.error) };
  }

  const records = (recordResult.error ? [] : recordResult.data)
    .map(toRecordRow)
    .filter((row): row is MortuaryRecordListRow => row !== null);

  return {
    data: ((unitResult.data ?? []) as MortuaryStorageUnit[]).map((unit) => {
      const record = records.find((row) => row.id === unit.current_record_id);

      return {
        ...unit,
        current_case_number: record?.case_number ?? null,
        current_patient_name: record?.patient_name ?? null,
      };
    }),
    error: null,
  };
}

export async function listMortuaryReleases(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<MortuaryReleaseListRow>> {
  const supabase = await getSupabaseServerClient();
  const [releaseResult, recordResult] = await Promise.all([
    supabase
      .from("mortuary_releases")
      .select("*")
      .order("requested_at", { ascending: false }),
    loadRecords(),
  ]);

  if (releaseResult.error) {
    return { data: null, error: toDataError(releaseResult.error) };
  }

  const records = new Map(
    (recordResult.error ? [] : recordResult.data)
      .map(toRecordRow)
      .filter((row): row is MortuaryRecordListRow => row !== null)
      .map((row) => [row.id, row])
  );

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = ((releaseResult.data ?? []) as MortuaryRelease[])
    .map((release) => {
      const record = records.get(release.record_id);

      if (!record) {
        return null;
      }

      return {
        ...release,
        case_number: record.case_number,
        patient_name: record.patient_name,
        patient_mrn: record.patient_mrn,
      } satisfies MortuaryReleaseListRow;
    })
    .filter((row): row is MortuaryReleaseListRow => row !== null)
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [row.case_number, row.patient_name, row.patient_mrn]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function getMortuaryRecordDetail(
  id: string
): Promise<DataResult<MortuaryRecordDetail>> {
  const recordResult = await loadRecords();

  if (recordResult.error) {
    return { data: null, error: recordResult.error };
  }

  const row = recordResult.data.find((record) => record.id === id);

  if (!row) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "The mortuary record could not be found." },
    };
  }

  const supabase = await getSupabaseServerClient();
  const [patientResult, unitResult, releaseResult, logResult] =
    await Promise.all([
      supabase.from("patients").select("*").eq("id", row.patient_id).maybeSingle(),
      row.storage_unit_id
        ? supabase
            .from("mortuary_storage_units")
            .select("*")
            .eq("id", row.storage_unit_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("mortuary_releases")
        .select("*")
        .eq("record_id", id)
        .maybeSingle(),
      supabase
        .from("mortuary_access_log")
        .select("id, record_id, action, actor_id, notes, created_at, profiles!mortuary_access_log_actor_id_fkey(full_name)")
        .eq("record_id", id)
        .order("created_at"),
    ]);

  return {
    data: {
      record: {
        id: row.id,
        case_number: row.case_number,
        patient_id: row.patient_id,
        declared_at: row.declared_at,
        place_of_death: row.place_of_death,
        body_tag_number: row.body_tag_number,
        identification_status: row.identification_status,
        storage_unit_id: row.storage_unit_id,
        status: row.status,
        next_of_kin_name: row.next_of_kin_name,
        next_of_kin_relationship: row.next_of_kin_relationship,
        next_of_kin_contact: row.next_of_kin_contact,
        next_of_kin_verified: row.next_of_kin_verified,
        admitted_at: row.admitted_at,
        released_at: row.released_at,
        released_to_name: row.released_to_name,
        release_authorized_by_name: null,
        release_document_reference: row.release_document_reference,
        notes: row.notes,
      },
      patient: (patientResult.data ?? {}) as Patient,
      storageUnit: (unitResult.data as MortuaryStorageUnit | null) ?? null,
      release: (releaseResult.data as MortuaryRelease | null) ?? null,
      accessLog: ((logResult.data ?? []) as Array<{
        id: string;
        record_id: string;
        action: string;
        actor_id: string | null;
        notes: string | null;
        created_at: string;
        profiles: Relation<{ full_name: string }>;
      }>).map((entry) => ({
        id: entry.id,
        record_id: entry.record_id,
        action: entry.action,
        actor_name: firstRelation(entry.profiles)?.full_name ?? "System",
        created_at: entry.created_at,
        notes: entry.notes,
      })),
    },
    error: null,
  };
}

export async function getMortuaryRecordDetails(): Promise<
  DataResult<Record<string, MortuaryRecordDetail>>
> {
  const recordResult = await loadRecords();

  if (recordResult.error) {
    return { data: null, error: recordResult.error };
  }

  const details: Record<string, MortuaryRecordDetail> = {};

  for (const row of recordResult.data.slice(0, 100)) {
    const detail = await getMortuaryRecordDetail(row.id);

    if (detail.data) {
      details[row.id] = detail.data;
    }
  }

  return { data: details, error: null };
}

export async function getMortuaryStats(): Promise<DataResult<MortuaryStats>> {
  const supabase = await getSupabaseServerClient();
  const today = manilaDate(new Date().toISOString());
  const [recordResult, unitResult, releaseResult] = await Promise.all([
    supabase.from("mortuary_records").select("status, declared_at, released_at, admitted_at, identification_status"),
    supabase.from("mortuary_storage_units").select("status"),
    supabase.from("mortuary_releases").select("status, released_at"),
  ]);

  if (recordResult.error) {
    return { data: null, error: toDataError(recordResult.error) };
  }

  const stats: MortuaryStats = {
    bodiesInCustody: 0,
    admittedToday: 0,
    releasedToday: 0,
    pendingRelease: 0,
    storageOccupied: 0,
    storageTotal: 0,
    unidentified: 0,
  };

  for (const record of (recordResult.data ?? []) as Array<{
    status: string;
    declared_at: string;
    released_at: string | null;
    admitted_at: string;
    identification_status: string;
  }>) {
    if (record.status !== "released") {
      stats.bodiesInCustody += 1;
    }

    if (manilaDate(record.admitted_at) === today) {
      stats.admittedToday += 1;
    }

    if (record.released_at && manilaDate(record.released_at) === today) {
      stats.releasedToday += 1;
    }

    if (record.identification_status !== "verified") {
      stats.unidentified += 1;
    }
  }

  for (const release of (releaseResult.data ?? []) as Array<{
    status: string;
  }>) {
    if (release.status === "pending" || release.status === "authorized") {
      stats.pendingRelease += 1;
    }
  }

  for (const unit of (unitResult.data ?? []) as Array<{ status: string }>) {
    stats.storageTotal += 1;

    if (unit.status === "occupied") {
      stats.storageOccupied += 1;
    }
  }

  return { data: stats, error: null };
}

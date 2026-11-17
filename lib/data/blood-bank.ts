import type {
  BloodBankStats,
  BloodCrossmatch,
  BloodDonation,
  BloodDonor,
  BloodDonorDetail,
  BloodDonorListRow,
  BloodIssue,
  BloodRequest,
  BloodRequestDetail,
  BloodRequestListRow,
  BloodScreening,
  BloodUnit,
  BloodUnitDetail,
  BloodUnitListRow,
  Patient,
  TransfusionRecord,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate, pageSlice, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const UNIT_COLUMNS =
  "*, blood_donors(id, donor_number, full_name, blood_type)";

const REQUEST_COLUMNS =
  "*, patients(id, medical_record_number, first_name, middle_name, last_name, suffix), profiles!blood_requests_created_by_fkey(full_name), departments(name)";

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

function daysBetween(date: string): number {
  const target = new Date(`${date}T00:00:00+08:00`).getTime();

  if (Number.isNaN(target)) {
    return 0;
  }

  return Math.ceil((target - Date.now()) / 86_400_000);
}

function emptyStats(): BloodBankStats {
  return {
    unitsInStock: 0,
    availableUnits: 0,
    expiringSoon: 0,
    pendingRequests: 0,
    crossmatchesPending: 0,
    issuedToday: 0,
  };
}

type UnitRow = BloodUnit & {
  blood_donors: Relation<{ id: string; donor_number: string; full_name: string }>;
};

type RequestRow = BloodRequest & {
  created_at: string;
  patients: Relation<{
    id: string;
    medical_record_number: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
  }>;
  profiles: Relation<{ full_name: string }>;
  departments: Relation<{ name: string }>;
};

async function loadUnits(): Promise<DataResult<UnitRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("blood_units")
    .select(UNIT_COLUMNS)
    .order("expiry_date");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as UnitRow[], error: null };
}

function toUnitRow(row: UnitRow): BloodUnitListRow {
  const donor = firstRelation(row.blood_donors);

  return {
    id: row.id,
    unit_number: row.unit_number,
    donation_id: row.donation_id,
    donor_id: row.donor_id,
    blood_type: row.blood_type,
    component: row.component,
    collection_date: row.collection_date,
    expiry_date: row.expiry_date,
    status: row.status,
    storage_location: row.storage_location,
    screening_status: row.screening_status,
    notes: row.notes,
    donor_name: donor?.full_name ?? "Unknown donor",
    request_number: null,
    days_to_expiry: daysBetween(row.expiry_date),
  };
}

async function loadRequests(): Promise<DataResult<RequestRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("blood_requests")
    .select(REQUEST_COLUMNS)
    .order("required_by");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as RequestRow[], error: null };
}

function toRequestRow(row: RequestRow): BloodRequestListRow | null {
  const patient = firstRelation(row.patients);

  if (!patient) {
    return null;
  }

  const requestor = firstRelation(row.profiles);
  const department = firstRelation(row.departments);

  return {
    id: row.id,
    request_number: row.request_number,
    patient_id: row.patient_id,
    blood_type: row.blood_type,
    component: row.component,
    units_requested: row.units_requested,
    units_fulfilled: row.units_fulfilled,
    priority: row.priority,
    status: row.status,
    requested_by_name: requestor?.full_name ?? "Unknown staff",
    department_name: department?.name ?? "Unassigned",
    requested_at: row.created_at,
    required_by: row.required_by,
    notes: row.notes,
    patient_name: fullName(patient),
    patient_mrn: patient.medical_record_number,
    crossmatch_status: null,
    issued_units: 0,
  };
}

export async function listBloodUnits(
  params: {
    q?: string;
    status?: string;
    bloodType?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<BloodUnitListRow>> {
  const unitResult = await loadUnits();

  if (unitResult.error) {
    return { data: null, error: unitResult.error };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = unitResult.data
    .map(toUnitRow)
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (params.bloodType && row.blood_type !== params.bloodType) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [row.unit_number, row.donor_name, row.blood_type, row.component]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function listBloodRequests(
  params: {
    q?: string;
    status?: string;
    priority?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<BloodRequestListRow>> {
  const requestResult = await loadRequests();

  if (requestResult.error) {
    return { data: null, error: requestResult.error };
  }

  const supabase = await getSupabaseServerClient();
  const [crossmatchResult, issueResult] = await Promise.all([
    supabase.from("blood_crossmatches").select("request_id, result"),
    supabase.from("blood_issues").select("request_id"),
  ]);

  const crossmatchByRequest = new Map<string, string>();

  for (const row of (crossmatchResult.data ?? []) as Array<{
    request_id: string;
    result: string;
  }>) {
    const current = crossmatchByRequest.get(row.request_id);

    if (!current || row.result === "compatible") {
      crossmatchByRequest.set(row.request_id, row.result);
    }
  }

  const issuesByRequest = new Map<string, number>();

  for (const row of (issueResult.data ?? []) as Array<{ request_id: string }>) {
    issuesByRequest.set(row.request_id, (issuesByRequest.get(row.request_id) ?? 0) + 1);
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = requestResult.data
    .map(toRequestRow)
    .filter((row): row is BloodRequestListRow => row !== null)
    .map((row) => ({
      ...row,
      crossmatch_status:
        (crossmatchByRequest.get(row.id) as BloodRequestListRow["crossmatch_status"]) ??
        null,
      issued_units: issuesByRequest.get(row.id) ?? 0,
    }))
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (params.priority && row.priority !== params.priority) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [row.request_number, row.patient_name, row.patient_mrn, row.blood_type, row.component]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function listBloodDonors(
  params: {
    q?: string;
    status?: string;
    bloodType?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<BloodDonorListRow>> {
  const supabase = await getSupabaseServerClient();
  const [donorResult, donationResult] = await Promise.all([
    supabase.from("blood_donors").select("*").order("full_name"),
    supabase.from("blood_donations").select("donor_id, donation_date"),
  ]);

  if (donorResult.error) {
    return { data: null, error: toDataError(donorResult.error) };
  }

  const year = new Date().getFullYear();
  const donationsByDonor = new Map<string, number>();

  for (const row of (donationResult.data ?? []) as Array<{
    donor_id: string;
    donation_date: string;
  }>) {
    if (row.donation_date.startsWith(String(year))) {
      donationsByDonor.set(row.donor_id, (donationsByDonor.get(row.donor_id) ?? 0) + 1);
    }
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = ((donorResult.data ?? []) as BloodDonor[])
    .filter((donor) => {
      if (params.status && donor.eligibility_status !== params.status) {
        return false;
      }

      if (params.bloodType && donor.blood_type !== params.bloodType) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [donor.full_name, donor.donor_number, donor.blood_type]
        .join(" ")
        .toLowerCase()
        .includes(search);
    })
    .map((donor) => ({
      ...donor,
      donations_this_year: donationsByDonor.get(donor.id) ?? 0,
    }));

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function getBloodUnitDetail(
  id: string
): Promise<DataResult<BloodUnitDetail>> {
  const unitResult = await loadUnits();

  if (unitResult.error) {
    return { data: null, error: unitResult.error };
  }

  const row = unitResult.data.find((unit) => unit.id === id);

  if (!row) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "The blood unit could not be found." },
    };
  }

  const supabase = await getSupabaseServerClient();
  const [donorResult, donationResult, screeningResult, issueResult, transfusionResult] =
    await Promise.all([
      supabase.from("blood_donors").select("*").eq("id", row.donor_id).maybeSingle(),
      supabase.from("blood_donations").select("*").eq("id", row.donation_id).maybeSingle(),
      supabase
        .from("blood_screenings")
        .select("*")
        .eq("unit_id", id)
        .order("created_at"),
      supabase.from("blood_issues").select("*").eq("unit_id", id).maybeSingle(),
      supabase.from("transfusion_records").select("*").eq("unit_id", id).maybeSingle(),
    ]);

  return {
    data: {
      unit: {
        id: row.id,
        unit_number: row.unit_number,
        donation_id: row.donation_id,
        donor_id: row.donor_id,
        blood_type: row.blood_type,
        component: row.component,
        collection_date: row.collection_date,
        expiry_date: row.expiry_date,
        status: row.status,
        storage_location: row.storage_location,
        screening_status: row.screening_status,
        notes: row.notes,
      },
      donor: (donorResult.data ?? {}) as BloodDonor,
      donation: (donationResult.data ?? {}) as BloodDonation,
      screenings: ((screeningResult.data ?? []) as Array<{
        id: string;
        unit_id: string;
        test_name: string;
        result: string;
        tested_at: string | null;
        tested_by: string | null;
        notes: string | null;
      }>).map((screening) => ({
        id: screening.id,
        unit_id: screening.unit_id,
        test_name: screening.test_name,
        result: screening.result as BloodScreening["result"],
        tested_at: screening.tested_at,
        tested_by_name: null,
        notes: screening.notes,
      })),
      request: null,
      issue: (issueResult.data as BloodIssue | null) ?? null,
      transfusion: (transfusionResult.data as TransfusionRecord | null) ?? null,
    },
    error: null,
  };
}

export async function getBloodUnitDetails(): Promise<
  DataResult<Record<string, BloodUnitDetail>>
> {
  const unitResult = await loadUnits();

  if (unitResult.error) {
    return { data: null, error: unitResult.error };
  }

  const details: Record<string, BloodUnitDetail> = {};

  for (const row of unitResult.data.slice(0, 200)) {
    const detail = await getBloodUnitDetail(row.id);

    if (detail.data) {
      details[row.id] = detail.data;
    }
  }

  return { data: details, error: null };
}

export async function getBloodRequestDetail(
  id: string
): Promise<DataResult<BloodRequestDetail>> {
  const requestResult = await loadRequests();

  if (requestResult.error) {
    return { data: null, error: requestResult.error };
  }

  const row = requestResult.data.find((request) => request.id === id);

  if (!row) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "The blood request could not be found." },
    };
  }

  const supabase = await getSupabaseServerClient();
  const [patientResult, crossmatchResult, issueResult, transfusionResult] =
    await Promise.all([
      supabase.from("patients").select("*").eq("id", row.patient_id).maybeSingle(),
      supabase
        .from("blood_crossmatches")
        .select("*, blood_units(unit_number, blood_type, component)")
        .eq("request_id", id),
      supabase
        .from("blood_issues")
        .select("*, blood_units(unit_number, blood_type, component)")
        .eq("request_id", id),
      supabase
        .from("transfusion_records")
        .select("*, blood_units(unit_number)")
        .eq("request_id", id),
    ]);

  return {
    data: {
      request: {
        id: row.id,
        request_number: row.request_number,
        patient_id: row.patient_id,
        blood_type: row.blood_type,
        component: row.component,
        units_requested: row.units_requested,
        units_fulfilled: row.units_fulfilled,
        priority: row.priority,
        status: row.status,
        requested_by_name:
          firstRelation(row.profiles)?.full_name ?? "Unknown staff",
        department_name: firstRelation(row.departments)?.name ?? "Unassigned",
        requested_at: row.created_at,
        required_by: row.required_by,
        notes: row.notes,
      },
      patient: (patientResult.data ?? {}) as Patient,
      crossmatches: ((crossmatchResult.data ?? []) as Array<
        BloodCrossmatch & { blood_units: Relation<{ unit_number: string; blood_type: string; component: string }> }
      >).map((crossmatch) => {
        const unit = firstRelation(crossmatch.blood_units);

        return {
          ...crossmatch,
          unit_number: unit?.unit_number ?? "\u2014",
          blood_type: (unit?.blood_type ?? "O+") as BloodRequestDetail["crossmatches"][number]["blood_type"],
          component: (unit?.component ?? "whole_blood") as BloodRequestDetail["crossmatches"][number]["component"],
        };
      }),
      issues: ((issueResult.data ?? []) as Array<
        BloodIssue & { blood_units: Relation<{ unit_number: string; blood_type: string; component: string }> }
      >).map((issue) => {
        const unit = firstRelation(issue.blood_units);

        return {
          ...issue,
          unit_number: unit?.unit_number ?? "\u2014",
          blood_type: (unit?.blood_type ?? "O+") as BloodRequestDetail["issues"][number]["blood_type"],
          component: (unit?.component ?? "whole_blood") as BloodRequestDetail["issues"][number]["component"],
        };
      }),
      transfusions: ((transfusionResult.data ?? []) as Array<
        TransfusionRecord & { blood_units: Relation<{ unit_number: string }> }
      >).map((transfusion) => ({
        ...transfusion,
        unit_number: firstRelation(transfusion.blood_units)?.unit_number ?? "\u2014",
      })),
    },
    error: null,
  };
}

export async function getBloodRequestDetails(): Promise<
  DataResult<Record<string, BloodRequestDetail>>
> {
  const requestResult = await loadRequests();

  if (requestResult.error) {
    return { data: null, error: requestResult.error };
  }

  const details: Record<string, BloodRequestDetail> = {};

  for (const row of requestResult.data.slice(0, 200)) {
    const detail = await getBloodRequestDetail(row.id);

    if (detail.data) {
      details[row.id] = detail.data;
    }
  }

  return { data: details, error: null };
}

export async function getBloodDonorDetail(
  id: string
): Promise<DataResult<BloodDonorDetail>> {
  const supabase = await getSupabaseServerClient();
  const [donorResult, donationResult, unitResult] = await Promise.all([
    supabase.from("blood_donors").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("blood_donations")
      .select("*")
      .eq("donor_id", id)
      .order("donation_date", { ascending: false }),
    loadUnits(),
  ]);

  if (donorResult.error || !donorResult.data) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "The blood donor could not be found." },
    };
  }

  const units = unitResult.error
    ? []
    : unitResult.data
        .filter((unit) => unit.donor_id === id)
        .map(toUnitRow);

  return {
    data: {
      donor: donorResult.data as BloodDonor,
      donations: (donationResult.data ?? []) as BloodDonation[],
      units,
    },
    error: null,
  };
}

export async function getBloodDonorDetails(): Promise<
  DataResult<Record<string, BloodDonorDetail>>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("blood_donors").select("id");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const details: Record<string, BloodDonorDetail> = {};

  for (const donor of (data ?? []) as Array<{ id: string }>) {
    const detail = await getBloodDonorDetail(donor.id);

    if (detail.data) {
      details[donor.id] = detail.data;
    }
  }

  return { data: details, error: null };
}

export async function listBloodScreenings(): Promise<
  DataResult<BloodScreening[]>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("blood_screenings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: ((data ?? []) as Array<{
      id: string;
      unit_id: string;
      test_name: string;
      result: string;
      tested_at: string | null;
      notes: string | null;
    }>).map((row) => ({
      id: row.id,
      unit_id: row.unit_id,
      test_name: row.test_name,
      result: row.result as BloodScreening["result"],
      tested_at: row.tested_at,
      tested_by_name: null,
      notes: row.notes,
    })),
    error: null,
  };
}

export async function listTransfusionRecords(): Promise<
  DataResult<TransfusionRecord[]>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("transfusion_records")
    .select("*")
    .order("transfused_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as TransfusionRecord[], error: null };
}

export async function getBloodBankStats(): Promise<DataResult<BloodBankStats>> {
  const supabase = await getSupabaseServerClient();
  const today = manilaDate(new Date().toISOString());
  const [unitResult, requestResult, crossmatchResult, issueResult] =
    await Promise.all([
      supabase.from("blood_units").select("status, expiry_date"),
      supabase.from("blood_requests").select("status"),
      supabase.from("blood_crossmatches").select("result"),
      supabase.from("blood_issues").select("issued_at"),
    ]);

  if (unitResult.error) {
    return { data: null, error: toDataError(unitResult.error) };
  }

  const stats = emptyStats();

  for (const unit of (unitResult.data ?? []) as Array<{
    status: string;
    expiry_date: string;
  }>) {
    if (unit.status !== "discarded") {
      stats.unitsInStock += 1;
    }

    if (unit.status === "available") {
      stats.availableUnits += 1;
    }

    if (daysBetween(unit.expiry_date) <= 7 && unit.status !== "issued") {
      stats.expiringSoon += 1;
    }
  }

  for (const request of (requestResult.data ?? []) as Array<{ status: string }>) {
    if (request.status === "pending" || request.status === "reserved") {
      stats.pendingRequests += 1;
    }
  }

  for (const crossmatch of (crossmatchResult.data ?? []) as Array<{
    result: string;
  }>) {
    if (crossmatch.result === "pending") {
      stats.crossmatchesPending += 1;
    }
  }

  for (const issue of (issueResult.data ?? []) as Array<{ issued_at: string }>) {
    if (manilaDate(issue.issued_at) === today) {
      stats.issuedToday += 1;
    }
  }

  return { data: stats, error: null };
}

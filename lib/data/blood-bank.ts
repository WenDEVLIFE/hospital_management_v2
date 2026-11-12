import type {
  BloodBankStats,
  BloodDonorDetail,
  BloodDonorListRow,
  BloodRequestDetail,
  BloodRequestListRow,
  BloodScreening,
  BloodUnitDetail,
  BloodUnitListRow,
  TransfusionRecord,
} from "@/types/hospital";
import {
  bloodBankStats,
  bloodDonorDetailById,
  bloodDonorListRows,
  bloodRequestDetailById,
  bloodRequestListRows,
  bloodScreenings,
  bloodUnitDetailById,
  bloodUnitListRows,
  transfusionRecords,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

const UNIT_NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested blood unit could not be found.",
} as const;

const REQUEST_NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested blood request could not be found.",
} as const;

const DONOR_NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested blood donor could not be found.",
} as const;

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

export async function listBloodUnits(
  params: {
    q?: string;
    status?: string;
    component?: string;
    bloodType?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<BloodUnitListRow>> {
  // TODO(supabase): replace with supabase.from("blood_units").select("*")
  if (!isPreviewMode) {
    return emptyPage<BloodUnitListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = bloodUnitListRows.filter((unit) => {
    if (params.status && unit.status !== params.status) {
      return false;
    }

    if (params.component && unit.component !== params.component) {
      return false;
    }

    if (params.bloodType && unit.blood_type !== params.bloodType) {
      return false;
    }

    return matchesQuery(params.q, [
      unit.unit_number,
      unit.blood_type,
      unit.component,
      unit.donor_name,
      unit.storage_location,
      unit.request_number,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getBloodUnitDetails(): Promise<
  DataResult<Record<string, BloodUnitDetail>>
> {
  // TODO(supabase): replace with a joined blood unit detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(bloodUnitDetailById),
    error: null,
  };
}

export async function getBloodUnitDetail(
  id: string
): Promise<DataResult<BloodUnitDetail>> {
  // TODO(supabase): replace with supabase.from("blood_units").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: UNIT_NOT_FOUND };
  }

  await Promise.resolve();

  const detail = bloodUnitDetailById.get(id);

  if (!detail) {
    return { data: null, error: UNIT_NOT_FOUND };
  }

  return { data: detail, error: null };
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
  // TODO(supabase): replace with supabase.from("blood_requests").select("*")
  if (!isPreviewMode) {
    return emptyPage<BloodRequestListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = bloodRequestListRows.filter((request) => {
    if (params.status && request.status !== params.status) {
      return false;
    }

    if (params.priority && request.priority !== params.priority) {
      return false;
    }

    return matchesQuery(params.q, [
      request.request_number,
      request.patient_name,
      request.patient_mrn,
      request.blood_type,
      request.component,
      request.requested_by_name,
      request.department_name,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getBloodRequestDetails(): Promise<
  DataResult<Record<string, BloodRequestDetail>>
> {
  // TODO(supabase): replace with a joined blood request detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(bloodRequestDetailById),
    error: null,
  };
}

export async function getBloodRequestDetail(
  id: string
): Promise<DataResult<BloodRequestDetail>> {
  // TODO(supabase): replace with supabase.from("blood_requests").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: REQUEST_NOT_FOUND };
  }

  await Promise.resolve();

  const detail = bloodRequestDetailById.get(id);

  if (!detail) {
    return { data: null, error: REQUEST_NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function listBloodDonors(
  params: {
    q?: string;
    eligibility?: string;
    bloodType?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<BloodDonorListRow>> {
  // TODO(supabase): replace with supabase.from("blood_donors").select("*")
  if (!isPreviewMode) {
    return emptyPage<BloodDonorListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = bloodDonorListRows.filter((donor) => {
    if (params.eligibility && donor.eligibility_status !== params.eligibility) {
      return false;
    }

    if (params.bloodType && donor.blood_type !== params.bloodType) {
      return false;
    }

    return matchesQuery(params.q, [
      donor.donor_number,
      donor.full_name,
      donor.blood_type,
      donor.contact_number,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getBloodDonorDetails(): Promise<
  DataResult<Record<string, BloodDonorDetail>>
> {
  // TODO(supabase): replace with a joined donor detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(bloodDonorDetailById),
    error: null,
  };
}

export async function getBloodDonorDetail(
  id: string
): Promise<DataResult<BloodDonorDetail>> {
  // TODO(supabase): replace with supabase.from("blood_donors").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: DONOR_NOT_FOUND };
  }

  await Promise.resolve();

  const detail = bloodDonorDetailById.get(id);

  if (!detail) {
    return { data: null, error: DONOR_NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function listBloodScreenings(): Promise<
  DataResult<BloodScreening[]>
> {
  // TODO(supabase): replace with supabase.from("blood_screenings").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: bloodScreenings, error: null };
}

export async function listTransfusionRecords(): Promise<
  DataResult<TransfusionRecord[]>
> {
  // TODO(supabase): replace with supabase.from("transfusion_records").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: transfusionRecords, error: null };
}

export async function getBloodBankStats(): Promise<
  DataResult<BloodBankStats>
> {
  // TODO(supabase): replace with aggregate queries over units and requests
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  return { data: bloodBankStats, error: null };
}

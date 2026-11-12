import type {
  MortuaryRecordDetail,
  MortuaryRecordListRow,
  MortuaryReleaseListRow,
  MortuaryStats,
  MortuaryStorageUnitListRow,
} from "@/types/hospital";
import {
  mortuaryRecordDetailById,
  mortuaryRecordListRows,
  mortuaryReleaseListRows,
  mortuaryStats,
  mortuaryStorageUnitListRows,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import {
  emptyPage,
  matchesQuery,
  pageSlice,
  sortByDateDesc,
} from "./query";
import type { DataResult, PagedResult } from "./result";

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested mortuary record could not be found.",
} as const;

function emptyStats(): MortuaryStats {
  return {
    bodiesInCustody: 0,
    admittedToday: 0,
    releasedToday: 0,
    pendingRelease: 0,
    storageOccupied: 0,
    storageTotal: 0,
    unidentified: 0,
  };
}

export async function listMortuaryRecords(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<MortuaryRecordListRow>> {
  // TODO(supabase): replace with supabase.from("mortuary_records").select("*")
  if (!isPreviewMode) {
    return emptyPage<MortuaryRecordListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = sortByDateDesc(
    mortuaryRecordListRows.filter((record) => {
      if (params.status && record.status !== params.status) {
        return false;
      }

      return matchesQuery(params.q, [
        record.case_number,
        record.patient_name,
        record.patient_mrn,
        record.body_tag_number,
        record.place_of_death,
        record.next_of_kin_name,
        record.storage_unit_label,
      ]);
    }),
    (record) => record.declared_at
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getMortuaryRecordDetails(): Promise<
  DataResult<Record<string, MortuaryRecordDetail>>
> {
  // TODO(supabase): replace with a joined mortuary record detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(mortuaryRecordDetailById),
    error: null,
  };
}

export async function getMortuaryRecordDetail(
  id: string
): Promise<DataResult<MortuaryRecordDetail>> {
  // TODO(supabase): replace with supabase.from("mortuary_records").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: NOT_FOUND };
  }

  await Promise.resolve();

  const detail = mortuaryRecordDetailById.get(id);

  if (!detail) {
    return { data: null, error: NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function listMortuaryReleases(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<MortuaryReleaseListRow>> {
  // TODO(supabase): replace with supabase.from("mortuary_releases").select("*")
  if (!isPreviewMode) {
    return emptyPage<MortuaryReleaseListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = sortByDateDesc(
    mortuaryReleaseListRows.filter((release) => {
      if (params.status && release.status !== params.status) {
        return false;
      }

      return matchesQuery(params.q, [
        release.case_number,
        release.patient_name,
        release.patient_mrn,
        release.released_to_name,
        release.document_reference,
        release.authorized_by_name,
      ]);
    }),
    (release) => release.requested_at
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listMortuaryStorageUnits(): Promise<
  DataResult<MortuaryStorageUnitListRow[]>
> {
  // TODO(supabase): replace with supabase.from("mortuary_storage_units").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: mortuaryStorageUnitListRows, error: null };
}

export async function getMortuaryStats(): Promise<DataResult<MortuaryStats>> {
  // TODO(supabase): replace with aggregate queries over mortuary records
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  return { data: mortuaryStats, error: null };
}

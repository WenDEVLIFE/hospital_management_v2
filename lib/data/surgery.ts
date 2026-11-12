import type {
  OperatingRoomBoardRow,
  SurgeryDetail,
  SurgeryListRow,
  SurgeryStats,
} from "@/types/hospital";
import {
  operatingRoomBoardRows,
  surgeryDetailById,
  surgeryListRows,
  surgeryStats,
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
  message: "The requested surgical case could not be found.",
} as const;

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
  // TODO(supabase): replace with supabase.from("surgery_cases").select("*")
  if (!isPreviewMode) {
    return emptyPage<SurgeryListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = sortByDateDesc(
    surgeryListRows.filter((surgery) => {
      if (params.status && surgery.status !== params.status) {
        return false;
      }

      if (params.priority && surgery.priority !== params.priority) {
        return false;
      }

      if (params.room && surgery.room_name !== params.room) {
        return false;
      }

      return matchesQuery(params.q, [
        surgery.case_number,
        surgery.patient_name,
        surgery.patient_mrn,
        surgery.procedure_name,
        surgery.procedure_code,
        surgery.room_name,
        surgery.surgeon_name,
        surgery.anesthesiologist_name,
        surgery.team_summary,
      ]);
    }),
    (surgery) => surgery.scheduled_start
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getSurgeryDetails(): Promise<
  DataResult<Record<string, SurgeryDetail>>
> {
  // TODO(supabase): replace with a single list query joined to clinical details
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(surgeryDetailById),
    error: null,
  };
}

export async function getSurgeryCase(
  id: string
): Promise<DataResult<SurgeryDetail>> {
  // TODO(supabase): replace with supabase.from("surgery_cases").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: NOT_FOUND };
  }

  await Promise.resolve();

  const detail = surgeryDetailById.get(id);

  if (!detail) {
    return { data: null, error: NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function getOperatingRoomBoard(): Promise<
  DataResult<OperatingRoomBoardRow[]>
> {
  // TODO(supabase): replace with supabase.from("operating_rooms").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  const rows = [...operatingRoomBoardRows].sort((a, b) =>
    a.room_name.localeCompare(b.room_name)
  );

  return { data: rows, error: null };
}

export async function getSurgeryStats(): Promise<DataResult<SurgeryStats>> {
  // TODO(supabase): replace with supabase.from("surgery_cases").select("status, priority")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  return { data: surgeryStats, error: null };
}

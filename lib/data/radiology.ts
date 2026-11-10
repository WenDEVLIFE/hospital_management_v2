import type {
  RadiologyOrderListRow,
  RadiologyStats,
} from "@/types/hospital";
import { radiologyOrderListRows, radiologyOrders } from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

function emptyStats(): RadiologyStats {
  return {
    total: 0,
    pending: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
  };
}

export async function listRadiologyOrders(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<RadiologyOrderListRow>> {
  // TODO(supabase): replace with supabase.from("radiology_orders").select("*")
  if (!isPreviewMode) {
    return emptyPage<RadiologyOrderListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = radiologyOrderListRows.filter((order) => {
    if (params.status && order.status !== params.status) {
      return false;
    }

    return matchesQuery(params.q, [
      order.order_number,
      order.patient_name,
      order.patient_mrn,
      order.ordered_by_name,
      order.examination_type,
      order.body_part,
      order.status,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getRadiologyStats(): Promise<
  DataResult<RadiologyStats>
> {
  // TODO(supabase): replace with supabase.from("radiology_orders").select("status")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const stats = emptyStats();

  for (const order of radiologyOrders) {
    stats.total += 1;

    switch (order.status) {
      case "pending":
        stats.pending += 1;
        break;
      case "scheduled":
        stats.scheduled += 1;
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
  }

  return { data: stats, error: null };
}

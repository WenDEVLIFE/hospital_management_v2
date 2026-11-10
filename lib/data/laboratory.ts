import type {
  LaboratoryStats,
  LabOrderListRow,
} from "@/types/hospital";
import { labOrderListRows, laboratoryOrders } from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

function emptyStats(): LaboratoryStats {
  return {
    total: 0,
    pending: 0,
    collection: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    urgent: 0,
    stat: 0,
  };
}

export async function listLabOrders(
  params: {
    q?: string;
    status?: string;
    priority?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<LabOrderListRow>> {
  // TODO(supabase): replace with supabase.from("laboratory_orders").select("*")
  if (!isPreviewMode) {
    return emptyPage<LabOrderListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = labOrderListRows.filter((order) => {
    if (params.status && order.status !== params.status) {
      return false;
    }

    if (params.priority && order.priority !== params.priority) {
      return false;
    }

    return matchesQuery(params.q, [
      order.order_number,
      order.patient_name,
      order.patient_mrn,
      order.ordered_by_name,
      order.tests.join(" "),
      order.priority,
      order.status,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getLabStats(): Promise<DataResult<LaboratoryStats>> {
  // TODO(supabase): replace with supabase.from("laboratory_orders").select("status, priority")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const stats = emptyStats();

  for (const order of laboratoryOrders) {
    stats.total += 1;

    switch (order.status) {
      case "pending":
        stats.pending += 1;
        break;
      case "collection":
        stats.collection += 1;
        break;
      case "processing":
        stats.processing += 1;
        break;
      case "completed":
        stats.completed += 1;
        break;
      case "cancelled":
        stats.cancelled += 1;
        break;
    }

    if (order.priority === "urgent") {
      stats.urgent += 1;
    }

    if (order.priority === "stat") {
      stats.stat += 1;
    }
  }

  return { data: stats, error: null };
}

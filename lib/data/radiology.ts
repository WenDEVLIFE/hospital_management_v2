import type {
  RadiologyOrder,
  RadiologyOrderListRow,
  RadiologyReport,
  RadiologyStats,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePagination, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const RADIOLOGY_ORDER_COLUMNS =
  "*, patients(first_name, middle_name, last_name, suffix, medical_record_number), profiles!radiology_orders_ordered_by_fkey(full_name), radiology_reports(report_status)";

type Relation<T> = T | T[] | null;

type RadiologyOrderJoinRow = RadiologyOrder & {
  patients: Relation<{
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    medical_record_number: string;
  }>;
  profiles: Relation<{ full_name: string }>;
  radiology_reports: Array<{
    report_status: RadiologyReport["report_status"];
  }> | null;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

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

function toRadiologyOrderListRow(
  row: RadiologyOrderJoinRow
): RadiologyOrderListRow {
  const patient = firstRelation(row.patients);
  const orderedBy = firstRelation(row.profiles);
  const report = (row.radiology_reports ?? [])[0] ?? null;

  return {
    id: row.id,
    order_number: row.order_number,
    patient_id: row.patient_id,
    patient_name: patient ? fullName(patient) : "Unknown patient",
    patient_mrn: patient?.medical_record_number ?? "\u2014",
    encounter_id: row.encounter_id,
    ordered_by_name: orderedBy?.full_name ?? "Unknown physician",
    examination_type: row.examination_type,
    body_part: row.body_part,
    scheduled_at: row.scheduled_at,
    status: row.status,
    report_status: report?.report_status ?? null,
    created_at: row.created_at,
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
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("radiology_orders")
    .select(RADIOLOGY_ORDER_COLUMNS, { count: "exact" });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      [
        `order_number.ilike.${term}`,
        `examination_type.ilike.${term}`,
        `body_part.ilike.${term}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: {
      rows: ((data ?? []) as RadiologyOrderJoinRow[]).map(
        toRadiologyOrderListRow
      ),
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function getRadiologyStats(): Promise<
  DataResult<RadiologyStats>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("radiology_orders")
    .select("status");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const stats = emptyStats();

  for (const order of (data ?? []) as Array<
    Pick<RadiologyOrder, "status">
  >) {
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

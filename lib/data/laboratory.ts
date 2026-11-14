import type {
  LabOrderListRow,
  LaboratoryOrder,
  LaboratorySpecimen,
  LaboratoryStats,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePagination, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const LAB_ORDER_COLUMNS =
  "*, patients(first_name, middle_name, last_name, suffix, medical_record_number), profiles!laboratory_orders_ordered_by_fkey(full_name), laboratory_order_items(laboratory_tests(test_name)), laboratory_specimens(collection_status)";

type Relation<T> = T | T[] | null;

type LabOrderJoinRow = LaboratoryOrder & {
  patients: Relation<{
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    medical_record_number: string;
  }>;
  profiles: Relation<{ full_name: string }>;
  laboratory_order_items: Array<{
    laboratory_tests: Relation<{ test_name: string }>;
  }> | null;
  laboratory_specimens: Array<{
    collection_status: LaboratorySpecimen["collection_status"];
  }> | null;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

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

function toLabOrderListRow(row: LabOrderJoinRow): LabOrderListRow {
  const patient = firstRelation(row.patients);
  const orderedBy = firstRelation(row.profiles);
  const items = row.laboratory_order_items ?? [];
  const tests = Array.from(
    new Set(
      items
        .map((item) => firstRelation(item.laboratory_tests)?.test_name)
        .filter((name): name is string => Boolean(name))
    )
  );
  const specimen = (row.laboratory_specimens ?? [])[0] ?? null;

  return {
    id: row.id,
    order_number: row.order_number,
    patient_id: row.patient_id,
    patient_name: patient ? fullName(patient) : "Unknown patient",
    patient_mrn: patient?.medical_record_number ?? "\u2014",
    encounter_id: row.encounter_id,
    ordered_by_name: orderedBy?.full_name ?? "Unknown physician",
    priority: row.priority,
    status: row.status,
    ordered_at: row.ordered_at,
    tests,
    item_count: items.length,
    specimen_status: specimen?.collection_status ?? null,
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
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("laboratory_orders")
    .select(LAB_ORDER_COLUMNS, { count: "exact" });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.priority) {
    query = query.eq("priority", params.priority);
  }

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    query = query.ilike("order_number", `%${search}%`);
  }

  const { data, error, count } = await query
    .order("ordered_at", { ascending: false })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: {
      rows: ((data ?? []) as LabOrderJoinRow[]).map(toLabOrderListRow),
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function getLabStats(): Promise<DataResult<LaboratoryStats>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("laboratory_orders")
    .select("status, priority");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const stats = emptyStats();

  for (const order of (data ?? []) as Array<
    Pick<LaboratoryOrder, "status" | "priority">
  >) {
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

import type { AuditLog, AuditLogRow, AuditStats } from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate, normalizePagination, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const AUDIT_COLUMNS = "*, profiles!audit_logs_actor_id_fkey(full_name)";

type Relation<T> = T | T[] | null;

type AuditLogJoinRow = AuditLog & {
  profiles: Relation<{ full_name: string }>;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function emptyStats(): AuditStats {
  return {
    total: 0,
    today: 0,
    success: 0,
    failed: 0,
    byAction: [],
  };
}

function auditResult(
  metadata: Record<string, unknown> | null
): "success" | "failed" {
  return metadata?.outcome === "failed" ? "failed" : "success";
}

function toAuditLogRow(row: AuditLogJoinRow): AuditLogRow {
  const actor = firstRelation(row.profiles);

  return {
    id: Number(row.id),
    created_at: row.created_at,
    actor_id: row.actor_id,
    actor_name: actor?.full_name ?? "System",
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    description: row.description,
    ip_address: row.ip_address,
    result: auditResult(row.metadata),
  };
}

export async function listAuditLogs(
  params: {
    q?: string;
    action?: string;
    actorId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AuditLogRow>> {
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("audit_logs")
    .select(AUDIT_COLUMNS, { count: "exact" });

  if (params.action) {
    query = query.eq("action", params.action);
  }

  if (params.actorId) {
    query = query.eq("actor_id", params.actorId);
  }

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      [
        `action.ilike.${term}`,
        `entity_type.ilike.${term}`,
        `description.ilike.${term}`,
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
      rows: ((data ?? []) as AuditLogJoinRow[]).map(toAuditLogRow),
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function getAuditStats(): Promise<DataResult<AuditStats>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("action, metadata, created_at");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const stats = emptyStats();
  const today = manilaDate(new Date().toISOString());
  const byAction = new Map<string, number>();

  for (const log of (data ?? []) as Array<
    Pick<AuditLog, "action" | "metadata" | "created_at">
  >) {
    stats.total += 1;

    if (auditResult(log.metadata) === "success") {
      stats.success += 1;
    } else {
      stats.failed += 1;
    }

    if (manilaDate(log.created_at) === today) {
      stats.today += 1;
    }

    byAction.set(log.action, (byAction.get(log.action) ?? 0) + 1);
  }

  stats.byAction = [...byAction.entries()]
    .map(([action, count]) => ({ action, count }))
    .sort((left, right) => left.action.localeCompare(right.action));

  return { data: stats, error: null };
}

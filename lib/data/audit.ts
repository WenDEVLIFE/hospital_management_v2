import type { AuditLogRow, AuditStats } from "@/types/hospital";
import { PREVIEW_NOW, auditLogRows } from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, manilaDate, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

function emptyStats(): AuditStats {
  return {
    total: 0,
    today: 0,
    success: 0,
    failed: 0,
    byAction: [],
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
  // TODO(supabase): replace with supabase.from("audit_logs").select("*")
  if (!isPreviewMode) {
    return emptyPage<AuditLogRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = auditLogRows.filter((log) => {
    if (params.action && log.action !== params.action) {
      return false;
    }

    if (params.actorId && log.actor_id !== params.actorId) {
      return false;
    }

    return matchesQuery(params.q, [
      log.actor_name,
      log.action,
      log.entity_type,
      log.description,
      log.ip_address,
      log.result,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getAuditStats(): Promise<DataResult<AuditStats>> {
  // TODO(supabase): replace with supabase.from("audit_logs").select("action")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const stats = emptyStats();
  const today = manilaDate(PREVIEW_NOW);
  const byAction = new Map<string, number>();

  for (const log of auditLogRows) {
    stats.total += 1;

    if (log.result === "success") {
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
    .sort((a, b) => a.action.localeCompare(b.action));

  return { data: stats, error: null };
}

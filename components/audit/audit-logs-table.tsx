"use client";

import {
  CheckCircleIcon,
  DangerCircleIcon,
  HistoryIcon,
} from "@solar-icons/react/linear";

import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import type { AuditLogRow } from "@/types/hospital";

export interface AuditLogsTableProps {
  rows: AuditLogRow[];
}

function formatModule(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function AuditResultBadge({ result }: { result: AuditLogRow["result"] }) {
  const success = result === "success";

  return (
    <Badge variant={success ? "success" : "critical"}>
      {success ? (
        <CheckCircleIcon className="size-3.5" aria-hidden="true" />
      ) : (
        <DangerCircleIcon className="size-3.5" aria-hidden="true" />
      )}
      <span>{success ? "Success" : "Failed"}</span>
    </Badge>
  );
}

export function AuditLogsTable({ rows }: AuditLogsTableProps) {
  const actions = Array.from(new Set(rows.map((row) => row.action))).sort(
    (a, b) => a.localeCompare(b)
  );

  const actors = Array.from(new Set(rows.map((row) => row.actor_name))).sort(
    (a, b) => a.localeCompare(b)
  );

  const columns: Column<AuditLogRow>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      cell: (row) => (
        <span className="whitespace-nowrap text-hospital-text-muted">
          {formatDateTime(row.created_at)}
        </span>
      ),
      sortable: true,
      sortValue: (row) => row.created_at,
    },
    {
      key: "user",
      header: "User",
      cell: (row) => (
        <span className="font-medium text-hospital-text">{row.actor_name}</span>
      ),
      sortable: true,
      sortValue: (row) => row.actor_name,
    },
    {
      key: "action",
      header: "Action",
      cell: (row) => <span className="text-hospital-text">{row.action}</span>,
      sortable: true,
      sortValue: (row) => row.action,
    },
    {
      key: "module",
      header: "Module",
      cell: (row) => (
        <span className="text-hospital-text-muted">
          {formatModule(row.entity_type)}
        </span>
      ),
      sortable: true,
      sortValue: (row) => row.entity_type,
    },
    {
      key: "affected_record",
      header: "Affected Record",
      cell: (row) =>
        row.entity_id ? (
          <span
            className="break-all font-mono text-[11px] text-hospital-text-muted"
            title={row.entity_id}
          >
            {row.entity_id}
          </span>
        ) : (
          <span className="text-hospital-text-muted">—</span>
        ),
    },
    {
      key: "result",
      header: "Result",
      cell: (row) => <AuditResultBadge result={row.result} />,
      sortable: true,
      sortValue: (row) => row.result,
    },
  ];

  const filters: FilterConfig<AuditLogRow>[] = [
    {
      key: "action",
      label: "Action",
      allLabel: "All actions",
      options: actions.map((action) => ({ label: action, value: action })),
      accessor: (row) => row.action,
    },
    {
      key: "actor",
      label: "User",
      allLabel: "All users",
      options: actors.map((actor) => ({ label: actor, value: actor })),
      accessor: (row) => row.actor_name,
    },
  ];

  return (
    <RecordTable
      rows={rows}
      columns={columns}
      rowKey={(row) => String(row.id)}
      caption="Audit log events"
      searchPlaceholder="Search action, module or user"
      searchAccessor={(row) =>
        `${row.action} ${row.entity_type} ${row.actor_name}`
      }
      filters={filters}
      emptyTitle="No audit events found"
      emptyDescription="Sensitive operations will be recorded here."
      emptyIcon={<HistoryIcon className="size-5" aria-hidden="true" />}
    />
  );
}

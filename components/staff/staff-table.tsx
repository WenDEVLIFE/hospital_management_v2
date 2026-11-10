"use client";

import * as React from "react";
import { EyeIcon } from "@solar-icons/react/linear";

import { RecordTable, type Column } from "@/components/module/record-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatIdentifier, formatName } from "@/lib/format";
import type { StaffListRow } from "@/types/hospital";

import { StaffDetailDialog } from "./staff-detail-dialog";
import {
  StaffWriteDialog,
  type StaffWriteRequest,
} from "./staff-write-dialog";

export interface StaffTableProps {
  rows: StaffListRow[];
}

export function StaffTable({ rows }: StaffTableProps) {
  const [selected, setSelected] = React.useState<StaffListRow | null>(null);
  const [writeRequest, setWriteRequest] =
    React.useState<StaffWriteRequest | null>(null);

  const departments = React.useMemo(() => {
    const byId = new Map<string, string>();

    for (const row of rows) {
      if (row.department_id && row.department_name) {
        byId.set(row.department_id, row.department_name);
      }
    }

    return [...byId.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "en"));
  }, [rows]);

  const columns: Column<StaffListRow>[] = [
    {
      key: "staff_number",
      header: "Staff ID",
      sortable: true,
      sortValue: (row) => row.staff_number,
      cell: (row) => (
        <span className="font-mono text-[11px] text-hospital-text">
          {formatIdentifier(row.staff_number)}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortValue: (row) => formatName(row),
      cell: (row) => (
        <span className="font-medium text-hospital-text" title={formatName(row)}>
          {formatName(row)}
        </span>
      ),
    },
    {
      key: "roles",
      header: "Role",
      cell: (row) =>
        row.role_names.length > 0 ? row.role_names.join(", ") : "\u2014",
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      sortValue: (row) => row.department_name ?? "",
      cell: (row) => row.department_name ?? "Unassigned",
    },
    {
      key: "contact",
      header: "Contact",
      cell: (row) => (
        <div className="min-w-0">
          <p>{row.contact_number ?? "\u2014"}</p>
          <p className="mt-0.5 break-all text-[11px] text-hospital-text-muted">
            {row.email}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Account Status",
      cell: (row) => (
        <StatusBadge status={row.is_active ? "active" : "inactive"} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelected(row)}
          aria-label={`View staff record for ${formatName(row)}`}
        >
          <EyeIcon className="size-3.5" aria-hidden="true" />
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <RecordTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        caption="Staff directory"
        searchPlaceholder="Search by staff ID, name, or contact"
        searchAccessor={(row) =>
          [
            row.staff_number,
            row.first_name,
            row.middle_name,
            row.last_name,
            row.full_name,
            row.contact_number,
            row.email,
          ]
            .filter(Boolean)
            .join(" ")
        }
        filters={[
          {
            key: "department",
            label: "department",
            allLabel: "All departments",
            options: departments,
            accessor: (row) => row.department_id ?? "",
          },
          {
            key: "account_status",
            label: "account status",
            allLabel: "All account statuses",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
            accessor: (row) => (row.is_active ? "active" : "inactive"),
          },
        ]}
        emptyTitle="No staff records found"
        emptyDescription="Staff accounts will appear here once they are provisioned."
      />

      <StaffDetailDialog
        staff={selected}
        onClose={() => setSelected(null)}
        onEdit={(staff) => {
          setSelected(null);
          setWriteRequest({ action: "edit", staff });
        }}
        onDeactivate={(staff) => {
          setSelected(null);
          setWriteRequest({ action: "deactivate", staff });
        }}
      />

      <StaffWriteDialog
        request={writeRequest}
        onClose={() => setWriteRequest(null)}
      />
    </>
  );
}

"use client";

import * as React from "react";
import { Buildings2Icon } from "@solar-icons/react/linear";

import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatIdentifier } from "@/lib/format";
import type { Department } from "@/types/hospital";

import { DepartmentAccent } from "./department-accent";

export interface DepartmentsTableProps {
  rows: Department[];
}

export function DepartmentsTable({ rows }: DepartmentsTableProps) {
  const [selected, setSelected] = React.useState<Department | null>(null);

  const columns: Column<Department>[] = [
    {
      key: "code",
      header: "Code",
      cell: (row) => (
        <span className="font-mono text-[11px] text-hospital-text-muted">
          {formatIdentifier(row.code)}
        </span>
      ),
      sortable: true,
      sortValue: (row) => row.code,
    },
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <span className="flex items-center gap-2">
          <DepartmentAccent code={row.code} />
          <span className="font-medium text-hospital-text">{row.name}</span>
        </span>
      ),
      sortable: true,
      sortValue: (row) => row.name,
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => (
        <span className="text-hospital-text-muted">
          {row.description ?? "—"}
        </span>
      ),
      className: "max-w-[360px]",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge status={row.is_active ? "active" : "inactive"} />
      ),
      sortable: true,
      sortValue: (row) => (row.is_active ? "Active" : "Inactive"),
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
          aria-label={`View ${row.name}`}
        >
          View
        </Button>
      ),
    },
  ];

  const filters: FilterConfig<Department>[] = [
    {
      key: "status",
      label: "Status",
      allLabel: "All statuses",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
      accessor: (row) => (row.is_active ? "active" : "inactive"),
    },
  ];

  return (
    <>
      <RecordTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        caption="Hospital departments"
        searchPlaceholder="Search by code or name"
        searchAccessor={(row) => `${row.code} ${row.name}`}
        filters={filters}
        emptyTitle="No departments found"
        emptyDescription="Departments will appear here once they are configured."
        emptyIcon={<Buildings2Icon className="size-5" aria-hidden="true" />}
      />

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Department"}
        description={
          selected
            ? `${formatIdentifier(selected.code)} · ${
                selected.is_active ? "Active" : "Inactive"
              }`
            : undefined
        }
        size="md"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <DepartmentAccent code={selected.code} />
              <span className="font-mono text-[11px] text-hospital-text-muted">
                {formatIdentifier(selected.code)}
              </span>
              <StatusBadge
                status={selected.is_active ? "active" : "inactive"}
              />
            </div>
            <p className="text-sm leading-relaxed text-hospital-text-muted">
              {selected.description ??
                "No description has been recorded for this department."}
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

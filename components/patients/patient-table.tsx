"use client";

import * as React from "react";
import Link from "next/link";
import { UserRoundedIcon } from "@solar-icons/react/linear";

import { RecordTable, type Column } from "@/components/module/record-table";
import { UnavailableActionDialog } from "@/components/module/unavailable-action";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PatientListRow } from "@/types/hospital";
import { formatDate, formatIdentifier, formatName } from "@/lib/format";

export interface PatientTableProps {
  rows: PatientListRow[];
}

export function PatientTable({ rows }: PatientTableProps) {
  const [editTarget, setEditTarget] = React.useState<PatientListRow | null>(
    null
  );

  const columns: Column<PatientListRow>[] = [
    {
      key: "mrn",
      header: "Medical Record Number",
      sortable: true,
      sortValue: (row) => row.medical_record_number,
      cell: (row) => (
        <Link
          href={`/patients/${row.id}`}
          className="rounded-sm font-mono text-[11px] font-medium text-hospital-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
        >
          {formatIdentifier(row.medical_record_number)}
        </Link>
      ),
    },
    {
      key: "name",
      header: "Patient Name",
      sortable: true,
      sortValue: (row) => formatName(row),
      cell: (row) => (
        <span className="font-medium text-hospital-text" title={formatName(row)}>
          {formatName(row)}
        </span>
      ),
    },
    {
      key: "sex",
      header: "Sex",
      cell: (row) => row.sex ?? "\u2014",
    },
    {
      key: "date_of_birth",
      header: "Date of Birth",
      sortable: true,
      sortValue: (row) => row.date_of_birth ?? "",
      cell: (row) =>
        row.date_of_birth ? formatDate(row.date_of_birth) : "\u2014",
    },
    {
      key: "contact_number",
      header: "Contact Number",
      cell: (row) => row.contact_number ?? "\u2014",
    },
    {
      key: "registration_date",
      header: "Registration Date",
      sortable: true,
      sortValue: (row) => row.registration_date,
      cell: (row) => formatDate(row.registration_date),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.registration_status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/patients/${row.id}`}
            className="inline-flex h-8 items-center rounded-md border border-hospital-green-border bg-white px-2.5 text-xs font-medium text-hospital-green transition-colors hover:bg-hospital-green-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
          >
            View
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="opacity-60"
            onClick={() => setEditTarget(row)}
            title="Editing is not available yet"
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <RecordTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        caption="Patient records"
        searchPlaceholder="Search by name, MRN, or contact number"
        searchAccessor={(row) =>
          [
            row.medical_record_number,
            row.full_name,
            row.first_name,
            row.middle_name,
            row.last_name,
            row.contact_number,
          ]
            .filter(Boolean)
            .join(" ")
        }
        filters={[
          {
            key: "registration_status",
            label: "registration status",
            allLabel: "All statuses",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Archived", value: "archived" },
            ],
            accessor: (row) => row.registration_status,
          },
        ]}
        emptyTitle="No patients found"
        emptyDescription="There are currently no patient records matching your search."
        emptyAction={
          <Link href="/patients/new">
            <Button>Register Patient</Button>
          </Link>
        }
        emptyIcon={<UserRoundedIcon className="size-5" aria-hidden="true" />}
      />

      <UnavailableActionDialog
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Edit patient record"
        description={
          editTarget
            ? `Editing ${formatName(editTarget)} is not available yet.`
            : undefined
        }
      />
    </>
  );
}

"use client";

import Link from "next/link";

import { RecordTable, type Column } from "@/components/module/record-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatIdentifier, formatName } from "@/lib/format";
import type { PatientListRow } from "@/types/hospital";

const COLUMNS: Column<PatientListRow>[] = [
  {
    key: "mrn",
    header: "Medical Record Number",
    cell: (row) => (
      <Link
        href={`/patients/${row.id}`}
        className="cursor-pointer rounded-sm font-mono text-[11px] text-hospital-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
      >
        {formatIdentifier(row.medical_record_number)}
      </Link>
    ),
  },
  {
    key: "patient",
    header: "Patient",
    cell: (row) => formatName(row),
  },
  {
    key: "sex",
    header: "Sex",
    cell: (row) => row.sex ?? "\u2014",
  },
  {
    key: "registrationDate",
    header: "Registration Date",
    cell: (row) => formatDate(row.registration_date),
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.registration_status} />,
  },
];

export interface RecentRegistrationsTableProps {
  rows: PatientListRow[];
}

export function RecentRegistrationsTable({ rows }: RecentRegistrationsTableProps) {
  return (
    <RecordTable
      rows={rows}
      columns={COLUMNS}
      rowKey={(row) => row.id}
      caption="Recent patient registrations"
      pageSize={5}
      emptyTitle="No recent registrations"
      emptyDescription="Newly registered patients will appear here."
    />
  );
}

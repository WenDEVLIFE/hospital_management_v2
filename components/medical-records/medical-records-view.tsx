"use client";

import * as React from "react";
import { EyeIcon } from "@solar-icons/react/linear";

import { RecordTable, type Column } from "@/components/module/record-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatIdentifier } from "@/lib/format";
import type { EncounterDetail, EncounterListRow } from "@/types/hospital";

import { EncounterDetailDialog } from "./encounter-detail-dialog";

export interface MedicalRecordsViewProps {
  rows: EncounterListRow[];
  detailsById: Record<string, EncounterDetail | undefined>;
  staffNamesByUserId: Record<string, string>;
}

const CLINICAL_STATUS_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export function MedicalRecordsView({
  rows,
  detailsById,
  staffNamesByUserId,
}: MedicalRecordsViewProps) {
  const [selectedRow, setSelectedRow] = React.useState<EncounterListRow | null>(
    null
  );

  const columns: Column<EncounterListRow>[] = [
    {
      key: "encounter_number",
      header: "Encounter No.",
      sortable: true,
      sortValue: (row) => row.encounter_number,
      cell: (row) => (
        <span className="font-mono text-[11px] text-hospital-text">
          {row.encounter_number}
        </span>
      ),
    },
    {
      key: "patient",
      header: "Patient",
      sortable: true,
      sortValue: (row) => row.patient_name,
      cell: (row) => (
        <div className="min-w-0">
          <p
            className="font-medium text-hospital-text"
            title={row.patient_name}
          >
            {row.patient_name}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-hospital-text-muted">
            {formatIdentifier(row.patient_mrn)}
          </p>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      sortValue: (row) => row.department_name,
      cell: (row) => row.department_name,
    },
    {
      key: "physician",
      header: "Physician",
      sortable: true,
      sortValue: (row) => row.physician_name ?? "",
      cell: (row) => row.physician_name ?? "\u2014",
    },
    {
      key: "encounter_type",
      header: "Type",
      cell: (row) => row.encounter_type,
    },
    {
      key: "chief_complaint",
      header: "Chief Complaint",
      cell: (row) =>
        row.chief_complaint ? (
          <span
            className="block max-w-[220px] truncate"
            title={row.chief_complaint}
          >
            {row.chief_complaint}
          </span>
        ) : (
          <span className="text-hospital-text-muted">Not recorded</span>
        ),
    },
    {
      key: "started_at",
      header: "Started",
      sortable: true,
      sortValue: (row) => row.started_at,
      cell: (row) => formatDateTime(row.started_at),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.clinical_status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedRow(row)}
          aria-label={`Open encounter ${row.encounter_number}`}
        >
          <EyeIcon className="size-3.5" aria-hidden="true" />
          Open encounter
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
        caption="Clinical encounters"
        searchPlaceholder="Search by encounter number, patient, or physician"
        searchAccessor={(row) =>
          [
            row.encounter_number,
            row.patient_name,
            row.patient_mrn,
            row.physician_name,
          ]
            .filter(Boolean)
            .join(" ")
        }
        filters={[
          {
            key: "clinical_status",
            label: "clinical status",
            allLabel: "All clinical statuses",
            options: CLINICAL_STATUS_OPTIONS,
            accessor: (row) => row.clinical_status,
          },
        ]}
        emptyTitle="No encounters found"
        emptyDescription="Encounters will appear here once a patient visit is opened."
      />

      <EncounterDetailDialog
        row={selectedRow}
        detail={selectedRow ? detailsById[selectedRow.id] : undefined}
        staffNamesByUserId={staffNamesByUserId}
        onClose={() => setSelectedRow(null)}
      />
    </>
  );
}

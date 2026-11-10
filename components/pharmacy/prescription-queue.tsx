"use client";

import * as React from "react";
import { Pills2Icon } from "@solar-icons/react/linear";

import { RecordTable, type Column } from "@/components/module/record-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import type { PrescriptionListRow } from "@/types/hospital";

import { DispenseDialog } from "./dispense-dialog";

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Partially Dispensed", value: "partially_dispensed" },
  { label: "Dispensed", value: "dispensed" },
  { label: "Cancelled", value: "cancelled" },
];

export interface PrescriptionQueueProps {
  rows: PrescriptionListRow[];
}

export function PrescriptionQueue({ rows }: PrescriptionQueueProps) {
  const [selected, setSelected] =
    React.useState<PrescriptionListRow | null>(null);

  const columns = React.useMemo<Column<PrescriptionListRow>[]>(
    () => [
      {
        key: "prescription_number",
        header: "Prescription No.",
        sortable: true,
        sortValue: (row) => row.prescription_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.prescription_number}
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
            <span className="font-medium text-hospital-text">
              {row.patient_name}
            </span>
            <span className="mt-0.5 block font-mono text-[11px] text-hospital-text-muted">
              {row.patient_mrn}
            </span>
          </div>
        ),
      },
      {
        key: "prescribed_by",
        header: "Prescribing Physician",
        sortable: true,
        sortValue: (row) => row.prescribed_by_name,
        cell: (row) => row.prescribed_by_name,
      },
      {
        key: "prescription_date",
        header: "Date",
        sortable: true,
        sortValue: (row) => row.prescription_date,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.prescription_date)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Dispensing Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Dispense prescription ${row.prescription_number}`}
            onClick={() => setSelected(row)}
          >
            Dispense
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <RecordTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        caption="Prescription queue"
        searchPlaceholder="Search prescription no., patient, or physician"
        searchAccessor={(row) =>
          [
            row.prescription_number,
            row.patient_name,
            row.patient_mrn,
            row.prescribed_by_name,
          ].join(" ")
        }
        filters={[
          {
            key: "status",
            label: "dispensing status",
            allLabel: "All dispensing statuses",
            options: STATUS_OPTIONS,
            accessor: (row) => row.status,
          },
        ]}
        emptyTitle="No prescriptions in the queue"
        emptyDescription="Prescriptions issued during consultations will appear here."
        emptyIcon={<Pills2Icon className="size-5" aria-hidden="true" />}
      />

      <DispenseDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        prescription={selected}
      />
    </>
  );
}

"use client";

import * as React from "react";
import { LogoutIcon } from "@solar-icons/react/linear";

import type { AdmissionListRow } from "@/types/hospital";
import { RecordTable, type Column } from "@/components/module/record-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";

export interface DischargesViewProps {
  rows: AdmissionListRow[];
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-hospital-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-hospital-text">{children}</dd>
    </div>
  );
}

export function DischargesView({ rows }: DischargesViewProps) {
  const [selected, setSelected] = React.useState<AdmissionListRow | null>(null);

  const columns = React.useMemo<Column<AdmissionListRow>[]>(
    () => [
      {
        key: "admission_number",
        header: "Admission No.",
        sortable: true,
        sortValue: (row) => row.admission_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.admission_number}
          </span>
        ),
      },
      {
        key: "patient",
        header: "Patient",
        sortable: true,
        sortValue: (row) => row.patient_name,
        cell: (row) => (
          <span className="font-medium text-hospital-text">{row.patient_name}</span>
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
        key: "admitted",
        header: "Admitted",
        sortable: true,
        sortValue: (row) => row.admission_date,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.admission_date)}
          </span>
        ),
      },
      {
        key: "discharged",
        header: "Discharged",
        sortable: true,
        sortValue: (row) => row.discharge_date ?? "",
        cell: (row) => (
          <span className="whitespace-nowrap">
            {row.discharge_date ? formatDateTime(row.discharge_date) : "\u2014"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
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
            aria-label={`View discharge summary for ${row.admission_number}`}
            onClick={() => setSelected(row)}
            className="whitespace-nowrap"
          >
            View discharge summary
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
        caption="Discharge records"
        searchPlaceholder="Search admission no. or patient"
        searchAccessor={(row) =>
          `${row.admission_number} ${row.patient_name}`
        }
        emptyTitle="No discharges recorded"
        emptyDescription="Completed discharges will appear here."
        emptyIcon={<LogoutIcon className="size-5" aria-hidden="true" />}
        pageSize={10}
      />

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `Discharge ${selected.admission_number}`
            : "Discharge summary"
        }
        description="Completed discharge record"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Patient">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">{selected.patient_name}</span>
                  <span className="font-mono text-[11px] text-hospital-text-muted">
                    {selected.patient_mrn}
                  </span>
                </div>
              </DetailField>

              <DetailField label="Status">
                <StatusBadge status={selected.status} />
              </DetailField>

              <DetailField label="Department">
                {selected.department_name}
              </DetailField>

              <DetailField label="Attending physician">
                {selected.attending_physician_name ?? "Unassigned"}
              </DetailField>

              <DetailField label="Admitted">
                {formatDateTime(selected.admission_date)}
              </DetailField>

              <DetailField label="Discharged">
                {selected.discharge_date
                  ? formatDateTime(selected.discharge_date)
                  : "\u2014"}
              </DetailField>

              <DetailField label="Room">
                {selected.room_number ?? "\u2014"}
              </DetailField>

              <DetailField label="Bed">
                {selected.bed_number ?? "\u2014"}
              </DetailField>
            </dl>

            <p className="rounded-md border border-hospital-border bg-hospital-surface p-3 text-xs leading-relaxed text-hospital-text-muted">
              Detailed discharge documentation is not available in this
              workspace yet. Only the recorded admission details are shown.
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

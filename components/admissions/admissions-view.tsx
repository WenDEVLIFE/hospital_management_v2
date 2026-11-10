"use client";

import * as React from "react";
import { ClipboardListIcon } from "@solar-icons/react/linear";

import type { AdmissionListRow } from "@/types/hospital";
import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";

const ADMISSION_STATUS_OPTIONS = [
  { value: "admitted", label: "Admitted" },
  { value: "transferred", label: "Transferred" },
  { value: "discharged", label: "Discharged" },
  { value: "cancelled", label: "Cancelled" },
];

export interface AdmissionsViewProps {
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

export function AdmissionsView({ rows }: AdmissionsViewProps) {
  const [selected, setSelected] = React.useState<AdmissionListRow | null>(null);

  const departments = React.useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.department_name)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [rows]);

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
        key: "physician",
        header: "Attending Physician",
        sortable: true,
        sortValue: (row) => row.attending_physician_name ?? "",
        cell: (row) => row.attending_physician_name ?? "Unassigned",
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
        key: "type",
        header: "Type",
        cell: (row) => row.admission_type ?? "\u2014",
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
            aria-label={`View admission ${row.admission_number}`}
            onClick={() => setSelected(row)}
          >
            View
          </Button>
        ),
      },
    ],
    []
  );

  const filters = React.useMemo<FilterConfig<AdmissionListRow>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: ADMISSION_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "department",
        label: "department",
        allLabel: "All departments",
        options: departments.map((name) => ({ label: name, value: name })),
        accessor: (row) => row.department_name,
      },
    ],
    [departments]
  );

  return (
    <>
      <RecordTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        caption="Admission list"
        searchPlaceholder="Search admission no. or patient"
        searchAccessor={(row) =>
          `${row.admission_number} ${row.patient_name}`
        }
        filters={filters}
        emptyTitle="No admissions found"
        emptyDescription="There are no admissions matching your selected filters."
        emptyIcon={<ClipboardListIcon className="size-5" aria-hidden="true" />}
        pageSize={10}
      />

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `Admission ${selected.admission_number}`
            : "Admission details"
        }
        description="Inpatient admission details"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {selected ? (
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

            <DetailField label="Type">
              {selected.admission_type ?? "\u2014"}
            </DetailField>

            <DetailField label="Room">
              {selected.room_number ?? "\u2014"}
            </DetailField>

            <DetailField label="Bed">
              {selected.bed_number ?? "\u2014"}
            </DetailField>

            {selected.status === "discharged" ? (
              <DetailField label="Discharged">
                {selected.discharge_date
                  ? formatDateTime(selected.discharge_date)
                  : "\u2014"}
              </DetailField>
            ) : null}
          </dl>
        ) : null}
      </Modal>
    </>
  );
}

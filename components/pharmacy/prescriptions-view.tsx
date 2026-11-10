"use client";

import * as React from "react";
import { DocumentMedicineIcon, Pills2Icon } from "@solar-icons/react/linear";

import { RecordTable, type Column } from "@/components/module/record-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import type { PrescriptionListRow } from "@/types/hospital";

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Partially Dispensed", value: "partially_dispensed" },
  { label: "Dispensed", value: "dispensed" },
  { label: "Cancelled", value: "cancelled" },
];

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

export interface PrescriptionsViewProps {
  rows: PrescriptionListRow[];
}

export function PrescriptionsView({ rows }: PrescriptionsViewProps) {
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
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "items",
        header: "Items",
        align: "right",
        sortable: true,
        sortValue: (row) => row.item_count,
        cell: (row) => (
          <span className="tabular-nums">{row.item_count}</span>
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
            aria-label={`View prescription ${row.prescription_number}`}
            onClick={() => setSelected(row)}
          >
            View
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
        caption="Prescription records"
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
            label: "status",
            allLabel: "All statuses",
            options: STATUS_OPTIONS,
            accessor: (row) => row.status,
          },
        ]}
        emptyTitle="No prescriptions found"
        emptyDescription="Prescriptions issued during consultations will appear here."
        emptyIcon={
          <DocumentMedicineIcon className="size-5" aria-hidden="true" />
        }
      />

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `Prescription ${selected.prescription_number}`
            : "Prescription"
        }
        description={
          selected
            ? `${selected.patient_name} · ${selected.patient_mrn}`
            : undefined
        }
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
              <DetailField label="Prescription number">
                <span className="font-mono text-[11px]">
                  {selected.prescription_number}
                </span>
              </DetailField>

              <DetailField label="Status">
                <StatusBadge status={selected.status} />
              </DetailField>

              <DetailField label="Patient">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">{selected.patient_name}</span>
                  <span className="font-mono text-[11px] text-hospital-text-muted">
                    {selected.patient_mrn}
                  </span>
                </div>
              </DetailField>

              <DetailField label="Prescribed by">
                {selected.prescribed_by_name}
              </DetailField>

              <DetailField label="Prescription date">
                {formatDateTime(selected.prescription_date)}
              </DetailField>
            </dl>

            <section className="rounded-md border border-hospital-border p-4">
              <h3 className="text-sm font-semibold text-hospital-text">
                Medication items
              </h3>

              {selected.medications.length > 0 ? (
                <>
                  <ul className="mt-3">
                    {selected.medications.map((medication, index) => (
                      <li
                        key={`${medication}-${index}`}
                        className="flex items-center justify-between gap-2 border-b border-hospital-border-subtle py-2 last:border-b-0"
                      >
                        <span className="text-sm text-hospital-text">
                          {medication}
                        </span>
                        <span className="text-[11px] text-hospital-text-subtle">
                          Medication on record
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[11px] text-hospital-text-muted">
                    Dosage, frequency and quantity line details are not included
                    in this list view.
                  </p>
                </>
              ) : (
                <EmptyState
                  icon={<Pills2Icon className="size-5" aria-hidden="true" />}
                  title="No medication items"
                  description="No medication items were supplied for this prescription."
                  className="px-0 py-6"
                />
              )}
            </section>

            <section className="rounded-md border border-hospital-border p-4">
              <h3 className="text-sm font-semibold text-hospital-text">
                Dispensing
              </h3>
              <EmptyState
                icon={<Pills2Icon className="size-5" aria-hidden="true" />}
                title="Dispensing history unavailable"
                description="Dispensing records are not included in this list view."
                className="px-0 py-6"
              />
            </section>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

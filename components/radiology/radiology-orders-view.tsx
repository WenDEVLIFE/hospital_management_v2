"use client";

import * as React from "react";
import { Scanner2Icon } from "@solar-icons/react/linear";

import { RecordTable, type Column } from "@/components/module/record-table";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import type { RadiologyOrderListRow } from "@/types/hospital";

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Scheduled", value: "scheduled" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
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

export interface RadiologyOrdersViewProps {
  rows: RadiologyOrderListRow[];
}

export function RadiologyOrdersView({ rows }: RadiologyOrdersViewProps) {
  const [selected, setSelected] =
    React.useState<RadiologyOrderListRow | null>(null);

  const columns = React.useMemo<Column<RadiologyOrderListRow>[]>(
    () => [
      {
        key: "order_number",
        header: "Request No.",
        sortable: true,
        sortValue: (row) => row.order_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.order_number}
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
        key: "examination_type",
        header: "Examination Type",
        sortable: true,
        sortValue: (row) => row.examination_type,
        cell: (row) => row.examination_type,
      },
      {
        key: "body_part",
        header: "Body Part",
        sortable: true,
        sortValue: (row) => row.body_part ?? "",
        cell: (row) => row.body_part ?? "\u2014",
      },
      {
        key: "ordered_by",
        header: "Requesting Physician",
        sortable: true,
        sortValue: (row) => row.ordered_by_name,
        cell: (row) => row.ordered_by_name,
      },
      {
        key: "scheduled_at",
        header: "Schedule",
        sortable: true,
        sortValue: (row) => row.scheduled_at ?? "",
        cell: (row) =>
          row.scheduled_at ? (
            <span className="whitespace-nowrap">
              {formatDateTime(row.scheduled_at)}
            </span>
          ) : (
            <span className="text-hospital-text-subtle">Not scheduled</span>
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
            aria-label={`View radiology request ${row.order_number}`}
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
        caption="Radiology requests"
        searchPlaceholder="Search request no., patient, or examination"
        searchAccessor={(row) =>
          [
            row.order_number,
            row.patient_name,
            row.patient_mrn,
            row.examination_type,
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
        emptyTitle="No radiology requests found"
        emptyDescription="Imaging requests created during consultations will appear here."
        emptyIcon={<Scanner2Icon className="size-5" aria-hidden="true" />}
      />

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `Radiology request ${selected.order_number}`
            : "Radiology request"
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
            {selected.report_status === "draft" ? (
              <Alert variant="warning" title="Draft report">
                <p>This report is a draft and has not been verified.</p>
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Request number">
                <span className="font-mono text-[11px]">
                  {selected.order_number}
                </span>
              </DetailField>

              <DetailField label="Patient">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">{selected.patient_name}</span>
                  <span className="font-mono text-[11px] text-hospital-text-muted">
                    {selected.patient_mrn}
                  </span>
                </div>
              </DetailField>

              <DetailField label="Examination">
                {selected.examination_type}
              </DetailField>

              <DetailField label="Body part">
                {selected.body_part ?? "\u2014"}
              </DetailField>

              <DetailField label="Requesting physician">
                {selected.ordered_by_name}
              </DetailField>

              <DetailField label="Order status">
                <StatusBadge status={selected.status} />
              </DetailField>

              <DetailField label="Scheduled">
                {selected.scheduled_at
                  ? formatDateTime(selected.scheduled_at)
                  : "Not scheduled"}
              </DetailField>

              <DetailField label="Requested at">
                {formatDateTime(selected.created_at)}
              </DetailField>
            </dl>

            <section className="rounded-md border border-hospital-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-hospital-text">
                  Imaging report
                </h3>
                {selected.report_status ? (
                  <StatusBadge status={selected.report_status} />
                ) : (
                  <Badge variant="inactive">No report filed</Badge>
                )}
              </div>

              {selected.report_status ? (
                <>
                  <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                    <DetailField label="Reported at">
                      <span className="text-hospital-text-muted">
                        Not included in this list view
                      </span>
                    </DetailField>
                    <DetailField label="Reported by">
                      <span className="text-hospital-text-muted">
                        Not included in this list view
                      </span>
                    </DetailField>
                    <DetailField label="Verified at">
                      <span className="text-hospital-text-muted">
                        Not included in this list view
                      </span>
                    </DetailField>
                    <DetailField label="Verified by">
                      <span className="text-hospital-text-muted">
                        Not included in this list view
                      </span>
                    </DetailField>
                  </dl>

                  <EmptyState
                    icon={<Scanner2Icon className="size-5" aria-hidden="true" />}
                    title="Report content not included"
                    description="Imaging report content is not included in this request list view. It will appear once the radiology report feed is connected."
                    className="px-0 py-6"
                  />
                </>
              ) : (
                <EmptyState
                  icon={<Scanner2Icon className="size-5" aria-hidden="true" />}
                  title="No report filed"
                  description="No imaging report has been submitted for this request yet."
                  className="px-0 py-6"
                />
              )}
            </section>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

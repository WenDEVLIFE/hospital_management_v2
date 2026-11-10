"use client";

import * as React from "react";
import { TestTubeIcon } from "@solar-icons/react/linear";

import { RecordTable, type Column } from "@/components/module/record-table";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import type { LabOrderListRow } from "@/types/hospital";

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Collection", value: "collection" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const PRIORITY_OPTIONS = [
  { label: "Routine", value: "routine" },
  { label: "Urgent", value: "urgent" },
  { label: "STAT", value: "stat" },
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

function DetailGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-hospital-border p-4">
      <h3 className="text-sm font-semibold text-hospital-text">{title}</h3>
      <dl className="mt-3 space-y-3">{children}</dl>
    </section>
  );
}

export interface LabOrdersViewProps {
  rows: LabOrderListRow[];
}

export function LabOrdersView({ rows }: LabOrdersViewProps) {
  const [selected, setSelected] = React.useState<LabOrderListRow | null>(null);
  const [verifyTarget, setVerifyTarget] =
    React.useState<LabOrderListRow | null>(null);
  const [verifyAcknowledged, setVerifyAcknowledged] = React.useState(false);

  const closeVerify = React.useCallback(() => {
    setVerifyTarget(null);
    setVerifyAcknowledged(false);
  }, []);

  const columns = React.useMemo<Column<LabOrderListRow>[]>(
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
        key: "tests",
        header: "Requested Test",
        sortable: true,
        sortValue: (row) => row.tests.join(", "),
        cell: (row) =>
          row.tests.length > 0 ? (
            <span className="block max-w-64">{row.tests.join(", ")}</span>
          ) : (
            <span className="text-hospital-text-subtle">Not recorded</span>
          ),
      },
      {
        key: "ordered_at",
        header: "Ordered",
        sortable: true,
        sortValue: (row) => row.ordered_at,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.ordered_at)}
          </span>
        ),
      },
      {
        key: "priority",
        header: "Priority",
        cell: (row) => <StatusBadge status={row.priority} />,
      },
      {
        key: "specimen",
        header: "Specimen",
        cell: (row) =>
          row.specimen_status ? (
            <StatusBadge status={row.specimen_status} />
          ) : (
            <span className="text-hospital-text-subtle">Not recorded</span>
          ),
      },
      {
        key: "status",
        header: "Processing Status",
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
            aria-label={`View laboratory request ${row.order_number}`}
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
        caption="Laboratory requests"
        searchPlaceholder="Search request no., patient, or test"
        searchAccessor={(row) =>
          [
            row.order_number,
            row.patient_name,
            row.patient_mrn,
            row.tests.join(" "),
          ].join(" ")
        }
        filters={[
          {
            key: "status",
            label: "processing status",
            allLabel: "All processing statuses",
            options: STATUS_OPTIONS,
            accessor: (row) => row.status,
          },
          {
            key: "priority",
            label: "priority",
            allLabel: "All priorities",
            options: PRIORITY_OPTIONS,
            accessor: (row) => row.priority,
          },
        ]}
        emptyTitle="No laboratory requests found"
        emptyDescription="Laboratory requests created during consultations will appear here."
        emptyIcon={<TestTubeIcon className="size-5" aria-hidden="true" />}
      />

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `Laboratory request ${selected.order_number}`
            : "Laboratory request"
        }
        description={
          selected
            ? `${selected.patient_name} · ${selected.patient_mrn}`
            : undefined
        }
        size="lg"
        footer={
          selected ? (
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setVerifyTarget(selected);
                  setSelected(null);
                  setVerifyAcknowledged(false);
                }}
              >
                Verify result
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-4">
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

              <DetailField label="Requested tests">
                {selected.tests.length > 0
                  ? selected.tests.join(", ")
                  : "Not recorded"}
              </DetailField>

              <DetailField label="Ordered by">
                {selected.ordered_by_name}
              </DetailField>

              <DetailField label="Priority">
                <StatusBadge status={selected.priority} />
              </DetailField>

              <DetailField label="Ordered at">
                {formatDateTime(selected.ordered_at)}
              </DetailField>
            </dl>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailGroup title="Specimen status">
                <DetailField label="Collection status">
                  {selected.specimen_status ? (
                    <StatusBadge status={selected.specimen_status} />
                  ) : (
                    <span className="text-hospital-text-subtle">
                      Not recorded
                    </span>
                  )}
                </DetailField>
                <DetailField label="Collection timestamp">
                  <span className="text-hospital-text-muted">
                    Not included in this list view
                  </span>
                </DetailField>
              </DetailGroup>

              <DetailGroup title="Result status">
                <DetailField label="Result stage">
                  <StatusBadge status={selected.status} />
                </DetailField>
                <DetailField label="Verification">
                  <span className="text-hospital-text-muted">
                    Not included in this list view
                  </span>
                </DetailField>
              </DetailGroup>
            </div>

            <section className="rounded-md border border-hospital-border p-4">
              <h3 className="text-sm font-semibold text-hospital-text">
                Results
              </h3>

              {selected.tests.length > 0 ? (
                <ul className="mt-3">
                  {selected.tests.map((test, index) => (
                    <li
                      key={`${test}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-hospital-border-subtle py-2 last:border-b-0"
                    >
                      <span className="text-sm text-hospital-text">{test}</span>
                      <Badge variant="inactive">Result value not supplied</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={<TestTubeIcon className="size-5" aria-hidden="true" />}
                  title="No tests on record"
                  description="This request does not list any requested tests."
                  className="px-0 py-6"
                />
              )}

              <p className="mt-3 text-[11px] text-hospital-text-muted">
                Result values, units and reference ranges are displayed only
                when supplied by the authorized laboratory configuration.
              </p>
            </section>

            <Alert variant="warning" title="Verification required">
              <p>
                Unverified results are not final. Only authorized laboratory
                personnel may verify results.
              </p>
            </Alert>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={verifyTarget !== null}
        onClose={closeVerify}
        title="Verify laboratory result"
        description={
          verifyTarget
            ? `Request ${verifyTarget.order_number} · ${verifyTarget.patient_name}`
            : undefined
        }
        size="md"
        footer={
          verifyAcknowledged ? (
            <Button variant="secondary" onClick={closeVerify}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={closeVerify}>
                Cancel
              </Button>
              <Button onClick={() => setVerifyAcknowledged(true)}>
                Verify result
              </Button>
            </>
          )
        }
      >
        {verifyAcknowledged ? (
          <Alert variant="info">
            <p>
              This action is not available yet because the Supabase backend is
              not connected.
            </p>
          </Alert>
        ) : (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-hospital-text-muted">
              Verifying a result finalizes it for the requesting clinician.
              Confirm that you are authorized to release this result before
              continuing.
            </p>
            <Alert variant="warning" title="Authorization required">
              <p>
                Unverified results are not final. Only authorized laboratory
                personnel may verify results.
              </p>
            </Alert>
          </div>
        )}
      </Modal>
    </>
  );
}

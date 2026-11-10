"use client";

import * as React from "react";
import { WalletMoneyIcon } from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { RecordTable, type Column } from "@/components/module/record-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PaymentListRow } from "@/types/hospital";
import { formatCurrency, formatDateTime } from "@/lib/format";

export interface PaymentsViewProps {
  payments: PaymentListRow[];
}

const PAYMENT_STATUS_FILTERS = [
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
  { label: "Cancelled", value: "cancelled" },
];

function Detail({
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

export function PaymentsView({ payments }: PaymentsViewProps) {
  const [selected, setSelected] = React.useState<PaymentListRow | null>(null);
  const [refundTarget, setRefundTarget] =
    React.useState<PaymentListRow | null>(null);
  const [refundConfirmed, setRefundConfirmed] = React.useState(false);

  const openRefund = React.useCallback((payment: PaymentListRow) => {
    setRefundConfirmed(false);
    setRefundTarget(payment);
  }, []);

  const closeRefund = React.useCallback(() => {
    setRefundTarget(null);
    setRefundConfirmed(false);
  }, []);

  const columns: Column<PaymentListRow>[] = [
    {
      key: "payment_reference",
      header: "Payment Reference",
      sortable: true,
      sortValue: (row) => row.payment_reference,
      cell: (row) => (
        <span className="font-mono text-[11px] text-hospital-text">
          {row.payment_reference}
        </span>
      ),
    },
    {
      key: "invoice_number",
      header: "Invoice No.",
      sortable: true,
      sortValue: (row) => row.invoice_number,
      cell: (row) => (
        <span className="font-mono text-[11px] text-hospital-text-muted">
          {row.invoice_number}
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
      key: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      sortValue: (row) => row.amount,
      cell: (row) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "payment_method",
      header: "Method",
      sortable: true,
      sortValue: (row) => row.payment_method,
      cell: (row) => row.payment_method,
    },
    {
      key: "received_by",
      header: "Received By",
      sortable: true,
      sortValue: (row) => row.received_by_name,
      cell: (row) => row.received_by_name,
    },
    {
      key: "received_at",
      header: "Received",
      sortable: true,
      sortValue: (row) => row.received_at,
      cell: (row) => (
        <span className="whitespace-nowrap">
          {formatDateTime(row.received_at)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (row) => row.payment_status,
      cell: (row) => <StatusBadge status={row.payment_status} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View receipt ${row.payment_reference}`}
            onClick={() => setSelected(row)}
          >
            View receipt
          </Button>
          {row.payment_status === "completed" ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Refund payment ${row.payment_reference}`}
              onClick={() => openRefund(row)}
            >
              Refund
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <RecordTable
        rows={payments}
        columns={columns}
        rowKey={(row) => row.id}
        caption="Recorded payments"
        searchPlaceholder="Search reference, invoice number, or patient"
        searchAccessor={(row) =>
          [
            row.payment_reference,
            row.invoice_number,
            row.patient_name,
            row.payment_method,
          ]
            .filter(Boolean)
            .join(" ")
        }
        filters={[
          {
            key: "payment_status",
            label: "payment status",
            allLabel: "All payment statuses",
            options: PAYMENT_STATUS_FILTERS,
            accessor: (row) => row.payment_status,
          },
        ]}
        emptyTitle="No payments recorded"
        emptyDescription="Recorded payments will appear here."
        emptyIcon={<WalletMoneyIcon className="size-5" aria-hidden="true" />}
        pageSize={10}
      />

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected ? `Payment ${selected.payment_reference}` : "Payment details"
        }
        description="Recorded payment details and transaction reference."
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-hospital-text">
                Southern Philippines Medical Center
              </p>
              <p className="text-[11px] text-hospital-text-muted">
                Hospital Management System
              </p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Payment reference">
                <span className="font-mono text-[11px]">
                  {selected.payment_reference}
                </span>
              </Detail>
              <Detail label="Invoice number">
                <span className="font-mono text-[11px]">
                  {selected.invoice_number}
                </span>
              </Detail>
              <Detail label="Patient">{selected.patient_name}</Detail>
              <Detail label="Amount">
                <span className="font-semibold tabular-nums">
                  {formatCurrency(selected.amount)}
                </span>
              </Detail>
              <Detail label="Payment method">{selected.payment_method}</Detail>
              <Detail label="Status">
                <StatusBadge status={selected.payment_status} />
              </Detail>
              <Detail label="Received by">{selected.received_by_name}</Detail>
              <Detail label="Received">
                {formatDateTime(selected.received_at)}
              </Detail>
            </dl>

            {selected.notes ? (
              <div>
                <p className="text-[11px] font-medium text-hospital-text-muted">
                  Notes
                </p>
                <p className="mt-0.5 text-sm text-hospital-text">
                  {selected.notes}
                </p>
              </div>
            ) : null}

            <Alert variant="info">
              This receipt reflects the recorded payment. Finalized financial
              records are not modified without the authorized refund workflow.
            </Alert>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={refundTarget !== null}
        onClose={closeRefund}
        title="Refund payment"
        description="Refunds require authorization and retain transaction history."
        size="md"
        footer={
          refundConfirmed ? (
            <Button variant="secondary" onClick={closeRefund}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={closeRefund}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => setRefundConfirmed(true)}>
                Confirm refund
              </Button>
            </>
          )
        }
      >
        {refundTarget ? (
          refundConfirmed ? (
            <Alert variant="info" title="Action unavailable">
              This action is not available yet because the Supabase backend is
              not connected.
            </Alert>
          ) : (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-hospital-text">
                Refund{" "}
                <span className="font-mono text-[11px]">
                  {refundTarget.payment_reference}
                </span>{" "}
                for{" "}
                <span className="font-semibold tabular-nums">
                  {formatCurrency(refundTarget.amount)}
                </span>
                ?
              </p>
              <p className="text-sm leading-relaxed text-hospital-text-muted">
                Refunds require authorization. Posted payments cannot be
                permanently deleted, and the transaction history is retained. No
                refund will be processed in this preview.
              </p>
            </div>
          )
        ) : null}
      </Modal>
    </>
  );
}

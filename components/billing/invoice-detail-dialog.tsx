"use client";

import * as React from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type { InvoiceListRow, PaymentListRow } from "@/types/hospital";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export interface InvoiceChargeLine {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface InvoiceDetailDialogProps {
  invoice: InvoiceListRow | null;
  payments: PaymentListRow[];
  items?: InvoiceChargeLine[];
  onClose: () => void;
}

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <dt className="text-[11px] font-medium text-hospital-text-muted">
      {children}
    </dt>
  );
}

function DetailValue({ children }: { children: React.ReactNode }) {
  return <dd className="mt-0.5 text-sm text-hospital-text">{children}</dd>;
}

function TotalRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt
        className={
          emphasis
            ? "text-sm font-semibold text-hospital-text"
            : "text-sm text-hospital-text-muted"
        }
      >
        {label}
      </dt>
      <dd
        className={
          emphasis
            ? "whitespace-nowrap text-sm font-semibold tabular-nums text-hospital-text"
            : "whitespace-nowrap text-sm tabular-nums text-hospital-text"
        }
      >
        {value}
      </dd>
    </div>
  );
}

export function InvoiceDetailDialog({
  invoice,
  payments,
  items = [],
  onClose,
}: InvoiceDetailDialogProps) {
  const relatedPayments = React.useMemo(
    () =>
      invoice
        ? payments.filter((payment) => payment.invoice_id === invoice.id)
        : [],
    [invoice, payments]
  );

  const isFinalized =
    invoice?.status === "paid" || invoice?.status === "refunded";

  return (
    <Modal
      open={invoice !== null}
      onClose={onClose}
      title={invoice ? `Invoice ${invoice.invoice_number}` : "Invoice details"}
      description="Itemized charges, payment history and outstanding balance."
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {invoice ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-hospital-text">
                Southern Philippines Medical Center
              </p>
              <p className="text-[11px] text-hospital-text-muted">
                Hospital Management System
              </p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <section>
              <h3 className="text-[11px] font-semibold text-hospital-text-muted">
                Patient
              </h3>
              <dl className="mt-2 space-y-2">
                <div>
                  <DetailLabel>Patient name</DetailLabel>
                  <DetailValue>
                    <span className="font-medium">{invoice.patient_name}</span>
                  </DetailValue>
                </div>
                <div>
                  <DetailLabel>Medical record number</DetailLabel>
                  <DetailValue>
                    <span className="font-mono text-[11px]">
                      {invoice.patient_mrn}
                    </span>
                  </DetailValue>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="text-[11px] font-semibold text-hospital-text-muted">
                Invoice reference
              </h3>
              <dl className="mt-2 space-y-2">
                <div>
                  <DetailLabel>Invoice number</DetailLabel>
                  <DetailValue>
                    <span className="font-mono text-[11px]">
                      {invoice.invoice_number}
                    </span>
                  </DetailValue>
                </div>
                <div>
                  <DetailLabel>Invoice date</DetailLabel>
                  <DetailValue>{formatDate(invoice.invoice_date)}</DetailValue>
                </div>
                <div>
                  <DetailLabel>Admission or encounter reference</DetailLabel>
                  <DetailValue>
                    {invoice.admission_id ? (
                      <span title={invoice.admission_id}>Admission</span>
                    ) : invoice.encounter_id ? (
                      <span title={invoice.encounter_id}>Encounter</span>
                    ) : (
                      "\u2014"
                    )}
                  </DetailValue>
                </div>
              </dl>
            </section>
          </div>

          <section>
            <h3 className="text-[11px] font-semibold text-hospital-text-muted">
              Itemized charges
            </h3>
            <div className="mt-2 overflow-x-auto rounded-md border border-hospital-border">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-hospital-border bg-hospital-surface-muted">
                    <th
                      scope="col"
                      className="h-9 px-3 text-left text-xs font-semibold text-hospital-text-muted"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="h-9 px-3 text-right text-xs font-semibold text-hospital-text-muted"
                    >
                      Qty
                    </th>
                    <th
                      scope="col"
                      className="h-9 px-3 text-right text-xs font-semibold text-hospital-text-muted"
                    >
                      Unit price
                    </th>
                    <th
                      scope="col"
                      className="h-9 px-3 text-right text-xs font-semibold text-hospital-text-muted"
                    >
                      Line total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length > 0 ? (
                    items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-hospital-border last:border-b-0"
                      >
                        <td className="px-3 py-2.5 text-hospital-text">
                          {item.description}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-hospital-text">
                          {item.quantity}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-hospital-text">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-hospital-text">
                          {formatCurrency(item.line_total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-3 text-xs text-hospital-text-muted"
                      >
                        Itemized charge lines are not available in this preview.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex justify-end">
            <dl className="w-full max-w-xs space-y-2 border-t border-hospital-border pt-3">
              <TotalRow
                label="Subtotal"
                value={formatCurrency(invoice.subtotal)}
              />
              {invoice.discount_amount > 0 ? (
                <TotalRow
                  label="Discount"
                  value={`-${formatCurrency(invoice.discount_amount)}`}
                />
              ) : null}
              <TotalRow
                label="Total"
                value={formatCurrency(invoice.total_amount)}
                emphasis
              />
              <TotalRow
                label="Amount paid"
                value={formatCurrency(invoice.amount_paid)}
              />
              <div className="flex items-baseline justify-between gap-6 border-t border-hospital-border pt-2">
                <dt className="text-sm font-semibold text-hospital-text">
                  Outstanding balance
                </dt>
                <dd className="whitespace-nowrap text-sm font-semibold tabular-nums text-hospital-text">
                  {formatCurrency(invoice.balance)}
                  {invoice.balance > 0 ? (
                    <span className="ml-1 text-[11px] font-medium text-hospital-text-muted">
                      outstanding
                    </span>
                  ) : null}
                </dd>
              </div>
            </dl>
          </div>

          <section>
            <h3 className="text-[11px] font-semibold text-hospital-text-muted">
              Payment history
            </h3>
            {relatedPayments.length > 0 ? (
              <ul className="mt-2 divide-y divide-hospital-border rounded-md border border-hospital-border">
                {relatedPayments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-hospital-text">
                        {payment.payment_reference}
                      </p>
                      <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                        {formatDateTime(payment.received_at)} ·{" "}
                        {payment.payment_method}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-medium tabular-nums text-hospital-text">
                        {formatCurrency(payment.amount)}
                      </span>
                      <StatusBadge status={payment.payment_status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-hospital-text-muted">
                No payments recorded for this invoice.
              </p>
            )}
          </section>

          {isFinalized ? (
            <Alert variant="info">
              Finalized financial records are not modified without the authorized
              refund workflow.
            </Alert>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

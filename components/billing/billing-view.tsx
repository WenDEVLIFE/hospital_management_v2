"use client";

import * as React from "react";
import { BillListIcon } from "@solar-icons/react/linear";

import { RecordTable, type Column } from "@/components/module/record-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { InvoiceListRow, PaymentListRow } from "@/types/hospital";
import {
  formatCurrency,
  formatDate,
  formatIdentifier,
} from "@/lib/format";

import { InvoiceDetailDialog } from "./invoice-detail-dialog";

export interface BillingViewProps {
  invoices: InvoiceListRow[];
  payments: PaymentListRow[];
}

const INVOICE_STATUS_FILTERS = [
  { label: "Unpaid", value: "unpaid" },
  { label: "Partially paid", value: "partially_paid" },
  { label: "Paid", value: "paid" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
];

function referenceLabel(invoice: InvoiceListRow): string | null {
  if (invoice.admission_id) return "Admission";
  if (invoice.encounter_id) return "Encounter";
  return null;
}

export function BillingView({ invoices, payments }: BillingViewProps) {
  const [selected, setSelected] = React.useState<InvoiceListRow | null>(null);

  const columns: Column<InvoiceListRow>[] = [
    {
      key: "invoice_number",
      header: "Invoice No.",
      sortable: true,
      sortValue: (row) => row.invoice_number,
      cell: (row) => (
        <span className="font-mono text-[11px] text-hospital-text">
          {formatIdentifier(row.invoice_number)}
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
          <p className="font-medium text-hospital-text">{row.patient_name}</p>
          <p className="font-mono text-[11px] text-hospital-text-muted">
            {row.patient_mrn}
          </p>
        </div>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      cell: (row) => {
        const label = referenceLabel(row);
        const id = row.admission_id ?? row.encounter_id;

        return label ? (
          <span className="text-xs text-hospital-text" title={id ?? undefined}>
            {label}
          </span>
        ) : (
          <span className="text-hospital-text-muted">{"\u2014"}</span>
        );
      },
    },
    {
      key: "invoice_date",
      header: "Invoice Date",
      sortable: true,
      sortValue: (row) => row.invoice_date,
      cell: (row) => (
        <span className="whitespace-nowrap">
          {formatDate(row.invoice_date)}
        </span>
      ),
    },
    {
      key: "total_amount",
      header: "Total",
      align: "right",
      sortable: true,
      sortValue: (row) => row.total_amount,
      cell: (row) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatCurrency(row.total_amount)}
        </span>
      ),
    },
    {
      key: "amount_paid",
      header: "Paid",
      align: "right",
      sortable: true,
      sortValue: (row) => row.amount_paid,
      cell: (row) => (
        <span className="whitespace-nowrap tabular-nums text-hospital-text-muted">
          {formatCurrency(row.amount_paid)}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      sortable: true,
      sortValue: (row) => row.balance,
      cell: (row) =>
        row.balance > 0 ? (
          <span className="whitespace-nowrap font-semibold tabular-nums text-hospital-text">
            {formatCurrency(row.balance)}
            <span className="ml-1 text-[11px] font-medium text-hospital-text-muted">
              outstanding
            </span>
          </span>
        ) : (
          <span className="whitespace-nowrap tabular-nums text-hospital-text-muted">
            {formatCurrency(row.balance)}
          </span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (row) => row.status,
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
          aria-label={`View invoice ${row.invoice_number}`}
          onClick={() => setSelected(row)}
        >
          View invoice
        </Button>
      ),
    },
  ];

  return (
    <>
      <RecordTable
        rows={invoices}
        columns={columns}
        rowKey={(row) => row.id}
        caption="Invoice list"
        searchPlaceholder="Search invoice number or patient"
        searchAccessor={(row) =>
          [row.invoice_number, row.patient_name, row.patient_mrn]
            .filter(Boolean)
            .join(" ")
        }
        filters={[
          {
            key: "status",
            label: "payment status",
            allLabel: "All payment statuses",
            options: INVOICE_STATUS_FILTERS,
            accessor: (row) => row.status,
          },
        ]}
        emptyTitle="No invoices found"
        emptyDescription="Invoices will appear here once charges are recorded."
        emptyIcon={<BillListIcon className="size-5" aria-hidden="true" />}
        pageSize={10}
      />

      <InvoiceDetailDialog
        invoice={selected}
        payments={payments}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

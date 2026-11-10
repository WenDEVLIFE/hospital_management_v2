import type {
  BillingStats,
  InvoiceListRow,
  PaymentListRow,
} from "@/types/hospital";
import {
  PREVIEW_NOW,
  invoiceListRows,
  invoices,
  paymentListRows,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import {
  emptyPage,
  manilaDate,
  matchesQuery,
  pageSlice,
  roundMoney,
} from "./query";
import type { DataResult, PagedResult } from "./result";

function emptyStats(): BillingStats {
  return {
    totalInvoices: 0,
    unpaid: 0,
    partiallyPaid: 0,
    paid: 0,
    cancelled: 0,
    refunded: 0,
    totalBilled: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    paymentsToday: 0,
  };
}

export async function listInvoices(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<InvoiceListRow>> {
  // TODO(supabase): replace with supabase.from("invoices").select("*")
  if (!isPreviewMode) {
    return emptyPage<InvoiceListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = invoiceListRows.filter((invoice) => {
    if (params.status && invoice.status !== params.status) {
      return false;
    }

    return matchesQuery(params.q, [
      invoice.invoice_number,
      invoice.patient_name,
      invoice.patient_mrn,
      invoice.status,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listPayments(
  params: {
    q?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<PaymentListRow>> {
  // TODO(supabase): replace with supabase.from("payments").select("*")
  if (!isPreviewMode) {
    return emptyPage<PaymentListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = paymentListRows.filter((payment) =>
    matchesQuery(params.q, [
      payment.payment_reference,
      payment.invoice_number,
      payment.patient_name,
      payment.payment_method,
      payment.payment_status,
      payment.received_by_name,
    ])
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getBillingStats(): Promise<DataResult<BillingStats>> {
  // TODO(supabase): replace with supabase.from("invoices").select("*")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const stats = emptyStats();
  const today = manilaDate(PREVIEW_NOW);

  for (const invoice of invoices) {
    stats.totalInvoices += 1;
    stats.totalBilled = roundMoney(stats.totalBilled + invoice.total_amount);
    stats.totalPaid = roundMoney(stats.totalPaid + invoice.amount_paid);

    if (invoice.status === "unpaid" || invoice.status === "partially_paid") {
      stats.outstandingBalance = roundMoney(
        stats.outstandingBalance + invoice.balance
      );
    }

    switch (invoice.status) {
      case "unpaid":
        stats.unpaid += 1;
        break;
      case "partially_paid":
        stats.partiallyPaid += 1;
        break;
      case "paid":
        stats.paid += 1;
        break;
      case "cancelled":
        stats.cancelled += 1;
        break;
      case "refunded":
        stats.refunded += 1;
        break;
    }
  }

  for (const payment of paymentListRows) {
    if (
      payment.payment_status === "completed" &&
      manilaDate(payment.received_at) === today
    ) {
      stats.paymentsToday += 1;
    }
  }

  return { data: stats, error: null };
}

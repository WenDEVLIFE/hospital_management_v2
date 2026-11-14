import type {
  BillingStats,
  Invoice,
  InvoiceListRow,
  Payment,
  PaymentListRow,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  manilaDate,
  normalizePagination,
  roundMoney,
  sanitizeSearchTerm,
} from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const INVOICE_COLUMNS =
  "*, patients(first_name, middle_name, last_name, suffix, medical_record_number)";

const PAYMENT_COLUMNS =
  "*, invoices(invoice_number, patients(first_name, middle_name, last_name, suffix)), profiles!payments_received_by_fkey(full_name)";

type Relation<T> = T | T[] | null;

type InvoiceJoinRow = Invoice & {
  patients: Relation<{
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    medical_record_number: string;
  }>;
};

type PaymentJoinRow = Payment & {
  invoices: Relation<{
    invoice_number: string;
    patients: Relation<{
      first_name: string;
      middle_name: string | null;
      last_name: string;
      suffix: string | null;
    }>;
  }>;
  profiles: Relation<{ full_name: string }>;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function fullName(row: {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
}): string {
  return [row.first_name, row.middle_name, row.last_name, row.suffix]
    .filter(Boolean)
    .join(" ");
}

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

function toInvoiceListRow(row: InvoiceJoinRow): InvoiceListRow {
  const patient = firstRelation(row.patients);

  return {
    id: row.id,
    invoice_number: row.invoice_number,
    patient_id: row.patient_id,
    patient_name: patient ? fullName(patient) : "Unknown patient",
    patient_mrn: patient?.medical_record_number ?? "\u2014",
    admission_id: row.admission_id,
    encounter_id: row.encounter_id,
    invoice_date: row.invoice_date,
    subtotal: Number(row.subtotal),
    discount_amount: Number(row.discount_amount),
    total_amount: Number(row.total_amount),
    amount_paid: Number(row.amount_paid),
    balance: Number(row.balance),
    status: row.status,
  };
}

function toPaymentListRow(row: PaymentJoinRow): PaymentListRow {
  const invoice = firstRelation(row.invoices);
  const patient = invoice ? firstRelation(invoice.patients) : null;
  const receivedBy = firstRelation(row.profiles);

  return {
    id: row.id,
    payment_reference: row.payment_reference,
    invoice_id: row.invoice_id,
    invoice_number: invoice?.invoice_number ?? "Unknown invoice",
    patient_name: patient ? fullName(patient) : "Unknown patient",
    amount: Number(row.amount),
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    received_by_name: receivedBy?.full_name ?? "Unknown staff",
    received_at: row.received_at,
    notes: row.notes,
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
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("invoices")
    .select(INVOICE_COLUMNS, { count: "exact" });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    query = query.ilike("invoice_number", `%${search}%`);
  }

  const { data, error, count } = await query
    .order("invoice_date", { ascending: false })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: {
      rows: ((data ?? []) as InvoiceJoinRow[]).map(toInvoiceListRow),
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
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
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("payments")
    .select(PAYMENT_COLUMNS, { count: "exact" });

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    query = query.ilike("payment_reference", `%${search}%`);
  }

  const { data, error, count } = await query
    .order("received_at", { ascending: false })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: {
      rows: ((data ?? []) as PaymentJoinRow[]).map(toPaymentListRow),
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function getBillingStats(): Promise<DataResult<BillingStats>> {
  const supabase = await getSupabaseServerClient();

  const [invoiceResult, paymentResult] = await Promise.all([
    supabase
      .from("invoices")
      .select("status, total_amount, amount_paid, balance"),
    supabase
      .from("payments")
      .select("payment_status, received_at")
      .eq("payment_status", "completed"),
  ]);

  if (invoiceResult.error) {
    return { data: null, error: toDataError(invoiceResult.error) };
  }

  if (paymentResult.error) {
    return { data: null, error: toDataError(paymentResult.error) };
  }

  const stats = emptyStats();
  const today = manilaDate(new Date().toISOString());

  for (const invoice of (invoiceResult.data ?? []) as Array<
    Pick<Invoice, "status" | "total_amount" | "amount_paid" | "balance">
  >) {
    stats.totalInvoices += 1;
    stats.totalBilled = roundMoney(
      stats.totalBilled + Number(invoice.total_amount)
    );
    stats.totalPaid = roundMoney(stats.totalPaid + Number(invoice.amount_paid));

    if (invoice.status === "unpaid" || invoice.status === "partially_paid") {
      stats.outstandingBalance = roundMoney(
        stats.outstandingBalance + Number(invoice.balance)
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

  for (const payment of (paymentResult.data ?? []) as Array<
    Pick<Payment, "payment_status" | "received_at">
  >) {
    if (manilaDate(payment.received_at) === today) {
      stats.paymentsToday += 1;
    }
  }

  return { data: stats, error: null };
}

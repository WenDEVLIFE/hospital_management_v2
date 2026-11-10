import type {
  Invoice,
  InvoiceItem,
  InvoiceListRow,
  Payment,
  PaymentListRow,
} from "@/types/hospital";
import {
  isoAt,
  previewUuid,
  profileIds,
  profileNameById,
  roundMoney,
} from "./base";
import { patientMrnById, patientNameById } from "./patients";

type InvoiceSeed = {
  patientIndex: number;
  admissionIndex: number | null;
  encounterIndex: number | null;
  dayOffset: number;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: Invoice["status"];
};

const INVOICE_SEEDS: InvoiceSeed[] = [
  { patientIndex: 0, admissionIndex: 0, encounterIndex: null, dayOffset: -1, subtotal: 5200, discount_amount: 0, total_amount: 5200, amount_paid: 0, balance: 5200, status: "unpaid" },
  { patientIndex: 1, admissionIndex: 1, encounterIndex: null, dayOffset: -2, subtotal: 12500, discount_amount: 500, total_amount: 12000, amount_paid: 6000, balance: 6000, status: "partially_paid" },
  { patientIndex: 2, admissionIndex: null, encounterIndex: 2, dayOffset: -3, subtotal: 8000, discount_amount: 0, total_amount: 8000, amount_paid: 8000, balance: 0, status: "paid" },
  { patientIndex: 3, admissionIndex: null, encounterIndex: 3, dayOffset: -4, subtotal: 3500, discount_amount: 0, total_amount: 3500, amount_paid: 0, balance: 0, status: "cancelled" },
  { patientIndex: 4, admissionIndex: null, encounterIndex: 4, dayOffset: -5, subtotal: 4200, discount_amount: 0, total_amount: 4200, amount_paid: 4200, balance: 0, status: "refunded" },
  { patientIndex: 5, admissionIndex: 5, encounterIndex: null, dayOffset: -6, subtotal: 18750, discount_amount: 0, total_amount: 18750, amount_paid: 0, balance: 18750, status: "unpaid" },
];

export const invoices: Invoice[] = INVOICE_SEEDS.map((seed, index) => ({
  id: previewUuid(41, index + 1),
  invoice_number: `INV-2026-${String(index + 1).padStart(4, "0")}`,
  patient_id: previewUuid(10, seed.patientIndex + 1),
  admission_id:
    seed.admissionIndex === null ? null : previewUuid(16, seed.admissionIndex + 1),
  encounter_id:
    seed.encounterIndex === null ? null : previewUuid(19, seed.encounterIndex + 1),
  invoice_date: isoAt(seed.dayOffset, 10),
  subtotal: roundMoney(seed.subtotal),
  discount_amount: roundMoney(seed.discount_amount),
  total_amount: roundMoney(seed.total_amount),
  amount_paid: roundMoney(seed.amount_paid),
  balance: roundMoney(seed.balance),
  status: seed.status,
  created_by: profileIds.billing,
  created_at: isoAt(seed.dayOffset, 10),
  updated_at: isoAt(seed.dayOffset + 1, 9),
}));

const INVOICE_ITEM_SEEDS: {
  invoiceIndex: number;
  description: string;
  quantity: number;
  unit_price: number;
}[] = [
  { invoiceIndex: 0, description: "Room accommodation", quantity: 1, unit_price: 3500 },
  { invoiceIndex: 0, description: "Laboratory services", quantity: 1, unit_price: 1700 },
  { invoiceIndex: 1, description: "Room accommodation", quantity: 1, unit_price: 8500 },
  { invoiceIndex: 1, description: "Pharmacy charges", quantity: 1, unit_price: 2500 },
  { invoiceIndex: 1, description: "Professional fee", quantity: 1, unit_price: 1500 },
  { invoiceIndex: 2, description: "Consultation", quantity: 1, unit_price: 1000 },
  { invoiceIndex: 2, description: "Laboratory services", quantity: 1, unit_price: 2500 },
  { invoiceIndex: 2, description: "Radiology services", quantity: 1, unit_price: 4500 },
  { invoiceIndex: 3, description: "Consultation", quantity: 1, unit_price: 1000 },
  { invoiceIndex: 3, description: "Laboratory services", quantity: 1, unit_price: 2500 },
  { invoiceIndex: 4, description: "Consultation", quantity: 1, unit_price: 1200 },
  { invoiceIndex: 4, description: "Pharmacy charges", quantity: 1, unit_price: 3000 },
  { invoiceIndex: 5, description: "Room accommodation", quantity: 1, unit_price: 15000 },
  { invoiceIndex: 5, description: "Pharmacy charges", quantity: 1, unit_price: 2500 },
  { invoiceIndex: 5, description: "Laboratory services", quantity: 1, unit_price: 1250 },
];

export const invoiceItems: InvoiceItem[] = INVOICE_ITEM_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(42, index + 1),
    invoice_id: invoices[seed.invoiceIndex].id,
    description: seed.description,
    quantity: seed.quantity,
    unit_price: roundMoney(seed.unit_price),
    line_total: roundMoney(seed.quantity * seed.unit_price),
    created_at: invoices[seed.invoiceIndex].created_at,
  })
);

type PaymentSeed = {
  invoiceIndex: number;
  amount: number;
  payment_method: string;
  payment_status: Payment["payment_status"];
  dayOffset: number;
  hour: number;
  notes: string | null;
};

const PAYMENT_SEEDS: PaymentSeed[] = [
  { invoiceIndex: 0, amount: 5200, payment_method: "Cash", payment_status: "pending", dayOffset: -1, hour: 11, notes: "Awaiting cashier confirmation." },
  { invoiceIndex: 1, amount: 3000, payment_method: "Cash", payment_status: "completed", dayOffset: -2, hour: 11, notes: null },
  { invoiceIndex: 1, amount: 3000, payment_method: "GCash", payment_status: "completed", dayOffset: -1, hour: 15, notes: null },
  { invoiceIndex: 2, amount: 5000, payment_method: "Cash", payment_status: "completed", dayOffset: -3, hour: 11, notes: null },
  { invoiceIndex: 2, amount: 3000, payment_method: "Credit Card", payment_status: "completed", dayOffset: -2, hour: 14, notes: null },
  { invoiceIndex: 3, amount: 3500, payment_method: "Cash", payment_status: "failed", dayOffset: -4, hour: 10, notes: "Payment attempt failed." },
  { invoiceIndex: 4, amount: 4200, payment_method: "Credit Card", payment_status: "completed", dayOffset: -5, hour: 12, notes: null },
  { invoiceIndex: 4, amount: 4200, payment_method: "Credit Card", payment_status: "refunded", dayOffset: -4, hour: 9, notes: "Refund processed." },
  { invoiceIndex: 5, amount: 5000, payment_method: "Bank Transfer", payment_status: "pending", dayOffset: -1, hour: 9, notes: "For verification." },
  { invoiceIndex: 5, amount: 2500, payment_method: "Cash", payment_status: "cancelled", dayOffset: -2, hour: 13, notes: "Cancelled at patient request." },
  { invoiceIndex: 5, amount: 2500, payment_method: "Cash", payment_status: "pending", dayOffset: -1, hour: 16, notes: "For cashier verification." },
  { invoiceIndex: 1, amount: 1000, payment_method: "GCash", payment_status: "failed", dayOffset: -3, hour: 13, notes: "Payment attempt failed." },
];

export const payments: Payment[] = PAYMENT_SEEDS.map((seed, index) => ({
  id: previewUuid(43, index + 1),
  payment_reference: `PAY-2026-${String(index + 1).padStart(4, "0")}`,
  invoice_id: invoices[seed.invoiceIndex].id,
  amount: roundMoney(seed.amount),
  payment_method: seed.payment_method,
  payment_status: seed.payment_status,
  received_by: profileIds.billing,
  received_at: isoAt(seed.dayOffset, seed.hour),
  notes: seed.notes,
  created_at: isoAt(seed.dayOffset, seed.hour),
}));

export const invoiceListRows: InvoiceListRow[] = invoices
  .map((invoice) => ({
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    patient_id: invoice.patient_id,
    patient_name: patientNameById.get(invoice.patient_id) ?? "Test Patient",
    patient_mrn: patientMrnById.get(invoice.patient_id) ?? "MRN-2026-0000",
    admission_id: invoice.admission_id,
    encounter_id: invoice.encounter_id,
    invoice_date: invoice.invoice_date,
    subtotal: invoice.subtotal,
    discount_amount: invoice.discount_amount,
    total_amount: invoice.total_amount,
    amount_paid: invoice.amount_paid,
    balance: invoice.balance,
    status: invoice.status,
  }))
  .sort((a, b) =>
    a.invoice_date === b.invoice_date
      ? 0
      : a.invoice_date < b.invoice_date
        ? 1
        : -1
  );

const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));

export const paymentListRows: PaymentListRow[] = payments
  .map((payment) => {
    const invoice = invoiceById.get(payment.invoice_id);

    return {
      id: payment.id,
      payment_reference: payment.payment_reference,
      invoice_id: payment.invoice_id,
      invoice_number: invoice?.invoice_number ?? "INV-2026-0000",
      patient_name: invoice
        ? patientNameById.get(invoice.patient_id) ?? "Test Patient"
        : "Test Patient",
      amount: payment.amount,
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      received_by_name:
        profileNameById.get(payment.received_by) ?? "Test Billing Staff",
      received_at: payment.received_at,
      notes: payment.notes,
    };
  })
  .sort((a, b) =>
    a.received_at === b.received_at ? 0 : a.received_at < b.received_at ? 1 : -1
  );

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { recordPaymentAction } from "@/app/(workspace)/billing/actions";
import { formatCurrency } from "@/lib/format";
import {
  PAYMENT_METHODS,
  recordPaymentSchema,
} from "@/lib/validations/payment";
import type { InvoiceListRow } from "@/types/hospital";

type FormValues = {
  amount: string;
  paymentMethod: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const METHOD_OPTIONS = PAYMENT_METHODS.map((method) => ({
  label: method,
  value: method,
}));

function initialValues(invoice: InvoiceListRow | null): FormValues {
  return {
    amount: invoice && invoice.balance > 0 ? invoice.balance.toFixed(2) : "",
    paymentMethod: "Cash",
    notes: "",
  };
}

function validate(values: FormValues, invoiceId: string): FormErrors {
  const result = recordPaymentSchema.safeParse({ invoiceId, ...values });

  if (result.success) {
    return {};
  }

  const errors: FormErrors = {};

  for (const issue of result.error.issues) {
    const field = issue.path[0];

    if (
      field === "amount" ||
      field === "paymentMethod" ||
      field === "notes"
    ) {
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }
  }

  return errors;
}

export interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  invoices: InvoiceListRow[];
  initialInvoiceId?: string | null;
}

export function RecordPaymentDialog({
  open,
  onClose,
  invoices,
  initialInvoiceId,
}: RecordPaymentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = React.useState(
    () => initialInvoiceId ?? (invoices.length === 1 ? invoices[0]?.id ?? "" : "")
  );
  const [values, setValues] = React.useState<FormValues>(() =>
    initialValues(invoices.find((entry) => entry.id === (initialInvoiceId ?? "")) ?? null)
  );
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const invoice = invoices.find((entry) => entry.id === selectedId) ?? null;
  const invoiceId = invoice?.id ?? "";

  const balance = invoice?.balance ?? 0;

  function handleInvoiceChange(nextId: string) {
    const next = invoices.find((entry) => entry.id === nextId) ?? null;

    setSelectedId(nextId);
    setValues((current) => ({
      ...current,
      amount: next && next.balance > 0 ? next.balance.toFixed(2) : "",
    }));
    setFormError(null);
  }

  function setField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K]
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setFormError(null);
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!invoice) {
      setFormError("Select the invoice receiving this payment.");
      return;
    }

    const nextErrors = validate(values, invoiceId);
    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await recordPaymentAction({
        invoiceId,
        amount: Number(values.amount),
        paymentMethod: values.paymentMethod,
        notes: values.notes,
      });

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Payment recorded",
        description: `${formatCurrency(Number(values.amount))} applied to ${
          invoice.invoice_number
        }.`,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not record the payment. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        invoice ? `Record payment · ${invoice.invoice_number}` : "Record payment"
      }
      description={
        invoice
          ? `${invoice.patient_name} · ${invoice.patient_mrn}`
          : "Apply a payment to an outstanding invoice."
      }
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="record-payment-form" loading={submitting}>
            Record payment
          </Button>
        </>
      }
    >
      <form
        id="record-payment-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {formError ? (
          <Alert variant="danger" title="Unable to record payment">
            {formError}
          </Alert>
        ) : null}

        {invoices.length > 1 ? (
          <FormField
            label="Invoice"
            htmlFor="payment_invoice"
            required
            hint="Only invoices with an outstanding balance are listed."
          >
            <Select
              id="payment_invoice"
              name="payment_invoice"
              value={selectedId}
              onChange={(event) => handleInvoiceChange(event.target.value)}
            >
              <option value="">Select invoice</option>
              {invoices.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.invoice_number} · {entry.patient_name} ·{" "}
                  {formatCurrency(entry.balance)} due
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}

        {invoice ? (
          <>
        <dl className="grid gap-3 rounded-md border border-hospital-border bg-hospital-surface-muted/60 px-3 py-3 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-medium text-hospital-text-muted">
              Total billed
            </dt>
            <dd className="mt-0.5 text-sm tabular-nums text-hospital-text">
              {formatCurrency(invoice.total_amount)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-hospital-text-muted">
              Amount paid
            </dt>
            <dd className="mt-0.5 text-sm tabular-nums text-hospital-text">
              {formatCurrency(invoice.amount_paid)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-hospital-text-muted">
              Outstanding balance
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums text-hospital-text">
              {formatCurrency(balance)}
            </dd>
          </div>
        </dl>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Amount received"
            htmlFor="payment_amount"
            required
            hint="Cannot exceed the outstanding balance."
            error={errors.amount}
          >
            <Input
              id="payment_amount"
              name="payment_amount"
              inputMode="decimal"
              autoComplete="off"
              value={values.amount}
              invalid={Boolean(errors.amount)}
              onChange={(event) => setField("amount", event.target.value)}
            />
          </FormField>

          <FormField
            label="Payment method"
            htmlFor="payment_method"
            required
            error={errors.paymentMethod}
          >
            <Select
              id="payment_method"
              name="payment_method"
              value={values.paymentMethod}
              invalid={Boolean(errors.paymentMethod)}
              onChange={(event) =>
                setField("paymentMethod", event.target.value)
              }
              options={METHOD_OPTIONS}
            />
          </FormField>
        </div>

        <FormField
          label="Notes"
          htmlFor="payment_notes"
          hint="Optional. Do not record clinical details here."
          error={errors.notes}
        >
          <Textarea
            id="payment_notes"
            name="payment_notes"
            rows={3}
            value={values.notes}
            invalid={Boolean(errors.notes)}
            onChange={(event) => setField("notes", event.target.value)}
          />
        </FormField>

        <Alert variant="info" title="Financial record">
          Recording a payment creates a permanent payment record and updates the
          invoice balance. Use the refund workflow to reverse a payment.
        </Alert>
          </>
        ) : (
          <Alert variant="info" title="Select an invoice">
            Choose the invoice that should receive this payment.
          </Alert>
        )}
      </form>
    </Modal>
  );
}

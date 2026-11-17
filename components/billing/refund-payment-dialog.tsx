"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { refundPaymentAction } from "@/app/(workspace)/billing/actions";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { refundPaymentSchema } from "@/lib/validations/payment";
import type { InvoiceListRow, PaymentListRow } from "@/types/hospital";

export interface RefundPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  payment: PaymentListRow | null;
  invoice: InvoiceListRow | null;
}

export function RefundPaymentDialog({
  open,
  onClose,
  payment,
  invoice,
}: RefundPaymentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reason, setReason] = React.useState("");
  const [reasonError, setReasonError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!payment) {
    return null;
  }

  const activePayment = payment;

  async function handleRefund() {
    if (submitting) {
      return;
    }

    const parsed = refundPaymentSchema.safeParse({
      paymentId: activePayment.id,
      reason,
    });

    if (!parsed.success) {
      setReasonError(
        parsed.error.issues.find((issue) => issue.path[0] === "reason")
          ?.message ?? null
      );
      return;
    }

    setReasonError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await refundPaymentAction({
        paymentId: activePayment.id,
        reason,
      });

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Payment refunded",
        description: `${formatCurrency(
          activePayment.amount
        )} refunded from ${activePayment.payment_reference}.`,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not refund the payment. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Refund payment"
      description={
        invoice
          ? `${payment.payment_reference} · ${invoice.invoice_number}`
          : payment.payment_reference
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
          <Button
            variant="destructive"
            onClick={handleRefund}
            loading={submitting}
          >
            Refund payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {formError ? (
          <Alert variant="danger" title="Unable to refund payment">
            {formError}
          </Alert>
        ) : null}

        <dl className="space-y-2 rounded-md border border-hospital-border bg-hospital-surface-muted/60 px-3 py-3">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[11px] font-medium text-hospital-text-muted">
              Payment reference
            </dt>
            <dd className="font-mono text-[11px] text-hospital-text">
              {payment.payment_reference}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[11px] font-medium text-hospital-text-muted">
              Amount
            </dt>
            <dd className="text-sm font-semibold tabular-nums text-hospital-text">
              {formatCurrency(payment.amount)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[11px] font-medium text-hospital-text-muted">
              Method
            </dt>
            <dd className="text-sm text-hospital-text">{payment.payment_method}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[11px] font-medium text-hospital-text-muted">
              Received
            </dt>
            <dd className="text-sm text-hospital-text">
              {formatDateTime(payment.received_at)}
            </dd>
          </div>
        </dl>

        <FormField
          label="Refund reason"
          htmlFor="refund_reason"
          hint="Optional, but recommended for the audit trail."
          error={reasonError ?? undefined}
        >
          <Textarea
            id="refund_reason"
            name="refund_reason"
            rows={3}
            value={reason}
            invalid={Boolean(reasonError)}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError(null);
              setFormError(null);
            }}
          />
        </FormField>

        <Alert variant="warning" title="This cannot be undone">
          The payment record is preserved with a refunded status, the amount is
          removed from the invoice, and the balance is restored. A new payment
          must be recorded to collect it again.
        </Alert>
      </div>
    </Modal>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AddCircleIcon, TrashBinTrashIcon } from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { createInvoiceAction } from "@/app/(workspace)/billing/actions";
import { formatCurrency } from "@/lib/format";
import { createInvoiceSchema } from "@/lib/validations/invoice";

type Line = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

type FormErrors = {
  patientId?: string;
  discountAmount?: string;
  items?: Record<string, string>;
  form?: string;
};

const INITIAL_LINE: Line = {
  id: "line-1",
  description: "",
  quantity: "1",
  unitPrice: "",
};

export interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  patients: Array<{
    id: string;
    full_name: string;
    medical_record_number: string;
  }>;
}

export function CreateInvoiceDialog({
  open,
  onClose,
  patients,
}: CreateInvoiceDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const lineCounter = React.useRef(2);
  const [patientId, setPatientId] = React.useState("");
  const [lines, setLines] = React.useState<Line[]>([INITIAL_LINE]);
  const [discount, setDiscount] = React.useState("");
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);

  const subtotal = lines.reduce((total, line) => {
    const quantity = Number(line.quantity);
    const unitPrice = Number(line.unitPrice);

    if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
      return total;
    }

    return total + Math.round(quantity * unitPrice * 100) / 100;
  }, 0);

  const discountValue = Number(discount) || 0;
  const total = Math.max(subtotal - discountValue, 0);

  function updateLine(id: string, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line))
    );
    setErrors((current) => ({ ...current, items: undefined, form: undefined }));
  }

  function addLine() {
    if (lines.length >= 30) {
      return;
    }

    const id = `line-${lineCounter.current}`;
    lineCounter.current += 1;
    setLines((current) => [
      ...current,
      { id, description: "", quantity: "1", unitPrice: "" },
    ]);
  }

  function removeLine(id: string) {
    setLines((current) =>
      current.length === 1
        ? current
        : current.filter((line) => line.id !== id)
    );
    setErrors((current) => ({ ...current, items: undefined, form: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = createInvoiceSchema.safeParse({
      patientId,
      discountAmount: discount === "" ? 0 : Number(discount),
      items: lines.map((line) => ({
        description: line.description,
        quantity: line.quantity === "" ? Number.NaN : Number(line.quantity),
        unitPrice: line.unitPrice === "" ? Number.NaN : Number(line.unitPrice),
      })),
    });

    if (!parsed.success) {
      const nextErrors: FormErrors = {};

      for (const issue of parsed.error.issues) {
        const [field, index] = issue.path;

        if (field === "patientId") {
          nextErrors.patientId = issue.message;
        } else if (field === "discountAmount") {
          nextErrors.discountAmount = issue.message;
        } else if (field === "items") {
          nextErrors.items = nextErrors.items ?? {};

          if (typeof index === "number") {
            const lineId = lines[index]?.id;

            if (lineId) {
              nextErrors.items[lineId] = issue.message;
            }
          } else {
            nextErrors.items.form = issue.message;
          }
        }
      }

      setErrors(nextErrors);
      return;
    }

    if (discountValue > subtotal) {
      setErrors({ discountAmount: "Discount cannot exceed the subtotal." });
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const result = await createInvoiceAction(parsed.data);

      if (!result.ok) {
        setErrors({ form: result.formError });
        return;
      }

      toast({
        title: "Invoice created",
        description: `${formatCurrency(total)} billed across ${lines.length} ${
          lines.length === 1 ? "charge" : "charges"
        }.`,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setErrors({
        form: "We could not create the invoice. Check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create invoice"
      description="Bill a patient for recorded charges."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-invoice-form" loading={submitting}>
            Create invoice
          </Button>
        </>
      }
    >
      <form
        id="create-invoice-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {errors.form ? (
          <Alert variant="danger" title="Unable to create invoice">
            {errors.form}
          </Alert>
        ) : null}

        <FormField
          label="Patient"
          htmlFor="invoice_patient"
          required
          error={errors.patientId}
        >
          <Select
            id="invoice_patient"
            name="invoice_patient"
            value={patientId}
            invalid={Boolean(errors.patientId)}
            onChange={(event) => {
              setPatientId(event.target.value);
              setErrors((current) => ({
                ...current,
                patientId: undefined,
                form: undefined,
              }));
            }}
          >
            <option value="">Select patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.full_name} · {patient.medical_record_number}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="space-y-2">
          <p className="text-xs font-medium text-hospital-text">Charge lines</p>

          {errors.items?.form ? (
            <p className="text-xs text-red-600">{errors.items.form}</p>
          ) : null}

          <div className="space-y-2">
            {lines.map((line, index) => (
              <div
                key={line.id}
                className="grid gap-2 rounded-md border border-hospital-border p-2 sm:grid-cols-[minmax(0,1fr)_88px_112px_36px]"
              >
                <Input
                  aria-label={`Charge description ${index + 1}`}
                  placeholder="Description"
                  value={line.description}
                  invalid={Boolean(errors.items?.[line.id])}
                  onChange={(event) =>
                    updateLine(line.id, { description: event.target.value })
                  }
                />
                <Input
                  aria-label={`Charge quantity ${index + 1}`}
                  inputMode="decimal"
                  placeholder="Qty"
                  value={line.quantity}
                  invalid={Boolean(errors.items?.[line.id])}
                  onChange={(event) =>
                    updateLine(line.id, { quantity: event.target.value })
                  }
                />
                <Input
                  aria-label={`Charge unit price ${index + 1}`}
                  inputMode="decimal"
                  placeholder="Unit price"
                  value={line.unitPrice}
                  invalid={Boolean(errors.items?.[line.id])}
                  onChange={(event) =>
                    updateLine(line.id, { unitPrice: event.target.value })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove charge line ${index + 1}`}
                  disabled={lines.length === 1}
                  onClick={() => removeLine(line.id)}
                >
                  <TrashBinTrashIcon className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>

          {errors.items && !errors.items.form ? (
            <ul className="space-y-1 text-xs text-red-600">
              {Object.entries(errors.items)
                .filter(([key]) => key !== "form")
                .map(([key, message]) => (
                  <li key={key}>{message}</li>
                ))}
            </ul>
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            onClick={addLine}
            disabled={lines.length >= 30}
          >
            <AddCircleIcon className="size-4" aria-hidden="true" />
            Add charge line
          </Button>
        </div>

        <FormField
          label="Discount"
          htmlFor="invoice_discount"
          hint="Optional. Applied before the total."
          error={errors.discountAmount}
        >
          <Input
            id="invoice_discount"
            name="invoice_discount"
            inputMode="decimal"
            autoComplete="off"
            value={discount}
            invalid={Boolean(errors.discountAmount)}
            onChange={(event) => {
              setDiscount(event.target.value);
              setErrors((current) => ({
                ...current,
                discountAmount: undefined,
                form: undefined,
              }));
            }}
          />
        </FormField>

        <dl className="space-y-2 border-t border-hospital-border pt-3">
          <div className="flex items-baseline justify-between gap-6">
            <dt className="text-sm text-hospital-text-muted">Subtotal</dt>
            <dd className="whitespace-nowrap text-sm tabular-nums text-hospital-text">
              {formatCurrency(subtotal)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-6">
            <dt className="text-sm text-hospital-text-muted">Discount</dt>
            <dd className="whitespace-nowrap text-sm tabular-nums text-hospital-text">
              -{formatCurrency(discountValue)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-6">
            <dt className="text-sm font-semibold text-hospital-text">Total</dt>
            <dd className="whitespace-nowrap text-sm font-semibold tabular-nums text-hospital-text">
              {formatCurrency(total)}
            </dd>
          </div>
        </dl>

        <Alert variant="info" title="Invoice records are financial">
          Creating an invoice records the charges and an outstanding balance. It
          can be collected or refunded through the payment workflow.
        </Alert>
      </form>
    </Modal>
  );
}

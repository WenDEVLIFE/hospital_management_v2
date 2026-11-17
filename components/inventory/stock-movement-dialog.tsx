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
import { adjustInventoryAction } from "@/app/(workspace)/inventory/actions";
import {
  stockMovementSchema,
  type StockMovementType,
} from "@/lib/validations/inventory";
import type { InventoryBatchOption, InventoryListRow } from "@/types/hospital";

type FormValues = {
  itemId: string;
  batchId: string;
  quantity: string;
  reason: string;
  batchNumber: string;
  expirationDate: string;
  unitCost: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_VALUES: FormValues = {
  itemId: "",
  batchId: "",
  quantity: "",
  reason: "",
  batchNumber: "",
  expirationDate: "",
  unitCost: "",
};

const COPY: Record<
  StockMovementType,
  {
    title: string;
    description: string;
    submit: string;
    quantityLabel: string;
    quantityHint: string;
    reasonLabel: string;
    reasonHint: string;
  }
> = {
  stock_in: {
    title: "Stock in",
    description: "Receive units into a new batch for an inventory item.",
    submit: "Receive stock",
    quantityLabel: "Quantity received",
    quantityHint: "A new batch is created for every receipt.",
    reasonLabel: "Note",
    reasonHint: "Optional. Reference the delivery or requisition.",
  },
  stock_out: {
    title: "Stock out",
    description: "Issue units from an inventory item.",
    submit: "Issue stock",
    quantityLabel: "Quantity issued",
    quantityHint: "Units are issued first-in-first-out across batches.",
    reasonLabel: "Reason",
    reasonHint: "Required. Record where the stock is going.",
  },
  adjustment: {
    title: "Adjust stock count",
    description: "Correct a batch quantity after a physical count.",
    submit: "Record count",
    quantityLabel: "Counted quantity",
    quantityHint: "Enter the quantity you actually counted in this batch.",
    reasonLabel: "Reason",
    reasonHint: "Required. Explain the discrepancy.",
  },
};

export interface StockMovementDialogProps {
  open: boolean;
  mode: StockMovementType;
  items: InventoryListRow[];
  batches: InventoryBatchOption[];
  onClose: () => void;
}

export function StockMovementDialog({
  open,
  mode,
  items,
  batches,
  onClose,
}: StockMovementDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const copy = COPY[mode];
  const selectedItem = items.find((item) => item.id === values.itemId) ?? null;
  const itemBatches = React.useMemo(
    () => batches.filter((batch) => batch.item_id === values.itemId),
    [batches, values.itemId]
  );
  const selectedBatch =
    itemBatches.find((batch) => batch.id === values.batchId) ?? null;

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

  function handleItemChange(itemId: string) {
    setValues((current) => ({
      ...current,
      itemId,
      batchId: "",
      quantity: mode === "adjustment" ? "" : current.quantity,
    }));
    setFormError(null);
    setErrors({});
  }

  function handleBatchChange(batchId: string) {
    const batch = itemBatches.find((entry) => entry.id === batchId);
    setValues((current) => ({
      ...current,
      batchId,
      quantity: batch ? String(batch.quantity_remaining) : "",
    }));
    setFormError(null);
    setErrors((current) => ({ ...current, batchId: undefined, quantity: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = stockMovementSchema.safeParse({
      itemId: values.itemId,
      transactionType: mode,
      quantity: values.quantity === "" ? Number.NaN : Number(values.quantity),
      reason: values.reason,
      batchId: values.batchId,
      batchNumber: values.batchNumber,
      expirationDate: values.expirationDate,
      unitCost: values.unitCost,
    });

    if (!parsed.success) {
      const nextErrors: FormErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !nextErrors[field as keyof FormValues]) {
          nextErrors[field as keyof FormValues] = issue.message;
        }
      }

      setErrors(nextErrors);
      setFormError(null);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await adjustInventoryAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title:
          mode === "stock_in"
            ? "Stock received"
            : mode === "stock_out"
              ? "Stock issued"
              : "Stock count adjusted",
        description: selectedItem
          ? `${selectedItem.name} · ${values.quantity || "0"} ${selectedItem.unit}`
          : undefined,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not record the stock movement. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const availableQuantity =
    mode === "adjustment" && selectedBatch
      ? selectedBatch.quantity_remaining
      : selectedItem?.quantity_on_hand ?? 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.title}
      description={copy.description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="stock-movement-form" loading={submitting}>
            {copy.submit}
          </Button>
        </>
      }
    >
      <form
        id="stock-movement-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {formError ? (
          <Alert variant="danger" title="Unable to record movement">
            {formError}
          </Alert>
        ) : null}

        <FormField
          label="Inventory item"
          htmlFor="stock_item"
          required
          error={errors.itemId}
        >
          <Select
            id="stock_item"
            name="stock_item"
            value={values.itemId}
            invalid={Boolean(errors.itemId)}
            onChange={(event) => handleItemChange(event.target.value)}
          >
            <option value="">Select item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.item_code}
              </option>
            ))}
          </Select>
        </FormField>

        {mode === "adjustment" ? (
          <FormField
            label="Batch"
            htmlFor="stock_batch"
            required
            hint={
              values.itemId && itemBatches.length === 0
                ? "This item has no batches on record."
                : "Select the batch you counted."
            }
            error={errors.batchId}
          >
            <Select
              id="stock_batch"
              name="stock_batch"
              value={values.batchId}
              invalid={Boolean(errors.batchId)}
              disabled={!values.itemId || itemBatches.length === 0}
              onChange={(event) => handleBatchChange(event.target.value)}
            >
              <option value="">Select batch</option>
              {itemBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_number ?? "No batch number"} ·{" "}
                  {batch.quantity_remaining} remaining
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={copy.quantityLabel}
            htmlFor="stock_quantity"
            required
            hint={
              values.itemId
                ? `${copy.quantityHint} On hand: ${availableQuantity} ${
                    selectedItem?.unit ?? ""
                  }`
                : copy.quantityHint
            }
            error={errors.quantity}
          >
            <Input
              id="stock_quantity"
              name="stock_quantity"
              inputMode="decimal"
              autoComplete="off"
              value={values.quantity}
              invalid={Boolean(errors.quantity)}
              onChange={(event) => setField("quantity", event.target.value)}
            />
          </FormField>

          {mode === "stock_in" ? (
            <FormField
              label="Batch number"
              htmlFor="stock_batch_number"
              hint="Optional."
              error={errors.batchNumber}
            >
              <Input
                id="stock_batch_number"
                name="stock_batch_number"
                autoComplete="off"
                value={values.batchNumber}
                invalid={Boolean(errors.batchNumber)}
                onChange={(event) =>
                  setField("batchNumber", event.target.value)
                }
              />
            </FormField>
          ) : null}
        </div>

        {mode === "stock_in" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Expiration date"
              htmlFor="stock_expiration"
              hint="Optional."
              error={errors.expirationDate}
            >
              <Input
                id="stock_expiration"
                name="stock_expiration"
                type="date"
                value={values.expirationDate}
                invalid={Boolean(errors.expirationDate)}
                onChange={(event) =>
                  setField("expirationDate", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Unit cost"
              htmlFor="stock_unit_cost"
              hint="Optional."
              error={errors.unitCost}
            >
              <Input
                id="stock_unit_cost"
                name="stock_unit_cost"
                inputMode="decimal"
                autoComplete="off"
                value={values.unitCost}
                invalid={Boolean(errors.unitCost)}
                onChange={(event) => setField("unitCost", event.target.value)}
              />
            </FormField>
          </div>
        ) : null}

        <FormField
          label={copy.reasonLabel}
          htmlFor="stock_reason"
          required={mode !== "stock_in"}
          hint={copy.reasonHint}
          error={errors.reason}
        >
          <Textarea
            id="stock_reason"
            name="stock_reason"
            rows={3}
            value={values.reason}
            invalid={Boolean(errors.reason)}
            onChange={(event) => setField("reason", event.target.value)}
          />
        </FormField>

        <Alert variant="info" title="Stock movements are permanent">
          {mode === "adjustment"
            ? "Adjustments correct a recorded batch quantity and are kept in the stock movement history."
            : "Every movement is written to the stock movement history. Quantities can never go below zero."}
        </Alert>
      </form>
    </Modal>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { dispensePrescriptionAction } from "@/app/(workspace)/pharmacy/actions";
import type { PrescriptionListRow } from "@/types/hospital";

export interface DispenseDialogProps {
  open: boolean;
  onClose: () => void;
  prescription: PrescriptionListRow | null;
}

export function DispenseDialog({
  open,
  onClose,
  prescription,
}: DispenseDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [dispensing, setDispensing] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const items = prescription?.items ?? [];
  const remainingItems = items.filter((item) => item.remaining_quantity > 0);
  const canDispense = Boolean(
    prescription &&
      remainingItems.length > 0 &&
      (prescription.status === "pending" ||
        prescription.status === "partially_dispensed")
  );

  async function handleDispense() {
    if (!prescription || !canDispense || dispensing) {
      return;
    }

    setDispensing(true);
    setFormError(null);

    try {
      const result = await dispensePrescriptionAction({
        prescriptionId: prescription.id,
      });

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Prescription dispensed",
        description: "Dispensing recorded and inventory updated.",
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not dispense the prescription. Check your connection and try again."
      );
    } finally {
      setDispensing(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        prescription
          ? `Dispense ${prescription.prescription_number}`
          : "Dispense prescription"
      }
      description={
        prescription
          ? `${prescription.patient_name} · ${prescription.patient_mrn}`
          : undefined
      }
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={dispensing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDispense}
            loading={dispensing}
            disabled={!canDispense}
          >
            Dispense remaining
          </Button>
        </>
      }
    >
      {prescription ? (
        <div className="space-y-4">
          {formError ? (
            <Alert variant="danger" title="Unable to dispense">
              {formError}
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={prescription.status} />
            <span className="text-[11px] text-hospital-text-muted">
              {items.length} {items.length === 1 ? "item" : "items"} ·{" "}
              {remainingItems.length} remaining
            </span>
          </div>

          {prescription.status === "dispensed" ? (
            <Alert variant="success" title="Already dispensed">
              This prescription has been fully dispensed.
            </Alert>
          ) : null}

          {prescription.status === "cancelled" ? (
            <Alert variant="warning" title="Prescription cancelled">
              Cancelled prescriptions cannot be dispensed.
            </Alert>
          ) : null}

          {items.length === 0 ? (
            <Alert variant="warning" title="No items recorded">
              This prescription does not list any medication items.
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage / frequency</TableHead>
                  <TableHead className="text-right">Prescribed</TableHead>
                  <TableHead className="text-right">Dispensed</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-hospital-text">
                      {item.medication_name}
                    </TableCell>
                    <TableCell className="text-hospital-text-muted">
                      {item.dosage} · {item.frequency}
                      {item.duration_days
                        ? ` · ${item.duration_days} days`
                        : ""}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-hospital-text-muted">
                      {item.dispensed_quantity}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {item.remaining_quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {items.length > 0 &&
          remainingItems.length === 0 &&
          prescription.status !== "dispensed" ? (
            <Alert variant="info" title="All items dispensed">
              There are no remaining quantities to dispense.
            </Alert>
          ) : null}

          <Alert variant="warning" title="Dispensing records stock">
            Confirming dispensing writes medication dispense records and
            decrements the matching inventory batches atomically. Verify the
            medication and quantities before continuing.
          </Alert>
        </div>
      ) : null}
    </Modal>
  );
}

"use client";

import { UnavailableActionDialog } from "@/components/module/unavailable-action";
import { formatDateTime } from "@/lib/format";
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
  return (
    <UnavailableActionDialog
      open={open}
      onClose={onClose}
      title={
        prescription
          ? `Dispense ${prescription.prescription_number}`
          : "Dispense prescription"
      }
      description={
        prescription
          ? `${prescription.patient_name} · ${
              prescription.prescribed_by_name
            } · Prescribed ${formatDateTime(prescription.prescription_date)}`
          : undefined
      }
      note="Confirm that the medication and quantity in this prescription have been checked before dispensing. Dispensing must be recorded together with the corresponding inventory movement. Nothing is saved in this preview."
    />
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useCan } from "@/components/providers/permission-provider";
import { setPatientStatusAction } from "@/app/(workspace)/patients/actions";

import {
  PatientEditDialog,
  type PatientEditable,
} from "./patient-edit-dialog";

export interface PatientRecordActionsProps {
  patient: PatientEditable;
}

export function PatientRecordActions({ patient }: PatientRecordActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isArchived = patient.registration_status === "archived";
  const nextStatus = isArchived ? "active" : "archived";
  const can = useCan();
  const canEdit = can("patient.update");
  const canArchive = can("patient.archive");

  if (!canEdit && !canArchive) {
    return null;
  }

  async function handleStatusChange() {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await setPatientStatusAction({
        patientId: patient.id,
        status: nextStatus,
      });

      if (!result.ok) {
        setError(result.formError);
        return;
      }

      toast({
        title: isArchived ? "Patient restored" : "Patient archived",
        description: isArchived
          ? "The record is active again and can be scheduled."
          : "The record is archived. Existing history is preserved.",
        variant: "success",
      });

      setConfirming(false);
      router.refresh();
    } catch {
      setError(
        "We could not update the patient status. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canEdit ? (
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
      ) : null}
      {canArchive ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null);
            setConfirming(true);
          }}
        >
          {isArchived ? "Restore" : "Archive"}
        </Button>
      ) : null}

      <PatientEditDialog
        key={editing ? "open" : "closed"}
        open={editing}
        patient={patient}
        onClose={() => setEditing(false)}
      />

      <ConfirmationDialog
        open={confirming}
        onClose={() => {
          if (!submitting) {
            setConfirming(false);
          }
        }}
        onConfirm={handleStatusChange}
        title={isArchived ? "Restore patient record" : "Archive patient record"}
        description={
          error ??
          (isArchived
            ? "The patient becomes active again. All history is preserved."
            : "The record is hidden from active workflows but all history is preserved. No data is deleted.")
        }
        confirmLabel={isArchived ? "Restore record" : "Archive record"}
        variant={isArchived ? "primary" : "danger"}
        loading={submitting}
      />
    </div>
  );
}

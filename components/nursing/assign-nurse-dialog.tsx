"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  assignNurseAction,
  unassignNurseAction,
} from "@/app/(workspace)/nursing/actions";

export interface AssignNurseDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  nurses: Array<{ id: string; full_name: string }>;
  currentStaffId: string | null;
  currentStaffName: string | null;
}

export function AssignNurseDialog({
  open,
  onClose,
  patientId,
  patientName,
  nurses,
  currentStaffId,
  currentStaffName,
}: AssignNurseDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [staffId, setStaffId] = React.useState(currentStaffId ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);

  async function handleAssign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || removing) {
      return;
    }

    if (!staffId) {
      setError("Select a nurse.");
      return;
    }

    setError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await assignNurseAction({ patientId, staffId });

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Nurse assigned",
        description: `${patientName} now has an assigned nurse.`,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not assign the nurse. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove() {
    if (submitting || removing) {
      return;
    }

    setError(null);
    setFormError(null);
    setRemoving(true);

    try {
      const result = await unassignNurseAction({ patientId });

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Assignment removed",
        description: `${patientName} no longer has an assigned nurse.`,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not remove the assignment. Check your connection and try again."
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting && !removing) {
          onClose();
        }
      }}
      title="Assign nurse"
      description={patientName}
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting || removing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="assign-nurse-form"
            loading={submitting}
            disabled={removing}
          >
            Assign nurse
          </Button>
        </>
      }
    >
      <form id="assign-nurse-form" className="space-y-4" onSubmit={handleAssign}>
        {formError ? (
          <Alert variant="danger" title="Unable to assign nurse">
            {formError}
          </Alert>
        ) : null}

        <p className="text-xs text-hospital-text-muted">
          Currently assigned:{" "}
          <span className="font-medium text-hospital-text">
            {currentStaffName ?? "Unassigned"}
          </span>
        </p>

        <FormField label="Nurse" htmlFor="assign_nurse_staff" required error={error ?? undefined}>
          <Select
            id="assign_nurse_staff"
            value={staffId}
            invalid={Boolean(error)}
            disabled={nurses.length === 0}
            onChange={(event) => {
              setStaffId(event.target.value);
              setError(null);
            }}
          >
            <option value="">Select nurse</option>
            {nurses.map((nurse) => (
              <option key={nurse.id} value={nurse.id}>
                {nurse.full_name}
              </option>
            ))}
          </Select>
        </FormField>

        {nurses.length === 0 ? (
          <p className="text-xs text-hospital-text-muted">
            No active nurses were found. Create a nurse staff account first.
          </p>
        ) : null}

        {currentStaffId ? (
          <div className="border-t border-hospital-border-subtle pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleRemove}
              loading={removing}
              disabled={submitting}
            >
              Remove assignment
            </Button>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

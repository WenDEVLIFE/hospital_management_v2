"use client";

import * as React from "react";
import { DocumentMedicineIcon } from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

/**
 * Header action for creating a prescription. The confirm step is an honest
 * no-write gate while the Supabase backend is not connected.
 */
export function NewPrescriptionButton() {
  const [open, setOpen] = React.useState(false);
  const [acknowledged, setAcknowledged] = React.useState(false);

  const close = React.useCallback(() => {
    setOpen(false);
    setAcknowledged(false);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setAcknowledged(false);
          setOpen(true);
        }}
      >
        <DocumentMedicineIcon className="size-4" aria-hidden="true" />
        New Prescription
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="New prescription"
        description="Medication orders are issued during a patient encounter."
        size="md"
        footer={
          acknowledged ? (
            <Button variant="secondary" onClick={close}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button onClick={() => setAcknowledged(true)}>
                Create prescription
              </Button>
            </>
          )
        }
      >
        {acknowledged ? (
          <Alert variant="info">
            <p>
              This action is not available yet because the Supabase backend is
              not connected.
            </p>
          </Alert>
        ) : (
          <p className="text-sm leading-relaxed text-hospital-text-muted">
            This workflow writes a new prescription to hospital records. It will
            be enabled once the hospital database connection is available.
          </p>
        )}
      </Modal>
    </>
  );
}

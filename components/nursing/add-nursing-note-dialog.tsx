"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { addNursingNoteAction } from "@/app/(workspace)/nursing/actions";
import { nursingNoteSchema } from "@/lib/validations/nursing";

export interface AddNursingNoteDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  encounterId: string;
  patientName: string;
}

export function AddNursingNoteDialog({
  open,
  onClose,
  patientId,
  encounterId,
  patientName,
}: AddNursingNoteDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = nursingNoteSchema.safeParse({
      patientId,
      encounterId,
      note,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Write the nursing note.");
      return;
    }

    setError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await addNursingNoteAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Nursing note added",
        description: `Note charted for ${patientName}.`,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not add the note. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add nursing note"
      description={`Nursing note for ${patientName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="nursing-note-form" loading={submitting}>
            Add note
          </Button>
        </>
      }
    >
      <form
        id="nursing-note-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {formError ? (
          <Alert variant="danger" title="Unable to add note">
            {formError}
          </Alert>
        ) : null}

        <FormField
          label="Note"
          htmlFor="nursing_note"
          required
          hint="Observations, interventions, and patient response."
          error={error ?? undefined}
        >
          <Textarea
            id="nursing_note"
            rows={6}
            value={note}
            invalid={Boolean(error)}
            onChange={(event) => {
              setNote(event.target.value);
              setError(null);
              setFormError(null);
            }}
          />
        </FormField>

        <Alert variant="info" title="Charting is timestamped">
          The note is stored with the current time and your staff account as part
          of the patient record.
        </Alert>
      </form>
    </Modal>
  );
}

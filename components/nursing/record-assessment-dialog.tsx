"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { recordNursingAssessmentAction } from "@/app/(workspace)/nursing/actions";
import { nursingAssessmentSchema } from "@/lib/validations/nursing";

const ASSESSMENT_TYPES = [
  { label: "Initial assessment", value: "Initial assessment" },
  { label: "Shift assessment", value: "Shift assessment" },
  { label: "Focused assessment", value: "Focused assessment" },
  { label: "Discharge assessment", value: "Discharge assessment" },
];

export interface RecordAssessmentDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  encounterId: string;
  patientName: string;
}

export function RecordAssessmentDialog({
  open,
  onClose,
  patientId,
  encounterId,
  patientName,
}: RecordAssessmentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [assessmentType, setAssessmentType] = React.useState(
    ASSESSMENT_TYPES[0].value
  );
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = nursingAssessmentSchema.safeParse({
      patientId,
      encounterId,
      assessmentType,
      notes,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the assessment.");
      return;
    }

    setError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await recordNursingAssessmentAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Assessment recorded",
        description: `${parsed.data.assessmentType} charted for ${patientName}.`,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not record the assessment. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting) {
          onClose();
        }
      }}
      title="Record nursing assessment"
      description={patientName}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="assessment-form" loading={submitting}>
            Record assessment
          </Button>
        </>
      }
    >
      <form id="assessment-form" className="space-y-4" onSubmit={handleSubmit}>
        {formError ? (
          <Alert variant="danger" title="Unable to record assessment">
            {formError}
          </Alert>
        ) : null}

        <FormField
          label="Assessment type"
          htmlFor="assessment_type"
          required
          error={error ?? undefined}
        >
          <Select
            id="assessment_type"
            value={assessmentType}
            options={ASSESSMENT_TYPES}
            onChange={(event) => {
              setAssessmentType(event.target.value);
              setError(null);
            }}
          />
        </FormField>

        <FormField
          label="Notes"
          htmlFor="assessment_notes"
          hint="Optional."
        >
          <Textarea
            id="assessment_notes"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </FormField>
      </form>
    </Modal>
  );
}

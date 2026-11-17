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
import { recordPatientAllergyAction } from "@/app/(workspace)/patients/actions";
import { patientAllergySchema } from "@/lib/validations/patient-records";

type FormValues = {
  allergen: string;
  reaction: string;
  severity: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  allergen: "",
  reaction: "",
  severity: "",
  notes: "",
};

const SEVERITY_OPTIONS = [
  { label: "Mild", value: "mild" },
  { label: "Moderate", value: "moderate" },
  { label: "Severe", value: "severe" },
  { label: "Life threatening", value: "life_threatening" },
];

export interface PatientAllergyDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

export function PatientAllergyDialog({
  open,
  onClose,
  patientId,
  patientName,
}: PatientAllergyDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = patientAllergySchema.safeParse({ patientId, ...values });

    if (!parsed.success) {
      const nextErrors: FormErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !nextErrors[field as keyof FormValues]) {
          nextErrors[field as keyof FormValues] = issue.message;
        }
      }

      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await recordPatientAllergyAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Allergy recorded",
        description: `${values.allergen} added to ${patientName}'s record.`,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not record the allergy. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add allergy"
      description={`Allergy record for ${patientName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="allergy-form" loading={submitting}>
            Record allergy
          </Button>
        </>
      }
    >
      <form
        id="allergy-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {formError ? (
          <Alert variant="danger" title="Unable to record allergy">
            {formError}
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Allergen"
            htmlFor="allergy_allergen"
            required
            error={errors.allergen}
          >
            <Input
              id="allergy_allergen"
              value={values.allergen}
              invalid={Boolean(errors.allergen)}
              onChange={(event) => setField("allergen", event.target.value)}
            />
          </FormField>

          <FormField
            label="Severity"
            htmlFor="allergy_severity"
            error={errors.severity}
          >
            <Select
              id="allergy_severity"
              value={values.severity}
              options={SEVERITY_OPTIONS}
              onChange={(event) => setField("severity", event.target.value)}
            >
              <option value="">Not recorded</option>
            </Select>
          </FormField>
        </div>

        <FormField
          label="Reaction"
          htmlFor="allergy_reaction"
          hint="Optional. Describe the observed reaction."
          error={errors.reaction}
        >
          <Input
            id="allergy_reaction"
            value={values.reaction}
            onChange={(event) => setField("reaction", event.target.value)}
          />
        </FormField>

        <FormField
          label="Notes"
          htmlFor="allergy_notes"
          hint="Optional."
          error={errors.notes}
        >
          <Textarea
            id="allergy_notes"
            rows={3}
            value={values.notes}
            onChange={(event) => setField("notes", event.target.value)}
          />
        </FormField>

        <Alert variant="warning" title="Clinical record">
          Allergy records are part of the medical record and are visible to
          authorized clinical staff.
        </Alert>
      </form>
    </Modal>
  );
}

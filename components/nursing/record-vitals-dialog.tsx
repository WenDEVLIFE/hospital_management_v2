"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { recordVitalSignsAction } from "@/app/(workspace)/nursing/actions";
import { vitalSignsSchema } from "@/lib/validations/nursing";

type FormValues = {
  systolicBp: string;
  diastolicBp: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  oxygenSaturation: string;
  weightKg: string;
  heightCm: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  systolicBp: "",
  diastolicBp: "",
  heartRate: "",
  respiratoryRate: "",
  temperature: "",
  oxygenSaturation: "",
  weightKg: "",
  heightCm: "",
};

const FIELDS: Array<{
  key: keyof FormValues;
  label: string;
  hint?: string;
}> = [
  { key: "systolicBp", label: "Systolic BP", hint: "mmHg" },
  { key: "diastolicBp", label: "Diastolic BP", hint: "mmHg" },
  { key: "heartRate", label: "Heart rate", hint: "bpm" },
  { key: "respiratoryRate", label: "Respiratory rate", hint: "breaths/min" },
  { key: "temperature", label: "Temperature", hint: "°C" },
  { key: "oxygenSaturation", label: "Oxygen saturation", hint: "%" },
  { key: "weightKg", label: "Weight", hint: "kg" },
  { key: "heightCm", label: "Height", hint: "cm" },
];

export interface RecordVitalsDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  encounterId: string;
  patientName: string;
}

export function RecordVitalsDialog({
  open,
  onClose,
  patientId,
  encounterId,
  patientName,
}: RecordVitalsDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function setField(field: keyof FormValues, value: string) {
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

    const parsed = vitalSignsSchema.safeParse({
      patientId,
      encounterId,
      ...values,
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
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await recordVitalSignsAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Vital signs recorded",
        description: `Observations charted for ${patientName}.`,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not record the vital signs. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record vitals"
      description={`New observations for ${patientName}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="vitals-form" loading={submitting}>
            Save observations
          </Button>
        </>
      }
    >
      <form
        id="vitals-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {formError ? (
          <Alert variant="danger" title="Unable to record vitals">
            {formError}
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <FormField
              key={field.key}
              label={field.label}
              htmlFor={`vitals_${field.key}`}
              hint={field.hint}
              error={errors[field.key]}
            >
              <Input
                id={`vitals_${field.key}`}
                inputMode="decimal"
                autoComplete="off"
                value={values[field.key]}
                invalid={Boolean(errors[field.key])}
                onChange={(event) => setField(field.key, event.target.value)}
              />
            </FormField>
          ))}
        </div>

        <Alert variant="info" title="Charting is timestamped">
          Observations are stored with the current time and your staff account.
          Leave fields blank when a measurement was not taken.
        </Alert>
      </form>
    </Modal>
  );
}

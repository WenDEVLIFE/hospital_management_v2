"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageSection } from "@/components/layout/page-section";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { dischargePatientAction } from "@/app/(workspace)/discharges/new/actions";
import { dischargeSchema } from "@/lib/validations/admission";

export type DischargeAdmissionOption = {
  id: string;
  admission_number: string;
  patient_name: string;
  patient_mrn: string;
  room_number: string | null;
  bed_number: string | null;
  department_name: string;
};

type FormValues = {
  admission_id: string;
  discharge_notes: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  admission_id: "",
  discharge_notes: "",
};

function validate(values: FormValues): FormErrors {
  const result = dischargeSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  const errors: FormErrors = {};

  for (const issue of result.error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !errors[field as keyof FormValues]) {
      errors[field as keyof FormValues] = issue.message;
    }
  }

  return errors;
}

export interface DischargeFormProps {
  admissions: DischargeAdmissionOption[];
}

export function DischargeForm({ admissions }: DischargeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const selectedAdmission =
    admissions.find((admission) => admission.id === values.admission_id) ??
    null;

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

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await dischargePatientAction(values);

      if (!result.ok) {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors as FormErrors);
        }

        if (result.formError) {
          setFormError(result.formError);
        }

        return;
      }

      toast({
        title: "Patient discharged",
        description: "The admission was completed and the bed released.",
        variant: "success",
      });

      router.push("/discharges");
      router.refresh();
    } catch {
      setFormError(
        "We could not discharge the patient. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setValues(INITIAL_VALUES);
    setErrors({});
    setFormError(null);
    setSubmitting(false);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {formError ? (
        <Alert variant="danger" title="Unable to discharge patient">
          {formError}
        </Alert>
      ) : null}

      <PageSection
        title="Discharge"
        description="Complete the admission and release the assigned bed."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Admission"
            htmlFor="admission_id"
            required
            error={errors.admission_id}
          >
            <Select
              id="admission_id"
              name="admission_id"
              value={values.admission_id}
              onChange={(event) =>
                setField("admission_id", event.target.value)
              }
            >
              <option value="">Select admission</option>
              {admissions.map((admission) => (
                <option key={admission.id} value={admission.id}>
                  {admission.admission_number} · {admission.patient_name} ·{" "}
                  {admission.patient_mrn}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="flex flex-col justify-end">
            <p className="text-[11px] font-medium text-hospital-text-muted">
              Current bed
            </p>
            <p className="mt-1 text-sm text-hospital-text">
              {selectedAdmission
                ? `${selectedAdmission.department_name} · Room ${
                    selectedAdmission.room_number ?? "—"
                  } · Bed ${selectedAdmission.bed_number ?? "—"}`
                : "Select an admission to view its current bed."}
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection
        title="Discharge notes"
        description="Summary and follow-up instructions."
      >
        <FormField
          label="Notes"
          htmlFor="discharge_notes"
          error={errors.discharge_notes}
        >
          <Textarea
            id="discharge_notes"
            name="discharge_notes"
            rows={4}
            value={values.discharge_notes}
            onChange={(event) =>
              setField("discharge_notes", event.target.value)
            }
          />
        </FormField>
      </PageSection>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/discharges">
          <Button variant="secondary">Cancel</Button>
        </Link>
        <Button
          type="button"
          variant="secondary"
          onClick={handleReset}
          disabled={submitting}
        >
          Reset form
        </Button>
        <Button type="submit" loading={submitting}>
          Discharge Patient
        </Button>
      </div>
    </form>
  );
}

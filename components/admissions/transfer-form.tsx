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
import { transferPatientAction } from "@/app/(workspace)/admissions/transfer/actions";
import { transferSchema } from "@/lib/validations/admission";

export type TransferAdmissionOption = {
  id: string;
  admission_number: string;
  patient_name: string;
  patient_mrn: string;
  room_number: string | null;
  bed_number: string | null;
  department_id: string;
  department_name: string;
};

export type TransferBedOption = {
  id: string;
  label: string;
  department_id: string;
  room_number: string;
  bed_number: string;
};

type FormValues = {
  admission_id: string;
  to_bed_id: string;
  transfer_reason: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  admission_id: "",
  to_bed_id: "",
  transfer_reason: "",
};

function validate(values: FormValues): FormErrors {
  const result = transferSchema.safeParse(values);

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

export interface TransferFormProps {
  admissions: TransferAdmissionOption[];
  beds: TransferBedOption[];
}

export function TransferForm({ admissions, beds }: TransferFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const selectedAdmission =
    admissions.find((admission) => admission.id === values.admission_id) ??
    null;

  const availableBeds = selectedAdmission
    ? beds.filter(
        (bed) =>
          bed.department_id === selectedAdmission.department_id &&
          !(
            bed.room_number === selectedAdmission.room_number &&
            bed.bed_number === selectedAdmission.bed_number
          )
      )
    : [];

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

  function handleAdmissionChange(admissionId: string) {
    setValues((current) => ({
      ...current,
      admission_id: admissionId,
      to_bed_id: "",
    }));
    setFormError(null);
    setErrors((current) => ({
      ...current,
      admission_id: undefined,
      to_bed_id: undefined,
    }));
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
      const result = await transferPatientAction(values);

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
        title: "Patient transferred",
        description: "The bed assignment was updated.",
        variant: "success",
      });

      router.push("/admissions");
      router.refresh();
    } catch {
      setFormError(
        "We could not transfer the patient. Check your connection and try again."
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
        <Alert variant="danger" title="Unable to transfer patient">
          {formError}
        </Alert>
      ) : null}

      <PageSection
        title="Transfer"
        description="Move an admitted patient to another available bed."
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
                handleAdmissionChange(event.target.value)
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

          <FormField
            label="New bed"
            htmlFor="to_bed_id"
            required
            hint={
              selectedAdmission && availableBeds.length === 0
                ? "No other available beds in this department."
                : "Only beds marked available are listed."
            }
            error={errors.to_bed_id}
          >
            <Select
              id="to_bed_id"
              name="to_bed_id"
              value={values.to_bed_id}
              onChange={(event) =>
                setField("to_bed_id", event.target.value)
              }
              disabled={!selectedAdmission}
            >
              <option value="">Select available bed</option>
              {availableBeds.map((bed) => (
                <option key={bed.id} value={bed.id}>
                  {bed.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </PageSection>

      <PageSection
        title="Transfer reason"
        description="Why the patient is moving beds."
      >
        <FormField
          label="Reason"
          htmlFor="transfer_reason"
          error={errors.transfer_reason}
        >
          <Textarea
            id="transfer_reason"
            name="transfer_reason"
            rows={3}
            value={values.transfer_reason}
            onChange={(event) =>
              setField("transfer_reason", event.target.value)
            }
          />
        </FormField>
      </PageSection>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/admissions">
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
          Transfer Patient
        </Button>
      </div>
    </form>
  );
}

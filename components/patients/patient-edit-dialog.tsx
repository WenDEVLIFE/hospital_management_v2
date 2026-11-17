"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { updatePatientAction } from "@/app/(workspace)/patients/actions";
import {
  PATIENT_STATUSES,
  patientUpdateSchema,
} from "@/lib/validations/patient-records";

export type PatientEditable = {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  date_of_birth: string | null;
  sex: string | null;
  civil_status?: string | null;
  nationality?: string | null;
  contact_number: string | null;
  email: string | null;
  address_line?: string | null;
  city?: string | null;
  province?: string | null;
  registration_status: "active" | "inactive" | "archived";
};

type FormValues = {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  date_of_birth: string;
  sex: string;
  civil_status: string;
  nationality: string;
  contact_number: string;
  email: string;
  address_line: string;
  city: string;
  province: string;
  registration_status: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const STATUS_OPTIONS = PATIENT_STATUSES.map((status) => ({
  label: status.charAt(0).toUpperCase() + status.slice(1),
  value: status,
}));

const SEX_OPTIONS = [
  { label: "Female", value: "Female" },
  { label: "Male", value: "Male" },
  { label: "Other", value: "Other" },
];

function toFormValues(patient: PatientEditable): FormValues {
  return {
    first_name: patient.first_name,
    middle_name: patient.middle_name ?? "",
    last_name: patient.last_name,
    suffix: patient.suffix ?? "",
    date_of_birth: patient.date_of_birth ?? "",
    sex: patient.sex ?? "",
    civil_status: patient.civil_status ?? "",
    nationality: patient.nationality ?? "",
    contact_number: patient.contact_number ?? "",
    email: patient.email ?? "",
    address_line: patient.address_line ?? "",
    city: patient.city ?? "",
    province: patient.province ?? "",
    registration_status: patient.registration_status,
  };
}

export interface PatientEditDialogProps {
  open: boolean;
  onClose: () => void;
  patient: PatientEditable | null;
}

export function PatientEditDialog({
  open,
  onClose,
  patient,
}: PatientEditDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState<FormValues>(() =>
    patient ? toFormValues(patient) : ({} as FormValues)
  );
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!patient) {
    return null;
  }

  const activePatient = patient;

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

    const parsed = patientUpdateSchema.safeParse({
      patientId: activePatient.id,
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
      const result = await updatePatientAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Patient record updated",
        description: "The demographic details were saved.",
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not update the patient record. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit patient record"
      description={`${patient.first_name} ${patient.last_name} · demographics and registration status`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="patient-edit-form" loading={submitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="patient-edit-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {formError ? (
          <Alert variant="danger" title="Unable to update patient">
            {formError}
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="First name"
            htmlFor="edit_first_name"
            required
            error={errors.first_name}
          >
            <Input
              id="edit_first_name"
              value={values.first_name}
              invalid={Boolean(errors.first_name)}
              onChange={(event) => setField("first_name", event.target.value)}
            />
          </FormField>

          <FormField
            label="Middle name"
            htmlFor="edit_middle_name"
            error={errors.middle_name}
          >
            <Input
              id="edit_middle_name"
              value={values.middle_name}
              onChange={(event) => setField("middle_name", event.target.value)}
            />
          </FormField>

          <FormField
            label="Last name"
            htmlFor="edit_last_name"
            required
            error={errors.last_name}
          >
            <Input
              id="edit_last_name"
              value={values.last_name}
              invalid={Boolean(errors.last_name)}
              onChange={(event) => setField("last_name", event.target.value)}
            />
          </FormField>

          <FormField label="Suffix" htmlFor="edit_suffix" error={errors.suffix}>
            <Input
              id="edit_suffix"
              value={values.suffix}
              onChange={(event) => setField("suffix", event.target.value)}
            />
          </FormField>

          <FormField
            label="Date of birth"
            htmlFor="edit_date_of_birth"
            error={errors.date_of_birth}
          >
            <Input
              id="edit_date_of_birth"
              type="date"
              value={values.date_of_birth}
              invalid={Boolean(errors.date_of_birth)}
              onChange={(event) =>
                setField("date_of_birth", event.target.value)
              }
            />
          </FormField>

          <FormField label="Sex" htmlFor="edit_sex" error={errors.sex}>
            <Select
              id="edit_sex"
              value={values.sex}
              onChange={(event) => setField("sex", event.target.value)}
            >
              <option value="">Not recorded</option>
              {SEX_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Civil status"
            htmlFor="edit_civil_status"
            error={errors.civil_status}
          >
            <Input
              id="edit_civil_status"
              value={values.civil_status}
              onChange={(event) =>
                setField("civil_status", event.target.value)
              }
            />
          </FormField>

          <FormField
            label="Nationality"
            htmlFor="edit_nationality"
            error={errors.nationality}
          >
            <Input
              id="edit_nationality"
              value={values.nationality}
              onChange={(event) => setField("nationality", event.target.value)}
            />
          </FormField>

          <FormField
            label="Contact number"
            htmlFor="edit_contact_number"
            error={errors.contact_number}
          >
            <Input
              id="edit_contact_number"
              value={values.contact_number}
              invalid={Boolean(errors.contact_number)}
              onChange={(event) =>
                setField("contact_number", event.target.value)
              }
            />
          </FormField>

          <FormField label="Email" htmlFor="edit_email" error={errors.email}>
            <Input
              id="edit_email"
              type="email"
              value={values.email}
              invalid={Boolean(errors.email)}
              onChange={(event) => setField("email", event.target.value)}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="Address"
            htmlFor="edit_address_line"
            error={errors.address_line}
          >
            <Input
              id="edit_address_line"
              value={values.address_line}
              onChange={(event) =>
                setField("address_line", event.target.value)
              }
            />
          </FormField>

          <FormField label="City" htmlFor="edit_city" error={errors.city}>
            <Input
              id="edit_city"
              value={values.city}
              onChange={(event) => setField("city", event.target.value)}
            />
          </FormField>

          <FormField
            label="Province"
            htmlFor="edit_province"
            error={errors.province}
          >
            <Input
              id="edit_province"
              value={values.province}
              onChange={(event) => setField("province", event.target.value)}
            />
          </FormField>
        </div>

        <FormField
          label="Registration status"
          htmlFor="edit_status"
          error={errors.registration_status}
        >
          <Select
            id="edit_status"
            value={values.registration_status}
            options={STATUS_OPTIONS}
            onChange={(event) =>
              setField("registration_status", event.target.value)
            }
          />
        </FormField>

        <Alert variant="info" title="Clinical data is separate">
          Demographics and registration status are editable here. Allergies,
          diagnoses and encounters are recorded from the medical record.
        </Alert>
      </form>
    </Modal>
  );
}

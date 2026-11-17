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
import { createAdmissionAction } from "@/app/(workspace)/admissions/new/actions";
import { admissionSchema } from "@/lib/validations/admission";
import type { PhysicianOption } from "@/types/hospital";

type FormValues = {
  patient_id: string;
  department_id: string;
  attending_physician_id: string;
  bed_id: string;
  admission_type: string;
  admission_notes: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  patient_id: "",
  department_id: "",
  attending_physician_id: "",
  bed_id: "",
  admission_type: "Elective",
  admission_notes: "",
};

const ADMISSION_TYPES = [
  { label: "Elective", value: "Elective" },
  { label: "Emergency", value: "Emergency" },
  { label: "Transfer", value: "Transfer" },
];

function validate(values: FormValues): FormErrors {
  const result = admissionSchema.safeParse(values);

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

export interface AdmissionFormProps {
  patients: {
    id: string;
    full_name: string;
    medical_record_number: string;
  }[];
  departments: { id: string; name: string }[];
  physicians: PhysicianOption[];
  beds: { id: string; label: string; department_id: string }[];
}

export function AdmissionForm({
  patients,
  departments,
  physicians,
  beds,
}: AdmissionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const filteredBeds = values.department_id
    ? beds.filter((bed) => bed.department_id === values.department_id)
    : beds;

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

  function handleDepartmentChange(departmentId: string) {
    setValues((current) => {
      const selectedBed = beds.find((bed) => bed.id === current.bed_id);

      return {
        ...current,
        department_id: departmentId,
        bed_id:
          selectedBed?.department_id === departmentId ? current.bed_id : "",
      };
    });
    setFormError(null);
    setErrors((current) => ({
      ...current,
      department_id: undefined,
      bed_id: undefined,
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
      const result = await createAdmissionAction(values);

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
        title: "Patient admitted",
        description: "The admission and bed assignment were created.",
        variant: "success",
      });

      router.push("/admissions");
      router.refresh();
    } catch {
      setFormError(
        "We could not admit the patient. Check your connection and try again."
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
        <Alert variant="danger" title="Unable to admit patient">
          {formError}
        </Alert>
      ) : null}

      <PageSection
        title="Admission"
        description="Patient, care team, and bed allocation."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Patient"
            htmlFor="patient_id"
            required
            error={errors.patient_id}
          >
            <Select
              id="patient_id"
              name="patient_id"
              value={values.patient_id}
              onChange={(event) =>
                setField("patient_id", event.target.value)
              }
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name} · {patient.medical_record_number}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Department"
            htmlFor="department_id"
            required
            error={errors.department_id}
          >
            <Select
              id="department_id"
              name="department_id"
              value={values.department_id}
              onChange={(event) =>
                handleDepartmentChange(event.target.value)
              }
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Attending physician"
            htmlFor="attending_physician_id"
            hint="Optional."
            error={errors.attending_physician_id}
          >
            <Select
              id="attending_physician_id"
              name="attending_physician_id"
              value={values.attending_physician_id}
              onChange={(event) =>
                setField("attending_physician_id", event.target.value)
              }
            >
              <option value="">Unassigned</option>
              {physicians.map((physician) => (
                <option key={physician.id} value={physician.id}>
                  {physician.full_name}
                  {physician.specialty ? ` · ${physician.specialty}` : ""}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Bed"
            htmlFor="bed_id"
            required
            hint={
              values.department_id && filteredBeds.length === 0
                ? "No available beds in this department."
                : "Only beds marked available are listed."
            }
            error={errors.bed_id}
          >
            <Select
              id="bed_id"
              name="bed_id"
              value={values.bed_id}
              onChange={(event) => setField("bed_id", event.target.value)}
            >
              <option value="">Select available bed</option>
              {filteredBeds.map((bed) => (
                <option key={bed.id} value={bed.id}>
                  {bed.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Admission type"
            htmlFor="admission_type"
            error={errors.admission_type}
          >
            <Select
              id="admission_type"
              name="admission_type"
              value={values.admission_type}
              onChange={(event) =>
                setField("admission_type", event.target.value)
              }
              options={ADMISSION_TYPES}
            />
          </FormField>
        </div>
      </PageSection>

      <PageSection
        title="Clinical notes"
        description="Reason for admission and initial instructions."
      >
        <FormField
          label="Admission notes"
          htmlFor="admission_notes"
          error={errors.admission_notes}
        >
          <Textarea
            id="admission_notes"
            name="admission_notes"
            rows={4}
            value={values.admission_notes}
            onChange={(event) =>
              setField("admission_notes", event.target.value)
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
          Admit Patient
        </Button>
      </div>
    </form>
  );
}

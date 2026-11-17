"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageSection } from "@/components/layout/page-section";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { createAppointmentAction } from "@/app/(workspace)/appointments/new/actions";
import { appointmentSchema } from "@/lib/validations/appointment";
import type { PhysicianOption } from "@/types/hospital";

type FormValues = {
  patient_id: string;
  department_id: string;
  physician_id: string;
  scheduled_at: string;
  duration_minutes: string;
  appointment_type: string;
  reason_for_visit: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  patient_id: "",
  department_id: "",
  physician_id: "",
  scheduled_at: "",
  duration_minutes: "30",
  appointment_type: "Consultation",
  reason_for_visit: "",
  notes: "",
};

const APPOINTMENT_TYPES = [
  { label: "Consultation", value: "Consultation" },
  { label: "Follow-up", value: "Follow-up" },
  { label: "Emergency", value: "Emergency" },
  { label: "Procedure", value: "Procedure" },
  { label: "Other", value: "Other" },
];

function validate(values: FormValues): FormErrors {
  const result = appointmentSchema.safeParse(values);

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

export interface AppointmentFormProps {
  patients: {
    id: string;
    full_name: string;
    medical_record_number: string;
  }[];
  departments: { id: string; name: string }[];
  physicians: PhysicianOption[];
}

export function AppointmentForm({
  patients,
  departments,
  physicians,
}: AppointmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

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
      const result = await createAppointmentAction(values);

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
        title: "Appointment scheduled",
        description: "The appointment was created successfully.",
        variant: "success",
      });

      router.push("/appointments");
      router.refresh();
    } catch {
      setFormError(
        "We could not schedule the appointment. Check your connection and try again."
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
        <Alert variant="danger" title="Unable to schedule appointment">
          {formError}
        </Alert>
      ) : null}

      <PageSection
        title="Appointment"
        description="Patient, care team, and schedule."
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
                setField("department_id", event.target.value)
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
            label="Physician"
            htmlFor="physician_id"
            hint="Optional. Leave unassigned for triage."
            error={errors.physician_id}
          >
            <Select
              id="physician_id"
              name="physician_id"
              value={values.physician_id}
              onChange={(event) =>
                setField("physician_id", event.target.value)
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
            label="Date and time"
            htmlFor="scheduled_at"
            required
            hint="Philippine Standard Time."
            error={errors.scheduled_at}
          >
            <Input
              id="scheduled_at"
              type="datetime-local"
              name="scheduled_at"
              value={values.scheduled_at}
              onChange={(event) =>
                setField("scheduled_at", event.target.value)
              }
            />
          </FormField>

          <FormField
            label="Duration (minutes)"
            htmlFor="duration_minutes"
            required
            error={errors.duration_minutes}
          >
            <Input
              id="duration_minutes"
              type="number"
              min={1}
              max={480}
              name="duration_minutes"
              value={values.duration_minutes}
              onChange={(event) =>
                setField("duration_minutes", event.target.value)
              }
            />
          </FormField>
        </div>
      </PageSection>

      <PageSection
        title="Visit details"
        description="Reason for the visit and any scheduling notes."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Appointment type"
            htmlFor="appointment_type"
            error={errors.appointment_type}
          >
            <Select
              id="appointment_type"
              name="appointment_type"
              value={values.appointment_type}
              onChange={(event) =>
                setField("appointment_type", event.target.value)
              }
              options={APPOINTMENT_TYPES}
            />
          </FormField>

          <FormField
            label="Reason for visit"
            htmlFor="reason_for_visit"
            error={errors.reason_for_visit}
          >
            <Input
              id="reason_for_visit"
              name="reason_for_visit"
              value={values.reason_for_visit}
              onChange={(event) =>
                setField("reason_for_visit", event.target.value)
              }
            />
          </FormField>

          <FormField
            label="Notes"
            htmlFor="notes"
            className="sm:col-span-2"
            error={errors.notes}
          >
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              value={values.notes}
              onChange={(event) => setField("notes", event.target.value)}
            />
          </FormField>
        </div>
      </PageSection>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/appointments">
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
          Schedule Appointment
        </Button>
      </div>
    </form>
  );
}

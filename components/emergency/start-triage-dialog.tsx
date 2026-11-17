"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HeartPulseIcon } from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useCan } from "@/components/providers/permission-provider";
import { startEmergencyVisitAction } from "@/app/(workspace)/emergency/actions";
import { startEmergencyVisitSchema } from "@/lib/validations/emergency";

type FormValues = {
  patientId: string;
  chiefComplaint: string;
  triageLevel: string;
  arrivalMode: string;
  triageNote: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  patientId: "",
  chiefComplaint: "",
  triageLevel: "urgent",
  arrivalMode: "walk_in",
  triageNote: "",
};

const TRIAGE_OPTIONS = [
  { label: "Critical", value: "critical" },
  { label: "Emergent", value: "emergent" },
  { label: "Urgent", value: "urgent" },
  { label: "Less urgent", value: "less_urgent" },
  { label: "Non-urgent", value: "non_urgent" },
];

const ARRIVAL_OPTIONS = [
  { label: "Walk-in", value: "walk_in" },
  { label: "Ambulance", value: "ambulance" },
  { label: "Referral", value: "referral" },
];

export interface StartTriageDialogProps {
  patients: Array<{
    id: string;
    full_name: string;
    medical_record_number: string;
  }>;
}

export function StartTriageAction({ patients }: StartTriageDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const can = useCan();

  if (!can("emergency.create")) {
    return null;
  }

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

    const parsed = startEmergencyVisitSchema.safeParse(values);

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
      const result = await startEmergencyVisitAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Triage started",
        description: "The emergency visit and encounter were created.",
        variant: "success",
      });

      setValues(INITIAL_VALUES);
      setOpen(false);
      router.refresh();
    } catch {
      setFormError(
        "We could not start triage. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <HeartPulseIcon className="size-4" aria-hidden="true" />
        Start Triage
      </Button>
      <Modal
        open={open}
        onClose={() => {
          if (!submitting) {
            setOpen(false);
          }
        }}
        title="Start triage"
        description="Record triage level and open an emergency encounter."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="triage-form" loading={submitting}>
              Start triage
            </Button>
          </>
        }
      >
        <form
          id="triage-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to start triage">
              {formError}
            </Alert>
          ) : null}

          <FormField
            label="Patient"
            htmlFor="triage_patient"
            required
            error={errors.patientId}
          >
            <Select
              id="triage_patient"
              value={values.patientId}
              invalid={Boolean(errors.patientId)}
              onChange={(event) => setField("patientId", event.target.value)}
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
            label="Chief complaint"
            htmlFor="triage_complaint"
            required
            error={errors.chiefComplaint}
          >
            <Textarea
              id="triage_complaint"
              rows={2}
              value={values.chiefComplaint}
              invalid={Boolean(errors.chiefComplaint)}
              onChange={(event) =>
                setField("chiefComplaint", event.target.value)
              }
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Triage level"
              htmlFor="triage_level"
              required
              error={errors.triageLevel}
            >
              <Select
                id="triage_level"
                value={values.triageLevel}
                options={TRIAGE_OPTIONS}
                onChange={(event) =>
                  setField("triageLevel", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Arrival mode"
              htmlFor="triage_arrival"
              required
              error={errors.arrivalMode}
            >
              <Select
                id="triage_arrival"
                value={values.arrivalMode}
                options={ARRIVAL_OPTIONS}
                onChange={(event) =>
                  setField("arrivalMode", event.target.value)
                }
              />
            </FormField>
          </div>

          <FormField
            label="Triage note"
            htmlFor="triage_note"
            hint="Optional. Observations at triage."
            error={errors.triageNote}
          >
            <Textarea
              id="triage_note"
              rows={3}
              value={values.triageNote}
              onChange={(event) => setField("triageNote", event.target.value)}
            />
          </FormField>

          <Alert variant="info" title="Creates an encounter">
            Triage opens an emergency encounter so vitals, orders, notes and
            diagnoses are charted against the same visit.
          </Alert>
        </form>
      </Modal>
    </>
  );
}

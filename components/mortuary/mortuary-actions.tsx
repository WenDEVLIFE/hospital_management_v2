"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArchiveIcon,
  FileCheckIcon,
} from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useCan } from "@/components/providers/permission-provider";
import {
  admitMortuaryCaseAction,
  releaseMortuaryCaseAction,
} from "@/app/(workspace)/mortuary/actions";
import {
  admitMortuarySchema,
  releaseMortuarySchema,
} from "@/lib/validations/mortuary";

export function MortuaryAdmissionAction({
  patients,
}: {
  patients: Array<{ id: string; full_name: string; medical_record_number: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    patientId: "",
    bodyTagNumber: "",
    placeOfDeath: "SPMC",
    identificationStatus: "pending",
    nextOfKinName: "",
    nextOfKinRelationship: "",
    nextOfKinContact: "",
    notes: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("mortuary.manage")) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = admitMortuarySchema.safeParse(values);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the admission details.");
      return;
    }

    setError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await admitMortuaryCaseAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Body admitted",
        description: `Tag ${parsed.data.bodyTagNumber} placed in the next available unit.`,
        variant: "success",
      });
      setValues({
        patientId: "",
        bodyTagNumber: "",
        placeOfDeath: "SPMC",
        identificationStatus: "pending",
        nextOfKinName: "",
        nextOfKinRelationship: "",
        nextOfKinContact: "",
        notes: "",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not admit the case. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <ArchiveIcon className="size-4" aria-hidden="true" />
        Mortuary Admission
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Mortuary admission"
        description="Record a body in custody and allocate a storage unit."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="mortuary-admit-form" loading={submitting}>
              Admit to mortuary
            </Button>
          </>
        }
      >
        <form
          id="mortuary-admit-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to admit">
              {formError}
            </Alert>
          ) : null}
          {error ? <Alert variant="warning" title="Check the form">{error}</Alert> : null}

          <FormField label="Patient" htmlFor="mor_patient" required>
            <Select
              id="mor_patient"
              value={values.patientId}
              onChange={(event) => setValues((c) => ({ ...c, patientId: event.target.value }))}
            >
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name} · {patient.medical_record_number}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Body tag number" htmlFor="mor_tag" required>
              <Input
                id="mor_tag"
                value={values.bodyTagNumber}
                onChange={(event) =>
                  setValues((c) => ({ ...c, bodyTagNumber: event.target.value }))
                }
              />
            </FormField>

            <FormField label="Place of death" htmlFor="mor_place">
              <Input
                id="mor_place"
                value={values.placeOfDeath}
                onChange={(event) =>
                  setValues((c) => ({ ...c, placeOfDeath: event.target.value }))
                }
              />
            </FormField>

            <FormField label="Identification" htmlFor="mor_identification" required>
              <Select
                id="mor_identification"
                value={values.identificationStatus}
                options={[
                  { label: "Pending", value: "pending" },
                  { label: "Verified", value: "verified" },
                  { label: "Discrepancy", value: "discrepancy" },
                ]}
                onChange={(event) =>
                  setValues((c) => ({ ...c, identificationStatus: event.target.value }))
                }
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Next of kin" htmlFor="mor_kin">
              <Input
                id="mor_kin"
                value={values.nextOfKinName}
                onChange={(event) =>
                  setValues((c) => ({ ...c, nextOfKinName: event.target.value }))
                }
              />
            </FormField>

            <FormField label="Relationship" htmlFor="mor_kin_rel">
              <Input
                id="mor_kin_rel"
                value={values.nextOfKinRelationship}
                onChange={(event) =>
                  setValues((c) => ({ ...c, nextOfKinRelationship: event.target.value }))
                }
              />
            </FormField>

            <FormField label="Contact" htmlFor="mor_kin_contact">
              <Input
                id="mor_kin_contact"
                value={values.nextOfKinContact}
                onChange={(event) =>
                  setValues((c) => ({ ...c, nextOfKinContact: event.target.value }))
                }
              />
            </FormField>
          </div>

          <FormField label="Notes" htmlFor="mor_notes" hint="Optional.">
            <Textarea
              id="mor_notes"
              rows={2}
              value={values.notes}
              onChange={(event) => setValues((c) => ({ ...c, notes: event.target.value }))}
            />
          </FormField>

          <Alert variant="info" title="Storage allocation">
            The first available unit is assigned automatically. Admission is
            refused when no unit is free.
          </Alert>
        </form>
      </Modal>
    </>
  );
}

export function ReleaseMortuaryAction({
  cases,
}: {
  cases: Array<{ id: string; case_number: string; patient_name: string; identification_status: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    recordId: "",
    releasedTo: "",
    relationship: "",
    documentReference: "",
    notes: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("mortuary.manage")) {
    return null;
  }

  const selected = cases.find((entry) => entry.id === values.recordId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = releaseMortuarySchema.safeParse(values);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the release details.");
      return;
    }

    setError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await releaseMortuaryCaseAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Body released",
        description: `Case released to ${parsed.data.releasedTo}.`,
        variant: "success",
      });
      setValues({
        recordId: "",
        releasedTo: "",
        relationship: "",
        documentReference: "",
        notes: "",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not record the release. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <FileCheckIcon className="size-4" aria-hidden="true" />
        Authorize Release
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Authorize release"
        description="Release a body to the next of kin and free the storage unit."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="mortuary-release-form" loading={submitting}>
              Release body
            </Button>
          </>
        }
      >
        <form
          id="mortuary-release-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to release">
              {formError}
            </Alert>
          ) : null}
          {error ? <Alert variant="warning" title="Check the form">{error}</Alert> : null}

          <FormField label="Case" htmlFor="mor_case" required>
            <Select
              id="mor_case"
              value={values.recordId}
              onChange={(event) => setValues((c) => ({ ...c, recordId: event.target.value }))}
            >
              <option value="">Select case</option>
              {cases.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.case_number} · {entry.patient_name} ·{" "}
                  {entry.identification_status}
                </option>
              ))}
            </Select>
          </FormField>

          {selected && selected.identification_status !== "verified" ? (
            <Alert variant="warning" title="Identification not verified">
              This case is marked <strong>{selected.identification_status}</strong>.
              A discrepancy blocks release until it is resolved.
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Released to" htmlFor="mor_released_to" required>
              <Input
                id="mor_released_to"
                value={values.releasedTo}
                onChange={(event) =>
                  setValues((c) => ({ ...c, releasedTo: event.target.value }))
                }
              />
            </FormField>

            <FormField label="Relationship" htmlFor="mor_relationship">
              <Input
                id="mor_relationship"
                value={values.relationship}
                onChange={(event) =>
                  setValues((c) => ({ ...c, relationship: event.target.value }))
                }
              />
            </FormField>

            <FormField label="Document reference" htmlFor="mor_document" required>
              <Input
                id="mor_document"
                value={values.documentReference}
                onChange={(event) =>
                  setValues((c) => ({ ...c, documentReference: event.target.value }))
                }
              />
            </FormField>
          </div>

          <FormField label="Notes" htmlFor="mor_release_notes" hint="Optional.">
            <Textarea
              id="mor_release_notes"
              rows={2}
              value={values.notes}
              onChange={(event) => setValues((c) => ({ ...c, notes: event.target.value }))}
            />
          </FormField>
        </form>
      </Modal>
    </>
  );
}

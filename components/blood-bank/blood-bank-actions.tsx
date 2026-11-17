"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AddCircleIcon,
  ClipboardListIcon,
  TestTubeIcon,
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
  createBloodRequestAction,
  recordDonationAction,
  registerDonorAction,
} from "@/app/(workspace)/blood-bank/actions";
import {
  createBloodRequestSchema,
  recordDonationSchema,
  registerDonorSchema,
} from "@/lib/validations/blood-bank";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS = [
  { label: "Whole blood", value: "whole_blood" },
  { label: "Packed RBC", value: "packed_rbc" },
  { label: "Plasma", value: "plasma" },
  { label: "Platelets", value: "platelets" },
  { label: "Cryoprecipitate", value: "cryoprecipitate" },
];

function fieldErrors<T extends Record<string, unknown>>(
  issues: Array<{ path: (string | number | symbol)[]; message: string }>
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !errors[field as keyof T]) {
      errors[field as keyof T] = issue.message;
    }
  }

  return errors;
}

export function RegisterDonorAction() {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    fullName: "",
    dateOfBirth: "",
    sex: "Female",
    bloodType: "O+",
    contactNumber: "",
    address: "",
  });
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof typeof values, string>>
  >({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("blood_bank.manage")) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = registerDonorSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await registerDonorAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Donor registered",
        description: `${parsed.data.fullName} · ${parsed.data.bloodType}`,
        variant: "success",
      });
      setValues({
        fullName: "",
        dateOfBirth: "",
        sex: "Female",
        bloodType: "O+",
        contactNumber: "",
        address: "",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not register the donor. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <AddCircleIcon className="size-4" aria-hidden="true" />
        Register Donor
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Register donor"
        description="Record a donor and their blood type."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="donor-form" loading={submitting}>
              Register donor
            </Button>
          </>
        }
      >
        <form id="donor-form" noValidate onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <Alert variant="danger" title="Unable to register donor">
              {formError}
            </Alert>
          ) : null}

          <FormField label="Full name" htmlFor="donor_name" required error={errors.fullName}>
            <Input
              id="donor_name"
              value={values.fullName}
              invalid={Boolean(errors.fullName)}
              onChange={(event) => setValues((c) => ({ ...c, fullName: event.target.value }))}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date of birth" htmlFor="donor_dob" required error={errors.dateOfBirth}>
              <Input
                id="donor_dob"
                type="date"
                value={values.dateOfBirth}
                invalid={Boolean(errors.dateOfBirth)}
                onChange={(event) => setValues((c) => ({ ...c, dateOfBirth: event.target.value }))}
              />
            </FormField>

            <FormField label="Sex" htmlFor="donor_sex" required error={errors.sex}>
              <Select
                id="donor_sex"
                value={values.sex}
                options={[
                  { label: "Female", value: "Female" },
                  { label: "Male", value: "Male" },
                ]}
                onChange={(event) => setValues((c) => ({ ...c, sex: event.target.value }))}
              />
            </FormField>

            <FormField label="Blood type" htmlFor="donor_type" required error={errors.bloodType}>
              <Select
                id="donor_type"
                value={values.bloodType}
                options={BLOOD_TYPES.map((value) => ({ label: value, value }))}
                onChange={(event) => setValues((c) => ({ ...c, bloodType: event.target.value }))}
              />
            </FormField>

            <FormField label="Contact number" htmlFor="donor_contact" error={errors.contactNumber}>
              <Input
                id="donor_contact"
                value={values.contactNumber}
                onChange={(event) => setValues((c) => ({ ...c, contactNumber: event.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Address" htmlFor="donor_address" error={errors.address}>
            <Textarea
              id="donor_address"
              rows={2}
              value={values.address}
              onChange={(event) => setValues((c) => ({ ...c, address: event.target.value }))}
            />
          </FormField>
        </form>
      </Modal>
    </>
  );
}

export function CreateRequestAction({
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
    bloodType: "O+",
    component: "packed_rbc",
    unitsRequested: "2",
    priority: "routine",
    requiredBy: "",
    notes: "",
  });
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof typeof values, string>>
  >({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("blood_bank.manage")) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const payload = {
      ...values,
      unitsRequested: values.unitsRequested === "" ? Number.NaN : Number(values.unitsRequested),
      requiredBy: values.requiredBy ? new Date(values.requiredBy).toISOString() : "",
    };
    const parsed = createBloodRequestSchema.safeParse(payload);

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await createBloodRequestAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Blood request created",
        description: `${parsed.data.unitsRequested} unit(s) of ${parsed.data.component.replace(/_/g, " ")}.`,
        variant: "success",
      });
      setValues({
        patientId: "",
        bloodType: "O+",
        component: "packed_rbc",
        unitsRequested: "2",
        priority: "routine",
        requiredBy: "",
        notes: "",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not create the request. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <ClipboardListIcon className="size-4" aria-hidden="true" />
        Create Request
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Create blood request"
        description="Request units for a patient and set the required time."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="blood-request-form" loading={submitting}>
              Create request
            </Button>
          </>
        }
      >
        <form
          id="blood-request-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to create request">
              {formError}
            </Alert>
          ) : null}

          <FormField label="Patient" htmlFor="request_patient" required error={errors.patientId}>
            <Select
              id="request_patient"
              value={values.patientId}
              invalid={Boolean(errors.patientId)}
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
            <FormField label="Blood type" htmlFor="request_type" required error={errors.bloodType}>
              <Select
                id="request_type"
                value={values.bloodType}
                options={BLOOD_TYPES.map((value) => ({ label: value, value }))}
                onChange={(event) => setValues((c) => ({ ...c, bloodType: event.target.value }))}
              />
            </FormField>

            <FormField label="Component" htmlFor="request_component" required error={errors.component}>
              <Select
                id="request_component"
                value={values.component}
                options={COMPONENTS}
                onChange={(event) => setValues((c) => ({ ...c, component: event.target.value }))}
              />
            </FormField>

            <FormField label="Units" htmlFor="request_units" required error={errors.unitsRequested}>
              <Input
                id="request_units"
                inputMode="numeric"
                value={values.unitsRequested}
                invalid={Boolean(errors.unitsRequested)}
                onChange={(event) => setValues((c) => ({ ...c, unitsRequested: event.target.value }))}
              />
            </FormField>

            <FormField label="Priority" htmlFor="request_priority" required error={errors.priority}>
              <Select
                id="request_priority"
                value={values.priority}
                options={[
                  { label: "Routine", value: "routine" },
                  { label: "Urgent", value: "urgent" },
                  { label: "Emergency", value: "emergency" },
                ]}
                onChange={(event) => setValues((c) => ({ ...c, priority: event.target.value }))}
              />
            </FormField>

            <FormField
              label="Required by"
              htmlFor="request_required"
              required
              hint="Defaults to four hours from now when left blank at the RPC."
              error={errors.requiredBy}
            >
              <Input
                id="request_required"
                type="datetime-local"
                value={values.requiredBy}
                invalid={Boolean(errors.requiredBy)}
                onChange={(event) => setValues((c) => ({ ...c, requiredBy: event.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Notes" htmlFor="request_notes" hint="Optional." error={errors.notes}>
            <Textarea
              id="request_notes"
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

export function RecordDonationAction({
  donors,
}: {
  donors: Array<{ id: string; full_name: string; blood_type: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    donorId: "",
    units: "1",
    component: "whole_blood",
    expiryDays: "35",
    collectionSite: "Blood bank",
  });
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof typeof values, string>>
  >({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("blood_bank.manage")) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const payload = {
      ...values,
      units: values.units === "" ? Number.NaN : Number(values.units),
      expiryDays: values.expiryDays === "" ? Number.NaN : Number(values.expiryDays),
    };
    const parsed = recordDonationSchema.safeParse(payload);

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await recordDonationAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Donation recorded",
        description: `${parsed.data.units} unit(s) collected; screening pending.`,
        variant: "success",
      });
      setValues({
        donorId: "",
        units: "1",
        component: "whole_blood",
        expiryDays: "35",
        collectionSite: "Blood bank",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not record the donation. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <TestTubeIcon className="size-4" aria-hidden="true" />
        Record Donation
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Record donation"
        description="Collect units from an eligible donor and mint blood units."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="donation-form" loading={submitting}>
              Record donation
            </Button>
          </>
        }
      >
        <form id="donation-form" noValidate onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <Alert variant="danger" title="Unable to record donation">
              {formError}
            </Alert>
          ) : null}

          <FormField label="Donor" htmlFor="donation_donor" required error={errors.donorId}>
            <Select
              id="donation_donor"
              value={values.donorId}
              invalid={Boolean(errors.donorId)}
              onChange={(event) => setValues((c) => ({ ...c, donorId: event.target.value }))}
            >
              <option value="">Select donor</option>
              {donors.map((donor) => (
                <option key={donor.id} value={donor.id}>
                  {donor.full_name} · {donor.blood_type}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Units collected" htmlFor="donation_units" required error={errors.units}>
              <Input
                id="donation_units"
                inputMode="numeric"
                value={values.units}
                invalid={Boolean(errors.units)}
                onChange={(event) => setValues((c) => ({ ...c, units: event.target.value }))}
              />
            </FormField>

            <FormField label="Component" htmlFor="donation_component" required error={errors.component}>
              <Select
                id="donation_component"
                value={values.component}
                options={COMPONENTS}
                onChange={(event) => setValues((c) => ({ ...c, component: event.target.value }))}
              />
            </FormField>

            <FormField
              label="Expiry (days)"
              htmlFor="donation_expiry"
              required
              hint="Whole blood is typically 35 days."
              error={errors.expiryDays}
            >
              <Input
                id="donation_expiry"
                inputMode="numeric"
                value={values.expiryDays}
                invalid={Boolean(errors.expiryDays)}
                onChange={(event) => setValues((c) => ({ ...c, expiryDays: event.target.value }))}
              />
            </FormField>

            <FormField label="Collection site" htmlFor="donation_site" required error={errors.collectionSite}>
              <Input
                id="donation_site"
                value={values.collectionSite}
                onChange={(event) => setValues((c) => ({ ...c, collectionSite: event.target.value }))}
              />
            </FormField>
          </div>

          <Alert variant="info" title="Screening comes next">
            New units start as available with screening pending. They cannot be
            crossmatched or issued until screening passes.
          </Alert>
        </form>
      </Modal>
    </>
  );
}

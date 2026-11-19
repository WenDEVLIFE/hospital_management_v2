"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AddCircleIcon, ShieldCheckIcon } from "@solar-icons/react/linear";

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
  createPolicyAction,
  createProviderAction,
} from "@/app/(workspace)/insurance/intake-actions";
import { policySchema, providerSchema } from "@/lib/validations/insurance-intake";

const PROVIDER_TYPES = [
  { label: "PhilHealth", value: "philhealth" },
  { label: "Private HMO", value: "private_hmo" },
  { label: "Private insurer", value: "private_insurer" },
  { label: "Government", value: "government" },
];

export function AddProviderAction() {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    name: "",
    code: "",
    type: "philhealth",
    contactNumber: "",
  });
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof typeof values, string>>
  >({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("insurance.manage")) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = providerSchema.safeParse(values);

    if (!parsed.success) {
      setErrors({ code: parsed.error.issues[0]?.message });
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await createProviderAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Provider registered",
        description: `${parsed.data.name} added as a payer.`,
        variant: "success",
      });
      setValues({ name: "", code: "", type: "philhealth", contactNumber: "" });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not register the provider. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <AddCircleIcon className="size-4" aria-hidden="true" />
        Add Provider
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Add insurance provider"
        description="Register a payer that policies can reference."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="provider-form" loading={submitting}>
              Register provider
            </Button>
          </>
        }
      >
        <form id="provider-form" noValidate onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <Alert variant="danger" title="Unable to register provider">
              {formError}
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" htmlFor="provider_name" required error={errors.name}>
              <Input
                id="provider_name"
                value={values.name}
                onChange={(event) => setValues((c) => ({ ...c, name: event.target.value }))}
              />
            </FormField>

            <FormField label="Code" htmlFor="provider_code" required error={errors.code}>
              <Input
                id="provider_code"
                value={values.code}
                onChange={(event) => setValues((c) => ({ ...c, code: event.target.value }))}
              />
            </FormField>

            <FormField label="Type" htmlFor="provider_type" required error={errors.type}>
              <Select
                id="provider_type"
                value={values.type}
                options={PROVIDER_TYPES}
                onChange={(event) => setValues((c) => ({ ...c, type: event.target.value }))}
              />
            </FormField>

            <FormField label="Contact number" htmlFor="provider_contact" error={errors.contactNumber}>
              <Input
                id="provider_contact"
                value={values.contactNumber}
                onChange={(event) =>
                  setValues((c) => ({ ...c, contactNumber: event.target.value }))
                }
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function AddPolicyAction({
  patients,
  providers,
}: {
  patients: Array<{ id: string; full_name: string; medical_record_number: string }>;
  providers: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    patientId: "",
    providerId: "",
    policyNumber: "",
    memberNumber: "",
    coverageType: "",
    effectiveDate: "",
    expiryDate: "",
    notes: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("insurance.manage")) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = policySchema.safeParse(values);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the policy details.");
      return;
    }

    setError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await createPolicyAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Policy registered",
        description: `${parsed.data.policyNumber} is ready for verification.`,
        variant: "success",
      });
      setValues({
        patientId: "",
        providerId: "",
        policyNumber: "",
        memberNumber: "",
        coverageType: "",
        effectiveDate: "",
        expiryDate: "",
        notes: "",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not register the policy. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <ShieldCheckIcon className="size-4" aria-hidden="true" />
        Add Policy
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Add insurance policy"
        description="Attach a patient to a payer and coverage period."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="policy-form" loading={submitting}>
              Register policy
            </Button>
          </>
        }
      >
        <form id="policy-form" noValidate onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <Alert variant="danger" title="Unable to register policy">
              {formError}
            </Alert>
          ) : null}
          {error ? <Alert variant="warning" title="Check the form">{error}</Alert> : null}

          <FormField label="Patient" htmlFor="policy_patient" required>
            <Select
              id="policy_patient"
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

          <FormField label="Provider" htmlFor="policy_provider" required>
            <Select
              id="policy_provider"
              value={values.providerId}
              onChange={(event) => setValues((c) => ({ ...c, providerId: event.target.value }))}
            >
              <option value="">Select provider</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Policy number" htmlFor="policy_number" required>
              <Input
                id="policy_number"
                value={values.policyNumber}
                onChange={(event) => setValues((c) => ({ ...c, policyNumber: event.target.value }))}
              />
            </FormField>

            <FormField label="Member number" htmlFor="policy_member" required>
              <Input
                id="policy_member"
                value={values.memberNumber}
                onChange={(event) => setValues((c) => ({ ...c, memberNumber: event.target.value }))}
              />
            </FormField>

            <FormField label="Coverage type" htmlFor="policy_coverage">
              <Input
                id="policy_coverage"
                value={values.coverageType}
                onChange={(event) => setValues((c) => ({ ...c, coverageType: event.target.value }))}
              />
            </FormField>

            <FormField label="Effective date" htmlFor="policy_effective" required>
              <Input
                id="policy_effective"
                type="date"
                value={values.effectiveDate}
                onChange={(event) => setValues((c) => ({ ...c, effectiveDate: event.target.value }))}
              />
            </FormField>

            <FormField label="Expiry date" htmlFor="policy_expiry" required>
              <Input
                id="policy_expiry"
                type="date"
                value={values.expiryDate}
                onChange={(event) => setValues((c) => ({ ...c, expiryDate: event.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Notes" htmlFor="policy_notes" hint="Optional.">
            <Textarea
              id="policy_notes"
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

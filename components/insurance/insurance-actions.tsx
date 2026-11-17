"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BillListIcon,
  ShieldCheckIcon,
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
  createClaimAction,
  verifyCoverageAction,
} from "@/app/(workspace)/insurance/actions";
import { formatCurrency } from "@/lib/format";
import {
  createClaimSchema,
  verifyCoverageSchema,
} from "@/lib/validations/insurance";

export interface InsurancePolicyOption {
  id: string;
  label: string;
  patientName: string;
  providerName: string;
  status: string;
}

type VerifyValues = {
  policyId: string;
  status: string;
  referenceNumber: string;
  notes: string;
};

type VerifyErrors = Partial<Record<keyof VerifyValues, string>>;

type ClaimValues = {
  policyId: string;
  claimType: string;
  diagnosis: string;
  totalCharged: string;
  amountClaimed: string;
};

type ClaimErrors = Partial<Record<keyof ClaimValues, string>>;

const VERIFY_INITIAL: VerifyValues = {
  policyId: "",
  status: "verified",
  referenceNumber: "",
  notes: "",
};

const CLAIM_INITIAL: ClaimValues = {
  policyId: "",
  claimType: "Confinement",
  diagnosis: "",
  totalCharged: "",
  amountClaimed: "",
};

const STATUS_OPTIONS = [
  { label: "Verified", value: "verified" },
  { label: "Failed", value: "failed" },
];

export function InsuranceActions({
  policies,
}: {
  policies: InsurancePolicyOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [verifyOpen, setVerifyOpen] = React.useState(false);
  const [claimOpen, setClaimOpen] = React.useState(false);

  const [verifyValues, setVerifyValues] =
    React.useState<VerifyValues>(VERIFY_INITIAL);
  const [verifyErrors, setVerifyErrors] = React.useState<VerifyErrors>({});
  const [verifyFormError, setVerifyFormError] = React.useState<string | null>(
    null
  );
  const [verifySubmitting, setVerifySubmitting] = React.useState(false);

  const [claimValues, setClaimValues] =
    React.useState<ClaimValues>(CLAIM_INITIAL);
  const [claimErrors, setClaimErrors] = React.useState<ClaimErrors>({});
  const [claimFormError, setClaimFormError] = React.useState<string | null>(
    null
  );
  const [claimSubmitting, setClaimSubmitting] = React.useState(false);

  if (!can("insurance.manage")) {
    return null;
  }

  const activePolicies = policies.filter((policy) => policy.status === "active");

  function setVerifyField<K extends keyof VerifyValues>(
    field: K,
    value: VerifyValues[K]
  ) {
    setVerifyValues((current) => ({ ...current, [field]: value }));
    setVerifyFormError(null);
    setVerifyErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      return next;
    });
  }

  function setClaimField<K extends keyof ClaimValues>(
    field: K,
    value: ClaimValues[K]
  ) {
    setClaimValues((current) => ({ ...current, [field]: value }));
    setClaimFormError(null);
    setClaimErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      return next;
    });
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (verifySubmitting) {
      return;
    }

    const parsed = verifyCoverageSchema.safeParse(verifyValues);

    if (!parsed.success) {
      const nextErrors: VerifyErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !nextErrors[field as keyof VerifyValues]) {
          nextErrors[field as keyof VerifyValues] = issue.message;
        }
      }

      setVerifyErrors(nextErrors);
      return;
    }

    setVerifyErrors({});
    setVerifyFormError(null);
    setVerifySubmitting(true);

    try {
      const result = await verifyCoverageAction(parsed.data);

      if (!result.ok) {
        setVerifyFormError(result.formError);
        return;
      }

      toast({
        title:
          parsed.data.status === "verified"
            ? "Coverage verified"
            : "Coverage check failed",
        description: `Reference ${parsed.data.referenceNumber} recorded.`,
        variant: "success",
      });

      setVerifyValues(VERIFY_INITIAL);
      setVerifyOpen(false);
      router.refresh();
    } catch {
      setVerifyFormError(
        "We could not record the verification. Check your connection and try again."
      );
    } finally {
      setVerifySubmitting(false);
    }
  }

  async function handleClaim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (claimSubmitting) {
      return;
    }

    const parsed = createClaimSchema.safeParse(claimValues);

    if (!parsed.success) {
      const nextErrors: ClaimErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !nextErrors[field as keyof ClaimValues]) {
          nextErrors[field as keyof ClaimValues] = issue.message;
        }
      }

      setClaimErrors(nextErrors);
      return;
    }

    setClaimErrors({});
    setClaimFormError(null);
    setClaimSubmitting(true);

    try {
      const result = await createClaimAction(parsed.data);

      if (!result.ok) {
        setClaimFormError(result.formError);
        return;
      }

      toast({
        title: "Claim prepared",
        description: `${formatCurrency(
          parsed.data.amountClaimed
        )} claim created from the selected policy.`,
        variant: "success",
      });

      setClaimValues(CLAIM_INITIAL);
      setClaimOpen(false);
      router.refresh();
    } catch {
      setClaimFormError(
        "We could not create the claim. Check your connection and try again."
      );
    } finally {
      setClaimSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setVerifyOpen(true)}>
        <ShieldCheckIcon className="size-4" aria-hidden="true" />
        Verify Coverage
      </Button>
      <Button onClick={() => setClaimOpen(true)}>
        <BillListIcon className="size-4" aria-hidden="true" />
        Create Claim
      </Button>

      <Modal
        open={verifyOpen}
        onClose={() => {
          if (!verifySubmitting) {
            setVerifyOpen(false);
          }
        }}
        title="Verify coverage"
        description="Record a manual eligibility check with the payer."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setVerifyOpen(false)}
              disabled={verifySubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="coverage-form" loading={verifySubmitting}>
              Record verification
            </Button>
          </>
        }
      >
        <form
          id="coverage-form"
          noValidate
          onSubmit={handleVerify}
          className="space-y-4"
        >
          {verifyFormError ? (
            <Alert variant="danger" title="Unable to record verification">
              {verifyFormError}
            </Alert>
          ) : null}

          <FormField
            label="Policy"
            htmlFor="coverage_policy"
            required
            error={verifyErrors.policyId}
          >
            <Select
              id="coverage_policy"
              value={verifyValues.policyId}
              invalid={Boolean(verifyErrors.policyId)}
              onChange={(event) =>
                setVerifyField("policyId", event.target.value)
              }
            >
              <option value="">Select policy</option>
              {policies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.label}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Result"
              htmlFor="coverage_status"
              required
              error={verifyErrors.status}
            >
              <Select
                id="coverage_status"
                value={verifyValues.status}
                options={STATUS_OPTIONS}
                onChange={(event) =>
                  setVerifyField("status", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Payer reference"
              htmlFor="coverage_reference"
              required
              error={verifyErrors.referenceNumber}
            >
              <Input
                id="coverage_reference"
                autoComplete="off"
                value={verifyValues.referenceNumber}
                invalid={Boolean(verifyErrors.referenceNumber)}
                onChange={(event) =>
                  setVerifyField("referenceNumber", event.target.value)
                }
              />
            </FormField>
          </div>

          <FormField
            label="Notes"
            htmlFor="coverage_notes"
            hint="Optional."
            error={verifyErrors.notes}
          >
            <Textarea
              id="coverage_notes"
              rows={2}
              value={verifyValues.notes}
              onChange={(event) => setVerifyField("notes", event.target.value)}
            />
          </FormField>
        </form>
      </Modal>

      <Modal
        open={claimOpen}
        onClose={() => {
          if (!claimSubmitting) {
            setClaimOpen(false);
          }
        }}
        title="Create claim"
        description="Prepare a claim against an active policy."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setClaimOpen(false)}
              disabled={claimSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="claim-form" loading={claimSubmitting}>
              Prepare claim
            </Button>
          </>
        }
      >
        <form
          id="claim-form"
          noValidate
          onSubmit={handleClaim}
          className="space-y-4"
        >
          {claimFormError ? (
            <Alert variant="danger" title="Unable to create claim">
              {claimFormError}
            </Alert>
          ) : null}

          <FormField
            label="Policy"
            htmlFor="claim_policy"
            required
            hint="Only active policies are listed."
            error={claimErrors.policyId}
          >
            <Select
              id="claim_policy"
              value={claimValues.policyId}
              invalid={Boolean(claimErrors.policyId)}
              onChange={(event) => setClaimField("policyId", event.target.value)}
            >
              <option value="">Select policy</option>
              {activePolicies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.label}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Claim type"
              htmlFor="claim_type"
              required
              error={claimErrors.claimType}
            >
              <Input
                id="claim_type"
                autoComplete="off"
                value={claimValues.claimType}
                invalid={Boolean(claimErrors.claimType)}
                onChange={(event) =>
                  setClaimField("claimType", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Diagnosis"
              htmlFor="claim_diagnosis"
              required
              error={claimErrors.diagnosis}
            >
              <Input
                id="claim_diagnosis"
                autoComplete="off"
                value={claimValues.diagnosis}
                invalid={Boolean(claimErrors.diagnosis)}
                onChange={(event) =>
                  setClaimField("diagnosis", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Total charged"
              htmlFor="claim_total"
              required
              error={claimErrors.totalCharged}
            >
              <Input
                id="claim_total"
                inputMode="decimal"
                autoComplete="off"
                value={claimValues.totalCharged}
                invalid={Boolean(claimErrors.totalCharged)}
                onChange={(event) =>
                  setClaimField("totalCharged", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Amount claimed"
              htmlFor="claim_amount"
              required
              error={claimErrors.amountClaimed}
            >
              <Input
                id="claim_amount"
                inputMode="decimal"
                autoComplete="off"
                value={claimValues.amountClaimed}
                invalid={Boolean(claimErrors.amountClaimed)}
                onChange={(event) =>
                  setClaimField("amountClaimed", event.target.value)
                }
              />
            </FormField>
          </div>

          <Alert variant="info" title="Manual workflow">
            Nothing is transmitted to the payer. The claim is stored with a
            prepared status so it can be submitted and adjudicated manually.
          </Alert>
        </form>
      </Modal>
    </>
  );
}

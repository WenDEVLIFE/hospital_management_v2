"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  crossmatchUnitAction,
  issueUnitAction,
} from "@/app/(workspace)/blood-bank/actions";
import type { BloodRequestListRow, BloodUnitListRow } from "@/types/hospital";

const OPEN_STATUSES = ["pending", "reserved", "crossmatched", "issued"];

export interface BloodUnitActionProps {
  unit: BloodUnitListRow | null;
  requests: BloodRequestListRow[];
  onClose: () => void;
}

export function CrossmatchUnitDialog({
  unit,
  requests,
  onClose,
}: BloodUnitActionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [requestId, setRequestId] = React.useState("");
  const [result, setResult] = React.useState("compatible");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!unit) {
    return null;
  }

  const openRequests = requests.filter((request) =>
    OPEN_STATUSES.includes(request.status)
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || !unit) {
      return;
    }

    if (!requestId) {
      setError("Select the request this unit is being crossmatched for.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await crossmatchUnitAction({
        requestId,
        unitId: unit.id,
        result,
      });

      if (!response.ok) {
        setError(response.formError);
        return;
      }

      toast({
        title: "Crossmatch recorded",
        description: `${unit.unit_number} · ${result}`,
        variant: "success",
      });
      onClose();
      router.refresh();
    } catch {
      setError("We could not record the crossmatch. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Crossmatch unit"
      description={`${unit.unit_number} · ${unit.blood_type}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="crossmatch-form" loading={submitting}>
            Record crossmatch
          </Button>
        </>
      }
    >
      <form id="crossmatch-form" noValidate onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <Alert variant="danger" title="Unable to record crossmatch">
            {error}
          </Alert>
        ) : null}

        {unit.screening_status !== "passed" ? (
          <Alert variant="warning" title="Screening not cleared">
            This unit has screening status <strong>{unit.screening_status}</strong>.
            The crossmatch will be refused until screening passes.
          </Alert>
        ) : null}

        <FormField label="Request" htmlFor="crossmatch_request" required>
          <Select
            id="crossmatch_request"
            value={requestId}
            onChange={(event) => {
              setRequestId(event.target.value);
              setError(null);
            }}
          >
            <option value="">Select request</option>
            {openRequests.map((request) => (
              <option key={request.id} value={request.id}>
                {request.request_number} · {request.patient_name} ·{" "}
                {request.blood_type} · {request.units_fulfilled}/
                {request.units_requested}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Result" htmlFor="crossmatch_result" required>
          <Select
            id="crossmatch_result"
            value={result}
            options={[
              { label: "Compatible", value: "compatible" },
              { label: "Incompatible", value: "incompatible" },
            ]}
            onChange={(event) => setResult(event.target.value)}
          />
        </FormField>

        <Alert variant="info" title="Compatible units move to crossmatched">
          An incompatible result returns the unit to available and leaves the
          request unchanged.
        </Alert>
      </form>
    </Modal>
  );
}

export function IssueUnitDialog({
  unit,
  requests,
  onClose,
}: BloodUnitActionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [requestId, setRequestId] = React.useState("");
  const [receivedBy, setReceivedBy] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!unit) {
    return null;
  }

  const openRequests = requests.filter((request) =>
    OPEN_STATUSES.includes(request.status)
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || !unit) {
      return;
    }

    if (!requestId || receivedBy.trim().length < 2) {
      setError("Select the request and record who received the unit.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await issueUnitAction({
        requestId,
        unitId: unit.id,
        receivedBy,
        notes,
      });

      if (!response.ok) {
        setError(response.formError);
        return;
      }

      toast({
        title: "Unit issued",
        description: `${unit.unit_number} issued to ${receivedBy}.`,
        variant: "success",
      });
      onClose();
      router.refresh();
    } catch {
      setError("We could not issue the unit. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Issue unit"
      description={`${unit.unit_number} · ${unit.blood_type}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="issue-form" loading={submitting}>
            Issue unit
          </Button>
        </>
      }
    >
      <form id="issue-form" noValidate onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <Alert variant="danger" title="Unable to issue unit">
            {error}
          </Alert>
        ) : null}

        <Alert variant="warning" title="Three checks are enforced">
          The unit must have passed screening, be unexpired, and hold a
          compatible crossmatch for the selected request.
        </Alert>

        <FormField label="Request" htmlFor="issue_request" required>
          <Select
            id="issue_request"
            value={requestId}
            onChange={(event) => {
              setRequestId(event.target.value);
              setError(null);
            }}
          >
            <option value="">Select request</option>
            {openRequests.map((request) => (
              <option key={request.id} value={request.id}>
                {request.request_number} · {request.patient_name} ·{" "}
                {request.units_fulfilled}/{request.units_requested}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Received by" htmlFor="issue_received" required>
          <Input
            id="issue_received"
            value={receivedBy}
            onChange={(event) => {
              setReceivedBy(event.target.value);
              setError(null);
            }}
          />
        </FormField>

        <FormField label="Notes" htmlFor="issue_notes" hint="Optional.">
          <Textarea
            id="issue_notes"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </FormField>
      </form>
    </Modal>
  );
}

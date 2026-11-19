"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BroomIcon } from "@solar-icons/react/linear";

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
  advanceCleaningRequestAction,
  createCleaningRequestAction,
  createHousekeepingStaffAction,
} from "@/app/(workspace)/housekeeping/actions";
import {
  advanceCleaningRequestSchema,
  createCleaningRequestSchema,
  housekeepingStaffSchema,
} from "@/lib/validations/housekeeping";
import type { CleaningRequestListRow, HousekeepingStaff } from "@/types/hospital";

const LOCATION_TYPES = [
  { label: "Room", value: "room" },
  { label: "Bed", value: "bed" },
  { label: "Common area", value: "common_area" },
  { label: "Isolation room", value: "isolation_room" },
];

const REQUEST_TYPES = [
  { label: "Routine", value: "routine" },
  { label: "Discharge", value: "discharge" },
  { label: "Terminal", value: "terminal" },
  { label: "Spill", value: "spill" },
  { label: "Isolation", value: "isolation" },
];

const PRIORITIES = [
  { label: "Routine", value: "routine" },
  { label: "Urgent", value: "urgent" },
  { label: "Emergency", value: "emergency" },
];

function defaultDue(): string {
  const due = new Date(Date.now() + 2 * 60 * 60 * 1000);

  return due.toISOString().slice(0, 16);
}

export function CreateCleaningRequestAction() {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    locationType: "room",
    locationLabel: "",
    requestType: "routine",
    priority: "routine",
    dueAt: defaultDue(),
    notes: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("housekeeping.manage")) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = createCleaningRequestSchema.safeParse({
      ...values,
      dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : "",
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !next[field]) {
          next[field] = issue.message;
        }
      }

      setErrors(next);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await createCleaningRequestAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Cleaning request created",
        description: `${parsed.data.locationLabel} · ${parsed.data.priority}`,
        variant: "success",
      });
      setValues({
        locationType: "room",
        locationLabel: "",
        requestType: "routine",
        priority: "routine",
        dueAt: defaultDue(),
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
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <BroomIcon className="size-4" aria-hidden="true" />
        New Cleaning Request
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="New cleaning request"
        description="Request cleaning for a room, bed or common area."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="cleaning-request-form" loading={submitting}>
              Create request
            </Button>
          </>
        }
      >
        <form
          id="cleaning-request-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to create request">
              {formError}
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Location type" htmlFor="clean_location_type" required error={errors.locationType}>
              <Select
                id="clean_location_type"
                value={values.locationType}
                options={LOCATION_TYPES}
                onChange={(event) => setValues((c) => ({ ...c, locationType: event.target.value }))}
              />
            </FormField>

            <FormField label="Location" htmlFor="clean_location" required error={errors.locationLabel}>
              <Input
                id="clean_location"
                placeholder="W3-302-A"
                value={values.locationLabel}
                invalid={Boolean(errors.locationLabel)}
                onChange={(event) => setValues((c) => ({ ...c, locationLabel: event.target.value }))}
              />
            </FormField>

            <FormField label="Request type" htmlFor="clean_type" required error={errors.requestType}>
              <Select
                id="clean_type"
                value={values.requestType}
                options={REQUEST_TYPES}
                onChange={(event) => setValues((c) => ({ ...c, requestType: event.target.value }))}
              />
            </FormField>

            <FormField label="Priority" htmlFor="clean_priority" required error={errors.priority}>
              <Select
                id="clean_priority"
                value={values.priority}
                options={PRIORITIES}
                onChange={(event) => setValues((c) => ({ ...c, priority: event.target.value }))}
              />
            </FormField>

            <FormField label="Due" htmlFor="clean_due" required error={errors.dueAt}>
              <Input
                id="clean_due"
                type="datetime-local"
                value={values.dueAt}
                invalid={Boolean(errors.dueAt)}
                onChange={(event) => setValues((c) => ({ ...c, dueAt: event.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Notes" htmlFor="clean_notes" hint="Optional." error={errors.notes}>
            <Textarea
              id="clean_notes"
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

const NEXT_ACTION: Record<string, { action: string; label: string } | undefined> = {
  requested: { action: "assign", label: "Assign staff" },
  assigned: { action: "start", label: "Start cleaning" },
  in_progress: { action: "complete", label: "Complete cleaning" },
  completed: { action: "verify", label: "Verify cleaning" },
};

export function CleaningRequestActions({
  request,
  staff,
}: {
  request: CleaningRequestListRow;
  staff: HousekeepingStaff[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [staffId, setStaffId] = React.useState(request.assigned_staff_id ?? "");
  const [method, setMethod] = React.useState("");
  const [chemical, setChemical] = React.useState("");
  const [contactMinutes, setContactMinutes] = React.useState("10");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("housekeeping.manage")) {
    return null;
  }

  const next = NEXT_ACTION[request.status];

  if (!next) {
    return null;
  }

  const action = next;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = advanceCleaningRequestSchema.safeParse({
      requestId: request.id,
      action: action.action,
      staffId,
      method,
      chemical,
      contactMinutes,
      notes,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the form.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const result = await advanceCleaningRequestAction(parsed.data);

      if (!result.ok) {
        setError(result.formError);
        return;
      }

      toast({
        title: action.label,
        description: `${request.request_number} updated.`,
        variant: "success",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setError("We could not update the request. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        {action.label}
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title={action.label}
        description={`${request.request_number} · ${request.location_label}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="advance-cleaning-form" loading={submitting}>
              {action.label}
            </Button>
          </>
        }
      >
        <form
          id="advance-cleaning-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {error ? (
            <Alert variant="danger" title="Unable to update request">
              {error}
            </Alert>
          ) : null}

          {action.action === "assign" ? (
            <FormField label="Assign to" htmlFor="clean_staff" required>
              <Select
                id="clean_staff"
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
              >
                <option value="">Select staff</option>
                {staff
                  .filter((member) => member.status !== "off_duty")
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} · {member.role}
                    </option>
                  ))}
              </Select>
            </FormField>
          ) : null}

          {action.action === "complete" ? (
            <>
              <Alert variant="warning" title="Disinfection is recorded">
                Completion writes a disinfection record. A room cannot be
                released without it.
              </Alert>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Method" htmlFor="clean_method" required>
                  <Input
                    id="clean_method"
                    value={method}
                    onChange={(event) => setMethod(event.target.value)}
                  />
                </FormField>
                <FormField label="Chemical" htmlFor="clean_chemical" required>
                  <Input
                    id="clean_chemical"
                    value={chemical}
                    onChange={(event) => setChemical(event.target.value)}
                  />
                </FormField>
                <FormField label="Contact time (min)" htmlFor="clean_contact" required>
                  <Input
                    id="clean_contact"
                    inputMode="numeric"
                    value={contactMinutes}
                    onChange={(event) => setContactMinutes(event.target.value)}
                  />
                </FormField>
              </div>
            </>
          ) : null}

          <FormField label="Notes" htmlFor="clean_advance_notes" hint="Optional.">
            <Textarea
              id="clean_advance_notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </FormField>
        </form>
      </Modal>
    </>
  );
}

export function AddHousekeepingStaffAction() {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    name: "",
    role: "Housekeeper",
    contactNumber: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("housekeeping.manage")) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = housekeepingStaffSchema.safeParse(values);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the staff details.");
      return;
    }

    setError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await createHousekeepingStaffAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Staff added",
        description: `${parsed.data.name} is on duty.`,
        variant: "success",
      });
      setValues({ name: "", role: "Housekeeper", contactNumber: "" });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not add the staff member. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Add staff
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Add housekeeping staff"
        description="Staff appear in the assignment list while on duty."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="hk-staff-form" loading={submitting}>
              Add staff
            </Button>
          </>
        }
      >
        <form id="hk-staff-form" noValidate onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <Alert variant="danger" title="Unable to add staff">
              {formError}
            </Alert>
          ) : null}
          {error ? <Alert variant="warning" title="Check the form">{error}</Alert> : null}

          <FormField label="Name" htmlFor="hk_staff_name" required>
            <Input
              id="hk_staff_name"
              value={values.name}
              onChange={(event) => setValues((c) => ({ ...c, name: event.target.value }))}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Role" htmlFor="hk_staff_role">
              <Input
                id="hk_staff_role"
                value={values.role}
                onChange={(event) => setValues((c) => ({ ...c, role: event.target.value }))}
              />
            </FormField>

            <FormField label="Contact number" htmlFor="hk_staff_contact" hint="Optional.">
              <Input
                id="hk_staff_contact"
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

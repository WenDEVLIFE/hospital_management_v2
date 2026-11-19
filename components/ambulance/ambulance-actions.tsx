"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BusIcon, SirenRoundedIcon } from "@solar-icons/react/linear";

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
  dispatchAmbulanceAction,
  registerAmbulanceAction,
} from "@/app/(workspace)/ambulance/actions";
import {
  dispatchAmbulanceSchema,
  registerAmbulanceSchema,
} from "@/lib/validations/ambulance";

const TYPES = [
  { label: "Basic life support", value: "basic_life_support" },
  { label: "Advanced life support", value: "advanced_life_support" },
  { label: "Patient transport", value: "patient_transport" },
  { label: "Mobile ICU", value: "mobile_icu" },
];

const PRIORITIES = [
  { label: "Routine", value: "routine" },
  { label: "Urgent", value: "urgent" },
  { label: "Emergency", value: "emergency" },
];

export function RegisterAmbulanceAction() {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    vehicleNumber: "",
    plateNumber: "",
    type: "basic_life_support",
    location: "Station",
    nextServiceDue: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("ambulance.manage")) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = registerAmbulanceSchema.safeParse(values);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the vehicle details.");
      return;
    }

    setError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await registerAmbulanceAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Ambulance registered",
        description: `${parsed.data.vehicleNumber} · ${parsed.data.plateNumber}`,
        variant: "success",
      });
      setValues({
        vehicleNumber: "",
        plateNumber: "",
        type: "basic_life_support",
        location: "Station",
        nextServiceDue: "",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not register the ambulance. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <BusIcon className="size-4" aria-hidden="true" />
        Register Ambulance
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Register ambulance"
        description="Add a vehicle to the fleet register."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="ambulance-form" loading={submitting}>
              Register vehicle
            </Button>
          </>
        }
      >
        <form id="ambulance-form" noValidate onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <Alert variant="danger" title="Unable to register ambulance">
              {formError}
            </Alert>
          ) : null}
          {error ? <Alert variant="warning" title="Check the form">{error}</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Vehicle number" htmlFor="amb_number" required>
              <Input
                id="amb_number"
                placeholder="AMB-01"
                value={values.vehicleNumber}
                onChange={(event) => setValues((c) => ({ ...c, vehicleNumber: event.target.value }))}
              />
            </FormField>

            <FormField label="Plate number" htmlFor="amb_plate" required>
              <Input
                id="amb_plate"
                value={values.plateNumber}
                onChange={(event) => setValues((c) => ({ ...c, plateNumber: event.target.value }))}
              />
            </FormField>

            <FormField label="Type" htmlFor="amb_type" required>
              <Select
                id="amb_type"
                value={values.type}
                options={TYPES}
                onChange={(event) => setValues((c) => ({ ...c, type: event.target.value }))}
              />
            </FormField>

            <FormField label="Home location" htmlFor="amb_location">
              <Input
                id="amb_location"
                value={values.location}
                onChange={(event) => setValues((c) => ({ ...c, location: event.target.value }))}
              />
            </FormField>

            <FormField label="Next service due" htmlFor="amb_service" hint="Optional.">
              <Input
                id="amb_service"
                type="date"
                value={values.nextServiceDue}
                onChange={(event) =>
                  setValues((c) => ({ ...c, nextServiceDue: event.target.value }))
                }
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DispatchAmbulanceAction({
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
    pickupLocation: "",
    destination: "SPMC Emergency Department",
    priority: "urgent",
    notes: "",
  });
  const [error, setError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("ambulance.manage")) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = dispatchAmbulanceSchema.safeParse(values);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the dispatch details.");
      return;
    }

    setError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await dispatchAmbulanceAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Dispatch requested",
        description: `${parsed.data.pickupLocation} → ${parsed.data.destination}`,
        variant: "success",
      });
      setValues({
        patientId: "",
        pickupLocation: "",
        destination: "SPMC Emergency Department",
        priority: "urgent",
        notes: "",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not create the dispatch. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <SirenRoundedIcon className="size-4" aria-hidden="true" />
        Dispatch Ambulance
      </Button>

      <Modal
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Dispatch ambulance"
        description="Create a transport request; assign the vehicle next."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="dispatch-form" loading={submitting}>
              Request dispatch
            </Button>
          </>
        }
      >
        <form id="dispatch-form" noValidate onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <Alert variant="danger" title="Unable to request dispatch">
              {formError}
            </Alert>
          ) : null}
          {error ? <Alert variant="warning" title="Check the form">{error}</Alert> : null}

          <FormField label="Patient" htmlFor="dispatch_patient" required>
            <Select
              id="dispatch_patient"
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
            <FormField label="Pickup" htmlFor="dispatch_pickup" required>
              <Input
                id="dispatch_pickup"
                value={values.pickupLocation}
                onChange={(event) =>
                  setValues((c) => ({ ...c, pickupLocation: event.target.value }))
                }
              />
            </FormField>

            <FormField label="Destination" htmlFor="dispatch_destination" required>
              <Input
                id="dispatch_destination"
                value={values.destination}
                onChange={(event) => setValues((c) => ({ ...c, destination: event.target.value }))}
              />
            </FormField>

            <FormField label="Priority" htmlFor="dispatch_priority" required>
              <Select
                id="dispatch_priority"
                value={values.priority}
                options={PRIORITIES}
                onChange={(event) => setValues((c) => ({ ...c, priority: event.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Notes" htmlFor="dispatch_notes" hint="Optional.">
            <Textarea
              id="dispatch_notes"
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

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BusIcon,
  FuelIcon,
  SettingsIcon,
  SirenRoundedIcon,
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
import type {
  AmbulanceTripListRow,
  AmbulanceVehicleListRow,
} from "@/types/hospital";
import {
  advanceAmbulanceTripAction,
  dispatchAmbulanceAction,
  recordFuelAction,
  recordMaintenanceAction,
  registerAmbulanceAction,
} from "@/app/(workspace)/ambulance/actions";
import {
  advanceAmbulanceTripSchema,
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

const TRIP_NEXT: Record<
  string,
  { action: string; label: string } | undefined
> = {
  requested: { action: "assign", label: "Dispatch ambulance" },
  assigned: { action: "en_route", label: "Mark en route" },
  en_route: { action: "on_scene", label: "Mark arrived at pickup" },
  on_scene: { action: "transporting", label: "Start transport" },
  transporting: { action: "complete", label: "Complete trip" },
};

export function TripActions({
  trip,
  vehicles,
}: {
  trip: AmbulanceTripListRow;
  vehicles: AmbulanceVehicleListRow[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [vehicleId, setVehicleId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("ambulance.manage")) {
    return null;
  }

  const next = TRIP_NEXT[trip.status];

  if (!next) {
    return null;
  }

  const action = next;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = advanceAmbulanceTripSchema.safeParse({
      tripId: trip.id,
      action: action.action,
      vehicleId,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the dispatch action.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const result = await advanceAmbulanceTripAction(parsed.data);

      if (!result.ok) {
        setError(result.formError);
        return;
      }

      toast({
        title: action.label,
        description: `${trip.trip_number} updated.`,
        variant: "success",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setError("We could not update the dispatch. Try again.");
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
        description={`${trip.trip_number} · ${trip.patient_name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="trip-action-form" loading={submitting}>
              {action.label}
            </Button>
          </>
        }
      >
        <form id="trip-action-form" noValidate onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="danger" title="Unable to update dispatch">
              {error}
            </Alert>
          ) : null}

          {action.action === "assign" ? (
            <FormField label="Ambulance" htmlFor="trip_vehicle" required>
              <Select
                id="trip_vehicle"
                value={vehicleId}
                onChange={(event) => setVehicleId(event.target.value)}
              >
                <option value="">Select available ambulance</option>
                {vehicles
                  .filter((vehicle) => vehicle.status === "available")
                  .map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicle_number} · {vehicle.plate_number} ·{" "}
                      {vehicle.location}
                    </option>
                  ))}
              </Select>
            </FormField>
          ) : (
            <p className="text-sm text-hospital-text-muted">
              This records the next step of the dispatch timeline.
            </p>
          )}
        </form>
      </Modal>
    </>
  );
}

type VehicleOption = Pick<
  AmbulanceVehicleListRow,
  "id" | "vehicle_number" | "odometer_km" | "status"
>;

function localDateTimeValue(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

const emptyMaintenance = {
  vehicleId: "",
  maintenanceType: "Preventive service",
  performedAt: "",
  cost: "",
  nextDueDate: "",
  notes: "",
};

export function RecordMaintenanceAction({
  vehicles,
}: {
  vehicles: VehicleOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    ...emptyMaintenance,
    performedAt: localDateTimeValue(),
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("ambulance.manage")) {
    return null;
  }

  function close() {
    if (submitting) {
      return;
    }

    setFormError(null);
    setOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const result = await recordMaintenanceAction(values);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Maintenance recorded",
        description: "Service history and the next due date were updated.",
        variant: "success",
      });
      setValues({ ...emptyMaintenance, performedAt: localDateTimeValue() });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not record the maintenance. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
      >
        <SettingsIcon className="size-4" aria-hidden="true" />
        Record Maintenance
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Record maintenance"
        description="Log the service and, optionally, the next service date."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="amb-maintenance-form" loading={submitting}>
              Save maintenance
            </Button>
          </>
        }
      >
        <form
          id="amb-maintenance-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to save">
              {formError}
            </Alert>
          ) : null}

          <FormField label="Ambulance" htmlFor="maint_vehicle" required>
            <Select
              id="maint_vehicle"
              value={values.vehicleId}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  vehicleId: event.target.value,
                }))
              }
            >
              <option value="">Select ambulance</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicle_number} · {vehicle.status}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Maintenance type" htmlFor="maint_type" required>
              <Select
                id="maint_type"
                value={values.maintenanceType}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    maintenanceType: event.target.value,
                  }))
                }
                options={[
                  { label: "Preventive service", value: "Preventive service" },
                  { label: "Repair", value: "Repair" },
                  { label: "Inspection", value: "Inspection" },
                  { label: "Oil change", value: "Oil change" },
                  { label: "Tire replacement", value: "Tire replacement" },
                ]}
              />
            </FormField>

            <FormField label="Performed at" htmlFor="maint_performed" required>
              <Input
                id="maint_performed"
                type="datetime-local"
                value={values.performedAt}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    performedAt: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Cost" htmlFor="maint_cost" hint="Philippine pesos.">
              <Input
                id="maint_cost"
                type="number"
                min="0"
                step="0.01"
                value={values.cost}
                onChange={(event) =>
                  setValues((current) => ({ ...current, cost: event.target.value }))
                }
              />
            </FormField>

            <FormField
              label="Next service due"
              htmlFor="maint_next"
              hint="Optional."
            >
              <Input
                id="maint_next"
                type="date"
                value={values.nextDueDate}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    nextDueDate: event.target.value,
                  }))
                }
              />
            </FormField>
          </div>

          <FormField label="Notes" htmlFor="maint_notes" hint="Optional.">
            <Textarea
              id="maint_notes"
              rows={2}
              value={values.notes}
              onChange={(event) =>
                setValues((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </FormField>

          <Alert variant="info" title="Fleet record updated">
            Saving sets the vehicle’s last service date and stores the next due
            date when you provide one.
          </Alert>
        </form>
      </Modal>
    </>
  );
}

const emptyFuel = {
  vehicleId: "",
  fueledAt: "",
  liters: "",
  cost: "",
  odometerKm: "",
  fuelLevel: "100",
};

export function RecordFuelAction({ vehicles }: { vehicles: VehicleOption[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    ...emptyFuel,
    fueledAt: localDateTimeValue(),
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("ambulance.manage")) {
    return null;
  }

  const selected = vehicles.find((vehicle) => vehicle.id === values.vehicleId);

  function close() {
    if (submitting) {
      return;
    }

    setFormError(null);
    setOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const result = await recordFuelAction(values);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Fuel recorded",
        description: "Odometer and tank level were updated.",
        variant: "success",
      });
      setValues({ ...emptyFuel, fueledAt: localDateTimeValue() });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not record the fuel purchase. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <FuelIcon className="size-4" aria-hidden="true" />
        Record Fuel
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Record fuel"
        description="Log liters, cost, odometer and the tank level after refuelling."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="amb-fuel-form" loading={submitting}>
              Save fuel record
            </Button>
          </>
        }
      >
        <form
          id="amb-fuel-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to save">
              {formError}
            </Alert>
          ) : null}

          <FormField label="Ambulance" htmlFor="fuel_vehicle" required>
            <Select
              id="fuel_vehicle"
              value={values.vehicleId}
              onChange={(event) => {
                const vehicle = vehicles.find(
                  (row) => row.id === event.target.value
                );

                setValues((current) => ({
                  ...current,
                  vehicleId: event.target.value,
                  odometerKm: vehicle ? String(vehicle.odometer_km) : "",
                }));
              }}
            >
              <option value="">Select ambulance</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicle_number} · {vehicle.odometer_km} km
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Fueled at" htmlFor="fuel_at" required>
              <Input
                id="fuel_at"
                type="datetime-local"
                value={values.fueledAt}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    fueledAt: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Liters" htmlFor="fuel_liters" required>
              <Input
                id="fuel_liters"
                type="number"
                min="0"
                step="0.01"
                value={values.liters}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    liters: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Cost" htmlFor="fuel_cost" hint="Philippine pesos.">
              <Input
                id="fuel_cost"
                type="number"
                min="0"
                step="0.01"
                value={values.cost}
                onChange={(event) =>
                  setValues((current) => ({ ...current, cost: event.target.value }))
                }
              />
            </FormField>

            <FormField
              label="Odometer (km)"
              htmlFor="fuel_odometer"
              hint={
                selected
                  ? `Last reading: ${selected.odometer_km} km`
                  : "Cannot be lower than the last reading."
              }
              required
            >
              <Input
                id="fuel_odometer"
                type="number"
                min="0"
                step="0.01"
                value={values.odometerKm}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    odometerKm: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField
              label="Tank level after (%)"
              htmlFor="fuel_level"
              hint="Defaults to 100 after a fill-up."
            >
              <Input
                id="fuel_level"
                type="number"
                min="0"
                max="100"
                step="1"
                value={values.fuelLevel}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    fuelLevel: event.target.value,
                  }))
                }
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </>
  );
}

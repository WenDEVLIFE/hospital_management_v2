"use client";

import * as React from "react";
import {
  BusIcon,
  ClockCircleIcon,
  FuelIcon,
  MapPointHospitalIcon,
  SettingsIcon,
  SirenRoundedIcon,
} from "@solar-icons/react/linear";

import type {
  AmbulanceMaintenance,
  AmbulanceTripDetail,
  AmbulanceTripListRow,
  AmbulanceVehicleDetail,
  AmbulanceVehicleListRow,
  FuelRecord,
} from "@/types/hospital";
import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { UNAVAILABLE_MESSAGE, UnavailableAction } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const VEHICLE_STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "dispatched", label: "Dispatched" },
  { value: "on_trip", label: "On trip" },
  { value: "maintenance", label: "Maintenance" },
  { value: "out_of_service", label: "Out of service" },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: "basic_life_support", label: "Basic life support" },
  { value: "advanced_life_support", label: "Advanced life support" },
  { value: "patient_transport", label: "Patient transport" },
  { value: "mobile_icu", label: "Mobile ICU" },
];

const DISPATCH_STATUS_OPTIONS = [
  { value: "requested", label: "Requested" },
  { value: "assigned", label: "Assigned" },
  { value: "en_route", label: "En route" },
  { value: "on_scene", label: "On scene" },
  { value: "transporting", label: "Transporting" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ACTIVE_DISPATCH_STATUSES = new Set([
  "requested",
  "assigned",
  "en_route",
  "on_scene",
  "transporting",
]);

const PRIORITY_OPTIONS = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
];

export interface AmbulanceViewProps {
  vehicles: AmbulanceVehicleListRow[];
  vehicleDetails: Record<string, AmbulanceVehicleDetail>;
  trips: AmbulanceTripListRow[];
  tripDetails: Record<string, AmbulanceTripDetail>;
  maintenance: AmbulanceMaintenance[];
  fuel: FuelRecord[];
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-hospital-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-hospital-text">{children}</dd>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-hospital-text-muted">
      <span aria-hidden="true">{icon}</span>
      {title}
    </h3>
  );
}

function FuelLevel({ value }: { value: number }) {
  return (
    <div className="min-w-[7rem]">
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-hospital-surface-muted"
        aria-hidden="true"
      >
        <div
          className={cn(
            "h-1.5 rounded-full",
            value <= 20
              ? "bg-red-600"
              : value <= 50
                ? "bg-amber-500"
                : "bg-hospital-green"
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-hospital-text-muted">{value}%</p>
    </div>
  );
}

export function AmbulanceView({
  vehicles,
  vehicleDetails,
  trips,
  tripDetails,
  maintenance,
  fuel,
}: AmbulanceViewProps) {
  const [tab, setTab] = React.useState("dispatch");
  const [selectedVehicle, setSelectedVehicle] =
    React.useState<AmbulanceVehicleListRow | null>(null);
  const [selectedTrip, setSelectedTrip] =
    React.useState<AmbulanceTripListRow | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const activeDispatches = React.useMemo(
    () => trips.filter((trip) => ACTIVE_DISPATCH_STATUSES.has(trip.status)),
    [trips]
  );

  const vehicleRowById = React.useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])),
    [vehicles]
  );
  const tripRowById = React.useMemo(
    () => new Map(trips.map((trip) => [trip.id, trip])),
    [trips]
  );

  const openVehicle = React.useCallback(
    (id: string) => {
      const row = vehicleRowById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedVehicle(row);
      }
    },
    [vehicleRowById]
  );

  const closeVehicle = React.useCallback(() => {
    setPendingAction(null);
    setSelectedVehicle(null);
  }, []);

  const openTrip = React.useCallback(
    (id: string) => {
      const row = tripRowById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedTrip(row);
      }
    },
    [tripRowById]
  );

  const closeTrip = React.useCallback(() => {
    setPendingAction(null);
    setSelectedTrip(null);
  }, []);

  const dispatchColumns = React.useMemo<Column<AmbulanceTripListRow>[]>(
    () => [
      {
        key: "trip_number",
        header: "Trip No.",
        sortable: true,
        sortValue: (row) => row.trip_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.trip_number}
          </span>
        ),
      },
      {
        key: "patient",
        header: "Patient",
        sortable: true,
        sortValue: (row) => row.patient_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">{row.patient_name}</p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.patient_mrn}
            </p>
          </div>
        ),
      },
      {
        key: "priority",
        header: "Priority",
        cell: (row) => <StatusBadge status={row.priority} />,
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "vehicle",
        header: "Ambulance",
        cell: (row) => row.vehicle_number ?? "Unassigned",
      },
      {
        key: "route",
        header: "Pickup → destination",
        cell: (row) => (
          <div className="min-w-0 text-xs">
            <p className="text-hospital-text">{row.pickup_location}</p>
            <p className="text-[11px] text-hospital-text-muted">
              → {row.destination}
            </p>
          </div>
        ),
      },
      {
        key: "requested_by",
        header: "Requested by",
        cell: (row) => row.requested_by_name,
      },
      {
        key: "requested_at",
        header: "Requested",
        sortable: true,
        sortValue: (row) => row.requested_at,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.requested_at)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View ambulance trip ${row.trip_number}`}
            onClick={() => openTrip(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openTrip]
  );

  const dispatchFilters = React.useMemo<
    FilterConfig<AmbulanceTripListRow>[]
  >(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: DISPATCH_STATUS_OPTIONS.filter((option) =>
          ACTIVE_DISPATCH_STATUSES.has(option.value)
        ),
        accessor: (row) => row.status,
      },
      {
        key: "priority",
        label: "priority",
        allLabel: "All priorities",
        options: PRIORITY_OPTIONS,
        accessor: (row) => row.priority,
      },
    ],
    []
  );

  const vehicleColumns = React.useMemo<Column<AmbulanceVehicleListRow>[]>(
    () => [
      {
        key: "vehicle",
        header: "Ambulance",
        sortable: true,
        sortValue: (row) => row.vehicle_number,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">
              {row.vehicle_number}
            </p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.plate_number}
            </p>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        cell: (row) => <StatusBadge status={row.type} />,
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "driver",
        header: "Driver / crew",
        cell: (row) => (
          <div className="min-w-0 text-xs">
            <p>{row.driver_name ?? "No driver assigned"}</p>
            <p className="text-[11px] text-hospital-text-muted">
              {row.crew_names.length > 0
                ? row.crew_names.join(" · ")
                : "No medical crew"}
            </p>
          </div>
        ),
      },
      {
        key: "location",
        header: "Location",
        cell: (row) => row.location,
      },
      {
        key: "fuel",
        header: "Fuel",
        cell: (row) => <FuelLevel value={row.fuel_level} />,
      },
      {
        key: "odometer",
        header: "Odometer",
        align: "right",
        sortable: true,
        sortValue: (row) => row.odometer_km,
        cell: (row) => `${row.odometer_km.toLocaleString("en-PH")} km`,
      },
      {
        key: "active_trip",
        header: "Active trip",
        cell: (row) =>
          row.active_trip_number ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px]">
                {row.active_trip_number}
              </span>
              {row.active_trip_status ? (
                <StatusBadge status={row.active_trip_status} />
              ) : null}
            </div>
          ) : (
            "\u2014"
          ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View ambulance ${row.vehicle_number}`}
            onClick={() => openVehicle(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openVehicle]
  );

  const vehicleFilters = React.useMemo<
    FilterConfig<AmbulanceVehicleListRow>[]
  >(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: VEHICLE_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "type",
        label: "type",
        allLabel: "All types",
        options: VEHICLE_TYPE_OPTIONS,
        accessor: (row) => row.type,
      },
    ],
    []
  );

  const tripColumns = React.useMemo<Column<AmbulanceTripListRow>[]>(
    () => [
      {
        key: "trip_number",
        header: "Trip No.",
        sortable: true,
        sortValue: (row) => row.trip_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.trip_number}
          </span>
        ),
      },
      {
        key: "patient",
        header: "Patient",
        sortable: true,
        sortValue: (row) => row.patient_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">{row.patient_name}</p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.patient_mrn}
            </p>
          </div>
        ),
      },
      {
        key: "vehicle",
        header: "Ambulance",
        cell: (row) => row.vehicle_number ?? "Unassigned",
      },
      {
        key: "priority",
        header: "Priority",
        cell: (row) => <StatusBadge status={row.priority} />,
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "pickup",
        header: "Pickup",
        cell: (row) => row.pickup_location,
      },
      {
        key: "destination",
        header: "Destination",
        cell: (row) => row.destination,
      },
      {
        key: "requested_at",
        header: "Requested",
        sortable: true,
        sortValue: (row) => row.requested_at,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.requested_at)}
          </span>
        ),
      },
      {
        key: "completed_at",
        header: "Completed",
        sortable: true,
        sortValue: (row) => row.completed_at ?? "",
        cell: (row) =>
          row.completed_at ? (
            <span className="whitespace-nowrap">
              {formatDateTime(row.completed_at)}
            </span>
          ) : (
            "\u2014"
          ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View ambulance trip ${row.trip_number}`}
            onClick={() => openTrip(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openTrip]
  );

  const tripFilters = React.useMemo<FilterConfig<AmbulanceTripListRow>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: DISPATCH_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "priority",
        label: "priority",
        allLabel: "All priorities",
        options: PRIORITY_OPTIONS,
        accessor: (row) => row.priority,
      },
    ],
    []
  );

  const vehicleDetail = selectedVehicle
    ? vehicleDetails[selectedVehicle.id] ?? null
    : null;
  const tripDetail = selectedTrip
    ? tripDetails[selectedTrip.id] ?? null
    : null;

  return (
    <>
      <div className="space-y-4">
        <Tabs
          items={[
            {
              value: "dispatch",
              label: "Dispatch board",
              count: activeDispatches.length,
            },
            { value: "fleet", label: "Fleet", count: vehicles.length },
            { value: "trips", label: "Trips", count: trips.length },
            {
              value: "maintenance",
              label: "Maintenance & fuel",
              count: maintenance.length + fuel.length,
            },
          ]}
          value={tab}
          onValueChange={setTab}
        />

        {tab === "dispatch" ? (
          <RecordTable
            rows={activeDispatches}
            columns={dispatchColumns}
            rowKey={(row) => row.id}
            caption="Active ambulance dispatches"
            searchPlaceholder="Search trip no., patient, pickup, or destination"
            searchAccessor={(row) =>
              `${row.trip_number} ${row.patient_name} ${row.patient_mrn} ${row.pickup_location} ${row.destination} ${row.vehicle_number ?? ""}`
            }
            filters={dispatchFilters}
            toolbarActions={
              <UnavailableAction
                label="Dispatch Ambulance"
                description="Assign an available ambulance and medical crew to a transport request."
                size="sm"
                variant="secondary"
                icon={<SirenRoundedIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No active dispatches"
            emptyDescription="There are no active ambulance dispatches."
            emptyIcon={<SirenRoundedIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "fleet" ? (
          <RecordTable
            rows={vehicles}
            columns={vehicleColumns}
            rowKey={(row) => row.id}
            caption="Ambulance fleet"
            searchPlaceholder="Search vehicle no., plate, driver, or location"
            searchAccessor={(row) =>
              `${row.vehicle_number} ${row.plate_number} ${row.type} ${row.driver_name ?? ""} ${row.crew_names.join(" ")} ${row.location}`
            }
            filters={vehicleFilters}
            toolbarActions={
              <UnavailableAction
                label="Register Ambulance"
                description="Register a vehicle, plate number, equipment level, and crew assignment."
                size="sm"
                variant="secondary"
                icon={<BusIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No ambulances found"
            emptyDescription="There are no vehicles matching your selected filters."
            emptyIcon={<BusIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "trips" ? (
          <RecordTable
            rows={trips}
            columns={tripColumns}
            rowKey={(row) => row.id}
            caption="Ambulance trip history"
            searchPlaceholder="Search trip no., patient, pickup, destination, or vehicle"
            searchAccessor={(row) =>
              `${row.trip_number} ${row.patient_name} ${row.patient_mrn} ${row.pickup_location} ${row.destination} ${row.vehicle_number ?? ""} ${row.requested_by_name}`
            }
            filters={tripFilters}
            emptyTitle="No ambulance trips found"
            emptyDescription="There are no trips matching your selected filters."
            emptyIcon={<MapPointHospitalIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "maintenance" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <UnavailableAction
                label="Record Maintenance"
                description="Record vehicle maintenance and schedule the next service."
                size="sm"
                variant="secondary"
                icon={<SettingsIcon className="size-4" aria-hidden="true" />}
              />
              <UnavailableAction
                label="Record Fuel"
                description="Record fuel purchase, liters, cost, and odometer reading."
                size="sm"
                variant="secondary"
                icon={<FuelIcon className="size-4" aria-hidden="true" />}
              />
            </div>

            <section className="space-y-2">
              <SectionHeading
                icon={<SettingsIcon className="size-3.5" />}
                title="Maintenance records"
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ambulance</TableHead>
                    <TableHead>Maintenance</TableHead>
                    <TableHead>Performed</TableHead>
                    <TableHead>Performed by</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead>Next due</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {vehicleRowById.get(record.vehicle_id)?.vehicle_number ??
                          "\u2014"}
                      </TableCell>
                      <TableCell>{record.maintenance_type}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(record.performed_at)}
                      </TableCell>
                      <TableCell>{record.performed_by_name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(record.cost)}
                      </TableCell>
                      <TableCell>
                        {record.next_due_date
                          ? formatDateTime(record.next_due_date)
                          : "\u2014"}
                      </TableCell>
                      <TableCell className="text-xs text-hospital-text-muted">
                        {record.notes ?? "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            <section className="space-y-2">
              <SectionHeading
                icon={<FuelIcon className="size-3.5" />}
                title="Fuel records"
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ambulance</TableHead>
                    <TableHead>Fueled at</TableHead>
                    <TableHead className="text-right">Liters</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Odometer</TableHead>
                    <TableHead>Recorded by</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuel.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {vehicleRowById.get(record.vehicle_id)?.vehicle_number ??
                          "\u2014"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(record.fueled_at)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {record.liters} L
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(record.cost)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {record.odometer_km.toLocaleString("en-PH")} km
                      </TableCell>
                      <TableCell>{record.recorded_by_name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          </div>
        ) : null}
      </div>

      <Modal
        open={selectedVehicle !== null}
        onClose={closeVehicle}
        title={
          selectedVehicle
            ? `Ambulance ${selectedVehicle.vehicle_number}`
            : "Ambulance details"
        }
        description="Vehicle status, crew, trips, maintenance, and fuel"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeVehicle}>
            Close
          </Button>
        }
      >
        {selectedVehicle ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Vehicle">
                {selectedVehicle.vehicle_number} ·{" "}
                <span className="font-mono text-xs">
                  {selectedVehicle.plate_number}
                </span>
              </DetailField>
              <DetailField label="Type">
                <StatusBadge status={selectedVehicle.type} />
              </DetailField>
              <DetailField label="Status">
                <StatusBadge status={selectedVehicle.status} />
              </DetailField>
              <DetailField label="Location">
                {selectedVehicle.location}
              </DetailField>
              <DetailField label="Driver">
                {selectedVehicle.driver_name ?? "No driver assigned"}
              </DetailField>
              <DetailField label="Medical crew">
                {selectedVehicle.crew_names.length > 0
                  ? selectedVehicle.crew_names.join(" · ")
                  : "No medical crew"}
              </DetailField>
              <DetailField label="Fuel level">
                <FuelLevel value={selectedVehicle.fuel_level} />
              </DetailField>
              <DetailField label="Odometer">
                {selectedVehicle.odometer_km.toLocaleString("en-PH")} km
              </DetailField>
              <DetailField label="Last service">
                {formatDateTime(selectedVehicle.last_service_date)}
              </DetailField>
              <DetailField label="Next service due">
                {formatDateTime(selectedVehicle.next_service_due)}
              </DetailField>
            </dl>

            {selectedVehicle.notes ? (
              <p className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2 text-xs text-hospital-text-muted">
                {selectedVehicle.notes}
              </p>
            ) : null}

            {vehicleDetail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<MapPointHospitalIcon className="size-3.5" />}
                    title="Recent trips"
                  />
                  {vehicleDetail.trips.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No trips recorded for this vehicle.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {vehicleDetail.trips.slice(0, 5).map((trip) => (
                        <li
                          key={trip.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                        >
                          <div>
                            <p className="font-mono text-[11px] text-hospital-text">
                              {trip.trip_number} · {trip.patient_name}
                            </p>
                            <p className="text-[11px] text-hospital-text-muted">
                              {trip.pickup_location} → {trip.destination}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={trip.status} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openTrip(trip.id)}
                            >
                              View
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<SettingsIcon className="size-3.5" />}
                    title="Maintenance"
                  />
                  {vehicleDetail.maintenance.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No maintenance records.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {vehicleDetail.maintenance.map((record) => (
                        <li
                          key={record.id}
                          className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-medium text-hospital-text">
                              {record.maintenance_type}
                            </p>
                            <span className="text-[11px] text-hospital-text-muted">
                              {formatCurrency(record.cost)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                            {formatDateTime(record.performed_at)} ·{" "}
                            {record.performed_by_name} · next due{" "}
                            {record.next_due_date
                              ? formatDateTime(record.next_due_date)
                              : "\u2014"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<FuelIcon className="size-3.5" />}
                    title="Fuel records"
                  />
                  {vehicleDetail.fuel.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No fuel records.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {vehicleDetail.fuel.map((record) => (
                        <li
                          key={record.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-medium text-hospital-text">
                              {record.liters} L · {formatCurrency(record.cost)}
                            </p>
                            <p className="text-[11px] text-hospital-text-muted">
                              {formatDateTime(record.fueled_at)} ·{" "}
                              {record.recorded_by_name}
                            </p>
                          </div>
                          <span className="text-[11px] text-hospital-text-muted">
                            {record.odometer_km.toLocaleString("en-PH")} km
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Assign driver and crew")}
                  >
                    Assign crew
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Record maintenance")}
                  >
                    Record maintenance
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingAction("Record fuel")}
                  >
                    Record fuel
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={selectedTrip !== null}
        onClose={closeTrip}
        title={
          selectedTrip
            ? `Ambulance trip ${selectedTrip.trip_number}`
            : "Ambulance trip details"
        }
        description="Pickup, destination, timeline, crew, and status"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeTrip}>
            Close
          </Button>
        }
      >
        {selectedTrip ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Patient">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">{selectedTrip.patient_name}</span>
                  <span className="font-mono text-[11px] text-hospital-text-muted">
                    {selectedTrip.patient_mrn}
                  </span>
                </div>
              </DetailField>
              <DetailField label="Ambulance">
                {selectedTrip.vehicle_number ?? "Unassigned"}
              </DetailField>
              <DetailField label="Priority">
                <StatusBadge status={selectedTrip.priority} />
              </DetailField>
              <DetailField label="Status">
                <StatusBadge status={selectedTrip.status} />
              </DetailField>
              <DetailField label="Pickup">
                {selectedTrip.pickup_location}
              </DetailField>
              <DetailField label="Destination">
                {selectedTrip.destination}
              </DetailField>
              <DetailField label="Requested by">
                {selectedTrip.requested_by_name}
              </DetailField>
              <DetailField label="Crew">
                {selectedTrip.crew_names.length > 0
                  ? selectedTrip.crew_names.join(" · ")
                  : "No crew assigned"}
              </DetailField>
              <DetailField label="Requested">
                {formatDateTime(selectedTrip.requested_at)}
              </DetailField>
              <DetailField label="Dispatched">
                {selectedTrip.dispatched_at
                  ? formatDateTime(selectedTrip.dispatched_at)
                  : "Not dispatched"}
              </DetailField>
              <DetailField label="Arrived pickup">
                {selectedTrip.arrived_pickup_at
                  ? formatDateTime(selectedTrip.arrived_pickup_at)
                  : "\u2014"}
              </DetailField>
              <DetailField label="Departed pickup">
                {selectedTrip.departed_pickup_at
                  ? formatDateTime(selectedTrip.departed_pickup_at)
                  : "\u2014"}
              </DetailField>
              <DetailField label="Arrived destination">
                {selectedTrip.arrived_destination_at
                  ? formatDateTime(selectedTrip.arrived_destination_at)
                  : "\u2014"}
              </DetailField>
              <DetailField label="Completed">
                {selectedTrip.completed_at
                  ? formatDateTime(selectedTrip.completed_at)
                  : "\u2014"}
              </DetailField>
            </dl>

            {selectedTrip.notes ? (
              <p className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2 text-xs text-hospital-text-muted">
                {selectedTrip.notes}
              </p>
            ) : null}

            {tripDetail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<ClockCircleIcon className="size-3.5" />}
                    title="Dispatch timeline"
                  />
                  <ol className="space-y-1.5">
                    {[
                      { label: "Requested", value: tripDetail.trip.requested_at },
                      { label: "Dispatched", value: tripDetail.trip.dispatched_at },
                      {
                        label: "Arrived at pickup",
                        value: tripDetail.trip.arrived_pickup_at,
                      },
                      {
                        label: "Departed pickup",
                        value: tripDetail.trip.departed_pickup_at,
                      },
                      {
                        label: "Arrived at destination",
                        value: tripDetail.trip.arrived_destination_at,
                      },
                      { label: "Completed", value: tripDetail.trip.completed_at },
                    ].map((step) => (
                      <li
                        key={step.label}
                        className="flex items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                      >
                        <span className="text-xs text-hospital-text">
                          {step.label}
                        </span>
                        <span className="text-[11px] text-hospital-text-muted">
                          {step.value ? formatDateTime(step.value) : "Pending"}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Dispatch ambulance")}
                  >
                    Dispatch
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Mark en route")}
                  >
                    En route
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Mark arrived at pickup")}
                  >
                    Arrive pickup
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Complete trip")}
                  >
                    Complete trip
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingAction("Cancel trip")}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

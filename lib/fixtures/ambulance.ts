import type {
  AmbulanceMaintenance,
  AmbulanceStats,
  AmbulanceTrip,
  AmbulanceTripDetail,
  AmbulanceTripListRow,
  AmbulanceVehicle,
  AmbulanceVehicleDetail,
  AmbulanceVehicleListRow,
  DispatchPriority,
  DispatchStatus,
  FuelRecord,
} from "@/types/hospital";
import {
  PREVIEW_NOW,
  isoAt,
  isoDate,
  previewUuid,
  staffIds,
  staffNameById,
} from "./base";
import { patientMrnById, patientNameById, patients } from "./patients";

const nurseA = staffNameById.get(staffIds.nurseA) ?? "Test Nurse A";
const nurseB = staffNameById.get(staffIds.nurseB) ?? "Test Nurse B";

function manilaDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export const ambulanceVehicles: AmbulanceVehicle[] = [
  {
    id: previewUuid(110, 1),
    vehicle_number: "AMB-01",
    plate_number: "SPMC-1001",
    type: "advanced_life_support",
    status: "available",
    driver_name: "Test Driver A",
    crew_names: [nurseA],
    location: "Emergency Department bay",
    fuel_level: 82,
    odometer_km: 45210,
    last_service_date: isoDate(-50),
    next_service_due: isoDate(40),
    notes: null,
  },
  {
    id: previewUuid(110, 2),
    vehicle_number: "AMB-02",
    plate_number: "SPMC-1002",
    type: "basic_life_support",
    status: "dispatched",
    driver_name: "Test Driver B",
    crew_names: [nurseB],
    location: "En route to Barangay Malinis",
    fuel_level: 64,
    odometer_km: 62100,
    last_service_date: isoDate(-20),
    next_service_due: isoDate(70),
    notes: null,
  },
  {
    id: previewUuid(110, 3),
    vehicle_number: "AMB-03",
    plate_number: "SPMC-1003",
    type: "patient_transport",
    status: "on_trip",
    driver_name: "Test Driver C",
    crew_names: [nurseA],
    location: "Transporting to SPMC Radiology",
    fuel_level: 55,
    odometer_km: 38900,
    last_service_date: isoDate(-90),
    next_service_due: isoDate(10),
    notes: null,
  },
  {
    id: previewUuid(110, 4),
    vehicle_number: "AMB-04",
    plate_number: "SPMC-1004",
    type: "mobile_icu",
    status: "maintenance",
    driver_name: "Test Driver D",
    crew_names: [nurseB],
    location: "Motor pool",
    fuel_level: 30,
    odometer_km: 74500,
    last_service_date: isoDate(-5),
    next_service_due: isoDate(85),
    notes: "Scheduled preventive maintenance.",
  },
  {
    id: previewUuid(110, 5),
    vehicle_number: "AMB-05",
    plate_number: "SPMC-1005",
    type: "basic_life_support",
    status: "out_of_service",
    driver_name: null,
    crew_names: [],
    location: "Motor pool",
    fuel_level: 12,
    odometer_km: 98000,
    last_service_date: isoDate(-200),
    next_service_due: isoDate(-10),
    notes: "Awaiting replacement of a damaged stretcher.",
  },
];

export const ambulanceVehicleById = new Map(
  ambulanceVehicles.map((vehicle) => [vehicle.id, vehicle])
);

type TripSeed = {
  patientIndex: number;
  vehicleIndex: number | null;
  status: DispatchStatus;
  priority: DispatchPriority;
  pickup: string;
  destination: string;
  requestedOffset: number;
  requestedHour: number;
  requestedMinute: number;
  dispatchedOffset: number | null;
  dispatchedHour: number | null;
  dispatchedMinute: number | null;
  arrivedPickupOffset: number | null;
  arrivedPickupHour: number | null;
  arrivedPickupMinute: number | null;
  departedPickupOffset: number | null;
  departedPickupHour: number | null;
  departedPickupMinute: number | null;
  arrivedDestinationOffset: number | null;
  arrivedDestinationHour: number | null;
  arrivedDestinationMinute: number | null;
  completedOffset: number | null;
  completedHour: number | null;
  completedMinute: number | null;
  requestedBy: string;
  crew: string[];
  notes: string;
};

const TRIP_SEEDS: TripSeed[] = [
  {
    patientIndex: 0,
    vehicleIndex: 0,
    status: "completed",
    priority: "emergency",
    pickup: "Barangay San Isidro",
    destination: "SPMC Emergency Department",
    requestedOffset: -2,
    requestedHour: 8,
    requestedMinute: 10,
    dispatchedOffset: -2,
    dispatchedHour: 8,
    dispatchedMinute: 12,
    arrivedPickupOffset: -2,
    arrivedPickupHour: 8,
    arrivedPickupMinute: 27,
    departedPickupOffset: -2,
    departedPickupHour: 8,
    departedPickupMinute: 40,
    arrivedDestinationOffset: -2,
    arrivedDestinationHour: 8,
    arrivedDestinationMinute: 58,
    completedOffset: -2,
    completedHour: 9,
    completedMinute: 5,
    requestedBy: "Test Physician B",
    crew: [nurseA],
    notes: "Chest pain; oxygen started en route.",
  },
  {
    patientIndex: 2,
    vehicleIndex: 2,
    status: "transporting",
    priority: "urgent",
    pickup: "Barangay Poblacion",
    destination: "SPMC Radiology",
    requestedOffset: 0,
    requestedHour: 6,
    requestedMinute: 0,
    dispatchedOffset: 0,
    dispatchedHour: 6,
    dispatchedMinute: 5,
    arrivedPickupOffset: 0,
    arrivedPickupHour: 6,
    arrivedPickupMinute: 20,
    departedPickupOffset: 0,
    departedPickupHour: 6,
    departedPickupMinute: 35,
    arrivedDestinationOffset: null,
    arrivedDestinationHour: null,
    arrivedDestinationMinute: null,
    completedOffset: null,
    completedHour: null,
    completedMinute: null,
    requestedBy: "Test Physician A",
    crew: [nurseA],
    notes: "Interfacility transfer for imaging.",
  },
  {
    patientIndex: 1,
    vehicleIndex: 0,
    status: "completed",
    priority: "routine",
    pickup: "SPMC",
    destination: "Barangay Manggahan",
    requestedOffset: -1,
    requestedHour: 14,
    requestedMinute: 0,
    dispatchedOffset: -1,
    dispatchedHour: 14,
    dispatchedMinute: 5,
    arrivedPickupOffset: -1,
    arrivedPickupHour: 14,
    arrivedPickupMinute: 10,
    departedPickupOffset: -1,
    departedPickupHour: 14,
    departedPickupMinute: 20,
    arrivedDestinationOffset: -1,
    arrivedDestinationHour: 14,
    arrivedDestinationMinute: 45,
    completedOffset: -1,
    completedHour: 14,
    completedMinute: 50,
    requestedBy: "Test Physician A",
    crew: [nurseB],
    notes: "Discharge transport.",
  },
  {
    patientIndex: 5,
    vehicleIndex: 1,
    status: "en_route",
    priority: "emergency",
    pickup: "Barangay Malinis",
    destination: "SPMC Emergency Department",
    requestedOffset: 0,
    requestedHour: 7,
    requestedMinute: 50,
    dispatchedOffset: 0,
    dispatchedHour: 7,
    dispatchedMinute: 52,
    arrivedPickupOffset: null,
    arrivedPickupHour: null,
    arrivedPickupMinute: null,
    departedPickupOffset: null,
    departedPickupHour: null,
    departedPickupMinute: null,
    arrivedDestinationOffset: null,
    arrivedDestinationHour: null,
    arrivedDestinationMinute: null,
    completedOffset: null,
    completedHour: null,
    completedMinute: null,
    requestedBy: "Test Physician B",
    crew: [nurseB],
    notes: "Fall from height; advanced life support requested.",
  },
  {
    patientIndex: 6,
    vehicleIndex: 0,
    status: "completed",
    priority: "urgent",
    pickup: "Barangay Mabuhay",
    destination: "SPMC Emergency Department",
    requestedOffset: -1,
    requestedHour: 9,
    requestedMinute: 0,
    dispatchedOffset: -1,
    dispatchedHour: 9,
    dispatchedMinute: 3,
    arrivedPickupOffset: -1,
    arrivedPickupHour: 9,
    arrivedPickupMinute: 18,
    departedPickupOffset: -1,
    departedPickupHour: 9,
    departedPickupMinute: 30,
    arrivedDestinationOffset: -1,
    arrivedDestinationHour: 9,
    arrivedDestinationMinute: 50,
    completedOffset: -1,
    completedHour: 9,
    completedMinute: 55,
    requestedBy: "Test Physician C",
    crew: [nurseA],
    notes: "Abdominal pain.",
  },
  {
    patientIndex: 4,
    vehicleIndex: 2,
    status: "completed",
    priority: "routine",
    pickup: "SPMC",
    destination: "Barangay Bagong Silang",
    requestedOffset: -3,
    requestedHour: 11,
    requestedMinute: 0,
    dispatchedOffset: -3,
    dispatchedHour: 11,
    dispatchedMinute: 5,
    arrivedPickupOffset: -3,
    arrivedPickupHour: 11,
    arrivedPickupMinute: 10,
    departedPickupOffset: -3,
    departedPickupHour: 11,
    departedPickupMinute: 25,
    arrivedDestinationOffset: -3,
    arrivedDestinationHour: 11,
    arrivedDestinationMinute: 50,
    completedOffset: -3,
    completedHour: 11,
    completedMinute: 55,
    requestedBy: "Test Physician A",
    crew: [nurseB],
    notes: "Follow-up transport.",
  },
  {
    patientIndex: 7,
    vehicleIndex: 0,
    status: "cancelled",
    priority: "routine",
    pickup: "Barangay Mataas",
    destination: "SPMC",
    requestedOffset: -1,
    requestedHour: 16,
    requestedMinute: 0,
    dispatchedOffset: null,
    dispatchedHour: null,
    dispatchedMinute: null,
    arrivedPickupOffset: null,
    arrivedPickupHour: null,
    arrivedPickupMinute: null,
    departedPickupOffset: null,
    departedPickupHour: null,
    departedPickupMinute: null,
    arrivedDestinationOffset: null,
    arrivedDestinationHour: null,
    arrivedDestinationMinute: null,
    completedOffset: null,
    completedHour: null,
    completedMinute: null,
    requestedBy: "Test Physician C",
    crew: [],
    notes: "Patient arranged private transport.",
  },
  {
    patientIndex: 3,
    vehicleIndex: null,
    status: "requested",
    priority: "urgent",
    pickup: "Barangay Tagumpay",
    destination: "SPMC Emergency Department",
    requestedOffset: 0,
    requestedHour: 8,
    requestedMinute: 0,
    dispatchedOffset: null,
    dispatchedHour: null,
    dispatchedMinute: null,
    arrivedPickupOffset: null,
    arrivedPickupHour: null,
    arrivedPickupMinute: null,
    departedPickupOffset: null,
    departedPickupHour: null,
    departedPickupMinute: null,
    arrivedDestinationOffset: null,
    arrivedDestinationHour: null,
    arrivedDestinationMinute: null,
    completedOffset: null,
    completedHour: null,
    completedMinute: null,
    requestedBy: "Test Physician C",
    crew: [],
    notes: "Awaiting ambulance assignment.",
  },
];

function at(
  offset: number | null,
  hour: number | null,
  minute: number | null
): string | null {
  if (offset === null || hour === null || minute === null) {
    return null;
  }

  return isoAt(offset, hour, minute);
}

export const ambulanceTrips: AmbulanceTrip[] = TRIP_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(111, index + 1),
    trip_number: `TRIP-2026-${String(index + 1).padStart(4, "0")}`,
    patient_id: previewUuid(10, seed.patientIndex + 1),
    vehicle_id:
      seed.vehicleIndex === null
        ? null
        : ambulanceVehicles[seed.vehicleIndex].id,
    status: seed.status,
    priority: seed.priority,
    pickup_location: seed.pickup,
    destination: seed.destination,
    requested_at: isoAt(
      seed.requestedOffset,
      seed.requestedHour,
      seed.requestedMinute
    ),
    dispatched_at: at(
      seed.dispatchedOffset,
      seed.dispatchedHour,
      seed.dispatchedMinute
    ),
    arrived_pickup_at: at(
      seed.arrivedPickupOffset,
      seed.arrivedPickupHour,
      seed.arrivedPickupMinute
    ),
    departed_pickup_at: at(
      seed.departedPickupOffset,
      seed.departedPickupHour,
      seed.departedPickupMinute
    ),
    arrived_destination_at: at(
      seed.arrivedDestinationOffset,
      seed.arrivedDestinationHour,
      seed.arrivedDestinationMinute
    ),
    completed_at: at(
      seed.completedOffset,
      seed.completedHour,
      seed.completedMinute
    ),
    requested_by_name: seed.requestedBy,
    crew_names: seed.crew,
    notes: seed.notes,
  })
);

export const ambulanceTripById = new Map(
  ambulanceTrips.map((trip) => [trip.id, trip])
);

export const ambulanceTripListRows: AmbulanceTripListRow[] = ambulanceTrips
  .map((trip) => {
    const vehicle = trip.vehicle_id
      ? ambulanceVehicleById.get(trip.vehicle_id)
      : null;

    return {
      ...trip,
      patient_name:
        patientNameById.get(trip.patient_id) ?? "Test Patient",
      patient_mrn:
        patientMrnById.get(trip.patient_id) ?? "MRN-2026-0000",
      vehicle_number: vehicle?.vehicle_number ?? null,
      vehicle_type: vehicle?.type ?? null,
    };
  })
  .sort((a, b) =>
    a.requested_at === b.requested_at
      ? 0
      : a.requested_at < b.requested_at
        ? 1
        : -1
  );

const ACTIVE_TRIP_STATUSES = new Set<DispatchStatus>([
  "requested",
  "assigned",
  "en_route",
  "on_scene",
  "transporting",
]);

export const ambulanceVehicleListRows: AmbulanceVehicleListRow[] =
  ambulanceVehicles.map((vehicle) => {
    const activeTrip = ambulanceTrips.find(
      (trip) =>
        trip.vehicle_id === vehicle.id &&
        ACTIVE_TRIP_STATUSES.has(trip.status)
    );

    return {
      ...vehicle,
      active_trip_number: activeTrip?.trip_number ?? null,
      active_trip_status: activeTrip?.status ?? null,
    };
  });

export const ambulanceMaintenance: AmbulanceMaintenance[] = [
  {
    id: previewUuid(112, 1),
    vehicle_id: ambulanceVehicles[0].id,
    maintenance_type: "Preventive maintenance",
    performed_at: isoAt(-50, 8),
    performed_by_name: "Test Fleet Mechanic",
    cost: 8500,
    notes: "Oil change, brake inspection, and tire rotation.",
    next_due_date: isoDate(40),
  },
  {
    id: previewUuid(112, 2),
    vehicle_id: ambulanceVehicles[1].id,
    maintenance_type: "Tire replacement",
    performed_at: isoAt(-20, 9),
    performed_by_name: "Test Fleet Mechanic",
    cost: 12000,
    notes: "Front tires replaced.",
    next_due_date: isoDate(70),
  },
  {
    id: previewUuid(112, 3),
    vehicle_id: ambulanceVehicles[2].id,
    maintenance_type: "Stretcher service",
    performed_at: isoAt(-90, 10),
    performed_by_name: "Test Fleet Mechanic",
    cost: 4500,
    notes: "Stretcher locking mechanism serviced.",
    next_due_date: isoDate(10),
  },
  {
    id: previewUuid(112, 4),
    vehicle_id: ambulanceVehicles[3].id,
    maintenance_type: "Scheduled preventive maintenance",
    performed_at: isoAt(-5, 8),
    performed_by_name: "Test Fleet Mechanic",
    cost: 15000,
    notes: "Preventive maintenance in progress.",
    next_due_date: isoDate(85),
  },
  {
    id: previewUuid(112, 5),
    vehicle_id: ambulanceVehicles[4].id,
    maintenance_type: "Stretcher replacement",
    performed_at: isoAt(-200, 8),
    performed_by_name: "Test Fleet Mechanic",
    cost: 0,
    notes: "Parts on order; vehicle out of service.",
    next_due_date: isoDate(-10),
  },
];

export const fuelRecords: FuelRecord[] = [
  {
    id: previewUuid(113, 1),
    vehicle_id: ambulanceVehicles[0].id,
    fueled_at: isoAt(-2, 7),
    liters: 45,
    cost: 2700,
    odometer_km: 45180,
    recorded_by_name: "Test Driver A",
  },
  {
    id: previewUuid(113, 2),
    vehicle_id: ambulanceVehicles[1].id,
    fueled_at: isoAt(0, 6),
    liters: 40,
    cost: 2400,
    odometer_km: 62050,
    recorded_by_name: "Test Driver B",
  },
  {
    id: previewUuid(113, 3),
    vehicle_id: ambulanceVehicles[2].id,
    fueled_at: isoAt(-1, 7),
    liters: 50,
    cost: 3000,
    odometer_km: 38850,
    recorded_by_name: "Test Driver C",
  },
  {
    id: previewUuid(113, 4),
    vehicle_id: ambulanceVehicles[3].id,
    fueled_at: isoAt(-5, 8),
    liters: 35,
    cost: 2100,
    odometer_km: 74450,
    recorded_by_name: "Test Driver D",
  },
  {
    id: previewUuid(113, 5),
    vehicle_id: ambulanceVehicles[4].id,
    fueled_at: isoAt(-60, 8),
    liters: 20,
    cost: 1200,
    odometer_km: 97900,
    recorded_by_name: "Test Driver D",
  },
  {
    id: previewUuid(113, 6),
    vehicle_id: ambulanceVehicles[0].id,
    fueled_at: isoAt(-10, 7),
    liters: 48,
    cost: 2880,
    odometer_km: 44800,
    recorded_by_name: "Test Driver A",
  },
];

const tripsByVehicleId = new Map<string, AmbulanceTripListRow[]>();

for (const trip of ambulanceTripListRows) {
  if (!trip.vehicle_id) {
    continue;
  }

  const list = tripsByVehicleId.get(trip.vehicle_id) ?? [];
  list.push(trip);
  tripsByVehicleId.set(trip.vehicle_id, list);
}

export const ambulanceVehicleDetailById = new Map<
  string,
  AmbulanceVehicleDetail
>(
  ambulanceVehicles.map((vehicle) => [
    vehicle.id,
    {
      vehicle,
      trips: tripsByVehicleId.get(vehicle.id) ?? [],
      maintenance: ambulanceMaintenance.filter(
        (record) => record.vehicle_id === vehicle.id
      ),
      fuel: fuelRecords.filter((record) => record.vehicle_id === vehicle.id),
    },
  ])
);

export const ambulanceTripDetailById = new Map<string, AmbulanceTripDetail>(
  ambulanceTrips.map((trip) => {
    const patient = patients.find((item) => item.id === trip.patient_id);
    const vehicle = trip.vehicle_id
      ? ambulanceVehicleById.get(trip.vehicle_id) ?? null
      : null;

    if (!patient) {
      throw new Error(`Ambulance fixture is missing patient ${trip.patient_id}`);
    }

    return [trip.id, { trip, patient, vehicle }];
  })
);

const responseTimes = ambulanceTrips
  .filter((trip) => trip.dispatched_at && trip.arrived_pickup_at)
  .map((trip) =>
    Math.round(
      (Date.parse(trip.arrived_pickup_at!) -
        Date.parse(trip.dispatched_at!)) /
        60_000
    )
  );

export const ambulanceStats: AmbulanceStats = {
  fleetSize: ambulanceVehicles.length,
  available: ambulanceVehicles.filter(
    (vehicle) => vehicle.status === "available"
  ).length,
  activeDispatches: ambulanceTrips.filter((trip) =>
    ACTIVE_TRIP_STATUSES.has(trip.status)
  ).length,
  requested: ambulanceTrips.filter((trip) => trip.status === "requested").length,
  enRoute: ambulanceTrips.filter((trip) => trip.status === "en_route").length,
  transporting: ambulanceTrips.filter(
    (trip) => trip.status === "transporting"
  ).length,
  maintenance: ambulanceVehicles.filter(
    (vehicle) =>
      vehicle.status === "maintenance" ||
      vehicle.status === "out_of_service"
  ).length,
  tripsToday: ambulanceTrips.filter(
    (trip) => manilaDate(trip.requested_at) === manilaDate(PREVIEW_NOW)
  ).length,
  completedTrips: ambulanceTrips.filter(
    (trip) => trip.status === "completed"
  ).length,
  averageResponseMinutes:
    responseTimes.length === 0
      ? 0
      : Math.round(
          responseTimes.reduce((total, value) => total + value, 0) /
            responseTimes.length
        ),
};

import type {
  AmbulanceMaintenance,
  AmbulanceStats,
  AmbulanceTrip,
  AmbulanceTripDetail,
  AmbulanceTripListRow,
  AmbulanceType,
  AmbulanceVehicle,
  AmbulanceVehicleDetail,
  AmbulanceVehicleListRow,
  DispatchStatus,
  FuelRecord,
  Patient,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate, pageSlice, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const VEHICLE_COLUMNS = "*";

const TRIP_COLUMNS =
  "*, patients(id, medical_record_number, first_name, middle_name, last_name, suffix), ambulance_vehicles(vehicle_number, type, status)";

type Relation<T> = T | T[] | null;

type TripJoinRow = AmbulanceTrip & {
  patients: Relation<{
    id: string;
    medical_record_number: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
  }>;
  ambulance_vehicles: Relation<{
    vehicle_number: string;
    type: string;
    status: string;
  }>;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function fullName(row: {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
}): string {
  return [row.first_name, row.middle_name, row.last_name, row.suffix]
    .filter(Boolean)
    .join(" ");
}

function toVehicle(row: Record<string, unknown>): AmbulanceVehicle {
  return {
    id: String(row.id),
    vehicle_number: String(row.vehicle_number),
    plate_number: String(row.plate_number),
    type: row.type as AmbulanceType,
    status: row.status as AmbulanceVehicle["status"],
    driver_name: (row.driver_name as string | null) ?? null,
    crew_names: (row.crew_names as string[] | null) ?? [],
    location: String(row.location ?? "Station"),
    fuel_level: Number(row.fuel_level ?? 0),
    odometer_km: Number(row.odometer_km ?? 0),
    last_service_date: (row.last_service_date as string | null) ?? "",
    next_service_due: (row.next_service_due as string | null) ?? "",
    notes: (row.notes as string | null) ?? null,
  };
}

function toTripRow(row: TripJoinRow): AmbulanceTripListRow | null {
  const patient = firstRelation(row.patients);
  const vehicle = firstRelation(row.ambulance_vehicles);

  if (!patient) {
    return null;
  }

  return {
    id: row.id,
    trip_number: row.trip_number,
    patient_id: row.patient_id,
    vehicle_id: row.vehicle_id,
    status: row.status as DispatchStatus,
    priority: row.priority as AmbulanceTrip["priority"],
    pickup_location: row.pickup_location,
    destination: row.destination,
    requested_at: row.requested_at,
    dispatched_at: row.dispatched_at,
    arrived_pickup_at: row.arrived_pickup_at,
    departed_pickup_at: row.departed_pickup_at,
    arrived_destination_at: row.arrived_destination_at,
    completed_at: row.completed_at,
    requested_by_name: "Staff",
    crew_names: row.crew_names ?? [],
    notes: row.notes,
    patient_name: fullName(patient),
    patient_mrn: patient.medical_record_number,
    vehicle_number: vehicle?.vehicle_number ?? null,
    vehicle_type: (vehicle?.type as AmbulanceType | undefined) ?? null,
  };
}

async function loadTrips(): Promise<DataResult<TripJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ambulance_trips")
    .select(TRIP_COLUMNS)
    .order("requested_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as TripJoinRow[], error: null };
}

export async function listAmbulanceVehicles(
  params: {
    q?: string;
    status?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AmbulanceVehicleListRow>> {
  const supabase = await getSupabaseServerClient();
  const [vehicleResult, tripResult] = await Promise.all([
    supabase.from("ambulance_vehicles").select(VEHICLE_COLUMNS).order("vehicle_number"),
    loadTrips(),
  ]);

  if (vehicleResult.error) {
    return { data: null, error: toDataError(vehicleResult.error) };
  }

  const openTrips = new Map<string, AmbulanceTripListRow>();

  for (const row of tripResult.error ? [] : tripResult.data) {
    const trip = toTripRow(row);

    if (!trip || !trip.vehicle_id) {
      continue;
    }

    if (trip.status === "completed" || trip.status === "cancelled") {
      continue;
    }

    openTrips.set(trip.vehicle_id, trip);
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = (vehicleResult.data ?? [])
    .map((row) => {
      const vehicle = toVehicle(row as Record<string, unknown>);
      const active = openTrips.get(vehicle.id) ?? null;

      return {
        ...vehicle,
        active_trip_number: active?.trip_number ?? null,
        active_trip_status: active?.status ?? null,
      } satisfies AmbulanceVehicleListRow;
    })
    .filter((vehicle) => {
      if (params.status && vehicle.status !== params.status) {
        return false;
      }

      if (params.type && vehicle.type !== params.type) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        vehicle.vehicle_number,
        vehicle.plate_number,
        vehicle.driver_name ?? "",
        vehicle.location,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function listAmbulanceTrips(
  params: {
    q?: string;
    status?: string;
    priority?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AmbulanceTripListRow>> {
  const tripResult = await loadTrips();

  if (tripResult.error) {
    return { data: null, error: tripResult.error };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = tripResult.data
    .map(toTripRow)
    .filter((row): row is AmbulanceTripListRow => row !== null)
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (params.priority && row.priority !== params.priority) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        row.trip_number,
        row.patient_name,
        row.patient_mrn,
        row.pickup_location,
        row.destination,
        row.vehicle_number ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function listAmbulanceMaintenance(): Promise<
  DataResult<AmbulanceMaintenance[]>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ambulance_maintenance")
    .select(
      "id, vehicle_id, maintenance_type, performed_at, cost, notes, next_due_date, profiles!ambulance_maintenance_performed_by_fkey(full_name)"
    )
    .order("performed_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: ((data ?? []) as Array<
      Omit<AmbulanceMaintenance, "performed_by_name"> & {
        profiles: Relation<{ full_name: string }>;
      }
    >).map((row) => ({
      id: row.id,
      vehicle_id: row.vehicle_id,
      maintenance_type: row.maintenance_type,
      performed_at: row.performed_at,
      performed_by_name:
        firstRelation(row.profiles)?.full_name ?? "Unknown staff",
      cost: Number(row.cost),
      notes: row.notes,
      next_due_date: row.next_due_date,
    })),
    error: null,
  };
}

export async function listFuelRecords(): Promise<DataResult<FuelRecord[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ambulance_fuel_records")
    .select(
      "id, vehicle_id, fueled_at, liters, cost, odometer_km, profiles!ambulance_fuel_records_recorded_by_fkey(full_name)"
    )
    .order("fueled_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: ((data ?? []) as Array<
      Omit<FuelRecord, "recorded_by_name"> & {
        profiles: Relation<{ full_name: string }>;
      }
    >).map((row) => ({
      id: row.id,
      vehicle_id: row.vehicle_id,
      fueled_at: row.fueled_at,
      liters: Number(row.liters),
      cost: Number(row.cost),
      odometer_km: Number(row.odometer_km),
      recorded_by_name:
        firstRelation(row.profiles)?.full_name ?? "Unknown staff",
    })),
    error: null,
  };
}

export async function getAmbulanceVehicleDetail(
  id: string
): Promise<DataResult<AmbulanceVehicleDetail>> {
  const supabase = await getSupabaseServerClient();
  const [vehicleResult, tripResult, maintenanceResult, fuelResult] =
    await Promise.all([
      supabase.from("ambulance_vehicles").select("*").eq("id", id).maybeSingle(),
      loadTrips(),
      listAmbulanceMaintenance(),
      listFuelRecords(),
    ]);

  if (vehicleResult.error || !vehicleResult.data) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "The ambulance could not be found." },
    };
  }

  const trips = (tripResult.error ? [] : tripResult.data)
    .map(toTripRow)
    .filter((row): row is AmbulanceTripListRow => row !== null)
    .filter((row) => row.vehicle_id === id);

  return {
    data: {
      vehicle: toVehicle(vehicleResult.data as Record<string, unknown>),
      trips,
      maintenance: (maintenanceResult.error ? [] : maintenanceResult.data).filter(
        (row) => row.vehicle_id === id
      ),
      fuel: (fuelResult.error ? [] : fuelResult.data).filter(
        (row) => row.vehicle_id === id
      ),
    },
    error: null,
  };
}

export async function getAmbulanceVehicleDetails(): Promise<
  DataResult<Record<string, AmbulanceVehicleDetail>>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("ambulance_vehicles").select("id");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const details: Record<string, AmbulanceVehicleDetail> = {};

  for (const row of (data ?? []) as Array<{ id: string }>) {
    const detail = await getAmbulanceVehicleDetail(row.id);

    if (detail.data) {
      details[row.id] = detail.data;
    }
  }

  return { data: details, error: null };
}

export async function getAmbulanceTripDetail(
  id: string
): Promise<DataResult<AmbulanceTripDetail>> {
  const tripResult = await loadTrips();

  if (tripResult.error) {
    return { data: null, error: tripResult.error };
  }

  const row = tripResult.data.find((trip) => trip.id === id);

  if (!row) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "The dispatch could not be found." },
    };
  }

  const trip = toTripRow(row);

  if (!trip) {
    return {
      data: null,
      error: { code: "NOT_FOUND", message: "The dispatch could not be found." },
    };
  }

  const supabase = await getSupabaseServerClient();
  const [patientResult, vehicleResult] = await Promise.all([
    supabase.from("patients").select("*").eq("id", row.patient_id).maybeSingle(),
    row.vehicle_id
      ? supabase
          .from("ambulance_vehicles")
          .select("*")
          .eq("id", row.vehicle_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    data: {
      trip: {
        id: trip.id,
        trip_number: trip.trip_number,
        patient_id: trip.patient_id,
        vehicle_id: trip.vehicle_id,
        status: trip.status,
        priority: trip.priority,
        pickup_location: trip.pickup_location,
        destination: trip.destination,
        requested_at: trip.requested_at,
        dispatched_at: trip.dispatched_at,
        arrived_pickup_at: trip.arrived_pickup_at,
        departed_pickup_at: trip.departed_pickup_at,
        arrived_destination_at: trip.arrived_destination_at,
        completed_at: trip.completed_at,
        requested_by_name: trip.requested_by_name,
        crew_names: trip.crew_names,
        notes: trip.notes,
      },
      patient: (patientResult.data ?? {}) as Patient,
      vehicle: vehicleResult.data
        ? toVehicle(vehicleResult.data as Record<string, unknown>)
        : null,
    },
    error: null,
  };
}

export async function getAmbulanceTripDetails(): Promise<
  DataResult<Record<string, AmbulanceTripDetail>>
> {
  const tripResult = await loadTrips();

  if (tripResult.error) {
    return { data: null, error: tripResult.error };
  }

  const details: Record<string, AmbulanceTripDetail> = {};

  for (const row of tripResult.data.slice(0, 200)) {
    const detail = await getAmbulanceTripDetail(row.id);

    if (detail.data) {
      details[row.id] = detail.data;
    }
  }

  return { data: details, error: null };
}

export async function getAmbulanceStats(): Promise<
  DataResult<AmbulanceStats>
> {
  const supabase = await getSupabaseServerClient();
  const today = manilaDate(new Date().toISOString());
  const [vehicleResult, tripResult] = await Promise.all([
    supabase.from("ambulance_vehicles").select("status"),
    supabase
      .from("ambulance_trips")
      .select("status, dispatched_at, arrived_pickup_at, completed_at"),
  ]);

  if (vehicleResult.error) {
    return { data: null, error: toDataError(vehicleResult.error) };
  }

  if (tripResult.error) {
    return { data: null, error: toDataError(tripResult.error) };
  }

  const stats: AmbulanceStats = {
    fleetSize: 0,
    available: 0,
    activeDispatches: 0,
    requested: 0,
    enRoute: 0,
    transporting: 0,
    maintenance: 0,
    tripsToday: 0,
    completedTrips: 0,
    averageResponseMinutes: 0,
  };

  for (const vehicle of (vehicleResult.data ?? []) as Array<{
    status: string;
  }>) {
    stats.fleetSize += 1;

    if (vehicle.status === "available") {
      stats.available += 1;
    }

    if (vehicle.status === "maintenance" || vehicle.status === "out_of_service") {
      stats.maintenance += 1;
    }

    if (vehicle.status === "dispatched" || vehicle.status === "on_trip") {
      stats.activeDispatches += 1;
    }
  }

  let responseTotal = 0;
  let responseCount = 0;

  for (const trip of (tripResult.data ?? []) as Array<{
    status: string;
    dispatched_at: string | null;
    arrived_pickup_at: string | null;
    completed_at: string | null;
  }>) {
    if (trip.status === "requested") {
      stats.requested += 1;
    }

    if (trip.status === "en_route" || trip.status === "on_scene") {
      stats.enRoute += 1;
    }

    if (trip.status === "transporting") {
      stats.transporting += 1;
    }

    if (trip.status === "completed") {
      stats.completedTrips += 1;
    }

    if (trip.completed_at && manilaDate(trip.completed_at) === today) {
      stats.tripsToday += 1;
    }

    if (trip.dispatched_at && trip.arrived_pickup_at) {
      const minutes =
        (new Date(trip.arrived_pickup_at).getTime() -
          new Date(trip.dispatched_at).getTime()) /
        60000;

      if (minutes >= 0) {
        responseTotal += minutes;
        responseCount += 1;
      }
    }
  }

  stats.averageResponseMinutes =
    responseCount > 0 ? Math.round(responseTotal / responseCount) : 0;

  return { data: stats, error: null };
}

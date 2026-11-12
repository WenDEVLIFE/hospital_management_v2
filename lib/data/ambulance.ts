import type {
  AmbulanceMaintenance,
  AmbulanceStats,
  AmbulanceTripDetail,
  AmbulanceTripListRow,
  AmbulanceVehicleDetail,
  AmbulanceVehicleListRow,
  FuelRecord,
} from "@/types/hospital";
import {
  ambulanceMaintenance,
  ambulanceStats,
  ambulanceTripDetailById,
  ambulanceTripListRows,
  ambulanceVehicleDetailById,
  ambulanceVehicleListRows,
  fuelRecords,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import {
  emptyPage,
  matchesQuery,
  pageSlice,
  sortByDateDesc,
} from "./query";
import type { DataResult, PagedResult } from "./result";

const VEHICLE_NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested ambulance could not be found.",
} as const;

const TRIP_NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested ambulance trip could not be found.",
} as const;

function emptyStats(): AmbulanceStats {
  return {
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
  // TODO(supabase): replace with supabase.from("ambulance_vehicles").select("*")
  if (!isPreviewMode) {
    return emptyPage<AmbulanceVehicleListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = ambulanceVehicleListRows.filter((vehicle) => {
    if (params.status && vehicle.status !== params.status) {
      return false;
    }

    if (params.type && vehicle.type !== params.type) {
      return false;
    }

    return matchesQuery(params.q, [
      vehicle.vehicle_number,
      vehicle.plate_number,
      vehicle.type,
      vehicle.driver_name,
      vehicle.crew_names.join(" "),
      vehicle.location,
      vehicle.active_trip_number,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getAmbulanceVehicleDetails(): Promise<
  DataResult<Record<string, AmbulanceVehicleDetail>>
> {
  // TODO(supabase): replace with a joined ambulance vehicle detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(ambulanceVehicleDetailById),
    error: null,
  };
}

export async function getAmbulanceVehicleDetail(
  id: string
): Promise<DataResult<AmbulanceVehicleDetail>> {
  // TODO(supabase): replace with supabase.from("ambulance_vehicles").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: VEHICLE_NOT_FOUND };
  }

  await Promise.resolve();

  const detail = ambulanceVehicleDetailById.get(id);

  if (!detail) {
    return { data: null, error: VEHICLE_NOT_FOUND };
  }

  return { data: detail, error: null };
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
  // TODO(supabase): replace with supabase.from("ambulance_trips").select("*")
  if (!isPreviewMode) {
    return emptyPage<AmbulanceTripListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = sortByDateDesc(
    ambulanceTripListRows.filter((trip) => {
      if (params.status && trip.status !== params.status) {
        return false;
      }

      if (params.priority && trip.priority !== params.priority) {
        return false;
      }

      return matchesQuery(params.q, [
        trip.trip_number,
        trip.patient_name,
        trip.patient_mrn,
        trip.pickup_location,
        trip.destination,
        trip.vehicle_number,
        trip.requested_by_name,
      ]);
    }),
    (trip) => trip.requested_at
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getAmbulanceTripDetails(): Promise<
  DataResult<Record<string, AmbulanceTripDetail>>
> {
  // TODO(supabase): replace with a joined ambulance trip detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(ambulanceTripDetailById),
    error: null,
  };
}

export async function getAmbulanceTripDetail(
  id: string
): Promise<DataResult<AmbulanceTripDetail>> {
  // TODO(supabase): replace with supabase.from("ambulance_trips").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: TRIP_NOT_FOUND };
  }

  await Promise.resolve();

  const detail = ambulanceTripDetailById.get(id);

  if (!detail) {
    return { data: null, error: TRIP_NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function listAmbulanceMaintenance(): Promise<
  DataResult<AmbulanceMaintenance[]>
> {
  // TODO(supabase): replace with supabase.from("ambulance_maintenance").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: ambulanceMaintenance, error: null };
}

export async function listFuelRecords(): Promise<
  DataResult<FuelRecord[]>
> {
  // TODO(supabase): replace with supabase.from("ambulance_fuel_records").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: fuelRecords, error: null };
}

export async function getAmbulanceStats(): Promise<
  DataResult<AmbulanceStats>
> {
  // TODO(supabase): replace with aggregate queries over vehicles and trips
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  return { data: ambulanceStats, error: null };
}

import { connection } from "next/server";
import {
  BusIcon,
  CheckCircleIcon,
  ClockCircleIcon,
  MapPointHospitalIcon,
  SettingsIcon,
  SirenRoundedIcon,
} from "@solar-icons/react/linear";

import { AmbulanceView } from "@/components/ambulance/ambulance-view";
import { AmbulanceWorkflowStrip } from "@/components/ambulance/ambulance-workflow-strip";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { UnavailableAction } from "@/components/module/unavailable-action";
import {
  getAmbulanceStats,
  getAmbulanceTripDetails,
  getAmbulanceVehicleDetails,
  listAmbulanceMaintenance,
  listAmbulanceTrips,
  listAmbulanceVehicles,
  listFuelRecords,
} from "@/lib/data/ambulance";

export const metadata = {
  title: "Ambulance",
};

export default async function AmbulancePage() {
  await connection();

  const [
    statsResult,
    vehiclesResult,
    vehicleDetailsResult,
    tripsResult,
    tripDetailsResult,
    maintenanceResult,
    fuelResult,
  ] = await Promise.all([
    getAmbulanceStats(),
    listAmbulanceVehicles({ pageSize: 200 }),
    getAmbulanceVehicleDetails(),
    listAmbulanceTrips({ pageSize: 200 }),
    getAmbulanceTripDetails(),
    listAmbulanceMaintenance(),
    listFuelRecords(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ambulance"
        description="Fleet availability, emergency dispatch, patient transport, and vehicle records."
        actions={
          <>
            <UnavailableAction
              label="Register Ambulance"
              description="Register a vehicle, plate number, equipment level, and crew assignment."
              variant="secondary"
              icon={<BusIcon className="size-4" aria-hidden="true" />}
            />
            <UnavailableAction
              label="Dispatch Ambulance"
              description="Assign an available ambulance and medical crew to a transport request."
              icon={<SirenRoundedIcon className="size-4" aria-hidden="true" />}
            />
          </>
        }
      />

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Fleet size"
              value={statsResult.data.fleetSize}
              hint="Registered ambulances"
              icon={<BusIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Available"
              value={statsResult.data.available}
              hint="Ready for dispatch"
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Active dispatches"
              value={statsResult.data.activeDispatches}
              hint={`${statsResult.data.requested} requested · ${statsResult.data.enRoute} en route`}
              tone="info"
              icon={<SirenRoundedIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Maintenance / out"
              value={statsResult.data.maintenance}
              hint="Not available for dispatch"
              tone="warning"
              icon={<SettingsIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Trips today"
              value={statsResult.data.tripsToday}
              hint={`${statsResult.data.completedTrips} completed in register`}
              icon={<MapPointHospitalIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Avg. response"
              value={`${statsResult.data.averageResponseMinutes} min`}
              hint="Dispatch to pickup arrival"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
          </div>

          <AmbulanceWorkflowStrip stats={statsResult.data} />
        </>
      )}

      {vehiclesResult.error ? (
        <ErrorState error={vehiclesResult.error} />
      ) : (
        <AmbulanceView
          vehicles={vehiclesResult.data.rows}
          vehicleDetails={
            vehicleDetailsResult.error ? {} : vehicleDetailsResult.data
          }
          trips={tripsResult.error ? [] : tripsResult.data.rows}
          tripDetails={
            tripDetailsResult.error ? {} : tripDetailsResult.data
          }
          maintenance={maintenanceResult.error ? [] : maintenanceResult.data}
          fuel={fuelResult.error ? [] : fuelResult.data}
        />
      )}
    </div>
  );
}

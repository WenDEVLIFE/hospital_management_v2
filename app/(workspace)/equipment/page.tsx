import { connection } from "next/server";
import {
  CheckCircleIcon,
  DangerCircleIcon,
  MedicalKitIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "@solar-icons/react/linear";

import { EquipmentView } from "@/components/equipment/equipment-view";
import { EquipmentWorkflowStrip } from "@/components/equipment/equipment-workflow-strip";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { UnavailableAction } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import {
  getEquipmentDetails,
  getEquipmentStats,
  listCalibrations,
  listEquipment,
  listMaintenanceHistory,
  listMaintenanceSchedules,
  listWorkOrders,
} from "@/lib/data/equipment";

export const metadata = {
  title: "Equipment & Maintenance",
};

export default async function EquipmentPage() {
  await connection();

  const [
    statsResult,
    equipmentResult,
    detailsResult,
    workOrdersResult,
    schedulesResult,
    calibrationsResult,
    historyResult,
  ] = await Promise.all([
    getEquipmentStats(),
    listEquipment({ pageSize: 200 }),
    getEquipmentDetails(),
    listWorkOrders({ pageSize: 200 }),
    listMaintenanceSchedules(),
    listCalibrations(),
    listMaintenanceHistory(),
  ]);

  const history = historyResult.error ? [] : historyResult.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment & Maintenance"
        description="Medical equipment register, preventive maintenance, work orders, and calibration."
        actions={
          <>
            <UnavailableAction
              label="Create Work Order"
              description="Create a repair or maintenance work order for medical equipment."
              variant="secondary"
              icon={<SettingsIcon className="size-4" aria-hidden="true" />}
            />
            <UnavailableAction
              label="Register Equipment"
              description="Register a medical asset, category, serial number, department, and maintenance schedule."
              icon={<MedicalKitIcon className="size-4" aria-hidden="true" />}
            />
          </>
        }
      />

      <Alert variant="info" title="Biomedical verification required">
        Maintenance and calibration records must be verified by biomedical
        engineering or authorized personnel. This interface records and displays
        operational data; it does not determine equipment safety or release
        status.
      </Alert>

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Total equipment"
              value={statsResult.data.totalEquipment}
              hint="Registered medical assets"
              icon={<MedicalKitIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Available"
              value={statsResult.data.available}
              hint="Ready for clinical use"
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Under maintenance"
              value={statsResult.data.underMaintenance}
              hint="Maintenance or out of service"
              tone="warning"
              icon={<SettingsIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Open work orders"
              value={statsResult.data.openWorkOrders}
              hint="Repair or service requests"
              tone="info"
              icon={<SettingsIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Calibrations due"
              value={statsResult.data.calibrationsDue}
              hint="Within 30 days or overdue"
              tone="warning"
              icon={<ShieldCheckIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Overdue maintenance"
              value={statsResult.data.overdueMaintenance}
              hint="Past the scheduled date"
              tone="danger"
              icon={<DangerCircleIcon className="size-4" aria-hidden="true" />}
            />
          </div>

          <EquipmentWorkflowStrip
            stats={statsResult.data}
            historyCount={history.length}
          />
        </>
      )}

      {equipmentResult.error ? (
        <ErrorState error={equipmentResult.error} />
      ) : (
        <EquipmentView
          equipment={equipmentResult.data.rows}
          equipmentDetails={detailsResult.error ? {} : detailsResult.data}
          workOrders={workOrdersResult.error ? [] : workOrdersResult.data.rows}
          schedules={schedulesResult.error ? [] : schedulesResult.data}
          calibrations={calibrationsResult.error ? [] : calibrationsResult.data}
          history={history}
        />
      )}
    </div>
  );
}

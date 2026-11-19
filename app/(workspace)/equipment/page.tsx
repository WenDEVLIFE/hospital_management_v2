import { connection } from "next/server";
import {
  CheckCircleIcon,
  DangerCircleIcon,
  MedicalKitIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "@solar-icons/react/linear";

import { EquipmentView } from "@/components/equipment/equipment-view";
import {
  CreateWorkOrderAction,
  RegisterEquipmentAction,
} from "@/components/equipment/equipment-actions";
import { EquipmentWorkflowStrip } from "@/components/equipment/equipment-workflow-strip";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { Alert } from "@/components/ui/alert";
import { listDepartments } from "@/lib/data/departments";
import {
  getEquipmentDetails,
  getEquipmentStats,
  listCalibrations,
  listEquipment,
  listEquipmentCategories,
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
    categoriesResult,
    departmentsResult,
  ] = await Promise.all([
    getEquipmentStats(),
    listEquipment({ pageSize: 200 }),
    getEquipmentDetails(),
    listWorkOrders({ pageSize: 200 }),
    listMaintenanceSchedules(),
    listCalibrations(),
    listMaintenanceHistory(),
    listEquipmentCategories(),
    listDepartments({ pageSize: 200, isActive: true }),
  ]);

  const history = historyResult.error ? [] : historyResult.data;
  const categories = (categoriesResult.data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
  }));
  const departments = (departmentsResult.data?.rows ?? []).map((department) => ({
    id: department.id,
    name: department.name,
  }));
  const equipmentRows = equipmentResult.data?.rows ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment & Maintenance"
        description="Medical equipment register, preventive maintenance, work orders, and calibration."
        actions={
          <>
            <CreateWorkOrderAction
              equipment={equipmentRows.map((row) => ({
                id: row.id,
                asset_number: row.asset_number,
                name: row.name,
              }))}
            />
            <RegisterEquipmentAction
              categories={categories}
              departments={departments}
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
          equipment={equipmentRows}
          equipmentDetails={detailsResult.error ? {} : detailsResult.data}
          workOrders={workOrdersResult.error ? [] : workOrdersResult.data.rows}
          schedules={schedulesResult.error ? [] : schedulesResult.data}
          calibrations={calibrationsResult.error ? [] : calibrationsResult.data}
          history={history}
          categories={categories}
        />
      )}
    </div>
  );
}

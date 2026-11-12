import type {
  CalibrationListRow,
  EquipmentDetail,
  EquipmentListRow,
  EquipmentStats,
  MaintenanceHistoryListRow,
  MaintenanceScheduleListRow,
  WorkOrderListRow,
} from "@/types/hospital";
import {
  calibrationListRows,
  equipmentDetailById,
  equipmentListRows,
  equipmentStats,
  maintenanceHistoryListRows,
  maintenanceScheduleListRows,
  workOrderListRows,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested equipment record could not be found.",
} as const;

function emptyStats(): EquipmentStats {
  return {
    totalEquipment: 0,
    available: 0,
    underMaintenance: 0,
    openWorkOrders: 0,
    calibrationsDue: 0,
    overdueMaintenance: 0,
  };
}

export async function listEquipment(
  params: {
    q?: string;
    status?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<EquipmentListRow>> {
  // TODO(supabase): replace with supabase.from("medical_equipment").select("*")
  if (!isPreviewMode) {
    return emptyPage<EquipmentListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = equipmentListRows.filter((equipment) => {
    if (params.status && equipment.status !== params.status) {
      return false;
    }

    if (params.category && equipment.category_name !== params.category) {
      return false;
    }

    return matchesQuery(params.q, [
      equipment.asset_number,
      equipment.name,
      equipment.category_name,
      equipment.manufacturer,
      equipment.model,
      equipment.serial_number,
      equipment.department_name,
      equipment.location,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getEquipmentDetails(): Promise<
  DataResult<Record<string, EquipmentDetail>>
> {
  // TODO(supabase): replace with a joined equipment detail query
  if (!isPreviewMode) {
    return { data: {}, error: null };
  }

  await Promise.resolve();

  return {
    data: Object.fromEntries(equipmentDetailById),
    error: null,
  };
}

export async function getEquipmentDetail(
  id: string
): Promise<DataResult<EquipmentDetail>> {
  // TODO(supabase): replace with supabase.from("medical_equipment").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: NOT_FOUND };
  }

  await Promise.resolve();

  const detail = equipmentDetailById.get(id);

  if (!detail) {
    return { data: null, error: NOT_FOUND };
  }

  return { data: detail, error: null };
}

export async function listWorkOrders(
  params: {
    q?: string;
    status?: string;
    priority?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<WorkOrderListRow>> {
  // TODO(supabase): replace with supabase.from("equipment_work_orders").select("*")
  if (!isPreviewMode) {
    return emptyPage<WorkOrderListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = workOrderListRows
    .filter((order) => {
      if (params.status && order.status !== params.status) {
        return false;
      }

      if (params.priority && order.priority !== params.priority) {
        return false;
      }

      return matchesQuery(params.q, [
        order.work_order_number,
        order.equipment_name,
        order.asset_number,
        order.department_name,
        order.issue_description,
        order.assigned_technician_name,
      ]);
    })
    .sort((a, b) =>
      a.requested_at === b.requested_at
        ? 0
        : a.requested_at < b.requested_at
          ? 1
          : -1
    );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listMaintenanceSchedules(): Promise<
  DataResult<MaintenanceScheduleListRow[]>
> {
  // TODO(supabase): replace with supabase.from("equipment_maintenance_schedules").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  const rows = [...maintenanceScheduleListRows].sort((a, b) =>
    a.scheduled_date === b.scheduled_date
      ? 0
      : a.scheduled_date < b.scheduled_date
        ? -1
        : 1
  );

  return { data: rows, error: null };
}

export async function listCalibrations(): Promise<
  DataResult<CalibrationListRow[]>
> {
  // TODO(supabase): replace with supabase.from("equipment_calibrations").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  const rows = [...calibrationListRows].sort((a, b) =>
    a.performed_at === b.performed_at
      ? 0
      : a.performed_at < b.performed_at
        ? 1
        : -1
  );

  return { data: rows, error: null };
}

export async function listMaintenanceHistory(): Promise<
  DataResult<MaintenanceHistoryListRow[]>
> {
  // TODO(supabase): replace with supabase.from("equipment_maintenance_history").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  const rows = [...maintenanceHistoryListRows].sort((a, b) =>
    a.performed_at === b.performed_at
      ? 0
      : a.performed_at < b.performed_at
        ? 1
        : -1
  );

  return { data: rows, error: null };
}

export async function getEquipmentStats(): Promise<
  DataResult<EquipmentStats>
> {
  // TODO(supabase): replace with aggregate queries over equipment and work orders
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  return { data: equipmentStats, error: null };
}

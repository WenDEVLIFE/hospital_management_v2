import type {
  CalibrationListRow,
  CalibrationRecord,
  EquipmentCategory,
  EquipmentDetail,
  EquipmentListRow,
  EquipmentMaintenanceHistory,
  EquipmentMaintenanceSchedule,
  EquipmentStats,
  EquipmentWorkOrder,
  MaintenanceHistoryListRow,
  MaintenanceScheduleListRow,
  MedicalEquipment,
  WorkOrderListRow,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { manilaDate, pageSlice, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const EQUIPMENT_COLUMNS =
  "*, equipment_categories(name), departments(name)";

const WORK_ORDER_COLUMNS =
  "*, medical_equipment(asset_number, name, departments(name)), profiles!equipment_work_orders_requested_by_fkey(full_name), equipment_technician:profiles!equipment_work_orders_assigned_technician_id_fkey(full_name)";

const SCHEDULE_COLUMNS =
  "*, medical_equipment(asset_number, name, departments(name))";

const CALIBRATION_COLUMNS =
  "*, medical_equipment(asset_number, name), profiles!equipment_calibrations_performed_by_fkey(full_name)";

const HISTORY_COLUMNS =
  "*, medical_equipment(asset_number, name), profiles!equipment_maintenance_history_performed_by_fkey(full_name)";

type Relation<T> = T | T[] | null;

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

type EquipmentJoinRow = {
  id: string;
  asset_number: string;
  name: string;
  category_id: string | null;
  manufacturer: string;
  model: string;
  serial_number: string;
  department_id: string | null;
  location: string;
  status: MedicalEquipment["status"];
  purchase_date: string | null;
  warranty_expiry: string | null;
  next_maintenance_due: string | null;
  next_calibration_due: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  equipment_categories: Relation<{ name: string }>;
  departments: Relation<{ name: string }>;
};

type WorkOrderJoinRow = EquipmentWorkOrder & {
  medical_equipment: Relation<{
    asset_number: string;
    name: string;
    departments: Relation<{ name: string }>;
  }>;
  profiles: Relation<{ full_name: string }>;
  equipment_technician: Relation<{ full_name: string }>;
};

type ScheduleJoinRow = {
  id: string;
  equipment_id: string;
  maintenance_type: EquipmentMaintenanceSchedule["maintenance_type"];
  due_date: string;
  status: EquipmentMaintenanceSchedule["status"];
  medical_equipment: Relation<{
    asset_number: string;
    name: string;
    departments: Relation<{ name: string }>;
  }>;
};

type CalibrationJoinRow = CalibrationRecord & {
  medical_equipment: Relation<{ asset_number: string; name: string }>;
  profiles: Relation<{ full_name: string }>;
};

type HistoryJoinRow = EquipmentMaintenanceHistory & {
  medical_equipment: Relation<{ asset_number: string; name: string }>;
  profiles: Relation<{ full_name: string }>;
};

function toEquipmentRow(row: EquipmentJoinRow): EquipmentListRow {
  return {
    id: row.id,
    asset_number: row.asset_number,
    name: row.name,
    category_id: row.category_id ?? "",
    manufacturer: row.manufacturer,
    model: row.model,
    serial_number: row.serial_number,
    department_name: firstRelation(row.departments)?.name ?? "Unassigned",
    location: row.location,
    status: row.status,
    purchase_date: row.purchase_date ?? "",
    warranty_expiry: row.warranty_expiry ?? "",
    next_maintenance_due: row.next_maintenance_due,
    next_calibration_due: row.next_calibration_due,
    notes: row.notes,
    is_active: row.is_active,
    category_name: firstRelation(row.equipment_categories)?.name ?? "Uncategorised",
    open_work_orders: 0,
    next_due: row.next_maintenance_due ?? row.next_calibration_due,
  };
}

function toWorkOrderRow(row: WorkOrderJoinRow): WorkOrderListRow | null {
  const equipment = firstRelation(row.medical_equipment);

  if (!equipment) {
    return null;
  }

  return {
    ...row,
    requested_by_name: firstRelation(row.profiles)?.full_name ?? "System",
    assigned_technician_name:
      firstRelation(row.equipment_technician)?.full_name ?? null,
    equipment_name: equipment.name,
    asset_number: equipment.asset_number,
    department_name:
      firstRelation(equipment.departments)?.name ?? "Unassigned",
  } as WorkOrderListRow;
}

function toScheduleRow(row: ScheduleJoinRow): MaintenanceScheduleListRow | null {
  const equipment = firstRelation(row.medical_equipment);

  if (!equipment) {
    return null;
  }

  return {
    id: row.id,
    equipment_id: row.equipment_id,
    maintenance_type: row.maintenance_type,
    scheduled_date: row.due_date,
    status: row.status,
    assigned_to_name: null,
    notes: null,
    equipment_name: equipment.name,
    asset_number: equipment.asset_number,
    department_name:
      firstRelation(equipment.departments)?.name ?? "Unassigned",
  };
}

function toCalibrationRow(row: CalibrationJoinRow): CalibrationListRow | null {
  const equipment = firstRelation(row.medical_equipment);

  if (!equipment) {
    return null;
  }

  return {
    ...row,
    performed_by_name: firstRelation(row.profiles)?.full_name ?? "System",
    equipment_name: equipment.name,
    asset_number: equipment.asset_number,
  } as CalibrationListRow;
}

function toHistoryRow(row: HistoryJoinRow): MaintenanceHistoryListRow | null {
  const equipment = firstRelation(row.medical_equipment);

  if (!equipment) {
    return null;
  }

  return {
    ...row,
    performed_by_name: firstRelation(row.profiles)?.full_name ?? "System",
    equipment_name: equipment.name,
    asset_number: equipment.asset_number,
  } as MaintenanceHistoryListRow;
}

async function loadEquipment(): Promise<DataResult<EquipmentJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("medical_equipment")
    .select(EQUIPMENT_COLUMNS)
    .order("asset_number");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as unknown as EquipmentJoinRow[], error: null };
}

async function loadWorkOrders(): Promise<DataResult<WorkOrderJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("equipment_work_orders")
    .select(WORK_ORDER_COLUMNS)
    .order("requested_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as unknown as WorkOrderJoinRow[], error: null };
}

async function loadSchedules(): Promise<DataResult<ScheduleJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("equipment_maintenance_schedules")
    .select(SCHEDULE_COLUMNS)
    .order("due_date");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as unknown as ScheduleJoinRow[], error: null };
}

async function loadCalibrations(): Promise<DataResult<CalibrationJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("equipment_calibrations")
    .select(CALIBRATION_COLUMNS)
    .order("performed_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as unknown as CalibrationJoinRow[], error: null };
}

async function loadHistory(): Promise<DataResult<HistoryJoinRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("equipment_maintenance_history")
    .select(HISTORY_COLUMNS)
    .order("performed_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as unknown as HistoryJoinRow[], error: null };
}

export async function listEquipmentCategories(): Promise<
  DataResult<EquipmentCategory[]>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("equipment_categories")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as EquipmentCategory[], error: null };
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
  const [equipmentResult, orderResult] = await Promise.all([
    loadEquipment(),
    loadWorkOrders(),
  ]);

  if (equipmentResult.error) {
    return { data: null, error: equipmentResult.error };
  }

  const openOrders = new Map<string, number>();

  for (const order of orderResult.error ? [] : orderResult.data) {
    if (order.status !== "completed" && order.status !== "cancelled") {
      openOrders.set(order.equipment_id, (openOrders.get(order.equipment_id) ?? 0) + 1);
    }
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = equipmentResult.data
    .map(toEquipmentRow)
    .map((row) => ({
      ...row,
      open_work_orders: openOrders.get(row.id) ?? 0,
    }))
    .filter((row) => {
      if (params.status && row.status !== params.status) {
        return false;
      }

      if (params.category && row.category_name !== params.category) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        row.asset_number,
        row.name,
        row.category_name,
        row.manufacturer,
        row.model,
        row.serial_number,
        row.department_name,
        row.location,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
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
  const orderResult = await loadWorkOrders();

  if (orderResult.error) {
    return { data: null, error: orderResult.error };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = orderResult.data
    .map(toWorkOrderRow)
    .filter((row): row is WorkOrderListRow => row !== null)
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
        row.work_order_number,
        row.equipment_name,
        row.asset_number,
        row.department_name,
        row.issue_description,
        row.assigned_technician_name,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function listMaintenanceSchedules(): Promise<
  DataResult<MaintenanceScheduleListRow[]>
> {
  const scheduleResult = await loadSchedules();

  if (scheduleResult.error) {
    return { data: null, error: scheduleResult.error };
  }

  return {
    data: scheduleResult.data
      .map(toScheduleRow)
      .filter((row): row is MaintenanceScheduleListRow => row !== null),
    error: null,
  };
}

export async function listCalibrations(): Promise<
  DataResult<CalibrationListRow[]>
> {
  const calibrationResult = await loadCalibrations();

  if (calibrationResult.error) {
    return { data: null, error: calibrationResult.error };
  }

  return {
    data: calibrationResult.data
      .map(toCalibrationRow)
      .filter((row): row is CalibrationListRow => row !== null),
    error: null,
  };
}

export async function listMaintenanceHistory(): Promise<
  DataResult<MaintenanceHistoryListRow[]>
> {
  const historyResult = await loadHistory();

  if (historyResult.error) {
    return { data: null, error: historyResult.error };
  }

  return {
    data: historyResult.data
      .map(toHistoryRow)
      .filter((row): row is MaintenanceHistoryListRow => row !== null),
    error: null,
  };
}

export async function getEquipmentDetails(): Promise<
  DataResult<Record<string, EquipmentDetail>>
> {
  const [equipmentResult, orderResult, scheduleResult, calibrationResult, historyResult] =
    await Promise.all([
      loadEquipment(),
      loadWorkOrders(),
      loadSchedules(),
      loadCalibrations(),
      loadHistory(),
    ]);

  if (equipmentResult.error) {
    return { data: null, error: equipmentResult.error };
  }

  const workOrders = (orderResult.error ? [] : orderResult.data)
    .map(toWorkOrderRow)
    .filter((row): row is WorkOrderListRow => row !== null);
  const schedules = (scheduleResult.error ? [] : scheduleResult.data)
    .map(toScheduleRow)
    .filter((row): row is MaintenanceScheduleListRow => row !== null);
  const calibrations = (calibrationResult.error ? [] : calibrationResult.data)
    .map(toCalibrationRow)
    .filter((row): row is CalibrationListRow => row !== null);
  const history = (historyResult.error ? [] : historyResult.data)
    .map(toHistoryRow)
    .filter((row): row is MaintenanceHistoryListRow => row !== null);

  const details: Record<string, EquipmentDetail> = {};

  for (const row of equipmentResult.data) {
    const equipment = toEquipmentRow(row);

    details[row.id] = {
      equipment: {
        id: equipment.id,
        asset_number: equipment.asset_number,
        name: equipment.name,
        category_id: equipment.category_id,
        manufacturer: equipment.manufacturer,
        model: equipment.model,
        serial_number: equipment.serial_number,
        department_name: equipment.department_name,
        location: equipment.location,
        status: equipment.status,
        purchase_date: equipment.purchase_date,
        warranty_expiry: equipment.warranty_expiry,
        next_maintenance_due: equipment.next_maintenance_due,
        next_calibration_due: equipment.next_calibration_due,
        notes: equipment.notes,
        is_active: equipment.is_active,
      },
      category: {
        id: equipment.category_id,
        name: equipment.category_name,
        description: "",
        is_active: true,
      },
      workOrders: workOrders.filter((order) => order.equipment_id === equipment.id),
      schedules: schedules.filter((schedule) => schedule.equipment_id === equipment.id),
      calibrations: calibrations.filter(
        (record) => record.equipment_id === equipment.id
      ),
      history: history.filter((record) => record.equipment_id === equipment.id),
    };
  }

  return { data: details, error: null };
}

export async function getEquipmentStats(): Promise<
  DataResult<EquipmentStats>
> {
  const [equipmentResult, orderResult] = await Promise.all([
    loadEquipment(),
    loadWorkOrders(),
  ]);

  if (equipmentResult.error) {
    return { data: null, error: equipmentResult.error };
  }

  const today = manilaDate(new Date().toISOString());
  const soon = manilaDate(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  );

  const stats: EquipmentStats = {
    totalEquipment: 0,
    available: 0,
    underMaintenance: 0,
    openWorkOrders: 0,
    calibrationsDue: 0,
    overdueMaintenance: 0,
  };

  for (const row of equipmentResult.data) {
    if (!row.is_active) {
      continue;
    }

    stats.totalEquipment += 1;

    if (row.status === "available") {
      stats.available += 1;
    }

    if (row.status === "maintenance" || row.status === "out_of_service") {
      stats.underMaintenance += 1;
    }

    if (row.next_calibration_due && row.next_calibration_due <= soon) {
      stats.calibrationsDue += 1;
    }

    if (row.next_maintenance_due && row.next_maintenance_due < today) {
      stats.overdueMaintenance += 1;
    }
  }

  for (const order of orderResult.error ? [] : orderResult.data) {
    if (order.status !== "completed" && order.status !== "cancelled") {
      stats.openWorkOrders += 1;
    }
  }

  return { data: stats, error: null };
}

import type {
  CalibrationListRow,
  CalibrationRecord,
  CalibrationResult,
  EquipmentCategory,
  EquipmentDetail,
  EquipmentListRow,
  EquipmentMaintenanceHistory,
  EquipmentMaintenanceSchedule,
  EquipmentStats,
  EquipmentStatus,
  EquipmentWorkOrder,
  MaintenanceHistoryListRow,
  MaintenanceScheduleListRow,
  MaintenanceScheduleStatus,
  MaintenanceType,
  MedicalEquipment,
  WorkOrderListRow,
  WorkOrderPriority,
  WorkOrderStatus,
} from "@/types/hospital";
import { PREVIEW_NOW, isoAt, isoDate, previewUuid } from "./base";

export const equipmentCategories: EquipmentCategory[] = [
  {
    id: previewUuid(140, 1),
    name: "Imaging",
    description: "Radiology and diagnostic imaging equipment.",
    is_active: true,
  },
  {
    id: previewUuid(140, 2),
    name: "Patient Monitoring",
    description: "Bedside and central monitoring devices.",
    is_active: true,
  },
  {
    id: previewUuid(140, 3),
    name: "Life Support",
    description: "Ventilators, defibrillators, infusion devices.",
    is_active: true,
  },
  {
    id: previewUuid(140, 4),
    name: "Laboratory",
    description: "Analyzers and laboratory instrumentation.",
    is_active: true,
  },
  {
    id: previewUuid(140, 5),
    name: "Surgical",
    description: "Operating room and procedural equipment.",
    is_active: true,
  },
  {
    id: previewUuid(140, 6),
    name: "Diagnostic",
    description: "ECG, ultrasound, and general diagnostic devices.",
    is_active: true,
  },
];

export const equipmentCategoryById = new Map(
  equipmentCategories.map((category) => [category.id, category])
);

type EquipmentSeed = {
  name: string;
  categoryIndex: number;
  manufacturer: string;
  model: string;
  serial: string;
  department: string;
  location: string;
  status: EquipmentStatus;
  purchaseOffset: number;
  warrantyOffset: number;
  maintenanceOffset: number | null;
  calibrationOffset: number | null;
  notes: string | null;
};

const EQUIPMENT_SEEDS: EquipmentSeed[] = [
  {
    name: "Ventilator",
    categoryIndex: 2,
    manufacturer: "Test Medical",
    model: "V-200",
    serial: "VEN-2026-0001",
    department: "Ward 5",
    location: "ICU Bay 1",
    status: "available",
    purchaseOffset: -800,
    warrantyOffset: 200,
    maintenanceOffset: 20,
    calibrationOffset: 60,
    notes: null,
  },
  {
    name: "Patient Monitor",
    categoryIndex: 1,
    manufacturer: "Test Medical",
    model: "PM-12",
    serial: "MON-2026-0002",
    department: "Ward 3",
    location: "Room 302",
    status: "in_use",
    purchaseOffset: -650,
    warrantyOffset: 120,
    maintenanceOffset: 45,
    calibrationOffset: 10,
    notes: null,
  },
  {
    name: "Infusion Pump",
    categoryIndex: 2,
    manufacturer: "Test Medical",
    model: "IP-50",
    serial: "INF-2026-0003",
    department: "Ward 4",
    location: "Room 401",
    status: "maintenance",
    purchaseOffset: -500,
    warrantyOffset: 60,
    maintenanceOffset: -5,
    calibrationOffset: 30,
    notes: "Preventive maintenance in progress.",
  },
  {
    name: "Ultrasound Machine",
    categoryIndex: 0,
    manufacturer: "Test Imaging",
    model: "US-4",
    serial: "ULT-2026-0004",
    department: "Radiology",
    location: "Ultrasound Room 1",
    status: "available",
    purchaseOffset: -900,
    warrantyOffset: 300,
    maintenanceOffset: 60,
    calibrationOffset: 15,
    notes: null,
  },
  {
    name: "Defibrillator",
    categoryIndex: 2,
    manufacturer: "Test Medical",
    model: "DEF-3",
    serial: "DEF-2026-0005",
    department: "Emergency Department",
    location: "ER Bay 2",
    status: "available",
    purchaseOffset: -700,
    warrantyOffset: 100,
    maintenanceOffset: 5,
    calibrationOffset: -2,
    notes: "Battery replacement requested.",
  },
  {
    name: "Laboratory Analyzer",
    categoryIndex: 3,
    manufacturer: "Test Diagnostics",
    model: "LA-9",
    serial: "LAB-2026-0006",
    department: "Laboratory",
    location: "Chemistry Section",
    status: "available",
    purchaseOffset: -600,
    warrantyOffset: 150,
    maintenanceOffset: 30,
    calibrationOffset: 90,
    notes: null,
  },
  {
    name: "Anesthesia Machine",
    categoryIndex: 4,
    manufacturer: "Test Surgical",
    model: "AN-7",
    serial: "ANS-2026-0007",
    department: "Operating Room",
    location: "OR 1",
    status: "in_use",
    purchaseOffset: -750,
    warrantyOffset: 180,
    maintenanceOffset: 10,
    calibrationOffset: 20,
    notes: null,
  },
  {
    name: "X-ray Machine",
    categoryIndex: 0,
    manufacturer: "Test Imaging",
    model: "XR-10",
    serial: "XRY-2026-0008",
    department: "Radiology",
    location: "X-ray Room 2",
    status: "out_of_service",
    purchaseOffset: -1200,
    warrantyOffset: -100,
    maintenanceOffset: -1,
    calibrationOffset: -10,
    notes: "Awaiting replacement tube.",
  },
  {
    name: "ECG Machine",
    categoryIndex: 5,
    manufacturer: "Test Medical",
    model: "ECG-6",
    serial: "ECG-2026-0009",
    department: "Emergency Department",
    location: "ER Bay 1",
    status: "available",
    purchaseOffset: -400,
    warrantyOffset: 200,
    maintenanceOffset: 90,
    calibrationOffset: 45,
    notes: null,
  },
  {
    name: "Surgical Light",
    categoryIndex: 4,
    manufacturer: "Test Surgical",
    model: "SL-2",
    serial: "LGT-2026-0010",
    department: "Operating Room",
    location: "OR 2",
    status: "available",
    purchaseOffset: -1000,
    warrantyOffset: 240,
    maintenanceOffset: 120,
    calibrationOffset: null,
    notes: null,
  },
  {
    name: "Dialysis Machine",
    categoryIndex: 2,
    manufacturer: "Test Renal",
    model: "DM-5",
    serial: "DIA-2026-0011",
    department: "Ward 5",
    location: "Dialysis Unit",
    status: "available",
    purchaseOffset: -550,
    warrantyOffset: 90,
    maintenanceOffset: 15,
    calibrationOffset: 25,
    notes: null,
  },
];

export const medicalEquipment: MedicalEquipment[] = EQUIPMENT_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(141, index + 1),
    asset_number: `EQ-2026-${String(index + 1).padStart(4, "0")}`,
    name: seed.name,
    category_id: equipmentCategories[seed.categoryIndex].id,
    manufacturer: seed.manufacturer,
    model: seed.model,
    serial_number: seed.serial,
    department_name: seed.department,
    location: seed.location,
    status: seed.status,
    purchase_date: isoDate(seed.purchaseOffset),
    warranty_expiry: isoDate(seed.warrantyOffset),
    next_maintenance_due:
      seed.maintenanceOffset === null ? null : isoDate(seed.maintenanceOffset),
    next_calibration_due:
      seed.calibrationOffset === null ? null : isoDate(seed.calibrationOffset),
    notes: seed.notes,
    is_active: true,
  })
);

export const medicalEquipmentById = new Map(
  medicalEquipment.map((equipment) => [equipment.id, equipment])
);

type WorkOrderSeed = {
  equipmentIndex: number;
  issue: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  requestedBy: string;
  technician: string | null;
  requestedOffset: number;
  scheduledOffset: number | null;
  completedOffset: number | null;
  resolution: string | null;
  parts: string | null;
  cost: number;
  notes: string | null;
};

const WORK_ORDER_SEEDS: WorkOrderSeed[] = [
  {
    equipmentIndex: 2,
    issue: "Intermittent occlusion alarm",
    priority: "urgent",
    status: "in_progress",
    requestedBy: "Test Nurse A",
    technician: "Test Biomedical Tech A",
    requestedOffset: -1,
    scheduledOffset: 0,
    completedOffset: null,
    resolution: null,
    parts: null,
    cost: 0,
    notes: "Pump module under inspection.",
  },
  {
    equipmentIndex: 7,
    issue: "Tube replacement required",
    priority: "emergency",
    status: "on_hold",
    requestedBy: "Test Radiologic Technologist A",
    technician: "Test Biomedical Tech B",
    requestedOffset: -3,
    scheduledOffset: -1,
    completedOffset: null,
    resolution: null,
    parts: "Replacement X-ray tube",
    cost: 0,
    notes: "Parts on order; equipment out of service.",
  },
  {
    equipmentIndex: 4,
    issue: "Battery replacement and calibration",
    priority: "urgent",
    status: "scheduled",
    requestedBy: "Test Nurse B",
    technician: "Test Biomedical Tech A",
    requestedOffset: 0,
    scheduledOffset: 0,
    completedOffset: null,
    resolution: null,
    parts: "Replacement battery pack",
    cost: 0,
    notes: "Scheduled for the morning biomedical round.",
  },
  {
    equipmentIndex: 5,
    issue: "Monthly preventive maintenance",
    priority: "routine",
    status: "completed",
    requestedBy: "Test Laboratory Staff A",
    technician: "Test Biomedical Tech B",
    requestedOffset: -5,
    scheduledOffset: -4,
    completedOffset: -4,
    resolution: "Filters replaced; self-test passed.",
    parts: "Filter kit",
    cost: 3000,
    notes: null,
  },
  {
    equipmentIndex: 1,
    issue: "Display flicker",
    priority: "routine",
    status: "requested",
    requestedBy: "Test Nurse A",
    technician: null,
    requestedOffset: 0,
    scheduledOffset: null,
    completedOffset: null,
    resolution: null,
    parts: null,
    cost: 0,
    notes: "Awaiting biomedical technician assignment.",
  },
  {
    equipmentIndex: 6,
    issue: "Annual preventive maintenance",
    priority: "routine",
    status: "completed",
    requestedBy: "Test Physician C",
    technician: "Test Biomedical Tech A",
    requestedOffset: -2,
    scheduledOffset: -2,
    completedOffset: -1,
    resolution: "Annual service completed; calibration verified.",
    parts: "Breathing circuit",
    cost: 6000,
    notes: null,
  },
  {
    equipmentIndex: 0,
    issue: "Flow sensor calibration",
    priority: "routine",
    status: "cancelled",
    requestedBy: "Test Nurse B",
    technician: "Test Biomedical Tech B",
    requestedOffset: -2,
    scheduledOffset: -1,
    completedOffset: null,
    resolution: null,
    parts: null,
    cost: 0,
    notes: "Duplicate request; closed.",
  },
];

export const equipmentWorkOrders: EquipmentWorkOrder[] = WORK_ORDER_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(142, index + 1),
    work_order_number: `WO-2026-${String(index + 1).padStart(4, "0")}`,
    equipment_id: medicalEquipment[seed.equipmentIndex].id,
    issue_description: seed.issue,
    priority: seed.priority,
    status: seed.status,
    requested_by_name: seed.requestedBy,
    assigned_technician_name: seed.technician,
    requested_at: isoAt(seed.requestedOffset, 9),
    scheduled_for:
      seed.scheduledOffset === null ? null : isoAt(seed.scheduledOffset, 10),
    completed_at:
      seed.completedOffset === null ? null : isoAt(seed.completedOffset, 15),
    resolution_notes: seed.resolution,
    parts_used: seed.parts,
    cost: seed.cost,
    notes: seed.notes,
  })
);

type ScheduleSeed = {
  equipmentIndex: number;
  type: MaintenanceType;
  scheduledOffset: number;
  status: MaintenanceScheduleStatus;
  assignedTo: string;
  notes: string | null;
};

const SCHEDULE_SEEDS: ScheduleSeed[] = [
  { equipmentIndex: 0, type: "preventive", scheduledOffset: 20, status: "scheduled", assignedTo: "Test Biomedical Tech A", notes: "Routine ventilator service." },
  { equipmentIndex: 0, type: "calibration", scheduledOffset: 60, status: "scheduled", assignedTo: "Test Biomedical Tech B", notes: "Flow and pressure calibration." },
  { equipmentIndex: 1, type: "calibration", scheduledOffset: 10, status: "scheduled", assignedTo: "Test Biomedical Tech A", notes: "Performance verification." },
  { equipmentIndex: 1, type: "preventive", scheduledOffset: 45, status: "scheduled", assignedTo: "Test Biomedical Tech B", notes: null },
  { equipmentIndex: 2, type: "preventive", scheduledOffset: -5, status: "overdue", assignedTo: "Test Biomedical Tech A", notes: "Preventive maintenance overdue." },
  { equipmentIndex: 2, type: "calibration", scheduledOffset: 30, status: "scheduled", assignedTo: "Test Biomedical Tech B", notes: null },
  { equipmentIndex: 3, type: "calibration", scheduledOffset: 15, status: "scheduled", assignedTo: "Test Biomedical Tech A", notes: null },
  { equipmentIndex: 4, type: "calibration", scheduledOffset: -2, status: "overdue", assignedTo: "Test Biomedical Tech A", notes: "Calibration overdue." },
  { equipmentIndex: 5, type: "preventive", scheduledOffset: 30, status: "scheduled", assignedTo: "Test Biomedical Tech B", notes: null },
  { equipmentIndex: 6, type: "preventive", scheduledOffset: 10, status: "scheduled", assignedTo: "Test Biomedical Tech A", notes: null },
  { equipmentIndex: 7, type: "calibration", scheduledOffset: -10, status: "overdue", assignedTo: "Test Biomedical Tech B", notes: "Equipment out of service." },
  { equipmentIndex: 10, type: "preventive", scheduledOffset: 15, status: "scheduled", assignedTo: "Test Biomedical Tech A", notes: null },
];

export const equipmentMaintenanceSchedules: EquipmentMaintenanceSchedule[] =
  SCHEDULE_SEEDS.map((seed, index) => ({
    id: previewUuid(143, index + 1),
    equipment_id: medicalEquipment[seed.equipmentIndex].id,
    maintenance_type: seed.type,
    scheduled_date: isoDate(seed.scheduledOffset),
    status: seed.status,
    assigned_to_name: seed.assignedTo,
    notes: seed.notes,
  }));

type CalibrationSeed = {
  equipmentIndex: number;
  type: string;
  offset: number;
  result: CalibrationResult;
  nextDueOffset: number | null;
  certificate: string;
  notes: string | null;
};

const CALIBRATION_SEEDS: CalibrationSeed[] = [
  { equipmentIndex: 0, type: "Flow and pressure calibration", offset: -60, result: "passed", nextDueOffset: 60, certificate: "CAL-2026-0001", notes: null },
  { equipmentIndex: 1, type: "Performance verification", offset: -80, result: "passed", nextDueOffset: 10, certificate: "CAL-2026-0002", notes: null },
  { equipmentIndex: 2, type: "Infusion rate calibration", offset: -30, result: "passed", nextDueOffset: 30, certificate: "CAL-2026-0003", notes: null },
  { equipmentIndex: 4, type: "Electrical safety and energy output", offset: -92, result: "passed", nextDueOffset: -2, certificate: "CAL-2026-0004", notes: "Recalibration due." },
  { equipmentIndex: 6, type: "Anesthesia gas calibration", offset: -70, result: "adjusted", nextDueOffset: 20, certificate: "CAL-2026-0005", notes: "Adjusted and verified." },
  { equipmentIndex: 3, type: "Image quality verification", offset: -75, result: "passed", nextDueOffset: 15, certificate: "CAL-2026-0006", notes: null },
  { equipmentIndex: 5, type: "Analyzer calibration", offset: -90, result: "passed", nextDueOffset: 90, certificate: "CAL-2026-0007", notes: null },
];

export const calibrationRecords: CalibrationRecord[] = CALIBRATION_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(144, index + 1),
    equipment_id: medicalEquipment[seed.equipmentIndex].id,
    calibration_type: seed.type,
    performed_at: isoAt(seed.offset, 10),
    performed_by_name: "Test Biomedical Tech A",
    result: seed.result,
    next_due_date:
      seed.nextDueOffset === null ? null : isoDate(seed.nextDueOffset),
    certificate_number: seed.certificate,
    notes: seed.notes,
  })
);

const HISTORY_SEEDS: {
  equipmentIndex: number;
  event: MaintenanceType;
  offset: number;
  technician: string;
  summary: string;
  cost: number;
}[] = [
  { equipmentIndex: 0, event: "preventive", offset: -100, technician: "Test Biomedical Tech A", summary: "Annual preventive maintenance completed.", cost: 5000 },
  { equipmentIndex: 1, event: "repair", offset: -80, technician: "Test Biomedical Tech B", summary: "Display cable replaced.", cost: 2500 },
  { equipmentIndex: 2, event: "repair", offset: -30, technician: "Test Biomedical Tech A", summary: "Pump module serviced.", cost: 4000 },
  { equipmentIndex: 5, event: "preventive", offset: -4, technician: "Test Biomedical Tech B", summary: "Filters replaced; self-test passed.", cost: 3000 },
  { equipmentIndex: 6, event: "preventive", offset: -1, technician: "Test Biomedical Tech A", summary: "Annual service and verification completed.", cost: 6000 },
  { equipmentIndex: 7, event: "repair", offset: -10, technician: "Test Biomedical Tech B", summary: "Tube inspection completed; replacement pending.", cost: 12000 },
];

export const equipmentMaintenanceHistory: EquipmentMaintenanceHistory[] =
  HISTORY_SEEDS.map((seed, index) => ({
    id: previewUuid(145, index + 1),
    equipment_id: medicalEquipment[seed.equipmentIndex].id,
    event_type: seed.event,
    performed_at: isoAt(seed.offset, 11),
    performed_by_name: seed.technician,
    summary: seed.summary,
    cost: seed.cost,
  }));

const openWorkOrderStatuses = new Set<WorkOrderStatus>([
  "requested",
  "scheduled",
  "in_progress",
  "on_hold",
]);

export const equipmentListRows: EquipmentListRow[] = medicalEquipment.map(
  (equipment) => {
    const category = equipmentCategoryById.get(equipment.category_id);
    const openWorkOrders = equipmentWorkOrders.filter(
      (order) =>
        order.equipment_id === equipment.id &&
        openWorkOrderStatuses.has(order.status)
    ).length;
    const dueDates = [
      equipment.next_maintenance_due,
      equipment.next_calibration_due,
    ].filter((value): value is string => Boolean(value));
    const nextDue = dueDates.sort()[0] ?? null;

    return {
      ...equipment,
      category_name: category?.name ?? "Uncategorized",
      open_work_orders: openWorkOrders,
      next_due: nextDue,
    };
  }
);

export const equipmentRowById = new Map(
  equipmentListRows.map((equipment) => [equipment.id, equipment])
);

export const workOrderListRows: WorkOrderListRow[] = equipmentWorkOrders.map(
  (order) => {
    const equipment = medicalEquipmentById.get(order.equipment_id);

    return {
      ...order,
      equipment_name: equipment?.name ?? "Unknown equipment",
      asset_number: equipment?.asset_number ?? "Unknown asset",
      department_name: equipment?.department_name ?? "Unknown department",
    };
  }
);

export const maintenanceScheduleListRows: MaintenanceScheduleListRow[] =
  equipmentMaintenanceSchedules.map((schedule) => {
    const equipment = medicalEquipmentById.get(schedule.equipment_id);

    return {
      ...schedule,
      equipment_name: equipment?.name ?? "Unknown equipment",
      asset_number: equipment?.asset_number ?? "Unknown asset",
      department_name: equipment?.department_name ?? "Unknown department",
    };
  });

export const calibrationListRows: CalibrationListRow[] = calibrationRecords.map(
  (record) => {
    const equipment = medicalEquipmentById.get(record.equipment_id);

    return {
      ...record,
      equipment_name: equipment?.name ?? "Unknown equipment",
      asset_number: equipment?.asset_number ?? "Unknown asset",
    };
  }
);

export const maintenanceHistoryListRows: MaintenanceHistoryListRow[] =
  equipmentMaintenanceHistory.map((record) => {
    const equipment = medicalEquipmentById.get(record.equipment_id);

    return {
      ...record,
      equipment_name: equipment?.name ?? "Unknown equipment",
      asset_number: equipment?.asset_number ?? "Unknown asset",
    };
  });

export const equipmentDetailById = new Map<string, EquipmentDetail>(
  medicalEquipment.map((equipment) => {
    const category = equipmentCategoryById.get(equipment.category_id);

    if (!category) {
      throw new Error(`Equipment fixture is missing category for ${equipment.id}`);
    }

    return [
      equipment.id,
      {
        equipment,
        category,
        workOrders: workOrderListRows.filter(
          (order) => order.equipment_id === equipment.id
        ),
        schedules: maintenanceScheduleListRows.filter(
          (schedule) => schedule.equipment_id === equipment.id
        ),
        calibrations: calibrationListRows.filter(
          (record) => record.equipment_id === equipment.id
        ),
        history: maintenanceHistoryListRows.filter(
          (record) => record.equipment_id === equipment.id
        ),
      },
    ];
  })
);

const calibrationWindowEnd = Date.parse(PREVIEW_NOW) + 30 * 86_400_000;

export const equipmentStats: EquipmentStats = {
  totalEquipment: medicalEquipment.length,
  available: medicalEquipment.filter(
    (equipment) => equipment.status === "available"
  ).length,
  underMaintenance: medicalEquipment.filter(
    (equipment) =>
      equipment.status === "maintenance" ||
      equipment.status === "out_of_service"
  ).length,
  openWorkOrders: equipmentWorkOrders.filter((order) =>
    openWorkOrderStatuses.has(order.status)
  ).length,
  calibrationsDue: medicalEquipment.filter(
    (equipment) =>
      equipment.next_calibration_due !== null &&
      Date.parse(equipment.next_calibration_due) <= calibrationWindowEnd
  ).length,
  overdueMaintenance: medicalEquipment.filter(
    (equipment) =>
      equipment.next_maintenance_due !== null &&
      Date.parse(equipment.next_maintenance_due) < Date.parse(PREVIEW_NOW)
  ).length,
};

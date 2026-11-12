import type {
  CleaningRequest,
  CleaningRequestDetail,
  CleaningRequestListRow,
  CleaningRequestType,
  CleaningLocationType,
  CleaningPriority,
  CleaningStatus,
  DisinfectionRecord,
  HousekeepingStaff,
  HousekeepingStats,
} from "@/types/hospital";
import { PREVIEW_NOW, isoAt, previewUuid } from "./base";

function manilaDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export const housekeepingStaff: HousekeepingStaff[] = [
  {
    id: previewUuid(130, 1),
    name: "Test Housekeeper A",
    role: "Housekeeper",
    status: "on_duty",
    contact_number: "0917-400-0001",
    current_assignment: "Room 301 discharge cleaning",
    completed_today: 4,
  },
  {
    id: previewUuid(130, 2),
    name: "Test Housekeeper B",
    role: "Housekeeper",
    status: "on_duty",
    contact_number: "0917-400-0002",
    current_assignment: "Room 302 bed cleaning",
    completed_today: 3,
  },
  {
    id: previewUuid(130, 3),
    name: "Test Housekeeper C",
    role: "Housekeeper",
    status: "on_duty",
    contact_number: "0917-400-0003",
    current_assignment: "ER spill cleanup",
    completed_today: 5,
  },
  {
    id: previewUuid(130, 4),
    name: "Test Housekeeper D",
    role: "Housekeeper",
    status: "on_break",
    contact_number: "0917-400-0004",
    current_assignment: null,
    completed_today: 2,
  },
  {
    id: previewUuid(130, 5),
    name: "Test Housekeeper E",
    role: "Housekeeper",
    status: "off_duty",
    contact_number: "0917-400-0005",
    current_assignment: null,
    completed_today: 0,
  },
  {
    id: previewUuid(130, 6),
    name: "Test Housekeeping Supervisor A",
    role: "Housekeeping Supervisor",
    status: "on_duty",
    contact_number: "0917-400-0006",
    current_assignment: "Verification rounds",
    completed_today: 0,
  },
];

export const housekeepingStaffById = new Map(
  housekeepingStaff.map((staff) => [staff.id, staff])
);

type CleaningSeed = {
  locationType: CleaningLocationType;
  locationLabel: string;
  department: string;
  requestType: CleaningRequestType;
  priority: CleaningPriority;
  status: CleaningStatus;
  requestedOffset: number;
  requestedHour: number;
  requestedMinute: number;
  dueOffset: number;
  dueHour: number;
  dueMinute: number;
  scheduledOffset: number;
  scheduledHour: number;
  scheduledMinute: number;
  staffIndex: number | null;
  startedOffset: number | null;
  startedHour: number | null;
  startedMinute: number | null;
  completedOffset: number | null;
  completedHour: number | null;
  completedMinute: number | null;
  verifiedOffset: number | null;
  verifiedHour: number | null;
  verifiedMinute: number | null;
  verifiedBy: string | null;
  disinfectionUsed: string | null;
  notes: string;
};

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

const CLEANING_SEEDS: CleaningSeed[] = [
  {
    locationType: "room",
    locationLabel: "Room 301",
    department: "Ward 3",
    requestType: "discharge",
    priority: "urgent",
    status: "in_progress",
    requestedOffset: 0,
    requestedHour: 7,
    requestedMinute: 30,
    dueOffset: 0,
    dueHour: 8,
    dueMinute: 0,
    scheduledOffset: 0,
    scheduledHour: 7,
    scheduledMinute: 30,
    staffIndex: 0,
    startedOffset: 0,
    startedHour: 7,
    startedMinute: 35,
    completedOffset: null,
    completedHour: null,
    completedMinute: null,
    verifiedOffset: null,
    verifiedHour: null,
    verifiedMinute: null,
    verifiedBy: null,
    disinfectionUsed: "10% sodium hypochlorite",
    notes: "Discharge cleaning after patient transfer.",
  },
  {
    locationType: "bed",
    locationLabel: "Room 302 · Bed B",
    department: "Ward 3",
    requestType: "routine",
    priority: "routine",
    status: "completed",
    requestedOffset: 0,
    requestedHour: 6,
    requestedMinute: 50,
    dueOffset: 0,
    dueHour: 7,
    dueMinute: 20,
    scheduledOffset: 0,
    scheduledHour: 6,
    scheduledMinute: 50,
    staffIndex: 1,
    startedOffset: 0,
    startedHour: 6,
    startedMinute: 55,
    completedOffset: 0,
    completedHour: 7,
    completedMinute: 15,
    verifiedOffset: 0,
    verifiedHour: 7,
    verifiedMinute: 25,
    verifiedBy: "Test Housekeeping Supervisor A",
    disinfectionUsed: "70% alcohol",
    notes: "Bedside and high-touch surfaces cleaned.",
  },
  {
    locationType: "common_area",
    locationLabel: "ER treatment bay",
    department: "Emergency Department",
    requestType: "spill",
    priority: "emergency",
    status: "in_progress",
    requestedOffset: 0,
    requestedHour: 7,
    requestedMinute: 40,
    dueOffset: 0,
    dueHour: 7,
    dueMinute: 55,
    scheduledOffset: 0,
    scheduledHour: 7,
    scheduledMinute: 40,
    staffIndex: 2,
    startedOffset: 0,
    startedHour: 7,
    startedMinute: 42,
    completedOffset: null,
    completedHour: null,
    completedMinute: null,
    verifiedOffset: null,
    verifiedHour: null,
    verifiedMinute: null,
    verifiedBy: null,
    disinfectionUsed: "Spill kit + 0.5% chlorine",
    notes: "Blood spill cleanup.",
  },
  {
    locationType: "isolation_room",
    locationLabel: "Isolation Room 5A",
    department: "Ward 5",
    requestType: "isolation",
    priority: "urgent",
    status: "assigned",
    requestedOffset: 0,
    requestedHour: 8,
    requestedMinute: 0,
    dueOffset: 0,
    dueHour: 8,
    dueMinute: 30,
    scheduledOffset: 0,
    scheduledHour: 8,
    scheduledMinute: 0,
    staffIndex: 0,
    startedOffset: null,
    startedHour: null,
    startedMinute: null,
    completedOffset: null,
    completedHour: null,
    completedMinute: null,
    verifiedOffset: null,
    verifiedHour: null,
    verifiedMinute: null,
    verifiedBy: null,
    disinfectionUsed: "UV-C terminal disinfection",
    notes: "Isolation terminal cleaning.",
  },
  {
    locationType: "common_area",
    locationLabel: "Ward 4 common area",
    department: "Ward 4",
    requestType: "routine",
    priority: "routine",
    status: "requested",
    requestedOffset: 0,
    requestedHour: 8,
    requestedMinute: 0,
    dueOffset: 0,
    dueHour: 9,
    dueMinute: 0,
    scheduledOffset: 0,
    scheduledHour: 8,
    scheduledMinute: 0,
    staffIndex: null,
    startedOffset: null,
    startedHour: null,
    startedMinute: null,
    completedOffset: null,
    completedHour: null,
    completedMinute: null,
    verifiedOffset: null,
    verifiedHour: null,
    verifiedMinute: null,
    verifiedBy: null,
    disinfectionUsed: null,
    notes: "Waiting for assignment.",
  },
  {
    locationType: "room",
    locationLabel: "Room 401",
    department: "Ward 4",
    requestType: "terminal",
    priority: "urgent",
    status: "completed",
    requestedOffset: -1,
    requestedHour: 14,
    requestedMinute: 0,
    dueOffset: -1,
    dueHour: 15,
    dueMinute: 0,
    scheduledOffset: -1,
    scheduledHour: 14,
    scheduledMinute: 0,
    staffIndex: 1,
    startedOffset: -1,
    startedHour: 14,
    startedMinute: 5,
    completedOffset: -1,
    completedHour: 14,
    completedMinute: 50,
    verifiedOffset: -1,
    verifiedHour: 15,
    verifiedMinute: 10,
    verifiedBy: "Test Housekeeping Supervisor A",
    disinfectionUsed: "Hydrogen peroxide vapor",
    notes: "Terminal cleaning after discharge.",
  },
  {
    locationType: "room",
    locationLabel: "Room 501",
    department: "Ward 5",
    requestType: "routine",
    priority: "routine",
    status: "completed",
    requestedOffset: -1,
    requestedHour: 9,
    requestedMinute: 0,
    dueOffset: -1,
    dueHour: 10,
    dueMinute: 0,
    scheduledOffset: -1,
    scheduledHour: 9,
    scheduledMinute: 0,
    staffIndex: 3,
    startedOffset: -1,
    startedHour: 9,
    startedMinute: 5,
    completedOffset: -1,
    completedHour: 9,
    completedMinute: 40,
    verifiedOffset: -1,
    verifiedHour: 9,
    verifiedMinute: 55,
    verifiedBy: "Test Housekeeping Supervisor A",
    disinfectionUsed: "70% alcohol",
    notes: "Routine room cleaning.",
  },
  {
    locationType: "room",
    locationLabel: "Room 601",
    department: "Ward 6",
    requestType: "discharge",
    priority: "urgent",
    status: "assigned",
    requestedOffset: -1,
    requestedHour: 17,
    requestedMinute: 0,
    dueOffset: -1,
    dueHour: 18,
    dueMinute: 0,
    scheduledOffset: -1,
    scheduledHour: 17,
    scheduledMinute: 0,
    staffIndex: 4,
    startedOffset: null,
    startedHour: null,
    startedMinute: null,
    completedOffset: null,
    completedHour: null,
    completedMinute: null,
    verifiedOffset: null,
    verifiedHour: null,
    verifiedMinute: null,
    verifiedBy: null,
    disinfectionUsed: null,
    notes: "Overdue assignment from the previous shift.",
  },
  {
    locationType: "room",
    locationLabel: "Room 602",
    department: "Ward 6",
    requestType: "routine",
    priority: "routine",
    status: "cancelled",
    requestedOffset: -2,
    requestedHour: 10,
    requestedMinute: 0,
    dueOffset: -2,
    dueHour: 11,
    dueMinute: 0,
    scheduledOffset: -2,
    scheduledHour: 10,
    scheduledMinute: 0,
    staffIndex: null,
    startedOffset: null,
    startedHour: null,
    startedMinute: null,
    completedOffset: null,
    completedHour: null,
    completedMinute: null,
    verifiedOffset: null,
    verifiedHour: null,
    verifiedMinute: null,
    verifiedBy: null,
    disinfectionUsed: null,
    notes: "Cancelled by the ward; patient still occupying the room.",
  },
];

export const cleaningRequests: CleaningRequest[] = CLEANING_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(131, index + 1),
    request_number: `HK-2026-${String(index + 1).padStart(4, "0")}`,
    location_type: seed.locationType,
    location_label: seed.locationLabel,
    department_name: seed.department,
    request_type: seed.requestType,
    priority: seed.priority,
    status: seed.status,
    requested_at: isoAt(
      seed.requestedOffset,
      seed.requestedHour,
      seed.requestedMinute
    ),
    due_at: isoAt(seed.dueOffset, seed.dueHour, seed.dueMinute),
    scheduled_for: isoAt(
      seed.scheduledOffset,
      seed.scheduledHour,
      seed.scheduledMinute
    ),
    assigned_staff_id:
      seed.staffIndex === null ? null : housekeepingStaff[seed.staffIndex].id,
    started_at: at(
      seed.startedOffset,
      seed.startedHour,
      seed.startedMinute
    ),
    completed_at: at(
      seed.completedOffset,
      seed.completedHour,
      seed.completedMinute
    ),
    verified_at: at(
      seed.verifiedOffset,
      seed.verifiedHour,
      seed.verifiedMinute
    ),
    verified_by_name: seed.verifiedBy,
    disinfection_used: seed.disinfectionUsed,
    notes: seed.notes,
  })
);

export const cleaningRequestById = new Map(
  cleaningRequests.map((request) => [request.id, request])
);

export const cleaningRequestListRows: CleaningRequestListRow[] =
  cleaningRequests.map((request) => ({
    ...request,
    assigned_staff_name: request.assigned_staff_id
      ? housekeepingStaffById.get(request.assigned_staff_id)?.name ?? null
      : null,
  }));

export const todayCleaningRequests = cleaningRequestListRows
  .filter(
    (request) =>
      manilaDate(request.scheduled_for) === manilaDate(PREVIEW_NOW)
  )
  .sort((a, b) =>
    a.scheduled_for === b.scheduled_for
      ? 0
      : a.scheduled_for < b.scheduled_for
        ? -1
        : 1
  );

export const disinfectionRecords: DisinfectionRecord[] = [
  {
    id: previewUuid(132, 1),
    request_id: cleaningRequests[1].id,
    method: "Surface disinfection",
    chemical: "70% alcohol",
    contact_time_minutes: 5,
    performed_by_name: "Test Housekeeper B",
    performed_at: isoAt(0, 7, 10),
    notes: "High-touch surfaces and bedside rails.",
  },
  {
    id: previewUuid(132, 2),
    request_id: cleaningRequests[2].id,
    method: "Spill cleanup",
    chemical: "0.5% chlorine",
    contact_time_minutes: 10,
    performed_by_name: "Test Housekeeper C",
    performed_at: isoAt(0, 7, 50),
    notes: "Blood spill kit used.",
  },
  {
    id: previewUuid(132, 3),
    request_id: cleaningRequests[5].id,
    method: "Terminal disinfection",
    chemical: "Hydrogen peroxide vapor",
    contact_time_minutes: 60,
    performed_by_name: "Test Housekeeper B",
    performed_at: isoAt(-1, 14, 45),
    notes: "Room sealed for the contact time.",
  },
  {
    id: previewUuid(132, 4),
    request_id: cleaningRequests[6].id,
    method: "Routine disinfection",
    chemical: "70% alcohol",
    contact_time_minutes: 5,
    performed_by_name: "Test Housekeeper D",
    performed_at: isoAt(-1, 9, 35),
    notes: null,
  },
];

const disinfectionByRequestId = new Map<string, DisinfectionRecord>();

for (const record of disinfectionRecords) {
  disinfectionByRequestId.set(record.request_id, record);
}

export const cleaningRequestDetailById = new Map<string, CleaningRequestDetail>(
  cleaningRequests.map((request) => [
    request.id,
    {
      request,
      staff: request.assigned_staff_id
        ? housekeepingStaffById.get(request.assigned_staff_id) ?? null
        : null,
      disinfection: disinfectionByRequestId.get(request.id) ?? null,
    },
  ])
);

const openStatuses = new Set<CleaningStatus>([
  "requested",
  "assigned",
  "in_progress",
]);

export const housekeepingStats: HousekeepingStats = {
  openRequests: cleaningRequests.filter((request) =>
    openStatuses.has(request.status)
  ).length,
  inProgress: cleaningRequests.filter(
    (request) => request.status === "in_progress"
  ).length,
  completedToday: cleaningRequests.filter(
    (request) =>
      (request.status === "completed" || request.status === "verified") &&
      request.completed_at !== null &&
      manilaDate(request.completed_at) === manilaDate(PREVIEW_NOW)
  ).length,
  overdue: cleaningRequests.filter(
    (request) =>
      openStatuses.has(request.status) &&
      Date.parse(request.due_at) < Date.parse(PREVIEW_NOW)
  ).length,
  roomsWaiting: new Set(
    cleaningRequests
      .filter((request) => openStatuses.has(request.status))
      .map((request) => request.location_label)
  ).size,
  staffOnDuty: housekeepingStaff.filter(
    (staff) => staff.status === "on_duty"
  ).length,
};

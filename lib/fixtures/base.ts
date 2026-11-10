import type {
  Bed,
  Department,
  Physician,
  Profile,
  Role,
  Room,
  StaffListRow,
  StaffProfile,
  UserListRow,
} from "@/types/hospital";

export const PREVIEW_NOW = "2026-11-10T08:00:00+08:00";
const PREVIEW_NOW_EPOCH = Date.parse(PREVIEW_NOW);
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export function isoAt(dayOffset: number, hour = 8, minute = 0): string {
  const value =
    PREVIEW_NOW_EPOCH + dayOffset * DAY_MS + (hour - 8) * HOUR_MS + minute * 60_000;

  return new Date(value).toISOString();
}

export function isoDate(dayOffset: number): string {
  return new Date(PREVIEW_NOW_EPOCH + dayOffset * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function previewUuid(namespace: number, index: number): string {
  const tail = String(namespace * 1000 + index).padStart(12, "0");

  return `00000000-0000-4000-8000-${tail}`;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function joinName(
  first: string,
  last: string,
  middle?: string | null,
  suffix?: string | null
): string {
  return [first, middle, last, suffix]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(" ");
}

export const departmentIds = {
  er: previewUuid(1, 1),
  opd: previewUuid(1, 2),
  ipd: previewUuid(1, 3),
  laboratory: previewUuid(1, 4),
  radiology: previewUuid(1, 5),
  pharmacy: previewUuid(1, 6),
  billing: previewUuid(1, 7),
  administration: previewUuid(1, 8),
} as const;

export const departments: Department[] = [
  {
    id: departmentIds.er,
    code: "ER",
    name: "Emergency Department",
    description: "Emergency care, triage, and stabilization.",
    is_active: true,
    created_at: isoAt(-400, 8),
    updated_at: isoAt(-400, 8),
  },
  {
    id: departmentIds.opd,
    code: "OPD",
    name: "Outpatient Department",
    description: "Consultation and outpatient services.",
    is_active: true,
    created_at: isoAt(-400, 8),
    updated_at: isoAt(-400, 8),
  },
  {
    id: departmentIds.ipd,
    code: "IPD",
    name: "Inpatient Department",
    description: "Ward, room, and inpatient care.",
    is_active: true,
    created_at: isoAt(-400, 8),
    updated_at: isoAt(-400, 8),
  },
  {
    id: departmentIds.laboratory,
    code: "LAB",
    name: "Laboratory",
    description: "Clinical laboratory testing.",
    is_active: true,
    created_at: isoAt(-400, 8),
    updated_at: isoAt(-400, 8),
  },
  {
    id: departmentIds.radiology,
    code: "RAD",
    name: "Radiology",
    description: "Imaging and radiology services.",
    is_active: true,
    created_at: isoAt(-400, 8),
    updated_at: isoAt(-400, 8),
  },
  {
    id: departmentIds.pharmacy,
    code: "PHARM",
    name: "Pharmacy",
    description: "Medication review and dispensing.",
    is_active: true,
    created_at: isoAt(-400, 8),
    updated_at: isoAt(-400, 8),
  },
  {
    id: departmentIds.billing,
    code: "BILL",
    name: "Billing",
    description: "Invoicing, payments, and financial records.",
    is_active: true,
    created_at: isoAt(-400, 8),
    updated_at: isoAt(-400, 8),
  },
  {
    id: departmentIds.administration,
    code: "ADMIN",
    name: "Administration",
    description: "Hospital administration and support services.",
    is_active: true,
    created_at: isoAt(-400, 8),
    updated_at: isoAt(-400, 8),
  },
];

export const departmentNameById = new Map(
  departments.map((department) => [department.id, department.name])
);

const ROLE_SEEDS: { slug: string; name: string; description: string }[] = [
  {
    slug: "super_admin",
    name: "Super Administrator",
    description: "Full system access and configuration.",
  },
  {
    slug: "hospital_admin",
    name: "Hospital Administrator",
    description: "Hospital-wide operational administration.",
  },
  {
    slug: "receptionist",
    name: "Receptionist",
    description: "Patient registration and appointment coordination.",
  },
  {
    slug: "physician",
    name: "Physician / Doctor",
    description: "Clinical consultation and orders.",
  },
  {
    slug: "nurse",
    name: "Nurse",
    description: "Nursing assessment and patient monitoring.",
  },
  {
    slug: "laboratory_staff",
    name: "Laboratory Staff",
    description: "Laboratory processing and results.",
  },
  {
    slug: "radiology_staff",
    name: "Radiology Staff",
    description: "Imaging studies and reports.",
  },
  {
    slug: "pharmacist",
    name: "Pharmacist",
    description: "Prescription review and dispensing.",
  },
  {
    slug: "billing_staff",
    name: "Billing Staff",
    description: "Invoices, payments, and collections.",
  },
  {
    slug: "inventory_staff",
    name: "Inventory Staff",
    description: "Supply stock and inventory records.",
  },
];

export const roles: Role[] = ROLE_SEEDS.map((role, index) => ({
  id: previewUuid(7, index + 1),
  slug: role.slug,
  name: role.name,
  description: role.description,
  is_system: true,
  created_at: isoAt(-400, 8),
}));

export const roleNameBySlug = new Map(
  roles.map((role) => [role.slug, role.name])
);

export const profileIds = {
  superAdmin: previewUuid(2, 1),
  hospitalAdmin: previewUuid(2, 2),
  receptionist: previewUuid(2, 3),
  physicianA: previewUuid(2, 4),
  physicianB: previewUuid(2, 5),
  physicianC: previewUuid(2, 6),
  nurseA: previewUuid(2, 7),
  nurseB: previewUuid(2, 8),
  labTech: previewUuid(2, 9),
  radiologist: previewUuid(2, 10),
  pharmacist: previewUuid(2, 11),
  billing: previewUuid(2, 12),
  inventory: previewUuid(2, 13),
} as const;

export const profiles: Profile[] = [
  {
    id: profileIds.superAdmin,
    email: "test.admin.a@example.test",
    full_name: "Test Admin A",
    avatar_path: null,
    contact_number: "0917-100-0001",
    is_active: true,
    created_at: isoAt(-400, 8),
    updated_at: isoAt(-400, 8),
  },
  {
    id: profileIds.hospitalAdmin,
    email: "test.admin.b@example.test",
    full_name: "Test Admin B",
    avatar_path: null,
    contact_number: "0917-100-0002",
    is_active: true,
    created_at: isoAt(-398, 8),
    updated_at: isoAt(-398, 8),
  },
  {
    id: profileIds.receptionist,
    email: "test.receptionist.a@example.test",
    full_name: "Test Receptionist A",
    avatar_path: null,
    contact_number: "0917-100-0003",
    is_active: true,
    created_at: isoAt(-396, 8),
    updated_at: isoAt(-396, 8),
  },
  {
    id: profileIds.physicianA,
    email: "test.physician.a@example.test",
    full_name: "Test Physician A",
    avatar_path: null,
    contact_number: "0917-100-0004",
    is_active: true,
    created_at: isoAt(-394, 8),
    updated_at: isoAt(-394, 8),
  },
  {
    id: profileIds.physicianB,
    email: "test.physician.b@example.test",
    full_name: "Test Physician B",
    avatar_path: null,
    contact_number: "0917-100-0005",
    is_active: true,
    created_at: isoAt(-392, 8),
    updated_at: isoAt(-392, 8),
  },
  {
    id: profileIds.physicianC,
    email: "test.physician.c@example.test",
    full_name: "Test Physician C",
    avatar_path: null,
    contact_number: "0917-100-0006",
    is_active: true,
    created_at: isoAt(-390, 8),
    updated_at: isoAt(-390, 8),
  },
  {
    id: profileIds.nurseA,
    email: "test.nurse.a@example.test",
    full_name: "Test Nurse A",
    avatar_path: null,
    contact_number: "0917-100-0007",
    is_active: true,
    created_at: isoAt(-388, 8),
    updated_at: isoAt(-388, 8),
  },
  {
    id: profileIds.nurseB,
    email: "test.nurse.b@example.test",
    full_name: "Test Nurse B",
    avatar_path: null,
    contact_number: "0917-100-0008",
    is_active: true,
    created_at: isoAt(-386, 8),
    updated_at: isoAt(-386, 8),
  },
  {
    id: profileIds.labTech,
    email: "test.lab.a@example.test",
    full_name: "Test Lab Staff A",
    avatar_path: null,
    contact_number: "0917-100-0009",
    is_active: true,
    created_at: isoAt(-384, 8),
    updated_at: isoAt(-384, 8),
  },
  {
    id: profileIds.radiologist,
    email: "test.radiology.a@example.test",
    full_name: "Test Radiology Staff A",
    avatar_path: null,
    contact_number: "0917-100-0010",
    is_active: true,
    created_at: isoAt(-382, 8),
    updated_at: isoAt(-382, 8),
  },
  {
    id: profileIds.pharmacist,
    email: "test.pharmacist.a@example.test",
    full_name: "Test Pharmacist A",
    avatar_path: null,
    contact_number: "0917-100-0011",
    is_active: true,
    created_at: isoAt(-380, 8),
    updated_at: isoAt(-380, 8),
  },
  {
    id: profileIds.billing,
    email: "test.billing.a@example.test",
    full_name: "Test Billing Staff A",
    avatar_path: null,
    contact_number: "0917-100-0012",
    is_active: true,
    created_at: isoAt(-378, 8),
    updated_at: isoAt(-378, 8),
  },
  {
    id: profileIds.inventory,
    email: "test.inventory.a@example.test",
    full_name: "Test Inventory Staff A",
    avatar_path: null,
    contact_number: "0917-100-0013",
    is_active: false,
    created_at: isoAt(-376, 8),
    updated_at: isoAt(-30, 8),
  },
];

export const profileNameById = new Map(
  profiles.map((profile) => [profile.id, profile.full_name])
);

export const roleSlugByUserId: Record<string, string> = {
  [profileIds.superAdmin]: "super_admin",
  [profileIds.hospitalAdmin]: "hospital_admin",
  [profileIds.receptionist]: "receptionist",
  [profileIds.physicianA]: "physician",
  [profileIds.physicianB]: "physician",
  [profileIds.physicianC]: "physician",
  [profileIds.nurseA]: "nurse",
  [profileIds.nurseB]: "nurse",
  [profileIds.labTech]: "laboratory_staff",
  [profileIds.radiologist]: "radiology_staff",
  [profileIds.pharmacist]: "pharmacist",
  [profileIds.billing]: "billing_staff",
  [profileIds.inventory]: "inventory_staff",
};

export const staffIds = {
  physicianA: previewUuid(3, 1),
  physicianB: previewUuid(3, 2),
  physicianC: previewUuid(3, 3),
  nurseA: previewUuid(3, 4),
  nurseB: previewUuid(3, 5),
  labTech: previewUuid(3, 6),
  radiologist: previewUuid(3, 7),
  pharmacist: previewUuid(3, 8),
  billing: previewUuid(3, 9),
  inventory: previewUuid(3, 10),
} as const;

export const staffProfiles: StaffProfile[] = [
  {
    id: staffIds.physicianA,
    user_id: profileIds.physicianA,
    staff_number: "STF-2026-0001",
    first_name: "Test",
    middle_name: null,
    last_name: "Physician A",
    department_id: departmentIds.opd,
    employment_type: "Full-time",
    professional_license_number: "PRC-0001001",
    is_active: true,
    created_at: isoAt(-394, 8),
    updated_at: isoAt(-394, 8),
  },
  {
    id: staffIds.physicianB,
    user_id: profileIds.physicianB,
    staff_number: "STF-2026-0002",
    first_name: "Test",
    middle_name: null,
    last_name: "Physician B",
    department_id: departmentIds.er,
    employment_type: "Full-time",
    professional_license_number: "PRC-0001002",
    is_active: true,
    created_at: isoAt(-392, 8),
    updated_at: isoAt(-392, 8),
  },
  {
    id: staffIds.physicianC,
    user_id: profileIds.physicianC,
    staff_number: "STF-2026-0003",
    first_name: "Test",
    middle_name: null,
    last_name: "Physician C",
    department_id: departmentIds.ipd,
    employment_type: "Full-time",
    professional_license_number: "PRC-0001003",
    is_active: true,
    created_at: isoAt(-390, 8),
    updated_at: isoAt(-390, 8),
  },
  {
    id: staffIds.nurseA,
    user_id: profileIds.nurseA,
    staff_number: "STF-2026-0004",
    first_name: "Test",
    middle_name: null,
    last_name: "Nurse A",
    department_id: departmentIds.ipd,
    employment_type: "Full-time",
    professional_license_number: "PRC-0002001",
    is_active: true,
    created_at: isoAt(-388, 8),
    updated_at: isoAt(-388, 8),
  },
  {
    id: staffIds.nurseB,
    user_id: profileIds.nurseB,
    staff_number: "STF-2026-0005",
    first_name: "Test",
    middle_name: null,
    last_name: "Nurse B",
    department_id: departmentIds.er,
    employment_type: "Part-time",
    professional_license_number: "PRC-0002002",
    is_active: true,
    created_at: isoAt(-386, 8),
    updated_at: isoAt(-386, 8),
  },
  {
    id: staffIds.labTech,
    user_id: profileIds.labTech,
    staff_number: "STF-2026-0006",
    first_name: "Test",
    middle_name: null,
    last_name: "Lab Staff A",
    department_id: departmentIds.laboratory,
    employment_type: "Full-time",
    professional_license_number: "PRC-0003001",
    is_active: true,
    created_at: isoAt(-384, 8),
    updated_at: isoAt(-384, 8),
  },
  {
    id: staffIds.radiologist,
    user_id: profileIds.radiologist,
    staff_number: "STF-2026-0007",
    first_name: "Test",
    middle_name: null,
    last_name: "Radiology Staff A",
    department_id: departmentIds.radiology,
    employment_type: "Full-time",
    professional_license_number: "PRC-0004001",
    is_active: true,
    created_at: isoAt(-382, 8),
    updated_at: isoAt(-382, 8),
  },
  {
    id: staffIds.pharmacist,
    user_id: profileIds.pharmacist,
    staff_number: "STF-2026-0008",
    first_name: "Test",
    middle_name: null,
    last_name: "Pharmacist A",
    department_id: departmentIds.pharmacy,
    employment_type: "Full-time",
    professional_license_number: "PRC-0005001",
    is_active: true,
    created_at: isoAt(-380, 8),
    updated_at: isoAt(-380, 8),
  },
  {
    id: staffIds.billing,
    user_id: profileIds.billing,
    staff_number: "STF-2026-0009",
    first_name: "Test",
    middle_name: null,
    last_name: "Billing Staff A",
    department_id: departmentIds.billing,
    employment_type: "Full-time",
    professional_license_number: null,
    is_active: true,
    created_at: isoAt(-378, 8),
    updated_at: isoAt(-378, 8),
  },
  {
    id: staffIds.inventory,
    user_id: profileIds.inventory,
    staff_number: "STF-2026-0010",
    first_name: "Test",
    middle_name: null,
    last_name: "Inventory Staff A",
    department_id: departmentIds.administration,
    employment_type: "Contract",
    professional_license_number: null,
    is_active: false,
    created_at: isoAt(-376, 8),
    updated_at: isoAt(-30, 8),
  },
];

export const staffNameById = new Map(
  staffProfiles.map((staff) => [
    staff.id,
    joinName(staff.first_name, staff.last_name, staff.middle_name),
  ])
);

const profileById = new Map(
  profiles.map((profile) => [profile.id, profile])
);

export const staffByUserId = new Map(
  staffProfiles.map((staff) => [staff.user_id, staff])
);

export const physicianIds = {
  a: previewUuid(4, 1),
  b: previewUuid(4, 2),
  c: previewUuid(4, 3),
} as const;

export const physicians: Physician[] = [
  {
    id: physicianIds.a,
    staff_id: staffIds.physicianA,
    specialty: "Internal Medicine",
    license_number: "PRC-0001001",
    is_available: true,
    created_at: isoAt(-394, 8),
    updated_at: isoAt(-394, 8),
  },
  {
    id: physicianIds.b,
    staff_id: staffIds.physicianB,
    specialty: "Emergency Medicine",
    license_number: "PRC-0001002",
    is_available: true,
    created_at: isoAt(-392, 8),
    updated_at: isoAt(-392, 8),
  },
  {
    id: physicianIds.c,
    staff_id: staffIds.physicianC,
    specialty: "General Surgery",
    license_number: "PRC-0001003",
    is_available: false,
    created_at: isoAt(-390, 8),
    updated_at: isoAt(-390, 8),
  },
];

export const physicianNameById = new Map(
  physicians.map((physician) => [
    physician.id,
    staffNameById.get(physician.staff_id) ?? "Test Physician",
  ])
);

export const physicianByStaffId = new Map(
  physicians.map((physician) => [physician.staff_id, physician])
);

export const staffListRows: StaffListRow[] = staffProfiles.map((staff) => {
  const profile = profileById.get(staff.user_id);
  const roleSlug = roleSlugByUserId[staff.user_id];
  const physician = physicianByStaffId.get(staff.id);

  return {
    id: staff.id,
    staff_number: staff.staff_number,
    user_id: staff.user_id,
    first_name: staff.first_name,
    middle_name: staff.middle_name,
    last_name: staff.last_name,
    full_name: joinName(staff.first_name, staff.last_name, staff.middle_name),
    email: profile?.email ?? "test.staff@example.test",
    contact_number: profile?.contact_number ?? null,
    role_names: roleSlug ? [roleNameBySlug.get(roleSlug) ?? roleSlug] : [],
    department_id: staff.department_id,
    department_name: staff.department_id
      ? departmentNameById.get(staff.department_id) ?? null
      : null,
    employment_type: staff.employment_type,
    professional_license_number: staff.professional_license_number,
    specialty: physician?.specialty ?? null,
    is_physician: Boolean(physician),
    is_active: staff.is_active,
  };
});

type RoomSeed = {
  room_number: string;
  department_id: string;
  room_type: string;
  floor_number: string;
  bed_statuses: Bed["status"][];
};

const ROOM_SEEDS: RoomSeed[] = [
  {
    room_number: "IPD-101",
    department_id: departmentIds.ipd,
    room_type: "Ward",
    floor_number: "1",
    bed_statuses: ["occupied", "occupied"],
  },
  {
    room_number: "IPD-102",
    department_id: departmentIds.ipd,
    room_type: "Ward",
    floor_number: "1",
    bed_statuses: ["occupied", "occupied"],
  },
  {
    room_number: "IPD-201",
    department_id: departmentIds.ipd,
    room_type: "Private",
    floor_number: "2",
    bed_statuses: ["occupied", "occupied"],
  },
  {
    room_number: "IPD-202",
    department_id: departmentIds.ipd,
    room_type: "Private",
    floor_number: "2",
    bed_statuses: ["available", "available"],
  },
  {
    room_number: "ER-01",
    department_id: departmentIds.er,
    room_type: "Emergency Bay",
    floor_number: "1",
    bed_statuses: ["occupied", "occupied"],
  },
  {
    room_number: "ER-02",
    department_id: departmentIds.er,
    room_type: "Emergency Bay",
    floor_number: "1",
    bed_statuses: ["available", "available"],
  },
  {
    room_number: "OPD-01",
    department_id: departmentIds.opd,
    room_type: "Observation",
    floor_number: "1",
    bed_statuses: ["available", "maintenance"],
  },
  {
    room_number: "OPD-02",
    department_id: departmentIds.opd,
    room_type: "Observation",
    floor_number: "1",
    bed_statuses: ["reserved", "available"],
  },
  {
    room_number: "RAD-01",
    department_id: departmentIds.radiology,
    room_type: "Recovery",
    floor_number: "1",
    bed_statuses: ["available", "maintenance"],
  },
  {
    room_number: "RAD-02",
    department_id: departmentIds.radiology,
    room_type: "Recovery",
    floor_number: "1",
    bed_statuses: ["available", "available"],
  },
  {
    room_number: "IPD-301",
    department_id: departmentIds.ipd,
    room_type: "Isolation",
    floor_number: "3",
    bed_statuses: ["reserved", "maintenance"],
  },
  {
    room_number: "IPD-302",
    department_id: departmentIds.ipd,
    room_type: "Ward",
    floor_number: "3",
    bed_statuses: ["available", "available"],
  },
];

export const rooms: Room[] = ROOM_SEEDS.map((room, index) => ({
  id: previewUuid(5, index + 1),
  room_number: room.room_number,
  department_id: room.department_id,
  room_type: room.room_type,
  floor_number: room.floor_number,
  is_active: true,
  created_at: isoAt(-360, 8),
  updated_at: isoAt(-360, 8),
}));

export const roomNameById = new Map(
  rooms.map((room) => [room.id, room.room_number])
);

export const beds: Bed[] = ROOM_SEEDS.flatMap((room, roomIndex) =>
  room.bed_statuses.map((status, bedIndex) => ({
    id: previewUuid(6, roomIndex * room.bed_statuses.length + bedIndex + 1),
    room_id: rooms[roomIndex].id,
    bed_number: String(bedIndex + 1).padStart(2, "0"),
    status,
    created_at: isoAt(-360, 8),
    updated_at: isoAt(-10 + bedIndex, 8),
  }))
);

export const bedById = new Map(beds.map((bed) => [bed.id, bed]));

export const roomById = new Map(rooms.map((room) => [room.id, room]));

export const occupiedBeds = beds.filter((bed) => bed.status === "occupied");
export const availableBeds = beds.filter((bed) => bed.status === "available");
export const reservedBeds = beds.filter((bed) => bed.status === "reserved");
export const maintenanceBeds = beds.filter(
  (bed) => bed.status === "maintenance"
);

export const userListRows: UserListRow[] = profiles.map((profile, index) => {
  const staff = staffByUserId.get(profile.id);
  const roleSlug = roleSlugByUserId[profile.id];
  const department = staff?.department_id
    ? departmentNameById.get(staff.department_id)
    : profile.id === profileIds.superAdmin ||
        profile.id === profileIds.hospitalAdmin
      ? departmentNameById.get(departmentIds.administration)
      : departmentNameById.get(departmentIds.opd);

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    avatar_path: profile.avatar_path,
    contact_number: profile.contact_number,
    role_slugs: roleSlug ? [roleSlug] : [],
    role_names: roleSlug ? [roleNameBySlug.get(roleSlug) ?? roleSlug] : [],
    department_name: department ?? null,
    is_active: profile.is_active,
    last_activity: profile.is_active ? isoAt(-index, 9) : null,
    created_at: profile.created_at,
  };
});

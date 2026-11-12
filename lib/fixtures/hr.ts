import type {
  AttendanceEntry,
  AttendanceListRow,
  AttendanceStatus,
  Credential,
  Employee,
  EmployeeDetail,
  EmployeeListRow,
  EmployeeStatus,
  EmploymentType,
  HrStats,
  LeaveRequest,
  LeaveType,
  PayrollEntry,
  PayrollPeriod,
  Shift,
  ShiftType,
} from "@/types/hospital";
import {
  PREVIEW_NOW,
  departmentIds,
  departmentNameById,
  isoAt,
  isoDate,
  previewUuid,
  profiles,
  staffIds,
  staffNameById,
  staffProfiles,
} from "./base";

const POSITION_BY_STAFF_ID: Record<string, string> = {
  [staffIds.physicianA]: "Internal Medicine Physician",
  [staffIds.physicianB]: "Emergency Medicine Physician",
  [staffIds.physicianC]: "General Surgeon",
  [staffIds.nurseA]: "Staff Nurse",
  [staffIds.nurseB]: "Staff Nurse",
  [staffIds.labTech]: "Medical Technologist",
  [staffIds.radiologist]: "Radiologic Technologist",
  [staffIds.pharmacist]: "Pharmacist",
  [staffIds.billing]: "Billing Officer",
  [staffIds.inventory]: "Inventory Officer",
};

const EMPLOYMENT_BY_STAFF_ID: Record<string, EmploymentType> = {
  [staffIds.radiologist]: "part_time",
  [staffIds.inventory]: "contractual",
};

const LICENSE_EXPIRY_BY_STAFF_ID: Record<string, string> = {
  [staffIds.physicianA]: "2027-06-30",
  [staffIds.physicianB]: "2026-12-15",
  [staffIds.physicianC]: "2028-03-31",
  [staffIds.nurseA]: "2027-01-20",
  [staffIds.nurseB]: "2026-11-30",
  [staffIds.labTech]: "2027-09-10",
  [staffIds.radiologist]: "2026-12-05",
  [staffIds.pharmacist]: "2028-02-14",
  [staffIds.billing]: "2027-05-01",
};

function licenseStatus(expiry: string | null): Employee["license_status"] {
  if (!expiry) {
    return "none";
  }

  const days = Math.floor(
    (Date.parse(expiry) - Date.parse(PREVIEW_NOW)) / 86_400_000
  );

  if (days < 0) {
    return "expired";
  }

  if (days <= 60) {
    return "expiring";
  }

  return "valid";
}

function addMinutes(value: string, minutes: number): string {
  return new Date(Date.parse(value) + minutes * 60_000).toISOString();
}

function buildStaffEmployee(index: number): Employee {
  const staff = staffProfiles[index];
  const profile = profiles.find((item) => item.id === staff.user_id);
  const departmentName = staff.department_id
    ? departmentNameById.get(staff.department_id) ?? null
    : null;
  const status: EmployeeStatus = !staff.is_active
    ? "inactive"
    : staff.id === staffIds.nurseB
      ? "on_leave"
      : "active";
  const licenseExpiry = LICENSE_EXPIRY_BY_STAFF_ID[staff.id] ?? null;

  return {
    id: staff.id,
    employee_number: staff.staff_number,
    user_id: staff.user_id,
    first_name: staff.first_name,
    middle_name: staff.middle_name,
    last_name: staff.last_name,
    full_name: staffNameById.get(staff.id) ?? "Test Employee",
    email: profile?.email ?? "staff@example.test",
    contact_number: profile?.contact_number ?? null,
    department_id: staff.department_id,
    department_name: departmentName,
    position: POSITION_BY_STAFF_ID[staff.id] ?? "Staff",
    employment_type: EMPLOYMENT_BY_STAFF_ID[staff.id] ?? "regular",
    status,
    hire_date: isoDate(-900 + index * 60),
    license_number: staff.professional_license_number,
    license_expiry: licenseExpiry,
    license_status: licenseStatus(licenseExpiry),
    is_active: staff.is_active,
    created_at: staff.created_at,
  };
}

const extraEmployees: Employee[] = [
  {
    id: previewUuid(80, 1),
    employee_number: "EMP-2026-0011",
    user_id: previewUuid(81, 1),
    first_name: "Test",
    middle_name: null,
    last_name: "HR Officer",
    full_name: "Test HR Officer",
    email: "test.hr@example.test",
    contact_number: "0917-100-0014",
    department_id: departmentIds.administration,
    department_name: "Administration",
    position: "HR Officer",
    employment_type: "regular",
    status: "active",
    hire_date: isoDate(-600),
    license_number: null,
    license_expiry: null,
    license_status: "none",
    is_active: true,
    created_at: isoAt(-600, 8),
  },
  {
    id: previewUuid(80, 2),
    employee_number: "EMP-2026-0012",
    user_id: previewUuid(81, 2),
    first_name: "Test",
    middle_name: null,
    last_name: "Payroll Officer",
    full_name: "Test Payroll Officer",
    email: "test.payroll@example.test",
    contact_number: "0917-100-0015",
    department_id: departmentIds.billing,
    department_name: "Billing",
    position: "Payroll Officer",
    employment_type: "regular",
    status: "active",
    hire_date: isoDate(-500),
    license_number: null,
    license_expiry: null,
    license_status: "none",
    is_active: true,
    created_at: isoAt(-500, 8),
  },
];

export const employees: Employee[] = [
  ...staffProfiles.map((_, index) => buildStaffEmployee(index)),
  ...extraEmployees,
].sort((a, b) => a.full_name.localeCompare(b.full_name));

export const employeeById = new Map(
  employees.map((employee) => [employee.id, employee])
);

export const employeeNameById = new Map(
  employees.map((employee) => [employee.id, employee.full_name])
);

export const credentials: Credential[] = [];
let credentialIndex = 0;

for (const employee of employees) {
  if (employee.license_number && employee.license_expiry) {
    credentialIndex += 1;
    credentials.push({
      id: previewUuid(82, credentialIndex),
      employee_id: employee.id,
      credential_type: employee.position.includes("Physician") ||
        employee.position.includes("Surgeon")
        ? "PRC Physician License"
        : "PRC Professional License",
      credential_number: employee.license_number,
      issued_at: isoDate(-1200),
      expires_at: employee.license_expiry,
      status:
        employee.license_status === "none"
          ? "valid"
          : employee.license_status,
    });
  }

  if (
    employee.position.includes("Nurse") ||
    employee.position.includes("Physician") ||
    employee.position.includes("Surgeon")
  ) {
    credentialIndex += 1;
    credentials.push({
      id: previewUuid(82, credentialIndex),
      employee_id: employee.id,
      credential_type: "BLS Certification",
      credential_number: `BLS-${employee.employee_number.slice(-4)}`,
      issued_at: isoDate(-300),
      expires_at: isoDate(400),
      status: "valid",
    });
  }
}

const shiftLabels: Record<ShiftType, string> = {
  morning: "Morning · 06:00–14:00",
  afternoon: "Afternoon · 14:00–22:00",
  night: "Night · 22:00–06:00",
  off: "Off duty",
};

function shiftTypeFor(index: number, dayOffset: number): ShiftType {
  switch ((index + dayOffset) % 3) {
    case 0:
      return "morning";
    case 1:
      return "afternoon";
    default:
      return "night";
  }
}

export const shifts: Shift[] = [];
const shiftsByEmployeeId = new Map<string, Shift[]>();
let shiftIndex = 0;

employees
  .filter(
    (employee) =>
      employee.status !== "inactive" && employee.status !== "separated"
  )
  .forEach((employee, employeeIndex) => {
    const list: Shift[] = [];

    for (let dayOffset = 0; dayOffset < 3; dayOffset += 1) {
      const shiftType = shiftTypeFor(employeeIndex, dayOffset);
      const startHour = shiftType === "morning" ? 6 : shiftType === "afternoon" ? 14 : 22;
      const endHour = shiftType === "morning" ? 14 : shiftType === "afternoon" ? 22 : 6;
      shiftIndex += 1;

      const shift: Shift = {
        id: previewUuid(83, shiftIndex),
        employee_id: employee.id,
        date: isoDate(dayOffset),
        shift_type: shiftType,
        start_time: isoAt(dayOffset, startHour),
        end_time: isoAt(dayOffset + (shiftType === "night" ? 1 : 0), endHour),
        department_name: employee.department_name,
        role: employee.position,
      };

      list.push(shift);
      shifts.push(shift);
    }

    shiftsByEmployeeId.set(employee.id, list);
  });

export const attendance: AttendanceEntry[] = [];
const attendanceByEmployeeId = new Map<string, AttendanceEntry[]>();
let attendanceIndex = 0;

employees
  .filter(
    (employee) =>
      employee.status !== "inactive" && employee.status !== "separated"
  )
  .forEach((employee, employeeIndex) => {
    const list: AttendanceEntry[] = [];

    for (let dayOffset = -6; dayOffset <= 0; dayOffset += 1) {
      const shiftType = shiftTypeFor(employeeIndex, dayOffset);
      const startHour = shiftType === "morning" ? 6 : shiftType === "afternoon" ? 14 : 22;
      const endHour = shiftType === "morning" ? 14 : shiftType === "afternoon" ? 22 : 6;
      const start = isoAt(dayOffset, startHour);
      const end = isoAt(dayOffset + (shiftType === "night" ? 1 : 0), endHour);

      const isLeave =
        employee.status === "on_leave" && (dayOffset === -1 || dayOffset === 0);
      const isAbsent = !isLeave && employeeIndex % 7 === 0 && dayOffset === -3;
      const isLate = !isLeave && !isAbsent && employeeIndex % 5 === 0 && dayOffset === -1;

      const status: AttendanceStatus = isLeave
        ? "leave"
        : isAbsent
          ? "absent"
          : isLate
            ? "late"
            : "present";

      const timeIn =
        status === "present"
          ? addMinutes(start, employeeIndex % 10)
          : status === "late"
            ? addMinutes(start, 45)
            : null;
      const timeOut =
        status === "present" || status === "late"
          ? dayOffset === 0 && employeeIndex % 3 !== 0
            ? null
            : addMinutes(end, status === "present" && employeeIndex % 3 === 0 ? 30 : 0)
          : null;
      const overtimeMinutes =
        status === "present" && employeeIndex % 3 === 0 ? 30 : 0;

      attendanceIndex += 1;
      const entry: AttendanceEntry = {
        id: previewUuid(84, attendanceIndex),
        employee_id: employee.id,
        date: isoDate(dayOffset),
        time_in: timeIn,
        time_out: timeOut,
        status,
        overtime_minutes: overtimeMinutes,
        note:
          status === "leave"
            ? "Approved sick leave."
            : status === "late"
              ? "Arrived after the shift start."
              : status === "absent"
                ? "No attendance record."
                : null,
      };

      list.push(entry);
      attendance.push(entry);
    }

    attendanceByEmployeeId.set(employee.id, list);
  });

function leaveEmployee(id: string): Employee {
  const employee = employeeById.get(id);

  if (!employee) {
    throw new Error(`HR fixture is missing employee ${id}`);
  }

  return employee;
}

const leaveSeeds: {
  employeeId: string;
  leave_type: LeaveType;
  start: string;
  end: string;
  days: number;
  status: LeaveRequest["status"];
  reason: string;
  requestedAt: string;
  reviewed_by_name: string | null;
}[] = [
  {
    employeeId: staffIds.nurseB,
    leave_type: "sick",
    start: isoDate(-1),
    end: isoDate(1),
    days: 3,
    status: "approved",
    reason: "Influenza with fever; advised to rest.",
    requestedAt: isoAt(-5, 9),
    reviewed_by_name: "Test HR Officer",
  },
  {
    employeeId: staffIds.billing,
    leave_type: "vacation",
    start: isoDate(10),
    end: isoDate(12),
    days: 3,
    status: "pending",
    reason: "Family trip.",
    requestedAt: isoAt(-2, 10),
    reviewed_by_name: null,
  },
  {
    employeeId: staffIds.labTech,
    leave_type: "emergency",
    start: isoDate(-5),
    end: isoDate(-5),
    days: 1,
    status: "approved",
    reason: "Family emergency.",
    requestedAt: isoAt(-8, 14),
    reviewed_by_name: "Test HR Officer",
  },
  {
    employeeId: staffIds.pharmacist,
    leave_type: "study",
    start: isoDate(21),
    end: isoDate(25),
    days: 5,
    status: "pending",
    reason: "Continuing education program.",
    requestedAt: isoAt(-1, 11),
    reviewed_by_name: null,
  },
  {
    employeeId: staffIds.physicianB,
    leave_type: "vacation",
    start: isoDate(40),
    end: isoDate(47),
    days: 8,
    status: "approved",
    reason: "Annual leave.",
    requestedAt: isoAt(-20, 8),
    reviewed_by_name: "Test HR Officer",
  },
  {
    employeeId: staffIds.inventory,
    leave_type: "sick",
    start: isoDate(-26),
    end: isoDate(-25),
    days: 2,
    status: "rejected",
    reason: "Insufficient balance.",
    requestedAt: isoAt(-30, 9),
    reviewed_by_name: "Test HR Officer",
  },
  {
    employeeId: previewUuid(80, 1),
    leave_type: "vacation",
    start: isoDate(15),
    end: isoDate(16),
    days: 2,
    status: "pending",
    reason: "Personal errand.",
    requestedAt: isoAt(-3, 13),
    reviewed_by_name: null,
  },
  {
    employeeId: previewUuid(80, 2),
    leave_type: "sick",
    start: isoDate(-3),
    end: isoDate(-3),
    days: 1,
    status: "cancelled",
    reason: "Recovered before the leave date.",
    requestedAt: isoAt(-6, 10),
    reviewed_by_name: null,
  },
];

export const leaveRequests: LeaveRequest[] = leaveSeeds
  .map((seed, index) => {
    const employee = leaveEmployee(seed.employeeId);

    return {
      id: previewUuid(86, index + 1),
      employee_id: employee.id,
      employee_name: employee.full_name,
      leave_type: seed.leave_type,
      start_date: seed.start,
      end_date: seed.end,
      days: seed.days,
      status: seed.status,
      reason: seed.reason,
      requested_at: seed.requestedAt,
      reviewed_by_name: seed.reviewed_by_name,
    };
  })
  .sort((a, b) =>
    a.requested_at === b.requested_at
      ? 0
      : a.requested_at < b.requested_at
        ? 1
        : -1
  );

const approvedLeaveDaysByEmployeeId = new Map<string, number>();

for (const request of leaveRequests) {
  if (request.status !== "approved") {
    continue;
  }

  approvedLeaveDaysByEmployeeId.set(
    request.employee_id,
    (approvedLeaveDaysByEmployeeId.get(request.employee_id) ?? 0) + request.days
  );
}

function attendanceRateFor(employeeId: string): number {
  const entries = attendanceByEmployeeId.get(employeeId) ?? [];

  if (entries.length === 0) {
    return 0;
  }

  const attended = entries.filter(
    (entry) => entry.status === "present" || entry.status === "late"
  ).length;

  return Math.round((attended / entries.length) * 100);
}

export const employeeListRows: EmployeeListRow[] = employees.map((employee) => {
  const todayShift = (shiftsByEmployeeId.get(employee.id) ?? []).find(
    (shift) => shift.date === isoDate(0)
  );

  return {
    ...employee,
    current_shift: todayShift ? shiftLabels[todayShift.shift_type] : null,
    attendance_rate: attendanceRateFor(employee.id),
    leave_balance: Math.max(
      0,
      15 - (approvedLeaveDaysByEmployeeId.get(employee.id) ?? 0)
    ),
  };
});

const todayAttendance = attendance.filter(
  (entry) => entry.date === isoDate(0)
);

export const todayAttendanceRows: AttendanceListRow[] = todayAttendance
  .map((entry) => {
    const employee = employeeById.get(entry.employee_id);
    const todayShift = (shiftsByEmployeeId.get(entry.employee_id) ?? []).find(
      (shift) => shift.date === isoDate(0)
    );

    return {
      ...entry,
      employee_name: employee?.full_name ?? "Test Employee",
      employee_number: employee?.employee_number ?? "EMP-0000",
      department_name: employee?.department_name ?? null,
      position: employee?.position ?? "Staff",
      shift_label: todayShift ? shiftLabels[todayShift.shift_type] : "Off duty",
    };
  })
  .sort((a, b) => a.employee_name.localeCompare(b.employee_name));

function basePayFor(position: string): number {
  if (position.includes("Surgeon")) {
    return 75000;
  }

  if (position.includes("Physician")) {
    return 65000;
  }

  if (position.includes("Nurse")) {
    return 32000;
  }

  if (position.includes("Medical Technologist")) {
    return 28000;
  }

  if (position.includes("Radiologic")) {
    return 30000;
  }

  if (position.includes("Pharmacist")) {
    return 30000;
  }

  if (position.includes("Billing")) {
    return 25000;
  }

  if (position.includes("Inventory")) {
    return 22000;
  }

  if (position.includes("HR") || position.includes("Payroll")) {
    return 35000;
  }

  return 25000;
}

const payrollPeriodSeeds: {
  periodStart: string;
  periodEnd: string;
  payDate: string;
  status: PayrollPeriod["status"];
}[] = [
  {
    periodStart: isoDate(-55),
    periodEnd: isoDate(-41),
    payDate: isoDate(-36),
    status: "paid",
  },
  {
    periodStart: isoDate(-40),
    periodEnd: isoDate(-26),
    payDate: isoDate(-21),
    status: "paid",
  },
  {
    periodStart: isoDate(-25),
    periodEnd: isoDate(-11),
    payDate: isoDate(-6),
    status: "approved",
  },
  {
    periodStart: isoDate(-9),
    periodEnd: isoDate(5),
    payDate: isoDate(10),
    status: "processing",
  },
];

export const payrollPeriods: PayrollPeriod[] = payrollPeriodSeeds.map(
  (seed, index) => ({
    id: previewUuid(87, index + 1),
    period_start: seed.periodStart,
    period_end: seed.periodEnd,
    pay_date: seed.payDate,
    status: seed.status,
    employee_count: 0,
    gross_pay: 0,
    total_deductions: 0,
    net_pay: 0,
  })
);

export const payrollEntriesByPeriodId = new Map<string, PayrollEntry[]>();
let payrollEntryIndex = 0;

const payrollEmployees = employees.filter(
  (employee) =>
    employee.status !== "inactive" && employee.status !== "separated"
);

for (const period of payrollPeriods) {
  const entries: PayrollEntry[] = [];

  payrollEmployees.forEach((employee, employeeIndex) => {
    const basicPay = basePayFor(employee.position);
    const allowances = 3000 + (employeeIndex % 4) * 500;
    const overtimePay = (employeeIndex % 3) * 750;
    const grossPay = basicPay + allowances + overtimePay;
    const deductions = Math.round(grossPay * 0.18);
    const netPay = grossPay - deductions;

    payrollEntryIndex += 1;
    entries.push({
      id: previewUuid(88, payrollEntryIndex),
      payroll_period_id: period.id,
      employee_id: employee.id,
      employee_name: employee.full_name,
      position: employee.position,
      basic_pay: basicPay,
      allowances,
      overtime_pay: overtimePay,
      gross_pay: grossPay,
      deductions,
      net_pay: netPay,
      status: period.status,
    });

    period.employee_count += 1;
    period.gross_pay += grossPay;
    period.total_deductions += deductions;
    period.net_pay += netPay;
  });

  payrollEntriesByPeriodId.set(period.id, entries);
}

export const currentPayrollPeriod =
  payrollPeriods.find((period) => period.status === "processing") ??
  payrollPeriods[payrollPeriods.length - 1];

const currentPayrollEntries = payrollEntriesByPeriodId.get(
  currentPayrollPeriod.id
) ?? [];

const currentPayslipByEmployeeId = new Map(
  currentPayrollEntries.map((entry) => [entry.employee_id, entry])
);

export const employeeDetailById = new Map<string, EmployeeDetail>(
  employees.map((employee) => [
    employee.id,
    {
      employee,
      credentials: credentials.filter(
        (credential) => credential.employee_id === employee.id
      ),
      attendance: attendanceByEmployeeId.get(employee.id) ?? [],
      shifts: shiftsByEmployeeId.get(employee.id) ?? [],
      leave_requests: leaveRequests.filter(
        (request) => request.employee_id === employee.id
      ),
      latest_payslip: currentPayslipByEmployeeId.get(employee.id) ?? null,
    },
  ])
);

export const hrStats: HrStats = {
  totalEmployees: employees.length,
  active: employees.filter((employee) => employee.status === "active").length,
  onLeave: employees.filter((employee) => employee.status === "on_leave").length,
  expiringLicenses: employees.filter(
    (employee) =>
      employee.license_status === "expiring" ||
      employee.license_status === "expired"
  ).length,
  pendingLeave: leaveRequests.filter((request) => request.status === "pending")
    .length,
  payrollNet: currentPayrollPeriod.net_pay,
  payrollStatus: currentPayrollPeriod.status,
};

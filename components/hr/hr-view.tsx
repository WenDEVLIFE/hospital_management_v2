"use client";

import * as React from "react";
import {
  BillListIcon,
  CaseIcon,
  CheckCircleIcon,
  ClockCircleIcon,
  DiplomaIcon,
  UserRoundedIcon,
  WalletMoneyIcon,
} from "@solar-icons/react/linear";

import type {
  AttendanceListRow,
  EmployeeDetail,
  EmployeeListRow,
  LeaveRequest,
  PayrollEntry,
  PayrollPeriod,
  ShiftType,
} from "@/types/hospital";
import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { UnavailableAction, UNAVAILABLE_MESSAGE } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";

const EMPLOYEE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On leave" },
  { value: "inactive", label: "Inactive" },
  { value: "separated", label: "Separated" },
];

const ATTENDANCE_STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "On leave" },
  { value: "holiday", label: "Holiday" },
];

const LEAVE_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const LEAVE_TYPE_OPTIONS = [
  { value: "vacation", label: "Vacation" },
  { value: "sick", label: "Sick" },
  { value: "maternity", label: "Maternity" },
  { value: "paternity", label: "Paternity" },
  { value: "emergency", label: "Emergency" },
  { value: "study", label: "Study" },
];

const PAYROLL_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "processing", label: "Processing" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
];

const SHIFT_LABELS: Record<ShiftType, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  night: "Night",
  off: "Off duty",
};

export interface HrViewProps {
  employees: EmployeeListRow[];
  employeeDetails: Record<string, EmployeeDetail>;
  attendance: AttendanceListRow[];
  leaveRequests: LeaveRequest[];
  payrollPeriods: PayrollPeriod[];
  payrollEntries: Record<string, PayrollEntry[]>;
}

function formatTime(value: string | null): string {
  if (!value) {
    return "\u2014";
  }

  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-hospital-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-hospital-text">{children}</dd>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-hospital-text-muted">
      <span aria-hidden="true">{icon}</span>
      {title}
    </h3>
  );
}

function LicenseBadge({ employee }: { employee: EmployeeListRow }) {
  if (!employee.license_number) {
    return (
      <span className="text-[11px] text-hospital-text-muted">
        No professional license
      </span>
    );
  }

  return (
    <div className="min-w-0">
      <p className="font-mono text-[11px] text-hospital-text">
        {employee.license_number}
      </p>
      <p className="text-[11px] text-hospital-text-muted">
        Expires {employee.license_expiry ? formatDate(employee.license_expiry) : "\u2014"}
      </p>
      <div className="mt-1">
        <StatusBadge status={employee.license_status} />
      </div>
    </div>
  );
}

export function HrView({
  employees,
  employeeDetails,
  attendance,
  leaveRequests,
  payrollPeriods,
  payrollEntries,
}: HrViewProps) {
  const [tab, setTab] = React.useState("employees");
  const [selectedEmployee, setSelectedEmployee] =
    React.useState<EmployeeListRow | null>(null);
  const [selectedPeriod, setSelectedPeriod] =
    React.useState<PayrollPeriod | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const employeeRowById = React.useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  );

  const departments = React.useMemo(
    () =>
      Array.from(
        new Set(
          employees
            .map((employee) => employee.department_name)
            .filter((name): name is string => Boolean(name))
        )
      ).sort(),
    [employees]
  );

  const openEmployee = React.useCallback(
    (id: string) => {
      const employee = employeeRowById.get(id);

      if (employee) {
        setPendingAction(null);
        setSelectedEmployee(employee);
      }
    },
    [employeeRowById]
  );

  const closeEmployee = React.useCallback(() => {
    setPendingAction(null);
    setSelectedEmployee(null);
  }, []);

  const openPeriod = React.useCallback((period: PayrollPeriod) => {
    setPendingAction(null);
    setSelectedPeriod(period);
  }, []);

  const closePeriod = React.useCallback(() => {
    setPendingAction(null);
    setSelectedPeriod(null);
  }, []);

  const employeeColumns = React.useMemo<Column<EmployeeListRow>[]>(
    () => [
      {
        key: "employee_number",
        header: "Employee No.",
        sortable: true,
        sortValue: (row) => row.employee_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.employee_number}
          </span>
        ),
      },
      {
        key: "employee",
        header: "Employee",
        sortable: true,
        sortValue: (row) => row.full_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">{row.full_name}</p>
            <p className="break-words text-[11px] text-hospital-text-muted">
              {row.email}
            </p>
          </div>
        ),
      },
      {
        key: "department",
        header: "Department",
        sortable: true,
        sortValue: (row) => row.department_name ?? "",
        cell: (row) => row.department_name ?? "\u2014",
      },
      {
        key: "position",
        header: "Position",
        sortable: true,
        sortValue: (row) => row.position,
        cell: (row) => row.position,
      },
      {
        key: "employment",
        header: "Employment",
        cell: (row) => <StatusBadge status={row.employment_type} />,
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "license",
        header: "License",
        cell: (row) => <LicenseBadge employee={row} />,
      },
      {
        key: "attendance",
        header: "Attendance",
        sortable: true,
        sortValue: (row) => row.attendance_rate,
        cell: (row) => (
          <span className="whitespace-nowrap text-xs text-hospital-text">
            {row.attendance_rate}%
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View employee ${row.full_name}`}
            onClick={() => openEmployee(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openEmployee]
  );

  const employeeFilters = React.useMemo<FilterConfig<EmployeeListRow>[]>(
    () => [
      {
        key: "department",
        label: "department",
        allLabel: "All departments",
        options: departments.map((name) => ({ label: name, value: name })),
        accessor: (row) => row.department_name ?? "",
      },
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: EMPLOYEE_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
    ],
    [departments]
  );

  const attendanceColumns = React.useMemo<Column<AttendanceListRow>[]>(
    () => [
      {
        key: "employee",
        header: "Employee",
        sortable: true,
        sortValue: (row) => row.employee_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">{row.employee_name}</p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.employee_number}
            </p>
          </div>
        ),
      },
      {
        key: "department",
        header: "Department / position",
        cell: (row) => (
          <div className="min-w-0 text-xs">
            <p>{row.department_name ?? "\u2014"}</p>
            <p className="text-[11px] text-hospital-text-muted">
              {row.position}
            </p>
          </div>
        ),
      },
      {
        key: "shift",
        header: "Shift",
        cell: (row) => (
          <span className="whitespace-nowrap text-xs">{row.shift_label}</span>
        ),
      },
      {
        key: "time_in",
        header: "Time in",
        cell: (row) => (
          <span className="whitespace-nowrap">{formatTime(row.time_in)}</span>
        ),
      },
      {
        key: "time_out",
        header: "Time out",
        cell: (row) => (
          <span className="whitespace-nowrap">{formatTime(row.time_out)}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "overtime",
        header: "Overtime",
        sortable: true,
        sortValue: (row) => row.overtime_minutes,
        cell: (row) =>
          row.overtime_minutes > 0 ? `${row.overtime_minutes} min` : "\u2014",
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View employee ${row.employee_name}`}
            onClick={() => openEmployee(row.employee_id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openEmployee]
  );

  const attendanceFilters = React.useMemo<FilterConfig<AttendanceListRow>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: ATTENDANCE_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
    ],
    []
  );

  const leaveColumns = React.useMemo<Column<LeaveRequest>[]>(
    () => [
      {
        key: "employee",
        header: "Employee",
        sortable: true,
        sortValue: (row) => row.employee_name,
        cell: (row) => (
          <span className="font-medium text-hospital-text">
            {row.employee_name}
          </span>
        ),
      },
      {
        key: "type",
        header: "Leave type",
        cell: (row) => <StatusBadge status={row.leave_type} />,
      },
      {
        key: "dates",
        header: "Dates",
        cell: (row) => (
          <span className="whitespace-nowrap text-xs">
            {formatDate(row.start_date)} – {formatDate(row.end_date)}
          </span>
        ),
      },
      {
        key: "days",
        header: "Days",
        sortable: true,
        sortValue: (row) => row.days,
        cell: (row) => `${row.days} day${row.days === 1 ? "" : "s"}`,
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "reason",
        header: "Reason",
        cell: (row) => (
          <span className="line-clamp-2 max-w-[16rem] text-xs text-hospital-text-muted">
            {row.reason}
          </span>
        ),
      },
      {
        key: "reviewer",
        header: "Reviewed by",
        cell: (row) => row.reviewed_by_name ?? "\u2014",
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View employee ${row.employee_name}`}
            onClick={() => openEmployee(row.employee_id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openEmployee]
  );

  const leaveFilters = React.useMemo<FilterConfig<LeaveRequest>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: LEAVE_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "type",
        label: "leave type",
        allLabel: "All leave types",
        options: LEAVE_TYPE_OPTIONS,
        accessor: (row) => row.leave_type,
      },
    ],
    []
  );

  const payrollColumns = React.useMemo<Column<PayrollPeriod>[]>(
    () => [
      {
        key: "period",
        header: "Pay period",
        sortable: true,
        sortValue: (row) => row.period_start,
        cell: (row) => (
          <span className="whitespace-nowrap text-xs">
            {formatDate(row.period_start)} – {formatDate(row.period_end)}
          </span>
        ),
      },
      {
        key: "pay_date",
        header: "Pay date",
        sortable: true,
        sortValue: (row) => row.pay_date,
        cell: (row) => (
          <span className="whitespace-nowrap">{formatDate(row.pay_date)}</span>
        ),
      },
      {
        key: "employees",
        header: "Employees",
        sortable: true,
        sortValue: (row) => row.employee_count,
        cell: (row) => row.employee_count,
      },
      {
        key: "gross",
        header: "Gross",
        align: "right",
        cell: (row) => (
          <span className="tabular-nums">{formatCurrency(row.gross_pay)}</span>
        ),
      },
      {
        key: "deductions",
        header: "Deductions",
        align: "right",
        cell: (row) => (
          <span className="tabular-nums">
            {formatCurrency(row.total_deductions)}
          </span>
        ),
      },
      {
        key: "net",
        header: "Net pay",
        align: "right",
        cell: (row) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(row.net_pay)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View payslips for ${formatDate(row.period_start)} to ${formatDate(row.period_end)}`}
            onClick={() => openPeriod(row)}
          >
            View slips
          </Button>
        ),
      },
    ],
    [openPeriod]
  );

  const payrollFilters = React.useMemo<FilterConfig<PayrollPeriod>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: PAYROLL_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
    ],
    []
  );

  const employeeDetail = selectedEmployee
    ? employeeDetails[selectedEmployee.id] ?? null
    : null;
  const periodEntries = selectedPeriod
    ? payrollEntries[selectedPeriod.id] ?? []
    : [];

  return (
    <>
      <div className="space-y-4">
        <Tabs
          items={[
            { value: "employees", label: "Employees", count: employees.length },
            { value: "attendance", label: "Attendance", count: attendance.length },
            { value: "leave", label: "Leave", count: leaveRequests.length },
            { value: "payroll", label: "Payroll", count: payrollPeriods.length },
          ]}
          value={tab}
          onValueChange={setTab}
        />

        {tab === "employees" ? (
          <RecordTable
            rows={employees}
            columns={employeeColumns}
            rowKey={(row) => row.id}
            caption="Employee directory"
            searchPlaceholder="Search employee no., name, position, or license"
            searchAccessor={(row) =>
              `${row.employee_number} ${row.full_name} ${row.email} ${row.position} ${row.department_name ?? ""} ${row.license_number ?? ""}`
            }
            filters={employeeFilters}
            emptyTitle="No employees found"
            emptyDescription="There are no employees matching your selected filters."
            emptyIcon={<UserRoundedIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "attendance" ? (
          <RecordTable
            rows={attendance}
            columns={attendanceColumns}
            rowKey={(row) => row.id}
            caption="Today's attendance"
            searchPlaceholder="Search employee, department, or shift"
            searchAccessor={(row) =>
              `${row.employee_name} ${row.employee_number} ${row.department_name ?? ""} ${row.position} ${row.shift_label}`
            }
            filters={attendanceFilters}
            toolbarActions={
              <UnavailableAction
                label="Schedule Shift"
                description="Assign an employee to a shift and publish the schedule."
                size="sm"
                variant="secondary"
                icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No attendance records"
            emptyDescription="No employees have attendance records for today."
            emptyIcon={<ClockCircleIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "leave" ? (
          <RecordTable
            rows={leaveRequests}
            columns={leaveColumns}
            rowKey={(row) => row.id}
            caption="Leave requests"
            searchPlaceholder="Search employee, leave type, or reason"
            searchAccessor={(row) =>
              `${row.employee_name} ${row.leave_type} ${row.reason} ${row.reviewed_by_name ?? ""}`
            }
            filters={leaveFilters}
            toolbarActions={
              <UnavailableAction
                label="File Leave"
                description="File a leave request for an employee and route it for review."
                size="sm"
                variant="secondary"
                icon={<CaseIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No leave requests"
            emptyDescription="There are no leave requests matching your selected filters."
            emptyIcon={<CaseIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "payroll" ? (
          <div className="space-y-3">
            <p className="text-[11px] text-hospital-text-muted">
              Payroll processing and approval are separate permissions. This
              preview does not enforce role separation.
            </p>
            <RecordTable
              rows={payrollPeriods}
              columns={payrollColumns}
              rowKey={(row) => row.id}
              caption="Payroll periods"
              searchPlaceholder="Search payroll periods"
              searchAccessor={(row) =>
                `${formatDate(row.period_start)} ${formatDate(row.period_end)} ${row.status}`
              }
              filters={payrollFilters}
              toolbarActions={
                <UnavailableAction
                  label="Process Payroll"
                  description="Process payroll for the current period and calculate statutory deductions."
                  size="sm"
                  variant="secondary"
                  icon={
                    <WalletMoneyIcon className="size-4" aria-hidden="true" />
                  }
                />
              }
              emptyTitle="No payroll periods"
              emptyDescription="There are no payroll periods matching your selected filters."
              emptyIcon={<BillListIcon className="size-5" aria-hidden="true" />}
              pageSize={10}
            />
          </div>
        ) : null}
      </div>

      <Modal
        open={selectedEmployee !== null}
        onClose={closeEmployee}
        title={
          selectedEmployee
            ? `Employee ${selectedEmployee.employee_number}`
            : "Employee details"
        }
        description="Profile, credentials, shifts, attendance, leave, and payroll"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeEmployee}>
            Close
          </Button>
        }
      >
        {selectedEmployee ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Full name">
                {selectedEmployee.full_name}
              </DetailField>

              <DetailField label="Employee number">
                <span className="font-mono text-xs">
                  {selectedEmployee.employee_number}
                </span>
              </DetailField>

              <DetailField label="Email">
                <span className="break-words">{selectedEmployee.email}</span>
              </DetailField>

              <DetailField label="Contact number">
                {selectedEmployee.contact_number ?? "\u2014"}
              </DetailField>

              <DetailField label="Department">
                {selectedEmployee.department_name ?? "\u2014"}
              </DetailField>

              <DetailField label="Position">
                {selectedEmployee.position}
              </DetailField>

              <DetailField label="Employment type">
                <StatusBadge status={selectedEmployee.employment_type} />
              </DetailField>

              <DetailField label="Status">
                <StatusBadge status={selectedEmployee.status} />
              </DetailField>

              <DetailField label="Hire date">
                {formatDate(selectedEmployee.hire_date)}
              </DetailField>

              <DetailField label="Attendance rate">
                {selectedEmployee.attendance_rate}%
              </DetailField>

              <DetailField label="Leave balance">
                {selectedEmployee.leave_balance} day
                {selectedEmployee.leave_balance === 1 ? "" : "s"}
              </DetailField>

              <DetailField label="Current shift">
                {selectedEmployee.current_shift ?? "Not scheduled"}
              </DetailField>
            </dl>

            {employeeDetail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<DiplomaIcon className="size-3.5" />}
                    title="Credentials & licenses"
                  />
                  {employeeDetail.credentials.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No professional credentials recorded.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {employeeDetail.credentials.map((credential) => (
                        <li
                          key={credential.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-hospital-text">
                              {credential.credential_type}
                            </p>
                            <p className="font-mono text-[11px] text-hospital-text-muted">
                              {credential.credential_number}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-hospital-text-muted">
                              Expires{" "}
                              {credential.expires_at
                                ? formatDate(credential.expires_at)
                                : "\u2014"}
                            </span>
                            <StatusBadge status={credential.status} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<ClockCircleIcon className="size-3.5" />}
                    title="Upcoming shifts"
                  />
                  <ul className="space-y-1.5">
                    {employeeDetail.shifts.map((shift) => (
                      <li
                        key={shift.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-medium text-hospital-text">
                            {SHIFT_LABELS[shift.shift_type]} ·{" "}
                            {formatDate(shift.date)}
                          </p>
                          <p className="text-[11px] text-hospital-text-muted">
                            {formatTime(shift.start_time)} –{" "}
                            {formatTime(shift.end_time)} · {shift.role}
                          </p>
                        </div>
                        <Badge variant="info">
                          {shift.department_name ?? "Unassigned"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<CheckCircleIcon className="size-3.5" />}
                    title="Recent attendance"
                  />
                  <ul className="space-y-1.5">
                    {employeeDetail.attendance.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-medium text-hospital-text">
                            {formatDate(entry.date)}
                          </p>
                          <p className="text-[11px] text-hospital-text-muted">
                            {formatTime(entry.time_in)} –{" "}
                            {formatTime(entry.time_out)}
                            {entry.overtime_minutes > 0
                              ? ` · ${entry.overtime_minutes} min overtime`
                              : ""}
                          </p>
                        </div>
                        <StatusBadge status={entry.status} />
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<CaseIcon className="size-3.5" />}
                    title="Leave requests"
                  />
                  {employeeDetail.leave_requests.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No leave requests recorded.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {employeeDetail.leave_requests.map((request) => (
                        <li
                          key={request.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-medium text-hospital-text">
                              {request.reason}
                            </p>
                            <p className="text-[11px] text-hospital-text-muted">
                              {formatDate(request.start_date)} –{" "}
                              {formatDate(request.end_date)} · {request.days} day
                              {request.days === 1 ? "" : "s"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={request.leave_type} />
                            <StatusBadge status={request.status} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<WalletMoneyIcon className="size-3.5" />}
                    title="Current payroll"
                  />
                  {employeeDetail.latest_payslip ? (
                    <div className="rounded-md border border-hospital-border p-3">
                      <dl className="grid gap-3 sm:grid-cols-2">
                        <DetailField label="Basic pay">
                          {formatCurrency(
                            employeeDetail.latest_payslip.basic_pay
                          )}
                        </DetailField>
                        <DetailField label="Allowances">
                          {formatCurrency(
                            employeeDetail.latest_payslip.allowances
                          )}
                        </DetailField>
                        <DetailField label="Overtime">
                          {formatCurrency(
                            employeeDetail.latest_payslip.overtime_pay
                          )}
                        </DetailField>
                        <DetailField label="Deductions">
                          {formatCurrency(
                            employeeDetail.latest_payslip.deductions
                          )}
                        </DetailField>
                        <DetailField label="Net pay">
                          <span className="font-semibold">
                            {formatCurrency(
                              employeeDetail.latest_payslip.net_pay
                            )}
                          </span>
                        </DetailField>
                        <DetailField label="Status">
                          <StatusBadge
                            status={employeeDetail.latest_payslip.status}
                          />
                        </DetailField>
                      </dl>
                    </div>
                  ) : (
                    <p className="text-xs text-hospital-text-muted">
                      No current payroll entry.
                    </p>
                  )}
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Edit employee")}
                  >
                    Edit employee
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Record attendance")}
                  >
                    Record attendance
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingAction("Generate payslip")}
                  >
                    Generate payslip
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-hospital-text-muted">
                Detailed employee data is not available.
              </p>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={selectedPeriod !== null}
        onClose={closePeriod}
        title={
          selectedPeriod
            ? `Payroll ${formatDate(selectedPeriod.period_start)} – ${formatDate(selectedPeriod.period_end)}`
            : "Payroll period"
        }
        description="Employee payslips and payroll totals"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closePeriod}>
            Close
          </Button>
        }
      >
        {selectedPeriod ? (
          <div className="space-y-4">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailField label="Pay date">
                {formatDate(selectedPeriod.pay_date)}
              </DetailField>
              <DetailField label="Status">
                <StatusBadge status={selectedPeriod.status} />
              </DetailField>
              <DetailField label="Employees">
                {selectedPeriod.employee_count}
              </DetailField>
              <DetailField label="Net pay">
                <span className="font-semibold">
                  {formatCurrency(selectedPeriod.net_pay)}
                </span>
              </DetailField>
            </dl>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">Allowances</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium text-hospital-text">
                          {entry.employee_name}
                        </p>
                        <p className="text-[11px] text-hospital-text-muted">
                          {entry.position}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(entry.basic_pay)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(entry.allowances)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(entry.overtime_pay)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(entry.deductions)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(entry.net_pay)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={entry.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPendingAction("Process payroll")}
              >
                Process payroll
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPendingAction("Approve payroll")}
              >
                Approve payroll
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPendingAction("Generate payslips")}
              >
                Generate payslips
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

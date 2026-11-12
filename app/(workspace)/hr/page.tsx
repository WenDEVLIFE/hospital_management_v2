import { connection } from "next/server";
import {
  CaseIcon,
  DiplomaIcon,
  UserPlusRoundedIcon,
  UserRoundedIcon,
  UsersGroupTwoRoundedIcon,
  WalletMoneyIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { UnavailableAction } from "@/components/module/unavailable-action";
import { HrView } from "@/components/hr/hr-view";
import { HrWorkflowStrip } from "@/components/hr/hr-workflow-strip";
import {
  getEmployeeDetails,
  getHrStats,
  getPayrollEntries,
  listEmployees,
  listLeaveRequests,
  listPayrollPeriods,
  listTodayAttendance,
} from "@/lib/data/hr";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata = {
  title: "Human Resources & Payroll",
};

export default async function HumanResourcesPage() {
  await connection();

  const [
    statsResult,
    employeesResult,
    detailsResult,
    attendanceResult,
    leaveResult,
    periodsResult,
    entriesResult,
  ] = await Promise.all([
    getHrStats(),
    listEmployees({ pageSize: 200 }),
    getEmployeeDetails(),
    listTodayAttendance({ pageSize: 200 }),
    listLeaveRequests({ pageSize: 200 }),
    listPayrollPeriods(),
    getPayrollEntries(),
  ]);

  const payrollPeriods = periodsResult.error ? [] : periodsResult.data;
  const currentPeriod =
    payrollPeriods.find((period) => period.status === "processing") ??
    payrollPeriods[0] ??
    null;
  const attendanceCount = attendanceResult.error
    ? 0
    : attendanceResult.data.rows.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human Resources & Payroll"
        description="Manage employee records, attendance, leave, and payroll."
        actions={
          <>
            <UnavailableAction
              label="Run Payroll"
              description="Process the current payroll period and calculate statutory deductions."
              variant="secondary"
              icon={<WalletMoneyIcon className="size-4" aria-hidden="true" />}
            />
            <UnavailableAction
              label="Add Employee"
              description="Create an employee record, assign a department and position, and record professional credentials."
              icon={<UserPlusRoundedIcon className="size-4" aria-hidden="true" />}
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
              label="Total employees"
              value={statsResult.data.totalEmployees}
              hint="Active employee records"
              icon={
                <UsersGroupTwoRoundedIcon
                  className="size-4"
                  aria-hidden="true"
                />
              }
            />
            <StatCard
              label="Active"
              value={statsResult.data.active}
              hint={`${statsResult.data.onLeave} on leave`}
              tone="success"
              icon={<UserRoundedIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="On leave"
              value={statsResult.data.onLeave}
              hint="Approved and active leave"
              tone="warning"
              icon={<CaseIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Expiring licenses"
              value={statsResult.data.expiringLicenses}
              hint="Within 60 days or expired"
              tone="danger"
              icon={<DiplomaIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Pending leave"
              value={statsResult.data.pendingLeave}
              hint="Awaiting HR review"
              tone="warning"
              icon={<CaseIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Current payroll net"
              value={formatCurrency(statsResult.data.payrollNet)}
              hint={
                currentPeriod
                  ? `Pay date ${formatDate(currentPeriod.pay_date)}`
                  : "No active period"
              }
              icon={<WalletMoneyIcon className="size-4" aria-hidden="true" />}
            />
          </div>

          <HrWorkflowStrip
            stats={statsResult.data}
            attendanceCount={attendanceCount}
            payrollEmployeeCount={currentPeriod?.employee_count ?? 0}
          />
        </>
      )}

      {employeesResult.error ? (
        <ErrorState error={employeesResult.error} />
      ) : (
        <HrView
          employees={employeesResult.data.rows}
          employeeDetails={detailsResult.error ? {} : detailsResult.data}
          attendance={attendanceResult.error ? [] : attendanceResult.data.rows}
          leaveRequests={leaveResult.error ? [] : leaveResult.data.rows}
          payrollPeriods={payrollPeriods}
          payrollEntries={entriesResult.error ? {} : entriesResult.data}
        />
      )}
    </div>
  );
}

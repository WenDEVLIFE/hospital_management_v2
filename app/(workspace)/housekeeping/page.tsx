import { connection } from "next/server";
import {
  BroomIcon,
  Buildings2Icon,
  CheckCircleIcon,
  ClockCircleIcon,
  DangerCircleIcon,
  UserRoundedIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { HousekeepingView } from "@/components/housekeeping/housekeeping-view";
import { HousekeepingWorkflowStrip } from "@/components/housekeeping/housekeeping-workflow-strip";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { UnavailableAction } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import {
  getCleaningRequestDetails,
  getHousekeepingStats,
  listCleaningRequests,
  listDisinfectionRecords,
  listHousekeepingStaff,
  listTodayCleaningSchedule,
} from "@/lib/data/housekeeping";

export const metadata = {
  title: "Housekeeping",
};

export default async function HousekeepingPage() {
  await connection();

  const [
    statsResult,
    requestsResult,
    requestDetailsResult,
    scheduleResult,
    staffResult,
    disinfectionResult,
  ] = await Promise.all([
    getHousekeepingStats(),
    listCleaningRequests({ pageSize: 200 }),
    getCleaningRequestDetails(),
    listTodayCleaningSchedule(),
    listHousekeepingStaff(),
    listDisinfectionRecords(),
  ]);

  const disinfection = disinfectionResult.error ? [] : disinfectionResult.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Housekeeping"
        description="Cleaning requests, assignments, disinfection, and completion verification."
        actions={
          <>
            <UnavailableAction
              label="Assign Staff"
              description="Assign housekeeping staff to a cleaning request."
              variant="secondary"
              icon={<UserRoundedIcon className="size-4" aria-hidden="true" />}
            />
            <UnavailableAction
              label="New Cleaning Request"
              description="Create a cleaning request for a room, bed, isolation area, or common space."
              icon={<BroomIcon className="size-4" aria-hidden="true" />}
            />
          </>
        }
      />

      <Alert variant="info" title="Supervisor verification required">
        Cleaning and disinfection records must be verified by housekeeping
        supervisors. This interface records and displays operational data; it
        does not determine infection-control clearance.
      </Alert>

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Open requests"
              value={statsResult.data.openRequests}
              hint="Requested, assigned, or in progress"
              icon={<BroomIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="In progress"
              value={statsResult.data.inProgress}
              hint="Cleaning underway"
              tone="info"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Completed today"
              value={statsResult.data.completedToday}
              hint="Completed or verified"
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Overdue"
              value={statsResult.data.overdue}
              hint="Past the due time"
              tone="danger"
              icon={<DangerCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Locations waiting"
              value={statsResult.data.roomsWaiting}
              hint="Rooms, beds, or areas"
              icon={<Buildings2Icon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Staff on duty"
              value={statsResult.data.staffOnDuty}
              hint="Available housekeeping staff"
              icon={<UserRoundedIcon className="size-4" aria-hidden="true" />}
            />
          </div>

          <HousekeepingWorkflowStrip
            stats={statsResult.data}
            disinfectionCount={disinfection.length}
          />
        </>
      )}

      {requestsResult.error ? (
        <ErrorState error={requestsResult.error} />
      ) : (
        <HousekeepingView
          requests={requestsResult.data.rows}
          requestDetails={
            requestDetailsResult.error ? {} : requestDetailsResult.data
          }
          todaySchedule={scheduleResult.error ? [] : scheduleResult.data}
          staff={staffResult.error ? [] : staffResult.data}
          disinfection={disinfection}
        />
      )}
    </div>
  );
}

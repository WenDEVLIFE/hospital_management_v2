import { connection } from "next/server";
import {
  CheckCircleIcon,
  ClipboardListIcon,
  ClockCircleIcon,
  DangerCircleIcon,
  HeartPulseIcon,
  UserRoundedIcon,
} from "@solar-icons/react/linear";

import { EmergencyView } from "@/components/emergency/emergency-view";
import { EmergencyWorkflowStrip } from "@/components/emergency/emergency-workflow-strip";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { UnavailableAction } from "@/components/module/unavailable-action";
import {
  getEmergencyStats,
  getEmergencyVisitDetails,
  listEmergencyVisits,
} from "@/lib/data/emergency";

export const metadata = {
  title: "Emergency Room",
};

export default async function EmergencyPage() {
  await connection();

  const [statsResult, listResult, detailsResult] = await Promise.all([
    getEmergencyStats(),
    listEmergencyVisits({ pageSize: 200 }),
    getEmergencyVisitDetails(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Room"
        description="Triage, treat, and disposition emergency patients."
        actions={
          <>
            <UnavailableAction
              label="Start Triage"
              description="Record triage level, initial vital signs, and assign the emergency care team."
              variant="secondary"
              icon={<HeartPulseIcon className="size-4" aria-hidden="true" />}
            />
            <UnavailableAction
              label="Register Emergency Patient"
              description="Create an emergency encounter and add the patient to the triage queue."
              icon={<UserRoundedIcon className="size-4" aria-hidden="true" />}
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
              label="Active cases"
              value={
                statsResult.data.total -
                statsResult.data.admitted -
                statsResult.data.transferred -
                statsResult.data.discharged
              }
              hint="Currently in the emergency department"
              icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Waiting / triage"
              value={statsResult.data.waiting + statsResult.data.triage}
              hint={`${statsResult.data.waiting} waiting · ${statsResult.data.triage} in triage`}
              tone="warning"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="In treatment"
              value={
                statsResult.data.inTreatment + statsResult.data.observation
              }
              hint={`${statsResult.data.inTreatment} treatment · ${statsResult.data.observation} observation`}
              tone="info"
              icon={<HeartPulseIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Critical"
              value={statsResult.data.critical}
              hint="Active critical triage level"
              tone="danger"
              icon={<DangerCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Admitted"
              value={statsResult.data.admitted}
              hint={`${statsResult.data.transferred} transferred · ${statsResult.data.discharged} discharged`}
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Average wait"
              value={`${statsResult.data.averageWaitMinutes} min`}
              hint="Waiting and triage cases"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
          </div>

          <EmergencyWorkflowStrip stats={statsResult.data} />
        </>
      )}

      {listResult.error ? (
        <ErrorState error={listResult.error} />
      ) : (
        <EmergencyView
          rows={listResult.data.rows}
          details={detailsResult.error ? {} : detailsResult.data}
        />
      )}
    </div>
  );
}

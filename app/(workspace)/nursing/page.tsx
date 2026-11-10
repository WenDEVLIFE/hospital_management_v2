import {
  ClipboardListIcon,
  HeartPulseIcon,
  UserRoundedIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { NursingWorkspace } from "@/components/nursing/nursing-workspace";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getNursingStats,
  listNursingAssignments,
} from "@/lib/data/nursing";
import { listStaff } from "@/lib/data/staff";

export default async function NursingPage() {
  const [assignmentsResult, statsResult, staffResult] = await Promise.all([
    listNursingAssignments(),
    getNursingStats(),
    listStaff({ pageSize: 100 }),
  ]);

  const assignments = assignmentsResult.data ?? [];

  const staffNamesByUserId: Record<string, string> = {};

  for (const staff of staffResult.data?.rows ?? []) {
    staffNamesByUserId[staff.user_id] = staff.full_name;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Nursing"
        description="Assigned patients, observations and nursing documentation."
      />

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Assigned patients"
            value={statsResult.data.assignedPatients}
            icon={<UserRoundedIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Pending assessments"
            value={statsResult.data.pendingAssessments}
            tone="warning"
            icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Vitals recorded today"
            value={statsResult.data.vitalsToday}
            tone="info"
            icon={<HeartPulseIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      )}

      {assignmentsResult.error ? (
        <ErrorState error={assignmentsResult.error} />
      ) : assignmentsResult.data ? (
        assignments.length === 0 ? (
          <PageSection>
            <EmptyState
              icon={<UserRoundedIcon className="size-5" aria-hidden="true" />}
              title="No assigned patients"
              description="Patients assigned to you will appear here."
            />
          </PageSection>
        ) : (
          <NursingWorkspace
            rows={assignments}
            staffNamesByUserId={staffNamesByUserId}
          />
        )
      ) : null}
    </div>
  );
}

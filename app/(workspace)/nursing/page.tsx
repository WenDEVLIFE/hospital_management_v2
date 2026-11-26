import {
  ClipboardListIcon,
  HeartPulseIcon,
  UserRoundedIcon,
} from "@solar-icons/react/linear";
import Link from "next/link";

import { getCurrentUserAccess } from "@/lib/auth/access";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { NursingWorkspace } from "@/components/nursing/nursing-workspace";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listNursingAssignments } from "@/lib/data/nursing";
import { manilaDate } from "@/lib/data/query";
import { getCurrentStaffId, listNurses, listStaff } from "@/lib/data/staff";

export default async function NursingPage() {
  const access = await getCurrentUserAccess();
  const canAssign = access.isAdmin;

  const [assignmentsResult, staffResult, currentStaffId] = await Promise.all([
    listNursingAssignments(),
    listStaff({ pageSize: 100 }),
    getCurrentStaffId(),
  ]);

  // Only assigners need the nurse picker. Regular nurses cannot self-assign.
  const nursesResult = canAssign
    ? await listNurses()
    : { data: [], error: null };

  const nurseNamesById = new Map(
    (nursesResult.data ?? []).map((nurse) => [nurse.id, nurse.full_name])
  );
  const staffNamesById = new Map(
    (staffResult.data?.rows ?? []).map((staff) => [staff.id, staff.full_name])
  );

  let assignments = (assignmentsResult.data ?? []).map((row) => ({
    ...row,
    assigned_staff_name: row.assigned_staff_id
      ? nurseNamesById.get(row.assigned_staff_id) ??
        staffNamesById.get(row.assigned_staff_id) ??
        null
      : null,
  }));

  // Nurses only see the patients assigned to them. Admins and physicians see
  // every admitted patient so they can make the assignment.
  if (!canAssign) {
    assignments = assignments.filter(
      (row) =>
        currentStaffId !== null && row.assigned_staff_id === currentStaffId
    );
  }

  const today = manilaDate(new Date().toISOString());
  const stats = {
    assignedPatients: assignments.filter((row) => row.assigned_staff_id)
      .length,
    pendingAssessments: assignments.reduce(
      (sum, row) => sum + row.pending_assessments,
      0
    ),
    vitalsToday: assignments.filter(
      (row) =>
        row.latest_vitals &&
        manilaDate(row.latest_vitals.recorded_at) === today
    ).length,
  };

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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Assigned patients"
          value={stats.assignedPatients}
          icon={<UserRoundedIcon className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Pending assessments"
          value={stats.pendingAssessments}
          tone="warning"
          icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Vitals recorded today"
          value={stats.vitalsToday}
          tone="info"
          icon={<HeartPulseIcon className="size-4" aria-hidden="true" />}
        />
      </div>

      {assignmentsResult.error ? (
        <ErrorState error={assignmentsResult.error} />
      ) : assignmentsResult.data ? (
        assignments.length === 0 ? (
          <PageSection>
            <EmptyState
              icon={<UserRoundedIcon className="size-5" aria-hidden="true" />}
              title={
                canAssign
                  ? "No admitted patients"
                  : "No patients assigned to you"
              }
              description={
                canAssign
                  ? "A patient must be admitted before a nurse can be assigned. Open Admissions, then assign a nurse from here."
                  : "A physician or administrator must assign patients to you before you can chart vitals, assessments, or notes."
              }
              action={
                canAssign ? (
                  <Link href="/admissions">
                    <Button variant="secondary">View admissions</Button>
                  </Link>
                ) : undefined
              }
            />
          </PageSection>
        ) : (
          <NursingWorkspace
            rows={assignments}
            staffNamesByUserId={staffNamesByUserId}
            nurses={nursesResult.data ?? []}
            currentStaffId={currentStaffId}
          />
        )
      ) : null}
    </div>
  );
}

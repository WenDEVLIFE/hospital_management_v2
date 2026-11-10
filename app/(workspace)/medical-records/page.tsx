import {
  CheckCircleIcon,
  ClipboardListIcon,
  ClockCircleIcon,
  DangerTriangleIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { MedicalRecordsView } from "@/components/medical-records/medical-records-view";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import {
  getEncounter,
  getEncounterStats,
  listEncounters,
} from "@/lib/data/medical-records";
import { listStaff } from "@/lib/data/staff";
import type { EncounterDetail } from "@/types/hospital";

export default async function MedicalRecordsPage() {
  const [listResult, statsResult, staffResult] = await Promise.all([
    listEncounters({ pageSize: 100 }),
    getEncounterStats(),
    listStaff({ pageSize: 100 }),
  ]);

  const rows = listResult.data?.rows ?? [];

  const detailResults = await Promise.all(
    rows.map((row) => getEncounter(row.id))
  );

  const detailsById: Record<string, EncounterDetail> = {};

  for (const result of detailResults) {
    if (result.data) {
      detailsById[result.data.encounter.id] = result.data;
    }
  }

  const staffNamesByUserId: Record<string, string> = {};

  for (const staff of staffResult.data?.rows ?? []) {
    staffNamesByUserId[staff.user_id] = staff.full_name;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Medical Records"
        description="Clinical encounters, vitals, diagnoses and documentation."
      />

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Open"
            value={statsResult.data.open}
            tone="info"
            icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="In Progress"
            value={statsResult.data.inProgress}
            icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Completed"
            value={statsResult.data.completed}
            tone="success"
            icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Cancelled"
            value={statsResult.data.cancelled}
            tone="danger"
            icon={<DangerTriangleIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      )}

      <PageSection
        title="Encounter register"
        description="Clinical encounters across departments. Open an encounter to review its documented record."
      >
        {listResult.error ? (
          <ErrorState error={listResult.error} />
        ) : listResult.data ? (
          <MedicalRecordsView
            rows={listResult.data.rows}
            detailsById={detailsById}
            staffNamesByUserId={staffNamesByUserId}
          />
        ) : null}
      </PageSection>
    </div>
  );
}

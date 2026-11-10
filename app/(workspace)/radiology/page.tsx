import {
  CalendarMarkIcon,
  CheckCircleIcon,
  ClockCircleIcon,
  RefreshIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { RadiologyOrdersView } from "@/components/radiology/radiology-orders-view";
import { getRadiologyStats, listRadiologyOrders } from "@/lib/data/radiology";

export default async function RadiologyPage() {
  const [listResult, statsResult] = await Promise.all([
    listRadiologyOrders({ pageSize: 100 }),
    getRadiologyStats(),
  ]);

  const stats = statsResult.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Radiology"
        description="Examination requests, scheduling and verified reports."
      />

      {statsResult.error ? <ErrorState error={statsResult.error} /> : null}

      {stats ? (
        <section aria-label="Radiology key indicators">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Pending"
              value={stats.pending}
              hint="Awaiting scheduling"
              tone="warning"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Scheduled"
              value={stats.scheduled}
              hint="Scheduled examinations"
              tone="info"
              icon={<CalendarMarkIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="In Progress"
              value={stats.inProgress}
              hint="Examinations underway"
              tone="info"
              icon={<RefreshIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              hint="Completed examinations"
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
          </div>
        </section>
      ) : null}

      <PageSection
        title="Examination Requests"
        description="Imaging requests, scheduling and report status"
      >
        {listResult.error ? (
          <ErrorState error={listResult.error} />
        ) : listResult.data ? (
          <RadiologyOrdersView rows={listResult.data.rows} />
        ) : null}
      </PageSection>
    </div>
  );
}

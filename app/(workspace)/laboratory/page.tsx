import {
  CheckCircleIcon,
  ClockCircleIcon,
  RefreshIcon,
  TestTubeIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { LabOrdersView } from "@/components/laboratory/lab-orders-view";
import { LabWorkflowStrip } from "@/components/laboratory/lab-workflow-strip";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { getLabStats, listLabOrders } from "@/lib/data/laboratory";

export default async function LaboratoryPage() {
  const [listResult, statsResult] = await Promise.all([
    listLabOrders({ pageSize: 100 }),
    getLabStats(),
  ]);

  const stats = statsResult.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Laboratory"
        description="Requests, specimens and verified results."
      />

      {statsResult.error ? <ErrorState error={statsResult.error} /> : null}

      {stats ? (
        <section aria-label="Laboratory key indicators">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Pending"
              value={stats.pending}
              hint="Awaiting specimen collection"
              tone="warning"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Collection"
              value={stats.collection}
              hint="Specimen collection stage"
              tone="info"
              icon={<TestTubeIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Processing"
              value={stats.processing}
              hint="Analysis in progress"
              tone="info"
              icon={<RefreshIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              hint="Completed requests"
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
          </div>
        </section>
      ) : null}

      {stats ? (
        <PageSection
          title="Laboratory Workflow"
          description="Requested, collected, processed, verified and completed stages"
          dense
        >
          <LabWorkflowStrip
            counts={{
              pending: stats.pending,
              collection: stats.collection,
              processing: stats.processing,
              completed: stats.completed,
            }}
          />
        </PageSection>
      ) : null}

      <PageSection
        title="Laboratory Requests"
        description="Requests, specimens and processing status"
      >
        {listResult.error ? (
          <ErrorState error={listResult.error} />
        ) : listResult.data ? (
          <LabOrdersView rows={listResult.data.rows} />
        ) : null}
      </PageSection>
    </div>
  );
}

import {
  ClockCircleIcon,
  DangerCircleIcon,
  HistoryIcon,
} from "@solar-icons/react/linear";

import { AuditLogsTable } from "@/components/audit/audit-logs-table";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { Alert } from "@/components/ui/alert";
import { getAuditStats, listAuditLogs } from "@/lib/data/audit";

export const metadata = {
  title: "Audit Logs",
};

export default async function AuditLogsPage() {
  const [listResult, statsResult] = await Promise.all([
    listAuditLogs({ pageSize: 200 }),
    getAuditStats(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Accountability trail for sensitive operations."
      />

      <Alert variant="info">
        Audit records cannot be edited or deleted from the interface.
      </Alert>

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total events"
            value={statsResult.data.total}
            icon={<HistoryIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Today"
            value={statsResult.data.today}
            tone="info"
            icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Failed actions"
            value={statsResult.data.failed}
            tone="danger"
            icon={<DangerCircleIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      )}

      <PageSection
        title="Audit trail"
        description="Chronological record of sensitive operations."
      >
        {listResult.error ? (
          <ErrorState error={listResult.error} />
        ) : (
          <AuditLogsTable rows={listResult.data.rows} />
        )}
      </PageSection>
    </div>
  );
}

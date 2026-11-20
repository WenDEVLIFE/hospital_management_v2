import { Suspense } from "react";

import { AdmissionTrendChart } from "@/components/dashboard/admission-trend-chart";
import { AppointmentBreakdown } from "@/components/dashboard/appointment-breakdown";
import { DashboardMetrics } from "@/components/dashboard/metric-grid";
import { PendingActivities } from "@/components/dashboard/pending-activities";
import { RecentRegistrationsTable } from "@/components/dashboard/recent-registrations-table";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { MetricCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/module/error-state";
import { getDashboardOverview } from "@/lib/data/dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" description="Hospital operations overview" />
      <Suspense fallback={<DashboardLoading />}>
        <DashboardData />
      </Suspense>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">Loading dashboard metrics</span>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <MetricCardSkeleton key={index} />)}
      </div>
      <Skeleton aria-hidden="true" className="h-64" />
    </div>
  );
}

async function DashboardData() {
  const result = await getDashboardOverview();

  if (result.error) {
    return <ErrorState error={result.error} />;
  }

  const {
    metrics,
    admissionTrend,
    appointmentBreakdown,
    recentRegistrations,
    pendingActivities,
  } = result.data;

  return (
    <>
      <section aria-label="Key hospital metrics">
        <DashboardMetrics metrics={metrics} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <PageSection
          title="Patient Admission Trends"
          description="Admissions and discharges by month"
        >
          <AdmissionTrendChart data={admissionTrend} />
        </PageSection>

        <PageSection
          title="Appointment Overview"
          description="Appointments grouped by current status"
        >
          <AppointmentBreakdown data={appointmentBreakdown} />
        </PageSection>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PageSection
          title="Recent Patient Registrations"
          description="Latest patients added to the registry"
        >
          <RecentRegistrationsTable rows={recentRegistrations} />
        </PageSection>

        <PageSection
          title="Pending Activities"
          description="Operational queues that need attention"
        >
          <PendingActivities activities={pendingActivities} />
        </PageSection>
      </div>
    </>
  );
}

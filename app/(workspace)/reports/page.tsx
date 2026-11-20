import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { ReportRangeControls } from "@/components/reports/report-range-controls";
import { ReportsCategoryGrid } from "@/components/reports/reports-category-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { getReportRange, listReportCategories } from "@/lib/data/reports";

export const metadata = {
  title: "Reports & Analytics",
};

async function CurrentReportRange() {
  await connection();
  const result = await getReportRange();

  return result.error ? (
    <ErrorState error={result.error} />
  ) : (
    <ReportRangeControls
      defaultStart={result.data.start}
      defaultEnd={result.data.end}
      defaultLabel={result.data.label}
    />
  );
}

export default async function ReportsPage() {
  const categoriesResult = await listReportCategories();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Operational and financial reporting by category."
      />

      <Suspense fallback={<Skeleton className="h-32" aria-hidden="true" />}>
        <CurrentReportRange />
      </Suspense>

      <Alert variant="info">
        Statistics are only official when produced from authorized hospital
        data.
      </Alert>

      {categoriesResult.error ? (
        <ErrorState error={categoriesResult.error} />
      ) : (
        <PageSection
          title="Report categories"
          description="Select a category to review the columns and available formats."
        >
          <ReportsCategoryGrid cards={categoriesResult.data} />
        </PageSection>
      )}
    </div>
  );
}

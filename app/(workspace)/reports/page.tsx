import { connection } from "next/server";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { ReportRangeControls } from "@/components/reports/report-range-controls";
import { ReportsCategoryGrid } from "@/components/reports/reports-category-grid";
import { Alert } from "@/components/ui/alert";
import { getReportRange, listReportCategories } from "@/lib/data/reports";

export const metadata = {
  title: "Reports & Analytics",
};

export default async function ReportsPage() {
  await connection();

  const [categoriesResult, rangeResult] = await Promise.all([
    listReportCategories(),
    getReportRange(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Operational and financial reporting by category."
      />

      {rangeResult.error ? (
        <ErrorState error={rangeResult.error} />
      ) : (
        <ReportRangeControls
          defaultStart={rangeResult.data.start}
          defaultEnd={rangeResult.data.end}
          defaultLabel={rangeResult.data.label}
        />
      )}

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

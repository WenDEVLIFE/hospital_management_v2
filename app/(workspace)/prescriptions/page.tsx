import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { NewPrescriptionButton } from "@/components/pharmacy/new-prescription-button";
import { PrescriptionsView } from "@/components/pharmacy/prescriptions-view";
import { listPrescriptions } from "@/lib/data/pharmacy";

export default async function PrescriptionsPage() {
  const result = await listPrescriptions({ pageSize: 100 });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Prescriptions"
        description="Medication orders issued during encounters."
        actions={<NewPrescriptionButton />}
      />

      <PageSection
        title="Prescription Records"
        description="Medication orders and dispensing status"
      >
        {result.error ? (
          <ErrorState error={result.error} />
        ) : result.data ? (
          <PrescriptionsView rows={result.data.rows} />
        ) : null}
      </PageSection>
    </div>
  );
}

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { NewPrescriptionButton } from "@/components/pharmacy/new-prescription-button";
import { PrescriptionsView } from "@/components/pharmacy/prescriptions-view";
import { accessCan, getCurrentUserAccess } from "@/lib/auth/access";
import {
  listPrescriptionFormOptions,
  listPrescriptions,
} from "@/lib/data/pharmacy";

export default async function PrescriptionsPage() {
  const [access, result, optionsResult] = await Promise.all([
    getCurrentUserAccess(),
    listPrescriptions({ pageSize: 100 }),
    listPrescriptionFormOptions(),
  ]);

  const canCreate = accessCan(access, "prescription.create");
  const options = optionsResult.data ?? { encounters: [], medications: [] };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Prescriptions"
        description="Medication orders issued during encounters."
        actions={
          canCreate ? (
            <NewPrescriptionButton
              encounters={options.encounters}
              medications={options.medications}
              optionsError={optionsResult.error?.message ?? null}
            />
          ) : null
        }
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

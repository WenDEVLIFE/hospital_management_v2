import {
  BoxIcon,
  CheckCircleIcon,
  ClockCircleIcon,
  DangerCircleIcon,
  DangerTriangleIcon,
  Pills2Icon,
  RefreshIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { PharmacyView } from "@/components/pharmacy/pharmacy-view";
import {
  getPharmacyStats,
  listMedicationStock,
  listPrescriptions,
} from "@/lib/data/pharmacy";

export default async function PharmacyPage() {
  const [prescriptionsResult, medicationsResult, statsResult] =
    await Promise.all([
      listPrescriptions({ pageSize: 100 }),
      listMedicationStock({ pageSize: 100 }),
      getPharmacyStats(),
    ]);

  const stats = statsResult.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pharmacy"
        description="Prescription queue, dispensing and medication stock."
      />

      {statsResult.error ? <ErrorState error={statsResult.error} /> : null}

      {stats ? (
        <section aria-label="Pharmacy key indicators">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Pending Prescriptions"
              value={stats.pending}
              hint="Awaiting dispensing"
              tone="warning"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Partially Dispensed"
              value={stats.partiallyDispensed}
              hint="Partially fulfilled"
              tone="info"
              icon={<RefreshIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Dispensed"
              value={stats.dispensed}
              hint="Completed dispensing"
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Low Stock"
              value={stats.lowStock}
              hint="At or below reorder level"
              tone="warning"
              icon={
                <DangerTriangleIcon className="size-4" aria-hidden="true" />
              }
            />
            <StatCard
              label="Out of Stock"
              value={stats.outOfStock}
              hint="Unavailable medicines"
              tone="danger"
              icon={<DangerCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Expiring Soon"
              value={stats.expiringSoon}
              hint="Near expiry medicines"
              tone="warning"
              icon={<BoxIcon className="size-4" aria-hidden="true" />}
            />
          </div>
        </section>
      ) : null}

      <PageSection
        title="Dispensing and Inventory"
        description="Prescription queue and medication stock"
      >
        <div className="mb-3 flex items-center gap-2 text-[11px] text-hospital-text-muted">
          <Pills2Icon className="size-4" aria-hidden="true" />
          <span>
            Dispensing records and inventory movements are recorded together.
          </span>
        </div>
        <PharmacyView
          prescriptions={prescriptionsResult.data?.rows ?? []}
          medications={medicationsResult.data?.rows ?? []}
          prescriptionsError={prescriptionsResult.error}
          medicationsError={medicationsResult.error}
        />
      </PageSection>
    </div>
  );
}

import {
  BoxIcon,
  CheckCircleIcon,
  ClockCircleIcon,
  DangerCircleIcon,
  DangerTriangleIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { InventoryView } from "@/components/inventory/inventory-view";
import { StockActions } from "@/components/inventory/stock-actions";
import {
  getInventoryStats,
  listInventoryCategories,
  listInventoryItems,
  listStockTransactions,
} from "@/lib/data/inventory";

export const metadata = {
  title: "Inventory",
};

export default async function InventoryPage() {
  const [statsResult, itemResult, categoryResult, transactionResult] =
    await Promise.all([
      getInventoryStats(),
      listInventoryItems({ pageSize: 200 }),
      listInventoryCategories(),
      listStockTransactions({ pageSize: 300 }),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Medical supplies, stock levels and movements."
        actions={<StockActions />}
      />

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Total items"
            value={statsResult.data.totalItems}
            icon={<BoxIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Available stock"
            value={statsResult.data.available}
            tone="success"
            icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Low stock"
            value={statsResult.data.lowStock}
            tone="warning"
            icon={<DangerTriangleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Out of stock"
            value={statsResult.data.outOfStock}
            tone="danger"
            icon={<DangerCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Expiring soon"
            value={statsResult.data.expiringSoon}
            tone="info"
            icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      )}

      {itemResult.error ? <ErrorState error={itemResult.error} /> : null}
      {transactionResult.error ? (
        <ErrorState error={transactionResult.error} />
      ) : null}

      <PageSection
        title="Inventory"
        description="Item quantities, reorder levels and stock movement history."
      >
        {itemResult.data ? (
          <InventoryView
            items={itemResult.data.rows}
            categories={categoryResult.data ?? []}
            transactions={transactionResult.data?.rows ?? []}
          />
        ) : null}
      </PageSection>
    </div>
  );
}

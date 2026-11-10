import {
  BillListIcon,
  CheckCircleIcon,
  ClockCircleIcon,
  DangerCircleIcon,
  WalletMoneyIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { BillingView } from "@/components/billing/billing-view";
import { CreateInvoiceAction } from "@/components/billing/create-invoice-action";
import { getBillingStats, listInvoices, listPayments } from "@/lib/data/billing";
import { formatCurrency } from "@/lib/format";

export const metadata = {
  title: "Billing",
};

export default async function BillingPage() {
  const [statsResult, invoiceResult, paymentResult] = await Promise.all([
    getBillingStats(),
    listInvoices({ pageSize: 200 }),
    listPayments({ pageSize: 500 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Invoices, charges and outstanding balances."
        actions={<CreateInvoiceAction />}
      />

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Total billing"
            value={formatCurrency(statsResult.data.totalBilled)}
            hint={`${statsResult.data.totalInvoices} invoices`}
            icon={<BillListIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Total paid"
            value={formatCurrency(statsResult.data.totalPaid)}
            tone="success"
            icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Outstanding balance"
            value={formatCurrency(statsResult.data.outstandingBalance)}
            tone="danger"
            icon={<DangerCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Unpaid invoices"
            value={statsResult.data.unpaid}
            hint={`${statsResult.data.partiallyPaid} partially paid`}
            tone="warning"
            icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Payments today"
            value={statsResult.data.paymentsToday}
            tone="info"
            icon={<WalletMoneyIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      )}

      <PageSection
        title="Invoices"
        description="Patient invoices with payment status and outstanding balances."
      >
        {invoiceResult.error ? (
          <ErrorState error={invoiceResult.error} />
        ) : invoiceResult.data ? (
          <BillingView
            invoices={invoiceResult.data.rows}
            payments={paymentResult.data?.rows ?? []}
          />
        ) : null}
      </PageSection>
    </div>
  );
}

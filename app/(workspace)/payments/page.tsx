import {
  CheckCircleIcon,
  ClockCircleIcon,
  RefreshIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { PaymentsView } from "@/components/payments/payments-view";
import { RecordPaymentAction } from "@/components/payments/record-payment-action";
import { getBillingStats, listPayments } from "@/lib/data/billing";
import { formatCurrency } from "@/lib/format";

export const metadata = {
  title: "Payments",
};

export default async function PaymentsPage() {
  const [statsResult, paymentResult] = await Promise.all([
    getBillingStats(),
    listPayments({ pageSize: 500 }),
  ]);

  const payments = paymentResult.data?.rows ?? [];
  const totalCollected = payments
    .filter((payment) => payment.payment_status === "completed")
    .reduce((total, payment) => total + payment.amount, 0);
  const refundedPayments = payments.filter(
    (payment) => payment.payment_status === "refunded"
  );
  const refundedTotal = refundedPayments.reduce(
    (total, payment) => total + payment.amount,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Recorded payments and transaction references."
        actions={<RecordPaymentAction />}
      />

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Total collected"
            value={formatCurrency(totalCollected)}
            hint="Completed payments"
            tone="success"
            icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Payments today"
            value={statsResult.data.paymentsToday}
            tone="info"
            icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Refunded"
            value={formatCurrency(refundedTotal)}
            hint={`${refundedPayments.length} refunded transactions`}
            tone="danger"
            icon={<RefreshIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      )}

      <PageSection
        title="Recorded payments"
        description="Payment transactions with invoice references and receiving staff."
      >
        {paymentResult.error ? (
          <ErrorState error={paymentResult.error} />
        ) : paymentResult.data ? (
          <PaymentsView payments={paymentResult.data.rows} />
        ) : null}
      </PageSection>
    </div>
  );
}

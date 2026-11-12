import { connection } from "next/server";
import {
  BillListIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  WalletMoneyIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { UnavailableAction } from "@/components/module/unavailable-action";
import { InsuranceView } from "@/components/insurance/insurance-view";
import { InsuranceWorkflowStrip } from "@/components/insurance/insurance-workflow-strip";
import { Alert } from "@/components/ui/alert";
import {
  getInsuranceClaimDetails,
  getInsurancePolicyDetails,
  getInsuranceStats,
  listAuthorizations,
  listClaims,
  listInsuranceBenefits,
  listInsurancePolicies,
  listInsuranceProviders,
} from "@/lib/data/insurance";
import { formatCurrency } from "@/lib/format";

export const metadata = {
  title: "Insurance & PhilHealth",
};

export default async function InsurancePage() {
  await connection();

  const [
    statsResult,
    policiesResult,
    policyDetailsResult,
    authorizationsResult,
    claimsResult,
    claimDetailsResult,
    providersResult,
    benefitsResult,
  ] = await Promise.all([
    getInsuranceStats(),
    listInsurancePolicies({ pageSize: 200 }),
    getInsurancePolicyDetails(),
    listAuthorizations({ pageSize: 200 }),
    listClaims({ pageSize: 200 }),
    getInsuranceClaimDetails(),
    listInsuranceProviders(),
    listInsuranceBenefits(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance & PhilHealth"
        description="Patient policies, coverage verification, authorizations, and claims."
        actions={
          <>
            <UnavailableAction
              label="Verify Coverage"
              description="Record a manual eligibility verification with the patient's insurer."
              variant="secondary"
              icon={<ShieldCheckIcon className="size-4" aria-hidden="true" />}
            />
            <UnavailableAction
              label="Create Claim"
              description="Prepare an insurance claim from an encounter or admission."
              icon={<BillListIcon className="size-4" aria-hidden="true" />}
            />
          </>
        }
      />

      <Alert variant="info" title="Manual insurance workflow">
        PhilHealth and insurer integrations are not connected. Eligibility
        checks, authorizations, claim submission, and payment monitoring are
        recorded manually; the system does not process claims automatically.
      </Alert>

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Active policies"
              value={statsResult.data.activePolicies}
              hint="Patient policies on file"
              icon={<ShieldCheckIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Pending verification"
              value={statsResult.data.pendingVerifications}
              hint="Coverage not yet confirmed"
              tone="warning"
              icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Pending authorizations"
              value={statsResult.data.pendingAuthorizations}
              hint="Awaiting insurer review"
              tone="warning"
              icon={<DocumentTextIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Claims in review"
              value={statsResult.data.claimsInReview}
              hint="Submitted or under review"
              tone="info"
              icon={<BillListIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Approved claims"
              value={statsResult.data.approvedClaims}
              hint="Approved or paid"
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Outstanding claims"
              value={formatCurrency(statsResult.data.outstandingClaimAmount)}
              hint="Approved unpaid plus in review"
              icon={<WalletMoneyIcon className="size-4" aria-hidden="true" />}
            />
          </div>

          <InsuranceWorkflowStrip stats={statsResult.data} />
        </>
      )}

      {policiesResult.error ? (
        <ErrorState error={policiesResult.error} />
      ) : (
        <InsuranceView
          policies={policiesResult.data.rows}
          policyDetails={
            policyDetailsResult.error ? {} : policyDetailsResult.data
          }
          authorizations={
            authorizationsResult.error ? [] : authorizationsResult.data.rows
          }
          claims={claimsResult.error ? [] : claimsResult.data.rows}
          claimDetails={
            claimDetailsResult.error ? {} : claimDetailsResult.data
          }
          providers={providersResult.error ? [] : providersResult.data}
          benefits={benefitsResult.error ? [] : benefitsResult.data}
        />
      )}
    </div>
  );
}

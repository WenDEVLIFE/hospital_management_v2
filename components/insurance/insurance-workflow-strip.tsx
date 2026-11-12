import { AltArrowRightIcon } from "@solar-icons/react/linear";

import type { InsuranceStats } from "@/types/hospital";
import { formatCurrency } from "@/lib/format";

export interface InsuranceWorkflowStripProps {
  stats: InsuranceStats;
}

export function InsuranceWorkflowStrip({ stats }: InsuranceWorkflowStripProps) {
  const stages = [
    {
      key: "policy",
      label: "Patient policy",
      countLabel: `${stats.activePolicies} active`,
    },
    {
      key: "verification",
      label: "Coverage verification",
      countLabel: `${stats.pendingVerifications} pending`,
    },
    {
      key: "authorization",
      label: "Authorization",
      countLabel: `${stats.pendingAuthorizations} pending`,
    },
    {
      key: "claims",
      label: "Claims in review",
      countLabel: `${stats.claimsInReview} active`,
    },
    {
      key: "approved",
      label: "Approved claims",
      countLabel: `${stats.approvedClaims} approved`,
    },
    {
      key: "payment",
      label: "Payment monitoring",
      countLabel: formatCurrency(stats.outstandingClaimAmount),
    },
  ];

  return (
    <section aria-label="Insurance and PhilHealth workflow stages">
      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-max items-stretch gap-2">
          {stages.map((stage, index) => (
            <li key={stage.key} className="flex items-center gap-2">
              <div className="flex min-w-[8rem] flex-col rounded-md border border-hospital-border bg-hospital-surface px-3 py-2">
                <span className="text-[11px] font-medium text-hospital-text-subtle">
                  Step {index + 1}
                </span>
                <span className="mt-0.5 text-sm font-medium text-hospital-text">
                  {stage.label}
                </span>
                <span className="mt-0.5 text-[11px] text-hospital-text-muted">
                  {stage.countLabel}
                </span>
              </div>

              {index < stages.length - 1 ? (
                <AltArrowRightIcon
                  className="size-4 shrink-0 text-hospital-text-subtle"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

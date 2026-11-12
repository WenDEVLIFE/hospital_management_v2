import { AltArrowRightIcon } from "@solar-icons/react/linear";

import type { BloodBankStats } from "@/types/hospital";

export interface BloodBankWorkflowStripProps {
  stats: BloodBankStats;
  donorCount: number;
  eligibleDonors: number;
  screenedUnits: number;
}

export function BloodBankWorkflowStrip({
  stats,
  donorCount,
  eligibleDonors,
  screenedUnits,
}: BloodBankWorkflowStripProps) {
  const stages = [
    {
      key: "donor",
      label: "Donor registration",
      countLabel: `${donorCount} donors`,
    },
    {
      key: "eligibility",
      label: "Eligibility",
      countLabel: `${eligibleDonors} eligible`,
    },
    {
      key: "testing",
      label: "Donation & testing",
      countLabel: `${screenedUnits} units screened`,
    },
    {
      key: "inventory",
      label: "Component inventory",
      countLabel: `${stats.unitsInStock} in stock`,
    },
    {
      key: "requests",
      label: "Request & crossmatch",
      countLabel: `${stats.pendingRequests} pending · ${stats.crossmatchesPending} crossmatch`,
    },
    {
      key: "issue",
      label: "Issue & transfusion",
      countLabel: `${stats.issuedToday} issued today`,
    },
  ];

  return (
    <section aria-label="Blood bank workflow stages">
      <div className="overflow-x-auto pb-1">
        <ol className="flex min-w-max items-stretch gap-2">
          {stages.map((stage, index) => (
            <li key={stage.key} className="flex items-center gap-2">
              <div className="flex min-w-[8.5rem] flex-col rounded-md border border-hospital-border bg-hospital-surface px-3 py-2">
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

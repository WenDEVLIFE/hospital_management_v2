import { AltArrowRightIcon } from "@solar-icons/react/linear";

import type { MortuaryStats } from "@/types/hospital";

export interface MortuaryWorkflowStripProps {
  stats: MortuaryStats;
}

export function MortuaryWorkflowStrip({ stats }: MortuaryWorkflowStripProps) {
  const stages = [
    {
      key: "record",
      label: "Death record",
      countLabel: `${stats.bodiesInCustody} in custody`,
    },
    {
      key: "admission",
      label: "Mortuary admission",
      countLabel: `${stats.admittedToday} today`,
    },
    {
      key: "identification",
      label: "Identification",
      countLabel: `${stats.unidentified} pending`,
    },
    {
      key: "storage",
      label: "Storage assignment",
      countLabel: `${stats.storageOccupied}/${stats.storageTotal} occupied`,
    },
    {
      key: "authorization",
      label: "Release authorization",
      countLabel: `${stats.pendingRelease} pending`,
    },
    {
      key: "release",
      label: "Release",
      countLabel: `${stats.releasedToday} today`,
    },
  ];

  return (
    <section aria-label="Mortuary workflow stages">
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

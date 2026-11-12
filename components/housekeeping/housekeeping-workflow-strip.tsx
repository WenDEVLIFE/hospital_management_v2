import { AltArrowRightIcon } from "@solar-icons/react/linear";

import type { HousekeepingStats } from "@/types/hospital";

export interface HousekeepingWorkflowStripProps {
  stats: HousekeepingStats;
  disinfectionCount: number;
}

export function HousekeepingWorkflowStrip({
  stats,
  disinfectionCount,
}: HousekeepingWorkflowStripProps) {
  const stages = [
    {
      key: "request",
      label: "Cleaning request",
      countLabel: `${stats.openRequests} open`,
    },
    {
      key: "assignment",
      label: "Assignment",
      countLabel: `${stats.roomsWaiting} locations`,
    },
    {
      key: "cleaning",
      label: "Cleaning",
      countLabel: `${stats.inProgress} in progress`,
    },
    {
      key: "disinfection",
      label: "Disinfection",
      countLabel: `${disinfectionCount} records`,
    },
    {
      key: "verification",
      label: "Verification",
      countLabel: `${stats.completedToday} today`,
    },
    {
      key: "overdue",
      label: "Overdue",
      countLabel: `${stats.overdue} overdue`,
    },
  ];

  return (
    <section aria-label="Housekeeping workflow stages">
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

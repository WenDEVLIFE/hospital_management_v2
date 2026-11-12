import { AltArrowRightIcon } from "@solar-icons/react/linear";

import type { AmbulanceStats } from "@/types/hospital";

export interface AmbulanceWorkflowStripProps {
  stats: AmbulanceStats;
}

export function AmbulanceWorkflowStrip({ stats }: AmbulanceWorkflowStripProps) {
  const stages = [
    { key: "request", label: "Request", countLabel: `${stats.requested} pending` },
    {
      key: "dispatch",
      label: "Dispatch",
      countLabel: `${stats.available} units available`,
    },
    { key: "en_route", label: "En route", countLabel: `${stats.enRoute} en route` },
    {
      key: "transport",
      label: "Transport",
      countLabel: `${stats.transporting} transporting`,
    },
    {
      key: "complete",
      label: "Arrival / complete",
      countLabel: `${stats.completedTrips} completed`,
    },
    { key: "today", label: "Today", countLabel: `${stats.tripsToday} trips today` },
  ];

  return (
    <section aria-label="Ambulance dispatch workflow stages">
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

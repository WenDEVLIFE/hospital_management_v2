import { AltArrowRightIcon } from "@solar-icons/react/linear";

import type { SurgeryStats } from "@/types/hospital";

export interface SurgeryWorkflowStripProps {
  stats: SurgeryStats;
}

export function SurgeryWorkflowStrip({ stats }: SurgeryWorkflowStripProps) {
  const stages = [
    {
      key: "requested",
      label: "Request",
      countLabel: `${stats.requested} pending`,
    },
    { key: "pre_op", label: "Pre-op", countLabel: `${stats.preOp} awaiting` },
    { key: "scheduled", label: "Scheduled", countLabel: `${stats.scheduled} scheduled` },
    { key: "in_progress", label: "In OR", countLabel: `${stats.inProgress} active` },
    { key: "recovery", label: "Recovery", countLabel: `${stats.recovery} in PACU` },
    { key: "completed", label: "Completed", countLabel: `${stats.completed} completed` },
  ];

  return (
    <section aria-label="Surgery and operating room workflow stages">
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

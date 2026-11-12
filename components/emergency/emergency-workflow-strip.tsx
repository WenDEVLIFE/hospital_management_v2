import { AltArrowRightIcon } from "@solar-icons/react/linear";

import type { EmergencyStats } from "@/types/hospital";

export interface EmergencyWorkflowStripProps {
  stats: EmergencyStats;
}

export function EmergencyWorkflowStrip({ stats }: EmergencyWorkflowStripProps) {
  const stages = [
    { key: "arrival", label: "Arrival", countLabel: `${stats.total} registered` },
    { key: "triage", label: "Triage", countLabel: `${stats.triage} in triage` },
    { key: "waiting", label: "Waiting", countLabel: `${stats.waiting} waiting` },
    {
      key: "treatment",
      label: "Treatment",
      countLabel: `${stats.inTreatment} in treatment`,
    },
    {
      key: "observation",
      label: "Observation",
      countLabel: `${stats.observation} under observation`,
    },
    {
      key: "disposition",
      label: "Disposition",
      countLabel: `${stats.admitted + stats.transferred + stats.discharged} completed`,
    },
  ];

  return (
    <section aria-label="Emergency department workflow stages">
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

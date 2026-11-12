import { AltArrowRightIcon } from "@solar-icons/react/linear";

import type { DietaryStats } from "@/types/hospital";

export interface DietaryWorkflowStripProps {
  stats: DietaryStats;
}

export function DietaryWorkflowStrip({ stats }: DietaryWorkflowStripProps) {
  const stages = [
    {
      key: "assessment",
      label: "Dietary assessment",
      countLabel: `${stats.activeOrders} active orders`,
    },
    {
      key: "diet",
      label: "Therapeutic diet",
      countLabel: `${stats.therapeuticDiets} configured`,
    },
    {
      key: "preparation",
      label: "Meal preparation",
      countLabel: `${stats.preparationPending} preparing`,
    },
    {
      key: "meals",
      label: "Meals today",
      countLabel: `${stats.mealsToday} scheduled`,
    },
    {
      key: "delivery",
      label: "Delivery confirmation",
      countLabel: `${stats.deliveredToday} delivered`,
    },
    {
      key: "alerts",
      label: "Allergy alerts",
      countLabel: `${stats.allergyAlerts} active`,
    },
  ];

  return (
    <section aria-label="Dietary workflow stages">
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

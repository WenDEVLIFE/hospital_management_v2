import { AltArrowRightIcon } from "@solar-icons/react/linear";

import type { EquipmentStats } from "@/types/hospital";

export interface EquipmentWorkflowStripProps {
  stats: EquipmentStats;
  historyCount: number;
}

export function EquipmentWorkflowStrip({
  stats,
  historyCount,
}: EquipmentWorkflowStripProps) {
  const stages = [
    {
      key: "register",
      label: "Equipment register",
      countLabel: `${stats.totalEquipment} assets`,
    },
    {
      key: "assignment",
      label: "Department assignment",
      countLabel: `${stats.available} available`,
    },
    {
      key: "schedule",
      label: "Maintenance schedule",
      countLabel: `${stats.overdueMaintenance} overdue`,
    },
    {
      key: "work_order",
      label: "Work orders",
      countLabel: `${stats.openWorkOrders} open`,
    },
    {
      key: "calibration",
      label: "Calibration",
      countLabel: `${stats.calibrationsDue} due`,
    },
    {
      key: "history",
      label: "Maintenance history",
      countLabel: `${historyCount} records`,
    },
  ];

  return (
    <section aria-label="Equipment maintenance workflow stages">
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

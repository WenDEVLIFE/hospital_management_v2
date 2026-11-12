import { AltArrowRightIcon } from "@solar-icons/react/linear";

import type { NotificationStats } from "@/types/hospital";

export interface NotificationsWorkflowStripProps {
  stats: NotificationStats;
}

export function NotificationsWorkflowStrip({
  stats,
}: NotificationsWorkflowStripProps) {
  const delivered = Math.max(0, stats.total - stats.queued - stats.failed);
  const read = Math.max(0, stats.total - stats.unread);
  const stages = [
    {
      key: "event",
      label: "Event notification",
      countLabel: `${stats.total} total`,
    },
    {
      key: "queued",
      label: "Queued",
      countLabel: `${stats.queued} queued`,
    },
    {
      key: "delivery",
      label: "Channel delivery",
      countLabel: `${delivered} in delivery`,
    },
    {
      key: "read",
      label: "Read / acknowledged",
      countLabel: `${read} read`,
    },
    {
      key: "critical",
      label: "Critical",
      countLabel: `${stats.critical} critical`,
    },
    {
      key: "failed",
      label: "Delivery failures",
      countLabel: `${stats.failed} failed`,
    },
  ];

  return (
    <section aria-label="Notification workflow stages">
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

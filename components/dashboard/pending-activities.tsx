import Link from "next/link";
import {
  AltArrowRightIcon,
  ClipboardListIcon,
  Pills2Icon,
  Scanner2Icon,
  TestTubeIcon,
  WalletMoneyIcon,
} from "@solar-icons/react/linear";

import { EmptyState } from "@/components/ui/empty-state";
import type { IconComponent } from "@/lib/navigation";
import type { DashboardOverview } from "@/types/hospital";

export interface PendingActivitiesProps {
  activities: DashboardOverview["pendingActivities"];
}

const MODULE_ICONS: Record<string, IconComponent> = {
  Laboratory: TestTubeIcon,
  Pharmacy: Pills2Icon,
  Radiology: Scanner2Icon,
  Billing: WalletMoneyIcon,
};

export function PendingActivities({ activities }: PendingActivitiesProps) {
  if (activities.length === 0) {
    return (
      <EmptyState
        title="No pending activities"
        description="Operational queues are clear."
        icon={<ClipboardListIcon className="size-5" />}
        className="px-0 py-8"
      />
    );
  }

  return (
    <ul className="divide-y divide-hospital-border-subtle">
      {activities.map((item) => {
        const Icon = MODULE_ICONS[item.module] ?? ClipboardListIcon;

        return (
          <li key={item.id}>
            <Link
              href={item.href}
              className="-mx-2 flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-hospital-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
            >
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-md bg-hospital-surface-muted text-hospital-text-muted"
              >
                <Icon className="size-4" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-hospital-text">
                  {item.label}
                </span>
                <span className="block text-[11px] text-hospital-text-muted">
                  {item.module}
                </span>
              </span>

              <span className="shrink-0 text-sm font-semibold tabular-nums text-hospital-text">
                {item.count.toLocaleString("en-PH")}
              </span>

              <AltArrowRightIcon
                className="size-4 shrink-0 text-hospital-text-subtle"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

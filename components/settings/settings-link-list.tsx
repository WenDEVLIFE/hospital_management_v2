import Link from "next/link";
import { AltArrowRightIcon } from "@solar-icons/react/linear";

import type { IconComponent } from "@/lib/navigation";

export type SettingsLink = {
  href: string;
  title: string;
  description: string;
  icon: IconComponent;
};

export interface SettingsLinkListProps {
  items: SettingsLink[];
}

export function SettingsLinkList({ items }: SettingsLinkListProps) {
  return (
    <ul className="divide-y divide-hospital-border-subtle">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group -mx-2 flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-hospital-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-hospital-green-light text-hospital-green">
                <Icon className="size-4" aria-hidden="true" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-hospital-text">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs text-hospital-text-muted">
                  {item.description}
                </span>
              </span>

              <AltArrowRightIcon
                className="size-4 shrink-0 text-hospital-text-muted transition-colors group-hover:text-hospital-green"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

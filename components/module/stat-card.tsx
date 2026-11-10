import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatTone = "default" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<StatTone, string> = {
  default: "bg-hospital-green-light text-hospital-green",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-700",
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: StatTone;
  className?: string;
}

/**
 * Compact KPI card used across module dashboards (THEME.MD §8.1).
 * Flat white surface, 1px border, no gradient or glow.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-md border border-hospital-border bg-white p-4 shadow-xs",
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-hospital-text-muted">{label}</p>
        <p className="mt-1 text-xl font-semibold leading-tight text-hospital-text">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-[11px] text-hospital-text-subtle">{hint}</p>
        ) : null}
      </div>

      {icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            TONE_CLASSES[tone]
          )}
        >
          {icon}
        </span>
      ) : null}
    </div>
  );
}

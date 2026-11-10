import * as React from "react";
import { cn } from "@/lib/utils";

export type PageSectionProps = {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  dense?: boolean;
  children: React.ReactNode;
};

export function PageSection({
  title,
  description,
  actions,
  dense = false,
  children,
}: PageSectionProps) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <section className="rounded-md border border-hospital-border bg-white shadow-xs">
      {hasHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hospital-border-subtle p-5">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-sm font-semibold text-hospital-text">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-xs text-hospital-text-muted">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}

      <div className={cn(dense ? "p-4" : "p-5")}>{children}</div>
    </section>
  );
}

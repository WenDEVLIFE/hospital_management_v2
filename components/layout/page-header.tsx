import * as React from "react";

export type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <div>
      {breadcrumbs ? <div className="mb-3">{breadcrumbs}</div> : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-normal text-hospital-green-dark">
            {title}
          </h1>
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

      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

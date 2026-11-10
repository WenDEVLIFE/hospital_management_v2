import * as React from "react";
import { FolderErrorIcon } from "@solar-icons/react/linear";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      <span className="mb-3 flex size-10 items-center justify-center rounded-md bg-hospital-surface-muted text-hospital-text-muted">
        {icon ?? <FolderErrorIcon className="size-5" aria-hidden="true" />}
      </span>
      <p className="text-sm font-semibold text-hospital-text">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-hospital-text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

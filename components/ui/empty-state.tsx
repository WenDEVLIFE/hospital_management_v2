import * as React from "react";
import { cn } from "@/lib/utils";
import { FolderX } from "lucide-react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-md border border-dashed border-hospital-border bg-hospital-white",
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-hospital-surface-muted text-hospital-green mb-3">
        {icon || <FolderX className="h-6 w-6" />}
      </div>
      <h4 className="text-sm font-semibold text-hospital-text">{title}</h4>
      {description && (
        <p className="mt-1 text-xs text-hospital-text-muted max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

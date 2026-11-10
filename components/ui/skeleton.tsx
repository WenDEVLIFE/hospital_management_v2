import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-hospital-surface-muted",
        className
      )}
      {...props}
    />
  );
}

export interface TableRowSkeletonProps {
  columns?: number;
  className?: string;
}

export function TableRowSkeleton({
  columns = 5,
  className,
}: TableRowSkeletonProps) {
  return (
    <tr
      className={cn("border-b border-hospital-border", className)}
      aria-hidden="true"
    >
      <td colSpan={columns} className="px-4 py-3">
        <div className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-3.5 flex-1" />
          ))}
        </div>
      </td>
    </tr>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-md border border-hospital-border bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-8 rounded-md" />
      </div>
      <Skeleton className="mt-4 h-6 w-16" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  );
}

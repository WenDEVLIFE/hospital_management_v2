import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "success"
  | "pending"
  | "critical"
  | "processing"
  | "inactive"
  | "info";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  critical: "bg-red-50 text-red-800 border-red-200",
  processing: "bg-sky-50 text-sky-800 border-sky-200",
  inactive: "bg-slate-100 text-slate-700 border-slate-200",
  info: "bg-sky-50 text-sky-800 border-sky-200",
};

export function Badge({
  className,
  variant = "inactive",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "standard"
    | "complex"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default:
      "bg-hospital-surface-muted text-hospital-text border-hospital-border",
    standard:
      "bg-emerald-50 text-emerald-800 border-emerald-200",
    complex:
      "bg-amber-50 text-amber-800 border-amber-200",
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning:
      "bg-amber-50 text-amber-800 border-amber-200",
    danger:
      "bg-red-50 text-red-700 border-red-200",
    info:
      "bg-sky-50 text-sky-700 border-sky-200",
    outline:
      "bg-transparent text-hospital-text border-hospital-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

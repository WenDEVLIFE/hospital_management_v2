"use client";

import * as React from "react";
import {
  CheckCircleIcon,
  CloseIcon,
  DangerCircleIcon,
  DangerTriangleIcon,
  InfoCircleIcon,
} from "@solar-icons/react/linear";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "danger";

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  info: "bg-sky-50 border-sky-200 text-sky-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  danger: "bg-red-50 border-red-200 text-red-900",
};

function AlertIcon({ variant }: { variant: AlertVariant }) {
  const iconClassName = "size-4 shrink-0";

  switch (variant) {
    case "success":
      return <CheckCircleIcon className={iconClassName} aria-hidden="true" />;
    case "warning":
      return <DangerTriangleIcon className={iconClassName} aria-hidden="true" />;
    case "danger":
      return <DangerCircleIcon className={iconClassName} aria-hidden="true" />;
    case "info":
    default:
      return <InfoCircleIcon className={iconClassName} aria-hidden="true" />;
  }
}

export function Alert({
  variant = "info",
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-md border text-xs leading-relaxed",
        variantStyles[variant],
        className
      )}
    >
      <span className="mt-0.5 flex">
        <AlertIcon variant={variant} />
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && "mt-0.5")}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-current opacity-70 transition-colors hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-1 cursor-pointer"
        >
          <CloseIcon className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

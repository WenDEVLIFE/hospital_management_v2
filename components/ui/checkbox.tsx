"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, id, label, description, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    const control = (
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        disabled={disabled}
        className={cn(
          "mt-0.5 size-4 shrink-0 rounded border border-hospital-border accent-[var(--hospital-green)] cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !label && !description && className
        )}
        {...props}
      />
    );

    if (!label && !description) return control;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex items-start gap-2",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          className
        )}
      >
        {control}
        <span className="min-w-0">
          {label && (
            <span className="block text-xs leading-snug text-hospital-text">
              {label}
            </span>
          )}
          {description && (
            <span className="mt-0.5 block text-[11px] leading-snug text-hospital-text-muted">
              {description}
            </span>
          )}
        </span>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

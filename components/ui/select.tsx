"use client";

import * as React from "react";
import { AltArrowDownIcon } from "@solar-icons/react/linear";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  /** Optional convenience label. Prefer `FormField` for full label/error wiring. */
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      id,
      invalid,
      label,
      error,
      helperText,
      options = [],
      children,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const errorId = error ? `${selectId}-error` : undefined;
    const hintId = helperText && !error ? `${selectId}-hint` : undefined;
    const describedBy =
      [ariaDescribedBy, errorId, hintId].filter(Boolean).join(" ") || undefined;
    const isInvalid = invalid ?? (ariaInvalid === true || Boolean(error));

    const control = (
      <div className="relative w-full">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full h-9 appearance-none rounded-md border border-hospital-border bg-white pl-3 pr-9 py-1 text-sm text-hospital-text transition-colors cursor-pointer",
            "focus:outline-none focus:border-hospital-green focus:ring-1 focus:ring-hospital-green",
            "disabled:cursor-not-allowed disabled:bg-hospital-surface-muted disabled:opacity-60",
            isInvalid && "border-red-500 text-red-700 focus:border-red-500 focus:ring-red-500",
            !label && !error && !helperText && className
          )}
          {...props}
        >
          {children
            ? children
            : options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
        </select>
        <AltArrowDownIcon
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-hospital-text-muted"
          aria-hidden="true"
        />
      </div>
    );

    if (!label && !error && !helperText) return control;

    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium text-hospital-text mb-1 block"
          >
            {label}
          </label>
        )}
        {control}
        {error ? (
          <p id={errorId} className="mt-1 text-xs text-red-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={hintId} className="mt-1 text-xs text-hospital-text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Select.displayName = "Select";

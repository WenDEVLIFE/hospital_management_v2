"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  /** Optional convenience label. Prefer `FormField` for full label/error wiring. */
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      id,
      invalid,
      label,
      error,
      helperText,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = helperText && !error ? `${inputId}-hint` : undefined;
    const describedBy =
      [ariaDescribedBy, errorId, hintId].filter(Boolean).join(" ") || undefined;
    const isInvalid = invalid ?? (ariaInvalid === true || Boolean(error));

    const control = (
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full min-h-20 rounded-md border border-hospital-border bg-white px-3 py-2 text-sm text-hospital-text placeholder:text-slate-400 transition-colors",
          "focus:outline-none focus:border-hospital-green focus:ring-1 focus:ring-hospital-green",
          "disabled:cursor-not-allowed disabled:bg-hospital-surface-muted disabled:opacity-60",
          isInvalid && "border-red-500 text-red-700 focus:border-red-500 focus:ring-red-500",
          !label && !error && !helperText && className
        )}
        {...props}
      />
    );

    if (!label && !error && !helperText) return control;

    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label
            htmlFor={inputId}
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
Textarea.displayName = "Textarea";

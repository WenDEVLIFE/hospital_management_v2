import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-hospital-text"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-hospital-border bg-hospital-white px-3 py-2 text-sm text-hospital-text",
            "placeholder:text-slate-400 transition-colors",
            "focus:outline-none focus:border-hospital-green focus:ring-1 focus:ring-hospital-green",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-status-danger focus:border-status-danger focus:ring-status-danger",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-status-danger font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-hospital-text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

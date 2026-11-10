import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, id, ...props }, ref) => {
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
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-md border border-hospital-border bg-hospital-white px-3 py-1 text-sm text-hospital-text",
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
Input.displayName = "Input";

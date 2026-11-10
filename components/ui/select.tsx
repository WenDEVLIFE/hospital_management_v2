import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options = [], children, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full flex flex-col space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium text-hospital-text"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-md border border-hospital-border bg-hospital-white px-3 py-1 text-sm text-hospital-text",
            "transition-colors focus:outline-none focus:border-hospital-green focus:ring-1 focus:ring-hospital-green",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-status-danger focus:border-status-danger focus:ring-status-danger",
            className
          )}
          {...props}
        >
          {children
            ? children
            : options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
        </select>
        {error && (
          <p className="text-xs text-status-danger font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

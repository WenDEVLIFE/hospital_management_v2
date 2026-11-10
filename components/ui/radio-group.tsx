"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null
);

export interface RadioGroupProps {
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  orientation?: "vertical" | "horizontal";
  disabled?: boolean;
}

export function RadioGroup({
  name,
  value,
  onValueChange,
  children,
  className,
  orientation = "vertical",
  disabled = false,
}: RadioGroupProps) {
  const generatedName = React.useId();
  const groupName = name ?? generatedName;

  return (
    <RadioGroupContext.Provider
      value={{ name: groupName, value, onValueChange, disabled }}
    >
      <div
        role="radiogroup"
        aria-orientation={orientation}
        className={cn(
          "flex",
          orientation === "horizontal"
            ? "flex-row flex-wrap gap-4"
            : "flex-col gap-2",
          className
        )}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioGroupItemProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "name" | "value" | "checked" | "onChange"
  > {
  value: string;
  label?: React.ReactNode;
  description?: string;
}

export const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  RadioGroupItemProps
>(
  (
    { value, label, description, className, id, disabled, ...props },
    ref
  ) => {
    const context = React.useContext(RadioGroupContext);

    if (!context) {
      throw new Error("RadioGroupItem must be used within RadioGroup");
    }

    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const isDisabled = disabled || context.disabled;

    const control = (
      <input
        ref={ref}
        id={inputId}
        type="radio"
        name={context.name}
        value={value}
        checked={context.value === value}
        onChange={() => context.onValueChange(value)}
        disabled={isDisabled}
        className={cn(
          "mt-0.5 size-4 shrink-0 accent-[var(--hospital-green)] cursor-pointer",
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
          isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
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
RadioGroupItem.displayName = "RadioGroupItem";

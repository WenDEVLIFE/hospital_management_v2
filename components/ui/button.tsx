"use client";

import * as React from "react";
import { LoaderIcon } from "@solar-icons/react/linear";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "destructive"
  | "ghost";

export type ButtonSize = "sm" | "md" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** @deprecated Use `loading` instead. */
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-hospital-green hover:bg-hospital-green-hover text-white rounded-md shadow-xs h-9 px-3.5 text-sm font-medium transition-colors cursor-pointer",
  secondary:
    "bg-hospital-surface-muted hover:bg-slate-200 text-hospital-text border border-hospital-border rounded-md h-9 px-3.5 text-sm",
  outline:
    "bg-white hover:bg-hospital-green-light text-hospital-green border border-hospital-green-border rounded-md h-9 px-3.5 text-sm",
  destructive:
    "bg-red-600 hover:bg-red-700 text-white rounded-md h-9 px-3.5 text-sm font-medium",
  ghost:
    "bg-transparent hover:bg-hospital-surface-muted text-hospital-text rounded-md h-9 px-3.5 text-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  icon: "h-9 w-9 p-0 gap-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      isLoading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isBusy = loading || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isBusy}
        aria-busy={isBusy || undefined}
        className={cn(
          "inline-flex items-center justify-center select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isBusy && (
          <LoaderIcon
            className="size-4 shrink-0 animate-spin"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

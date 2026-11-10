import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        "bg-hospital-green hover:bg-hospital-green-hover text-white shadow-xs border border-transparent",
      secondary:
        "bg-hospital-surface-muted hover:bg-slate-200 text-hospital-text border border-hospital-border",
      outline:
        "bg-hospital-white hover:bg-hospital-green-light text-hospital-green border border-hospital-green-border",
      ghost:
        "hover:bg-hospital-surface-muted text-hospital-text border border-transparent",
      destructive:
        "bg-status-danger hover:bg-red-700 text-white shadow-xs border border-transparent",
    };

    const sizeStyles = {
      sm: "h-8 px-2.5 text-xs gap-1.5",
      md: "h-9 px-3.5 text-sm gap-2",
      lg: "h-11 px-5 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-md transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

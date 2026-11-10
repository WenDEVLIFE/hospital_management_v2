import * as React from "react";
import { cn } from "@/lib/utils";
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
}

export function Alert({
  variant = "info",
  title,
  className,
  children,
  ...props
}: AlertProps) {
  const iconMap = {
    info: <Info className="w-4 h-4 text-sky-600 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
  };

  const variantStyles = {
    info: "bg-sky-50/70 border-sky-200 text-sky-900",
    success: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50/70 border-amber-200 text-amber-900",
    danger: "bg-red-50/70 border-red-200 text-red-900",
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-md border text-xs leading-relaxed",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="mt-0.5">{iconMap[variant]}</div>
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5 leading-snug">{title}</h5>}
        <div className="text-hospital-text/90">{children}</div>
      </div>
    </div>
  );
}

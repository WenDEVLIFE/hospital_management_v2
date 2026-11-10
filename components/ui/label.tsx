import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required = false, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-xs font-medium text-hospital-text mb-1 block", className)}
      {...props}
    >
      {children}
      {required && (
        <>
          {" "}
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
        </>
      )}
    </label>
  )
);
Label.displayName = "Label";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

export function FormField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  const hintId = hint && !error ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<ControlProps>, {
        id: htmlFor,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className={cn("w-full", className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-hospital-text mb-1 block"
      >
        {label}
        {required && (
          <>
            {" "}
            <span className="text-red-600" aria-hidden="true">
              *
            </span>
          </>
        )}
      </label>
      {control}
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1 text-xs text-hospital-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

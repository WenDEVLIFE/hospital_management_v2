import { cn } from "@/lib/utils";

const DEPARTMENT_ACCENTS: Record<string, string> = {
  ER: "var(--department-emergency)",
  OPD: "var(--department-outpatient)",
  IPD: "var(--department-inpatient)",
  LAB: "var(--department-laboratory)",
  PHARM: "var(--department-pharmacy)",
  RAD: "var(--department-radiology)",
  BILL: "var(--department-billing)",
  ADMIN: "var(--department-administration)",
};

export function getDepartmentAccent(code: string): string {
  return (
    DEPARTMENT_ACCENTS[code.trim().toUpperCase()] ?? "var(--hospital-text-subtle)"
  );
}

export interface DepartmentAccentProps {
  code: string;
  className?: string;
}

/**
 * Small department identity marker derived from the department code
 * (THEME.MD §3.6). Decorative only: the department name and code are always
 * rendered as text beside it.
 */
export function DepartmentAccent({ code, className }: DepartmentAccentProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2 shrink-0 rounded-[2px]", className)}
      style={{ backgroundColor: getDepartmentAccent(code) }}
    />
  );
}

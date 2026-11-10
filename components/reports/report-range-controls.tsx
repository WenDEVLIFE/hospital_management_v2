"use client";

import * as React from "react";
import { CalendarMarkIcon, RefreshIcon } from "@solar-icons/react/linear";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/format";

export interface ReportRangeControlsProps {
  defaultStart: string;
  defaultEnd: string;
  defaultLabel: string;
}

export function ReportRangeControls({
  defaultStart,
  defaultEnd,
  defaultLabel,
}: ReportRangeControlsProps) {
  const [start, setStart] = React.useState(defaultStart);
  const [end, setEnd] = React.useState(defaultEnd);
  const [department, setDepartment] = React.useState("all");

  const reset = React.useCallback(() => {
    setStart(defaultStart);
    setEnd(defaultEnd);
    setDepartment("all");
  }, [defaultStart, defaultEnd]);

  const hasOverride =
    start !== defaultStart || end !== defaultEnd || department !== "all";

  return (
    <section className="rounded-md border border-hospital-border bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-hospital-text">
            Report range
          </h2>
          <p className="mt-1 max-w-prose text-xs text-hospital-text-muted">
            Date and department filters apply to report generation. Category
            definitions below are not date-bound in this build.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-md border border-hospital-border bg-hospital-surface px-2.5 py-1 text-[11px] font-medium text-hospital-text-muted">
          <CalendarMarkIcon className="size-3.5" aria-hidden="true" />
          Active range: {formatDate(start)} – {formatDate(end)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          id="report-range-from"
          label="From"
          type="date"
          value={start}
          onChange={(event) => setStart(event.target.value)}
        />

        <Input
          id="report-range-to"
          label="To"
          type="date"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
        />

        <Select
          id="report-range-department"
          label="Department"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          helperText="Department filtering activates when hospital department data is connected."
          options={[{ label: "All departments", value: "all" }]}
        />

        <div className="flex items-end">
          <Button
            variant="secondary"
            onClick={reset}
            disabled={!hasOverride}
            className="w-full cursor-pointer"
          >
            <RefreshIcon className="size-4" aria-hidden="true" />
            Reset range
          </Button>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-hospital-text-subtle">
        Default range: {defaultLabel}.
      </p>
    </section>
  );
}

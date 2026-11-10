"use client";

import * as React from "react";
import { AltArrowLeftIcon, AltArrowRightIcon } from "@solar-icons/react/linear";

import type { AppointmentListRow } from "@/types/hospital";
import { Button } from "@/components/ui/button";

import {
  buildMonthCells,
  calendarDateKey,
  calendarDayLabel,
  calendarMonthLabel,
  formatAppointmentTime,
  manilaDateKey,
  parseMonthKey,
  shiftMonth,
} from "./appointment-utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export interface AppointmentsCalendarProps {
  rows: AppointmentListRow[];
  initialMonth: string;
}

export function AppointmentsCalendar({
  rows,
  initialMonth,
}: AppointmentsCalendarProps) {
  const [cursor, setCursor] = React.useState(() => parseMonthKey(initialMonth));

  const rowsByDate = React.useMemo(() => {
    const map = new Map<string, AppointmentListRow[]>();

    for (const row of rows) {
      const key = manilaDateKey(row.scheduled_at);

      if (!key) {
        continue;
      }

      const bucket = map.get(key);

      if (bucket) {
        bucket.push(row);
      } else {
        map.set(key, [row]);
      }
    }

    for (const bucket of map.values()) {
      bucket.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    }

    return map;
  }, [rows]);

  const cells = buildMonthCells(cursor.year, cursor.month);
  const monthPrefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
  const monthTotal = rows.reduce((total, row) => {
    return manilaDateKey(row.scheduled_at).startsWith(monthPrefix)
      ? total + 1
      : total;
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() =>
              setCursor((current) =>
                shiftMonth(current.year, current.month, -1)
              )
            }
          >
            <AltArrowLeftIcon className="size-4" aria-hidden="true" />
          </Button>

          <p
            aria-live="polite"
            className="min-w-36 text-center text-sm font-semibold text-hospital-text"
          >
            {calendarMonthLabel(cursor.year, cursor.month)}
          </p>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() =>
              setCursor((current) => shiftMonth(current.year, current.month, 1))
            }
          >
            <AltArrowRightIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <p className="text-[11px] text-hospital-text-muted">
          {monthTotal} {monthTotal === 1 ? "appointment" : "appointments"} in{" "}
          {calendarMonthLabel(cursor.year, cursor.month)}
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-hospital-border bg-white">
        <div role="grid" aria-label={`Appointment calendar for ${calendarMonthLabel(cursor.year, cursor.month)}`}>
          <div role="row" className="grid grid-cols-7 border-b border-hospital-border bg-hospital-surface-muted">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                role="columnheader"
                className="px-1 py-2 text-center text-[10px] font-semibold text-hospital-text-muted"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    aria-hidden="true"
                    className="min-h-24 border-b border-r border-hospital-border-subtle bg-hospital-surface"
                  />
                );
              }

              const dateKey = calendarDateKey(cursor.year, cursor.month, day);
              const dayRows = rowsByDate.get(dateKey) ?? [];
              const count = dayRows.length;
              const label = calendarDayLabel(cursor.year, cursor.month, day);

              return (
                <div
                  key={dateKey}
                  role="gridcell"
                  aria-label={`${label}, ${count} ${
                    count === 1 ? "appointment" : "appointments"
                  }`}
                  className="min-h-24 min-w-0 border-b border-r border-hospital-border-subtle p-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-medium text-hospital-text">
                      {day}
                    </span>
                    {count > 0 ? (
                      <span className="rounded-full bg-hospital-green-light px-1.5 text-[10px] font-semibold text-hospital-green-dark">
                        {count}
                      </span>
                    ) : null}
                  </div>

                  {count > 0 ? (
                    <ul className="mt-1 space-y-0.5">
                      {dayRows.slice(0, 3).map((row) => (
                        <li
                          key={row.id}
                          title={`${formatAppointmentTime(row.scheduled_at)} ${
                            row.patient_name
                          }`}
                          className="truncate rounded-sm border border-hospital-border bg-hospital-surface px-1 py-0.5 text-[10px] leading-4 text-hospital-text"
                        >
                          {formatAppointmentTime(row.scheduled_at)} ·{" "}
                          {row.patient_name}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {count > 3 ? (
                    <p className="mt-0.5 text-[10px] font-medium text-hospital-text-muted">
                      +{count - 3} more
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

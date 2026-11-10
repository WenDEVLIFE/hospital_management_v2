import type { AppointmentListRow } from "@/types/hospital";
import { CalendarMarkIcon } from "@solar-icons/react/linear";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";

import {
  formatAppointmentTime,
  groupAppointmentsByHour,
} from "./appointment-utils";

export interface AppointmentsDailyScheduleProps {
  rows: AppointmentListRow[];
}

export function AppointmentsDailySchedule({
  rows,
}: AppointmentsDailyScheduleProps) {
  const groups = groupAppointmentsByHour(rows);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<CalendarMarkIcon className="size-5" aria-hidden="true" />}
        title="No appointments found"
        description="There are no appointments matching your selected filters."
        className="rounded-md border border-hospital-border bg-white"
      />
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.key} aria-label={`${formatDate(group.rows[0].scheduled_at)} ${group.hourLabel}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hospital-border pb-2">
            <h3 className="text-xs font-semibold text-hospital-text">
              {formatDate(group.rows[0].scheduled_at)}
              <span className="ml-2 font-normal text-hospital-text-muted">
                {group.hourLabel}
              </span>
            </h3>
            <p className="text-[11px] text-hospital-text-subtle">
              {group.rows.length}{" "}
              {group.rows.length === 1 ? "appointment" : "appointments"}
            </p>
          </div>

          <ol className="mt-2 space-y-1.5 border-l border-hospital-border pl-3">
            {group.rows.map((row) => (
              <li
                key={row.id}
                className="relative flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-hospital-border bg-white px-3 py-2 before:absolute before:-left-[17px] before:top-3.5 before:h-1.5 before:w-1.5 before:rounded-full before:border before:border-hospital-green before:bg-white"
              >
                <span className="w-16 shrink-0 font-mono text-[11px] text-hospital-text">
                  {formatAppointmentTime(row.scheduled_at)}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-hospital-text">
                  {row.patient_name}
                </span>
                <span className="min-w-0 truncate text-[11px] text-hospital-text-muted">
                  {row.physician_name ?? "Unassigned physician"}
                </span>
                <StatusBadge status={row.status} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

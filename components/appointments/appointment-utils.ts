import type { AppointmentListRow } from "@/types/hospital";

export const APPOINTMENT_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "waiting", label: "Waiting" },
  { value: "in_consultation", label: "In Consultation" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
] as const;

const MANILA_TIME_ZONE = "Asia/Manila";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MANILA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: MANILA_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const hourFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: MANILA_TIME_ZONE,
  hour: "numeric",
  hour12: true,
});

const hour24Formatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: MANILA_TIME_ZONE,
  hour: "2-digit",
  hourCycle: "h23",
});

export function manilaDateKey(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : dateKeyFormatter.format(date);
}

export function formatAppointmentTime(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "\u2014" : timeFormatter.format(date);
}

export function formatAppointmentHour(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "\u2014" : hourFormatter.format(date);
}

export type AppointmentHourGroup = {
  key: string;
  dateKey: string;
  hourLabel: string;
  rows: AppointmentListRow[];
};

export function groupAppointmentsByHour(
  rows: AppointmentListRow[]
): AppointmentHourGroup[] {
  const groups: AppointmentHourGroup[] = [];
  const sorted = [...rows].sort((a, b) =>
    a.scheduled_at.localeCompare(b.scheduled_at)
  );

  for (const row of sorted) {
    const date = new Date(row.scheduled_at);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const dateKey = manilaDateKey(row.scheduled_at);
    const hour = Number(hour24Formatter.format(date));
    const key = `${dateKey}T${String(hour).padStart(2, "0")}`;
    const current = groups[groups.length - 1];

    if (current?.key === key) {
      current.rows.push(row);
      continue;
    }

    groups.push({
      key,
      dateKey,
      hourLabel: formatAppointmentHour(row.scheduled_at),
      rows: [row],
    });
  }

  return groups;
}

export function parseMonthKey(value: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(value);

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;

    if (month >= 0 && month <= 11) {
      return { year, month };
    }
  }

  const now = new Date();

  return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  const shifted = new Date(Date.UTC(year, month + delta, 1));

  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() };
}

export function buildMonthCells(year: number, month: number): (number | null)[] {
  const startWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [];

  for (let index = 0; index < startWeekday; index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

const monthLabelFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

const dayLabelFormatter = new Intl.DateTimeFormat("en-PH", {
  timeZone: "UTC",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function calendarMonthLabel(year: number, month: number): string {
  return monthLabelFormatter.format(new Date(Date.UTC(year, month, 1)));
}

export function calendarDayLabel(
  year: number,
  month: number,
  day: number
): string {
  return dayLabelFormatter.format(new Date(Date.UTC(year, month, day)));
}

export function calendarDateKey(
  year: number,
  month: number,
  day: number
): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

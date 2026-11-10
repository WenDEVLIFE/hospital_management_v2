import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { DashboardOverview } from "@/types/hospital";

export interface AppointmentBreakdownProps {
  data: DashboardOverview["appointmentBreakdown"];
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-sky-400",
  confirmed: "bg-emerald-500",
  waiting: "bg-amber-400",
  in_consultation: "bg-purple-400",
  completed: "bg-hospital-green",
  cancelled: "bg-red-400",
  no_show: "bg-slate-500",
};

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function humanizeStatus(status: string) {
  return normalizeStatus(status)
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AppointmentBreakdown({ data }: AppointmentBreakdownProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <EmptyState
        title="No appointments recorded"
        description="Appointment activity will appear here once appointments are scheduled."
        className="px-0 py-8"
      />
    );
  }

  const distribution = data
    .filter((item) => item.count > 0)
    .map((item) => `${humanizeStatus(item.status)} ${item.count}`)
    .join(", ");

  return (
    <div>
      <div
        role="img"
        aria-label={`Appointment status distribution. ${distribution}. Total ${total} appointments.`}
        className="flex h-3 overflow-hidden rounded-sm border border-hospital-border bg-hospital-surface-muted"
      >
        {data
          .filter((item) => item.count > 0)
          .map((item) => (
            <div
              key={item.status}
              className={
                STATUS_COLORS[normalizeStatus(item.status)] ?? "bg-slate-400"
              }
              style={{ width: `${(item.count / total) * 100}%` }}
            />
          ))}
      </div>

      <ul className="mt-4 space-y-2">
        {data.map((item) => (
          <li
            key={item.status}
            className="flex items-center justify-between gap-3"
          >
            <StatusBadge status={item.status} />
            <span className="text-sm font-semibold tabular-nums text-hospital-text">
              {item.count.toLocaleString("en-PH")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

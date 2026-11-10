import { connection } from "next/server";
import {
  CalendarMarkIcon,
  CalendarMinimalisticIcon,
  CheckCircleIcon,
  ClockCircleIcon,
  DangerCircleIcon,
  StethoscopeIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { AppointmentsView } from "@/components/appointments/appointments-view";
import { UnavailableAction } from "@/components/module/unavailable-action";
import { getAppointmentStats, listAppointments } from "@/lib/data/appointments";

export const metadata = {
  title: "Appointments",
};

function manilaMonthKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";

  return `${year}-${month}`;
}

export default async function AppointmentsPage() {
  await connection();

  const [statsResult, listResult] = await Promise.all([
    getAppointmentStats(),
    listAppointments({ pageSize: 200 }),
  ]);

  const monthKey = manilaMonthKey();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Schedule and track outpatient consultations."
        actions={
          <UnavailableAction
            label="Schedule Appointment"
            description="Create a new outpatient consultation appointment for a patient."
            icon={<CalendarMarkIcon className="size-4" aria-hidden="true" />}
          />
        }
      />

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="Total appointments"
            value={statsResult.data.total}
            icon={<CalendarMarkIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Today"
            value={statsResult.data.today}
            tone="info"
            icon={
              <CalendarMinimalisticIcon
                className="size-4"
                aria-hidden="true"
              />
            }
          />
          <StatCard
            label="Waiting"
            value={statsResult.data.waiting}
            tone="warning"
            icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="In consultation"
            value={statsResult.data.inConsultation}
            tone="info"
            icon={<StethoscopeIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Completed"
            value={statsResult.data.completed}
            tone="success"
            icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Cancelled / no-show"
            value={statsResult.data.cancelled + statsResult.data.noShow}
            hint={`${statsResult.data.cancelled} cancelled · ${statsResult.data.noShow} no-show`}
            tone="danger"
            icon={<DangerCircleIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      )}

      {listResult.error ? (
        <ErrorState error={listResult.error} />
      ) : (
        <AppointmentsView
          rows={listResult.data.rows}
          initialMonth={monthKey}
        />
      )}
    </div>
  );
}

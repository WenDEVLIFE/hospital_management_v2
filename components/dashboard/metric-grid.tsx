import {
  BedIcon,
  CalendarMarkIcon,
  HospitalIcon,
  Pills2Icon,
  TestTubeIcon,
  UserRoundedIcon,
  WalletMoneyIcon,
} from "@solar-icons/react/linear";

import { StatCard } from "@/components/module/stat-card";
import { formatCurrency } from "@/lib/format";
import type { DashboardOverview } from "@/types/hospital";

export interface DashboardMetricsProps {
  metrics: DashboardOverview["metrics"];
}

function count(value: number) {
  return value.toLocaleString("en-PH");
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Registered Patients"
        value={count(metrics.totalPatients)}
        icon={<UserRoundedIcon className="size-4" aria-hidden="true" />}
      />
      <StatCard
        label="Today's Appointments"
        value={count(metrics.todaysAppointments)}
        icon={<CalendarMarkIcon className="size-4" aria-hidden="true" />}
      />
      <StatCard
        label="Currently Admitted Patients"
        value={count(metrics.admittedPatients)}
        icon={<HospitalIcon className="size-4" aria-hidden="true" />}
      />
      <StatCard
        label="Available Beds"
        value={count(metrics.availableBeds)}
        tone="success"
        icon={<BedIcon className="size-4" aria-hidden="true" />}
      />
      <StatCard
        label="Pending Laboratory Requests"
        value={count(metrics.pendingLabOrders)}
        tone="warning"
        icon={<TestTubeIcon className="size-4" aria-hidden="true" />}
      />
      <StatCard
        label="Pending Prescriptions"
        value={count(metrics.pendingPrescriptions)}
        tone="warning"
        icon={<Pills2Icon className="size-4" aria-hidden="true" />}
      />
      <StatCard
        label="Outstanding Billing"
        value={formatCurrency(metrics.outstandingBilling)}
        icon={<WalletMoneyIcon className="size-4" aria-hidden="true" />}
      />
    </div>
  );
}

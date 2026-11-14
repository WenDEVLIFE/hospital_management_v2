import type {
  Admission,
  Appointment,
  DashboardOverview,
  Invoice,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { listPatients } from "./patients";
import { manilaDate, roundMoney } from "./query";
import { toDataError, type DataResult } from "./result";

const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "waiting",
  "in_consultation",
  "completed",
  "cancelled",
  "no_show",
] as const;

function manilaMonthKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

function lastSixManilaMonths(): string[] {
  const [year, month] = manilaMonthKey(new Date()).split("-").map(Number);

  return Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index;
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));

    return `${date.getUTCFullYear()}-${String(
      date.getUTCMonth() + 1
    ).padStart(2, "0")}`;
  });
}

export async function getDashboardOverview(): Promise<
  DataResult<DashboardOverview>
> {
  const supabase = await getSupabaseServerClient();

  const [
    patientsCount,
    appointmentsResult,
    admissionsResult,
    availableBedsCount,
    pendingLabCount,
    pendingPrescriptionsCount,
    pendingRadiologyCount,
    invoicesResult,
    recentPatients,
  ] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase.from("appointments").select("status, scheduled_at"),
    supabase
      .from("admissions")
      .select("status, admission_date, discharge_date"),
    supabase
      .from("beds")
      .select("id", { count: "exact", head: true })
      .eq("status", "available"),
    supabase
      .from("laboratory_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("prescriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("radiology_orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("invoices")
      .select("status, balance")
      .in("status", ["unpaid", "partially_paid"]),
    listPatients({ pageSize: 5 }),
  ]);

  const error =
    patientsCount.error ??
    appointmentsResult.error ??
    admissionsResult.error ??
    availableBedsCount.error ??
    pendingLabCount.error ??
    pendingPrescriptionsCount.error ??
    pendingRadiologyCount.error ??
    invoicesResult.error ??
    recentPatients.error;

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const appointmentRows = (appointmentsResult.data ?? []) as Array<
    Pick<Appointment, "status" | "scheduled_at">
  >;
  const admissionRows = (admissionsResult.data ?? []) as Array<
    Pick<Admission, "status" | "admission_date" | "discharge_date">
  >;
  const invoiceRows = (invoicesResult.data ?? []) as Array<
    Pick<Invoice, "status" | "balance">
  >;

  const today = manilaDate(new Date().toISOString());
  const todaysAppointments = appointmentRows.filter(
    (appointment) => manilaDate(appointment.scheduled_at) === today
  ).length;
  const admittedPatients = admissionRows.filter(
    (admission) =>
      admission.status === "admitted" || admission.status === "transferred"
  ).length;

  const outstandingBilling = roundMoney(
    invoiceRows.reduce(
      (total, invoice) => total + Number(invoice.balance ?? 0),
      0
    )
  );

  const appointmentBreakdown = APPOINTMENT_STATUSES.map((status) => ({
    status,
    count: appointmentRows.filter(
      (appointment) => appointment.status === status
    ).length,
  }));

  const trendMonths = lastSixManilaMonths();
  const trendMap = new Map(
    trendMonths.map((month) => [
      month,
      { month, admissions: 0, discharges: 0 },
    ])
  );

  for (const admission of admissionRows) {
    const admissionPoint = trendMap.get(
      manilaMonthKey(admission.admission_date)
    );

    if (admissionPoint) {
      admissionPoint.admissions += 1;
    }

    if (admission.discharge_date) {
      const dischargePoint = trendMap.get(
        manilaMonthKey(admission.discharge_date)
      );

      if (dischargePoint) {
        dischargePoint.discharges += 1;
      }
    }
  }

  const admissionTrend = trendMonths
    .map((month) => trendMap.get(month))
    .filter(
      (point): point is { month: string; admissions: number; discharges: number } =>
        Boolean(point)
    );

  const pendingActivities = [
    {
      id: "lab-pending",
      label: "Laboratory orders awaiting processing",
      module: "Laboratory",
      count: pendingLabCount.count ?? 0,
      href: "/laboratory",
    },
    {
      id: "prescription-pending",
      label: "Prescriptions awaiting dispensing",
      module: "Pharmacy",
      count: pendingPrescriptionsCount.count ?? 0,
      href: "/prescriptions",
    },
    {
      id: "radiology-pending",
      label: "Radiology orders awaiting scheduling",
      module: "Radiology",
      count: pendingRadiologyCount.count ?? 0,
      href: "/radiology",
    },
    {
      id: "billing-outstanding",
      label: "Invoices with outstanding balances",
      module: "Billing",
      count: invoiceRows.length,
      href: "/billing",
    },
  ];

  return {
    data: {
      metrics: {
        totalPatients: patientsCount.count ?? 0,
        todaysAppointments,
        admittedPatients,
        availableBeds: availableBedsCount.count ?? 0,
        pendingLabOrders: pendingLabCount.count ?? 0,
        pendingPrescriptions: pendingPrescriptionsCount.count ?? 0,
        outstandingBilling,
      },
      admissionTrend,
      appointmentBreakdown,
      recentRegistrations: recentPatients.data?.rows ?? [],
      pendingActivities,
    },
    error: null,
  };
}

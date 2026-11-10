import type { DashboardOverview, PatientListRow } from "@/types/hospital";
import {
  PREVIEW_NOW,
  admissionListRows,
  admissionTrend,
  appointmentListRows,
  bedBoardRows,
  invoiceListRows,
  labOrderListRows,
  patientListRows,
  prescriptionListRows,
  radiologyOrderListRows,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { manilaDate, roundMoney, sortByDateDesc } from "./query";
import type { DataResult } from "./result";

const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "waiting",
  "in_consultation",
  "completed",
  "cancelled",
  "no_show",
] as const;

function emptyOverview(): DashboardOverview {
  return {
    metrics: {
      totalPatients: 0,
      todaysAppointments: 0,
      admittedPatients: 0,
      availableBeds: 0,
      pendingLabOrders: 0,
      pendingPrescriptions: 0,
      outstandingBilling: 0,
    },
    admissionTrend: [],
    appointmentBreakdown: [],
    recentRegistrations: [],
    pendingActivities: [],
  };
}

export async function getDashboardOverview(): Promise<
  DataResult<DashboardOverview>
> {
  // TODO(supabase): replace with supabase.from("v_patient_summary").select("*")
  if (!isPreviewMode) {
    return { data: emptyOverview(), error: null };
  }

  await Promise.resolve();

  const today = manilaDate(PREVIEW_NOW);

  const todaysAppointments = appointmentListRows.filter(
    (appointment) => manilaDate(appointment.scheduled_at) === today
  ).length;

  const admittedPatients = admissionListRows.filter(
    (admission) =>
      admission.status === "admitted" || admission.status === "transferred"
  ).length;

  const availableBeds = bedBoardRows.filter(
    (bed) => bed.status === "available"
  ).length;

  const pendingLabOrders = labOrderListRows.filter(
    (order) => order.status === "pending"
  ).length;

  const pendingPrescriptions = prescriptionListRows.filter(
    (prescription) => prescription.status === "pending"
  ).length;

  const pendingRadiologyOrders = radiologyOrderListRows.filter(
    (order) => order.status === "pending"
  ).length;

  const outstandingInvoices = invoiceListRows.filter(
    (invoice) =>
      invoice.status === "unpaid" || invoice.status === "partially_paid"
  );

  const outstandingBilling = roundMoney(
    outstandingInvoices.reduce((total, invoice) => total + invoice.balance, 0)
  );

  const appointmentBreakdown = APPOINTMENT_STATUSES.map((status) => ({
    status,
    count: appointmentListRows.filter(
      (appointment) => appointment.status === status
    ).length,
  }));

  const recentRegistrations: PatientListRow[] = sortByDateDesc(
    patientListRows,
    (patient) => patient.registration_date
  ).slice(0, 5);

  const pendingActivities = [
    {
      id: "lab-pending",
      label: "Laboratory orders awaiting processing",
      module: "Laboratory",
      count: pendingLabOrders,
      href: "/laboratory",
    },
    {
      id: "prescription-pending",
      label: "Prescriptions awaiting dispensing",
      module: "Pharmacy",
      count: pendingPrescriptions,
      href: "/prescriptions",
    },
    {
      id: "radiology-pending",
      label: "Radiology orders awaiting scheduling",
      module: "Radiology",
      count: pendingRadiologyOrders,
      href: "/radiology",
    },
    {
      id: "billing-outstanding",
      label: "Invoices with outstanding balances",
      module: "Billing",
      count: outstandingInvoices.length,
      href: "/billing",
    },
  ];

  return {
    data: {
      metrics: {
        totalPatients: patientListRows.length,
        todaysAppointments,
        admittedPatients,
        availableBeds,
        pendingLabOrders,
        pendingPrescriptions,
        outstandingBilling,
      },
      admissionTrend,
      appointmentBreakdown,
      recentRegistrations,
      pendingActivities,
    },
    error: null,
  };
}

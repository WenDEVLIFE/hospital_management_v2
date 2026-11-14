import type { ReportCard, ReportRange } from "@/types/hospital";
import type { DataResult } from "./result";

/**
 * Report categories are product configuration, not hospital records. The
 * schema has no report_categories table; keeping the catalogue here removes
 * the fixture dependency while the date range is computed at request time.
 */
const REPORT_CARDS: ReportCard[] = [
  {
    id: "report-1",
    title: "Patient Registration",
    description: "Registration volume and demographic summaries.",
    category: "Patient",
    href: "/reports?category=patient",
    formats: ["PDF", "XLSX", "CSV"],
  },
  {
    id: "report-2",
    title: "Appointment Activity",
    description: "Appointment status and scheduling summaries.",
    category: "Appointment",
    href: "/reports?category=appointment",
    formats: ["PDF", "XLSX", "CSV"],
  },
  {
    id: "report-3",
    title: "Admission and Discharge",
    description: "Admissions, discharges, and length of stay.",
    category: "Admission",
    href: "/reports?category=admission",
    formats: ["PDF", "XLSX", "CSV"],
  },
  {
    id: "report-4",
    title: "Bed Occupancy",
    description: "Bed availability and occupancy by department.",
    category: "Admission",
    href: "/reports?category=bed-occupancy",
    formats: ["PDF", "XLSX"],
  },
  {
    id: "report-5",
    title: "Laboratory Activity",
    description: "Laboratory order volume and turnaround.",
    category: "Laboratory",
    href: "/reports?category=laboratory",
    formats: ["PDF", "XLSX", "CSV"],
  },
  {
    id: "report-6",
    title: "Pharmacy Dispensing",
    description: "Prescription and dispensing summaries.",
    category: "Pharmacy",
    href: "/reports?category=pharmacy",
    formats: ["PDF", "XLSX", "CSV"],
  },
  {
    id: "report-7",
    title: "Billing and Collections",
    description: "Invoices, payments, and outstanding balances.",
    category: "Billing",
    href: "/reports?category=billing",
    formats: ["PDF", "XLSX", "CSV"],
  },
  {
    id: "report-8",
    title: "Inventory and Stock",
    description: "Stock levels, movements, and expirations.",
    category: "Inventory",
    href: "/reports?category=inventory",
    formats: ["PDF", "XLSX", "CSV"],
  },
  {
    id: "report-9",
    title: "Staff Directory",
    description: "Staff roster and department assignments.",
    category: "Staff",
    href: "/reports?category=staff",
    formats: ["PDF", "XLSX"],
  },
];

function manilaDateKey(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export async function listReportCategories(): Promise<
  DataResult<ReportCard[]>
> {
  return { data: REPORT_CARDS, error: null };
}

export async function getReportRange(): Promise<DataResult<ReportRange>> {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    data: {
      start: manilaDateKey(start),
      end: manilaDateKey(end),
      label: "Last 30 days",
    },
    error: null,
  };
}

import { cacheLife } from "next/cache";

import type { ReportCard, ReportRange } from "@/types/hospital";
import type { DataResult } from "./result";

/**
 * Report categories are product configuration, not hospital records. The
 * schema has no report_categories table; the catalogue lives here and the date
 * range is computed at request time.
 */
const REPORT_CARDS: ReportCard[] = [
  {
    id: "report-1",
    title: "Patient Registration Reports",
    description: "Registration volume and demographic summaries.",
    category: "Patient",
    href: "/reports?category=patient",
    formats: ["PDF", "XLSX", "CSV"],
    columns: [
      "Medical record number",
      "Patient name",
      "Sex",
      "Age",
      "Registration date",
      "Registration status",
    ],
  },
  {
    id: "report-2",
    title: "Appointment Reports",
    description: "Appointment status and scheduling summaries.",
    category: "Appointment",
    href: "/reports?category=appointment",
    formats: ["PDF", "XLSX", "CSV"],
    columns: [
      "Appointment number",
      "Patient name",
      "Department",
      "Physician",
      "Scheduled date",
      "Appointment status",
    ],
  },
  {
    id: "report-3",
    title: "Admission and Discharge Reports",
    description: "Admissions, discharges, and length of stay.",
    category: "Admission",
    href: "/reports?category=admission",
    formats: ["PDF", "XLSX", "CSV"],
    columns: [
      "Admission number",
      "Patient name",
      "Department",
      "Attending physician",
      "Admission date",
      "Discharge date",
      "Length of stay",
      "Admission status",
    ],
  },
  {
    id: "report-4",
    title: "Bed Occupancy Reports",
    description: "Bed availability and occupancy by department.",
    category: "Admission",
    href: "/reports?category=bed-occupancy",
    formats: ["PDF", "XLSX"],
    columns: [
      "Department",
      "Room number",
      "Bed number",
      "Bed status",
      "Occupied days",
      "Occupancy rate",
    ],
  },
  {
    id: "report-5",
    title: "Laboratory Reports",
    description: "Laboratory order volume and turnaround.",
    category: "Laboratory",
    href: "/reports?category=laboratory",
    formats: ["PDF", "XLSX", "CSV"],
    columns: [
      "Order number",
      "Patient name",
      "Test name",
      "Priority",
      "Ordered at",
      "Result status",
      "Verified at",
    ],
  },
  {
    id: "report-6",
    title: "Pharmacy Reports",
    description: "Prescription and dispensing summaries.",
    category: "Pharmacy",
    href: "/reports?category=pharmacy",
    formats: ["PDF", "XLSX", "CSV"],
    columns: [
      "Prescription number",
      "Patient name",
      "Medication",
      "Quantity dispensed",
      "Dispensed by",
      "Dispensed at",
    ],
  },
  {
    id: "report-7",
    title: "Billing Reports",
    description: "Invoices, payments, and outstanding balances.",
    category: "Billing",
    href: "/reports?category=billing",
    formats: ["PDF", "XLSX", "CSV"],
    columns: [
      "Invoice number",
      "Patient name",
      "Invoice date",
      "Total amount",
      "Amount paid",
      "Balance",
      "Invoice status",
    ],
  },
  {
    id: "report-8",
    title: "Inventory Reports",
    description: "Stock levels, movements, and expirations.",
    category: "Inventory",
    href: "/reports?category=inventory",
    formats: ["PDF", "XLSX", "CSV"],
    columns: [
      "Item code",
      "Item name",
      "Unit",
      "Quantity on hand",
      "Reorder level",
      "Nearest expiration",
      "Stock status",
    ],
  },
  {
    id: "report-9",
    title: "Staff Reports",
    description: "Staff roster and department assignments.",
    category: "Staff",
    href: "/reports?category=staff",
    formats: ["PDF", "XLSX"],
    columns: [
      "Staff number",
      "Staff name",
      "Role",
      "Department",
      "Employment type",
      "Account status",
    ],
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
  "use cache";
  cacheLife("max");
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

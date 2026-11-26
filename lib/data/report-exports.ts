import { formatDate, formatDateTime } from "@/lib/format";
import { listAdmissions } from "./admissions";
import { listAppointments } from "./appointments";
import { listInvoices } from "./billing";
import { listInventoryItems } from "./inventory";
import { listLabOrders } from "./laboratory";
import { listPatients } from "./patients";
import { listPrescriptions } from "./pharmacy";
import { listBeds } from "./rooms";
import { listStaff } from "./staff";
import type { DataResult, PagedResult } from "./result";
import type { ExportCell } from "@/lib/reports/export-formats";

export const REPORT_KEYS = [
  "patient",
  "appointment",
  "admission",
  "bed-occupancy",
  "laboratory",
  "pharmacy",
  "billing",
  "inventory",
  "staff",
] as const;

export type ReportKey = (typeof REPORT_KEYS)[number];

export function isReportKey(value: string): value is ReportKey {
  return (REPORT_KEYS as readonly string[]).includes(value);
}

export type ReportTable = {
  title: string;
  columns: string[];
  rows: ExportCell[][];
};

async function collect<T>(
  load: (page: number, pageSize: number) => Promise<PagedResult<T>>
): Promise<DataResult<T[]>> {
  const pageSize = 500;
  const rows: T[] = [];
  let page = 1;

  for (;;) {
    const result = await load(page, pageSize);

    if (result.error) {
      return { data: null, error: result.error };
    }

    rows.push(...result.data.rows);

    if (
      result.data.rows.length < pageSize ||
      rows.length >= result.data.total ||
      page >= 40
    ) {
      return { data: rows, error: null };
    }

    page += 1;
  }
}

function ageFrom(dob: string | null): string {
  if (!dob) {
    return "—";
  }

  const birth = new Date(dob);

  if (Number.isNaN(birth.getTime())) {
    return "—";
  }

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const monthDelta = now.getMonth() - birth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) {
    years -= 1;
  }

  return String(Math.max(0, years));
}

function lengthOfStay(start: string, end: string | null): string {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "—";
  }

  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  return String(Math.max(0, days));
}

function notEmpty(value: string | null | undefined, fallback = "—"): string {
  const trimmed = value?.trim();

  return trimmed ? trimmed : fallback;
}

export async function buildReportTable(
  key: ReportKey
): Promise<DataResult<ReportTable>> {
  switch (key) {
    case "patient": {
      const result = await collect((page, pageSize) =>
        listPatients({ page, pageSize })
      );

      if (result.error) {
        return result;
      }

      return {
        data: {
          title: "Patient Registration Report",
          columns: [
            "Medical record number",
            "Patient name",
            "Sex",
            "Age",
            "Registration date",
            "Registration status",
          ],
          rows: result.data.map((row) => [
            row.medical_record_number,
            row.full_name,
            notEmpty(row.sex),
            ageFrom(row.date_of_birth),
            formatDate(row.registration_date),
            row.registration_status,
          ]),
        },
        error: null,
      };
    }

    case "appointment": {
      const result = await collect((page, pageSize) =>
        listAppointments({ page, pageSize })
      );

      if (result.error) {
        return result;
      }

      return {
        data: {
          title: "Appointment Report",
          columns: [
            "Appointment number",
            "Patient name",
            "Department",
            "Physician",
            "Scheduled date",
            "Appointment status",
          ],
          rows: result.data.map((row) => [
            row.appointment_number,
            row.patient_name,
            row.department_name,
            notEmpty(row.physician_name, "Unassigned"),
            formatDateTime(row.scheduled_at),
            row.status,
          ]),
        },
        error: null,
      };
    }

    case "admission": {
      const result = await collect((page, pageSize) =>
        listAdmissions({ page, pageSize })
      );

      if (result.error) {
        return result;
      }

      return {
        data: {
          title: "Admission and Discharge Report",
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
          rows: result.data.map((row) => [
            row.admission_number,
            row.patient_name,
            row.department_name,
            notEmpty(row.attending_physician_name, "Unassigned"),
            formatDateTime(row.admission_date),
            row.discharge_date ? formatDateTime(row.discharge_date) : "—",
            lengthOfStay(row.admission_date, row.discharge_date),
            row.status,
          ]),
        },
        error: null,
      };
    }

    case "bed-occupancy": {
      const result = await listBeds();

      if (result.error) {
        return result;
      }

      return {
        data: {
          title: "Bed Occupancy Report",
          columns: [
            "Department",
            "Room number",
            "Bed number",
            "Bed status",
            "Patient",
          ],
          rows: result.data.map((bed) => [
            bed.department_name,
            bed.room_number,
            bed.bed_number,
            bed.status,
            notEmpty(bed.patient_name, "Unassigned"),
          ]),
        },
        error: null,
      };
    }

    case "laboratory": {
      const result = await collect((page, pageSize) =>
        listLabOrders({ page, pageSize })
      );

      if (result.error) {
        return result;
      }

      return {
        data: {
          title: "Laboratory Report",
          columns: [
            "Order number",
            "Patient name",
            "Test(s)",
            "Priority",
            "Ordered at",
            "Status",
          ],
          rows: result.data.map((row) => [
            row.order_number,
            row.patient_name,
            row.tests.length > 0 ? row.tests.join(", ") : "—",
            row.priority,
            formatDateTime(row.ordered_at),
            row.status,
          ]),
        },
        error: null,
      };
    }

    case "pharmacy": {
      const result = await collect((page, pageSize) =>
        listPrescriptions({ page, pageSize })
      );

      if (result.error) {
        return result;
      }

      return {
        data: {
          title: "Pharmacy Report",
          columns: [
            "Prescription number",
            "Patient name",
            "Medication(s)",
            "Items",
            "Status",
            "Prescription date",
          ],
          rows: result.data.map((row) => [
            row.prescription_number,
            row.patient_name,
            row.medications.length > 0 ? row.medications.join(", ") : "—",
            row.item_count,
            row.status,
            formatDateTime(row.prescription_date),
          ]),
        },
        error: null,
      };
    }

    case "billing": {
      const result = await collect((page, pageSize) =>
        listInvoices({ page, pageSize })
      );

      if (result.error) {
        return result;
      }

      return {
        data: {
          title: "Billing Report",
          columns: [
            "Invoice number",
            "Patient name",
            "Invoice date",
            "Total amount",
            "Amount paid",
            "Balance",
            "Invoice status",
          ],
          rows: result.data.map((row) => [
            row.invoice_number,
            row.patient_name,
            formatDate(row.invoice_date),
            Number(row.total_amount),
            Number(row.amount_paid),
            Number(row.balance),
            row.status,
          ]),
        },
        error: null,
      };
    }

    case "inventory": {
      const result = await collect((page, pageSize) =>
        listInventoryItems({ page, pageSize })
      );

      if (result.error) {
        return result;
      }

      return {
        data: {
          title: "Inventory Report",
          columns: [
            "Item code",
            "Item name",
            "Unit",
            "Quantity on hand",
            "Reorder level",
            "Nearest expiration",
            "Stock status",
          ],
          rows: result.data.map((row) => [
            row.item_code,
            row.name,
            row.unit,
            row.quantity_on_hand,
            row.reorder_level,
            row.nearest_expiration ? formatDate(row.nearest_expiration) : "—",
            row.stock_status,
          ]),
        },
        error: null,
      };
    }

    case "staff": {
      const result = await collect((page, pageSize) =>
        listStaff({ page, pageSize })
      );

      if (result.error) {
        return result;
      }

      return {
        data: {
          title: "Staff Report",
          columns: [
            "Staff number",
            "Staff name",
            "Role",
            "Department",
            "Employment type",
            "Account status",
          ],
          rows: result.data.map((row) => [
            row.staff_number,
            row.full_name,
            row.role_names.length > 0 ? row.role_names.join(", ") : "—",
            notEmpty(row.department_name),
            notEmpty(row.employment_type),
            row.is_active ? "Active" : "Inactive",
          ]),
        },
        error: null,
      };
    }
  }

  return {
    data: null,
    error: { code: "UNKNOWN", message: "Unknown report category." },
  };
}

import type { AuditLog, AuditLogRow, ReportCard, ReportRange } from "@/types/hospital";
import {
  isoAt,
  isoDate,
  previewUuid,
  profileIds,
  profileNameById,
} from "./base";

type AuditSeed = {
  actor: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  outcome: "success" | "failed";
  dayOffset: number;
  hour: number;
  ip: string;
};

const AUDIT_SEEDS: AuditSeed[] = [
  { actor: profileIds.superAdmin, action: "auth.login", entity_type: "profile", entity_id: profileIds.superAdmin, description: "User signed in.", outcome: "success", dayOffset: 0, hour: 7, ip: "192.168.10.11" },
  { actor: profileIds.receptionist, action: "patient.create", entity_type: "patient", entity_id: previewUuid(10, 1), description: "Patient registration created.", outcome: "success", dayOffset: 0, hour: 8, ip: "192.168.10.21" },
  { actor: profileIds.physicianA, action: "patient.view", entity_type: "patient", entity_id: previewUuid(10, 2), description: "Patient record opened.", outcome: "success", dayOffset: 0, hour: 8, ip: "192.168.10.31" },
  { actor: profileIds.receptionist, action: "appointment.create", entity_type: "appointment", entity_id: previewUuid(11, 4), description: "Appointment scheduled.", outcome: "success", dayOffset: -1, hour: 9, ip: "192.168.10.21" },
  { actor: profileIds.physicianA, action: "medical_record.update", entity_type: "encounter", entity_id: previewUuid(19, 4), description: "Clinical note updated.", outcome: "success", dayOffset: -1, hour: 10, ip: "192.168.10.31" },
  { actor: profileIds.nurseA, action: "vital_signs.record", entity_type: "vital_signs", entity_id: previewUuid(20, 4), description: "Vital signs recorded.", outcome: "success", dayOffset: -1, hour: 11, ip: "192.168.10.41" },
  { actor: profileIds.labTech, action: "laboratory.result.verify", entity_type: "laboratory_result", entity_id: previewUuid(29, 1), description: "Laboratory result verified.", outcome: "success", dayOffset: -2, hour: 12, ip: "192.168.10.51" },
  { actor: profileIds.radiologist, action: "radiology.report.verify", entity_type: "radiology_report", entity_id: previewUuid(31, 2), description: "Radiology report verified.", outcome: "success", dayOffset: -2, hour: 13, ip: "192.168.10.52" },
  { actor: profileIds.pharmacist, action: "prescription.dispense", entity_type: "prescription", entity_id: previewUuid(33, 6), description: "Prescription partially dispensed.", outcome: "success", dayOffset: -3, hour: 14, ip: "192.168.10.61" },
  { actor: profileIds.billing, action: "payment.post", entity_type: "payment", entity_id: previewUuid(43, 2), description: "Payment recorded.", outcome: "success", dayOffset: -3, hour: 15, ip: "192.168.10.71" },
  { actor: profileIds.hospitalAdmin, action: "user.role.update", entity_type: "profile", entity_id: profileIds.inventory, description: "Role assignment updated.", outcome: "failed", dayOffset: -4, hour: 9, ip: "192.168.10.12" },
  { actor: profileIds.inventory, action: "inventory.stock.adjust", entity_type: "stock_transaction", entity_id: previewUuid(39, 3), description: "Stock adjustment recorded.", outcome: "success", dayOffset: -4, hour: 10, ip: "192.168.10.81" },
  { actor: profileIds.physicianC, action: "admission.create", entity_type: "admission", entity_id: previewUuid(16, 6), description: "Inpatient admission created.", outcome: "success", dayOffset: -5, hour: 11, ip: "192.168.10.32" },
  { actor: profileIds.physicianC, action: "admission.discharge", entity_type: "admission", entity_id: previewUuid(16, 9), description: "Discharge processed.", outcome: "success", dayOffset: -6, hour: 12, ip: "192.168.10.32" },
  { actor: profileIds.nurseB, action: "nursing.assessment.create", entity_type: "nursing_assessment", entity_id: previewUuid(23, 2), description: "Nursing assessment recorded.", outcome: "success", dayOffset: -7, hour: 8, ip: "192.168.10.42" },
  { actor: profileIds.superAdmin, action: "settings.update", entity_type: "system_settings", entity_id: null, description: "Hospital configuration updated.", outcome: "success", dayOffset: -8, hour: 9, ip: "192.168.10.11" },
  { actor: profileIds.receptionist, action: "appointment.cancel", entity_type: "appointment", entity_id: previewUuid(11, 10), description: "Appointment cancelled.", outcome: "failed", dayOffset: -9, hour: 10, ip: "192.168.10.21" },
  { actor: profileIds.billing, action: "invoice.create", entity_type: "invoice", entity_id: previewUuid(41, 6), description: "Invoice generated.", outcome: "success", dayOffset: -10, hour: 11, ip: "192.168.10.71" },
];

export const auditLogs: AuditLog[] = AUDIT_SEEDS.map((seed, index) => ({
  id: index + 1,
  actor_id: seed.actor,
  action: seed.action,
  entity_type: seed.entity_type,
  entity_id: seed.entity_id,
  description: seed.description,
  metadata: { outcome: seed.outcome },
  ip_address: seed.ip,
  created_at: isoAt(seed.dayOffset, seed.hour),
}));

export const auditLogRows: AuditLogRow[] = auditLogs
  .map((log) => ({
    id: log.id,
    created_at: log.created_at,
    actor_id: log.actor_id,
    actor_name: log.actor_id
      ? profileNameById.get(log.actor_id) ?? "Test User"
      : "System",
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    description: log.description,
    ip_address: log.ip_address,
    result:
      log.metadata.outcome === "failed"
        ? ("failed" as const)
        : ("success" as const),
  }))
  .sort((a, b) =>
    a.created_at === b.created_at ? 0 : a.created_at < b.created_at ? 1 : -1
  );

const REPORT_SEEDS: Omit<ReportCard, "id">[] = [
  { title: "Patient Registration", description: "Registration volume and demographic summaries.", category: "Patient", href: "/reports?category=patient", formats: ["PDF", "XLSX", "CSV"] },
  { title: "Appointment Activity", description: "Appointment status and scheduling summaries.", category: "Appointment", href: "/reports?category=appointment", formats: ["PDF", "XLSX", "CSV"] },
  { title: "Admission and Discharge", description: "Admissions, discharges, and length of stay.", category: "Admission", href: "/reports?category=admission", formats: ["PDF", "XLSX", "CSV"] },
  { title: "Bed Occupancy", description: "Bed availability and occupancy by department.", category: "Admission", href: "/reports?category=bed-occupancy", formats: ["PDF", "XLSX"] },
  { title: "Laboratory Activity", description: "Laboratory order volume and turnaround.", category: "Laboratory", href: "/reports?category=laboratory", formats: ["PDF", "XLSX", "CSV"] },
  { title: "Pharmacy Dispensing", description: "Prescription and dispensing summaries.", category: "Pharmacy", href: "/reports?category=pharmacy", formats: ["PDF", "XLSX", "CSV"] },
  { title: "Billing and Collections", description: "Invoices, payments, and outstanding balances.", category: "Billing", href: "/reports?category=billing", formats: ["PDF", "XLSX", "CSV"] },
  { title: "Inventory and Stock", description: "Stock levels, movements, and expirations.", category: "Inventory", href: "/reports?category=inventory", formats: ["PDF", "XLSX", "CSV"] },
  { title: "Staff Directory", description: "Staff roster and department assignments.", category: "Staff", href: "/reports?category=staff", formats: ["PDF", "XLSX"] },
];

export const reportCards: ReportCard[] = REPORT_SEEDS.map((seed, index) => ({
  id: `report-${index + 1}`,
  ...seed,
}));

export const reportRange: ReportRange = {
  start: isoDate(-30),
  end: isoDate(0),
  label: "Last 30 days",
};

import type {
  Appointment,
  AppointmentListRow,
} from "@/types/hospital";
import {
  departmentIds,
  departmentNameById,
  isoAt,
  physicianIds,
  physicianNameById,
  previewUuid,
  profileIds,
} from "./base";
import { patientMrnById, patientNameById } from "./patients";

type AppointmentSeed = {
  patientIndex: number;
  department_id: string;
  physicianKey: "a" | "b" | "c" | null;
  dayOffset: number;
  hour: number;
  minute: number;
  duration_minutes: number;
  appointment_type: string;
  reason_for_visit: string;
  status: Appointment["status"];
};

const APPOINTMENT_SEEDS: AppointmentSeed[] = [
  { patientIndex: 0, department_id: departmentIds.opd, physicianKey: "a", dayOffset: -3, hour: 9, minute: 0, duration_minutes: 30, appointment_type: "Consultation", reason_for_visit: "Routine checkup", status: "completed" },
  { patientIndex: 1, department_id: departmentIds.opd, physicianKey: "a", dayOffset: -2, hour: 10, minute: 30, duration_minutes: 30, appointment_type: "Follow-up", reason_for_visit: "Follow-up visit", status: "completed" },
  { patientIndex: 2, department_id: departmentIds.er, physicianKey: "b", dayOffset: -1, hour: 11, minute: 0, duration_minutes: 45, appointment_type: "Emergency", reason_for_visit: "Persistent cough", status: "no_show" },
  { patientIndex: 3, department_id: departmentIds.opd, physicianKey: "a", dayOffset: 0, hour: 8, minute: 0, duration_minutes: 30, appointment_type: "Consultation", reason_for_visit: "Headache evaluation", status: "waiting" },
  { patientIndex: 4, department_id: departmentIds.opd, physicianKey: "a", dayOffset: 0, hour: 9, minute: 0, duration_minutes: 30, appointment_type: "Follow-up", reason_for_visit: "Blood pressure monitoring", status: "in_consultation" },
  { patientIndex: 5, department_id: departmentIds.ipd, physicianKey: "c", dayOffset: 0, hour: 10, minute: 0, duration_minutes: 60, appointment_type: "Consultation", reason_for_visit: "Pre-operative assessment", status: "scheduled" },
  { patientIndex: 6, department_id: departmentIds.opd, physicianKey: "a", dayOffset: 1, hour: 13, minute: 0, duration_minutes: 30, appointment_type: "Follow-up", reason_for_visit: "Medication review", status: "confirmed" },
  { patientIndex: 7, department_id: departmentIds.er, physicianKey: "b", dayOffset: 1, hour: 14, minute: 0, duration_minutes: 45, appointment_type: "Walk-in", reason_for_visit: "Abdominal discomfort", status: "scheduled" },
  { patientIndex: 8, department_id: departmentIds.opd, physicianKey: "a", dayOffset: 2, hour: 9, minute: 0, duration_minutes: 30, appointment_type: "Consultation", reason_for_visit: "Skin rash evaluation", status: "confirmed" },
  { patientIndex: 9, department_id: departmentIds.opd, physicianKey: null, dayOffset: 2, hour: 10, minute: 0, duration_minutes: 30, appointment_type: "Consultation", reason_for_visit: "General consultation", status: "cancelled" },
  { patientIndex: 10, department_id: departmentIds.ipd, physicianKey: "c", dayOffset: 3, hour: 11, minute: 0, duration_minutes: 60, appointment_type: "Follow-up", reason_for_visit: "Post-operative review", status: "scheduled" },
  { patientIndex: 11, department_id: departmentIds.opd, physicianKey: "a", dayOffset: 4, hour: 15, minute: 0, duration_minutes: 30, appointment_type: "Consultation", reason_for_visit: "Annual physical examination", status: "confirmed" },
  { patientIndex: 12, department_id: departmentIds.er, physicianKey: "b", dayOffset: -4, hour: 9, minute: 0, duration_minutes: 45, appointment_type: "Emergency", reason_for_visit: "Fever and chills", status: "cancelled" },
  { patientIndex: 13, department_id: departmentIds.opd, physicianKey: "a", dayOffset: -5, hour: 14, minute: 0, duration_minutes: 30, appointment_type: "Follow-up", reason_for_visit: "Laboratory result review", status: "completed" },
  { patientIndex: 2, department_id: departmentIds.opd, physicianKey: "a", dayOffset: 2, hour: 16, minute: 0, duration_minutes: 30, appointment_type: "Consultation", reason_for_visit: "Recurring back pain", status: "waiting" },
  { patientIndex: 6, department_id: departmentIds.opd, physicianKey: "a", dayOffset: 6, hour: 8, minute: 30, duration_minutes: 30, appointment_type: "Consultation", reason_for_visit: "Routine screening", status: "scheduled" },
];

export const appointments: Appointment[] = APPOINTMENT_SEEDS.map(
  (seed, index) => {
    const scheduled = isoAt(seed.dayOffset, seed.hour, seed.minute);

    return {
      id: previewUuid(11, index + 1),
      appointment_number: `APT-2026-${String(index + 1).padStart(4, "0")}`,
      patient_id: previewUuid(10, seed.patientIndex + 1),
      department_id: seed.department_id,
      physician_id: seed.physicianKey ? physicianIds[seed.physicianKey] : null,
      scheduled_at: scheduled,
      duration_minutes: seed.duration_minutes,
      appointment_type: seed.appointment_type,
      reason_for_visit: seed.reason_for_visit,
      status: seed.status,
      notes: null,
      created_by: profileIds.receptionist,
      created_at: isoAt(seed.dayOffset - 2, 9),
      updated_at: isoAt(seed.dayOffset, 7),
    };
  }
);

export const appointmentListRows: AppointmentListRow[] = appointments
  .map((appointment) => ({
    id: appointment.id,
    appointment_number: appointment.appointment_number,
    patient_id: appointment.patient_id,
    patient_name: patientNameById.get(appointment.patient_id) ?? "Test Patient",
    patient_mrn: patientMrnById.get(appointment.patient_id) ?? "MRN-2026-0000",
    department_id: appointment.department_id,
    department_name:
      departmentNameById.get(appointment.department_id) ?? "Unassigned",
    physician_id: appointment.physician_id,
    physician_name: appointment.physician_id
      ? physicianNameById.get(appointment.physician_id) ?? null
      : null,
    scheduled_at: appointment.scheduled_at,
    duration_minutes: appointment.duration_minutes,
    appointment_type: appointment.appointment_type,
    reason_for_visit: appointment.reason_for_visit,
    status: appointment.status,
    notes: appointment.notes,
    created_at: appointment.created_at,
  }))
  .sort((a, b) =>
    a.scheduled_at === b.scheduled_at
      ? 0
      : a.scheduled_at < b.scheduled_at
        ? 1
        : -1
  );

export const appointmentById = new Map(
  appointments.map((appointment) => [appointment.id, appointment])
);

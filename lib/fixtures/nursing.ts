import type { NursingAssignmentRow } from "@/types/hospital";
import { staffIds, staffNameById } from "./base";
import { patientMrnById, patientNameById } from "./patients";
import { admissions, bedBoardRows } from "./admissions";
import { nursingAssessments, vitalSigns } from "./encounters";

const latestVitalsByPatientId = new Map<string, (typeof vitalSigns)[number]>();

for (const vital of vitalSigns) {
  const existing = latestVitalsByPatientId.get(vital.patient_id);

  if (!existing || existing.recorded_at < vital.recorded_at) {
    latestVitalsByPatientId.set(vital.patient_id, vital);
  }
}

const assessedPatientIds = new Set(
  nursingAssessments.map((assessment) => assessment.patient_id)
);

export const nursingAssignmentRows: NursingAssignmentRow[] = admissions
  .filter(
    (admission) =>
      admission.status === "admitted" || admission.status === "transferred"
  )
  .map((admission, index) => {
    const bed = bedBoardRows.find((row) => row.admission_id === admission.id);
    const nurseId = index % 2 === 0 ? staffIds.nurseA : staffIds.nurseB;

    return {
      patient_id: admission.patient_id,
      patient_name:
        patientNameById.get(admission.patient_id) ?? bed?.patient_name ?? "Test Patient",
      patient_mrn:
        patientMrnById.get(admission.patient_id) ?? "MRN-2026-0000",
      admission_id: admission.id,
      admission_number: admission.admission_number,
      department_name: bed?.department_name ?? "Inpatient Department",
      room_number: bed?.room_number ?? null,
      bed_number: bed?.bed_number ?? null,
      assigned_staff_name: staffNameById.get(nurseId) ?? "Test Nurse",
      latest_vitals: latestVitalsByPatientId.get(admission.patient_id) ?? null,
      pending_assessments: assessedPatientIds.has(admission.patient_id) ? 0 : 1,
      active_tasks: 1 + (index % 3),
    };
  });

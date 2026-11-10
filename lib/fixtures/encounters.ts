import type {
  ClinicalNote,
  Diagnosis,
  Encounter,
  EncounterListRow,
  NursingAssessment,
  NursingNote,
  VitalSigns,
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
import { appointments } from "./appointments";
import { admissions } from "./admissions";

type EncounterSeed = {
  patientIndex: number;
  appointmentIndex: number | null;
  admissionIndex: number | null;
  physicianKey: "a" | "b" | "c";
  department_id: string;
  encounter_type: string;
  chief_complaint: string;
  clinical_status: Encounter["clinical_status"];
  dayOffset: number;
  hour: number;
};

const ENCOUNTER_SEEDS: EncounterSeed[] = [
  { patientIndex: 0, appointmentIndex: 0, admissionIndex: null, physicianKey: "a", department_id: departmentIds.opd, encounter_type: "Outpatient", chief_complaint: "Routine checkup", clinical_status: "completed", dayOffset: -3, hour: 9 },
  { patientIndex: 1, appointmentIndex: 1, admissionIndex: null, physicianKey: "a", department_id: departmentIds.opd, encounter_type: "Outpatient", chief_complaint: "Follow-up visit", clinical_status: "completed", dayOffset: -2, hour: 10 },
  { patientIndex: 2, appointmentIndex: 2, admissionIndex: null, physicianKey: "b", department_id: departmentIds.er, encounter_type: "Emergency", chief_complaint: "Persistent cough", clinical_status: "completed", dayOffset: -1, hour: 11 },
  { patientIndex: 3, appointmentIndex: 3, admissionIndex: null, physicianKey: "a", department_id: departmentIds.opd, encounter_type: "Outpatient", chief_complaint: "Headache evaluation", clinical_status: "in_progress", dayOffset: 0, hour: 8 },
  { patientIndex: 4, appointmentIndex: 4, admissionIndex: null, physicianKey: "a", department_id: departmentIds.opd, encounter_type: "Outpatient", chief_complaint: "Blood pressure monitoring", clinical_status: "in_progress", dayOffset: 0, hour: 9 },
  { patientIndex: 5, appointmentIndex: 5, admissionIndex: null, physicianKey: "c", department_id: departmentIds.ipd, encounter_type: "Inpatient", chief_complaint: "Pre-operative assessment", clinical_status: "open", dayOffset: 0, hour: 10 },
  { patientIndex: 6, appointmentIndex: null, admissionIndex: 6, physicianKey: "c", department_id: departmentIds.ipd, encounter_type: "Inpatient", chief_complaint: "Post-operative monitoring", clinical_status: "in_progress", dayOffset: -22, hour: 10 },
  { patientIndex: 7, appointmentIndex: null, admissionIndex: 7, physicianKey: "b", department_id: departmentIds.er, encounter_type: "Emergency", chief_complaint: "Abdominal discomfort", clinical_status: "completed", dayOffset: -27, hour: 11 },
  { patientIndex: 8, appointmentIndex: null, admissionIndex: 8, physicianKey: "a", department_id: departmentIds.ipd, encounter_type: "Inpatient", chief_complaint: "Completed treatment course", clinical_status: "completed", dayOffset: -35, hour: 10 },
  { patientIndex: 9, appointmentIndex: null, admissionIndex: 9, physicianKey: "c", department_id: departmentIds.ipd, encounter_type: "Inpatient", chief_complaint: "Medication adjustment", clinical_status: "completed", dayOffset: -48, hour: 10 },
  { patientIndex: 10, appointmentIndex: null, admissionIndex: 10, physicianKey: "a", department_id: departmentIds.opd, encounter_type: "Observation", chief_complaint: "Short observation stay", clinical_status: "completed", dayOffset: -62, hour: 10 },
  { patientIndex: 11, appointmentIndex: null, admissionIndex: null, physicianKey: "b", department_id: departmentIds.er, encounter_type: "Emergency", chief_complaint: "Fever and chills", clinical_status: "cancelled", dayOffset: -4, hour: 9 },
  { patientIndex: 12, appointmentIndex: null, admissionIndex: null, physicianKey: "a", department_id: departmentIds.opd, encounter_type: "Outpatient", chief_complaint: "Skin rash evaluation", clinical_status: "open", dayOffset: 1, hour: 9 },
  { patientIndex: 13, appointmentIndex: null, admissionIndex: null, physicianKey: "a", department_id: departmentIds.opd, encounter_type: "Outpatient", chief_complaint: "Laboratory result review", clinical_status: "completed", dayOffset: -5, hour: 14 },
];

const PHYSICIAN_PROFILE_BY_KEY = {
  a: profileIds.physicianA,
  b: profileIds.physicianB,
  c: profileIds.physicianC,
};

export const encounters: Encounter[] = ENCOUNTER_SEEDS.map((seed, index) => ({
  id: previewUuid(19, index + 1),
  encounter_number: `ENC-2026-${String(index + 1).padStart(4, "0")}`,
  patient_id: previewUuid(10, seed.patientIndex + 1),
  appointment_id:
    seed.appointmentIndex === null
      ? null
      : appointments[seed.appointmentIndex].id,
  admission_id:
    seed.admissionIndex === null ? null : admissions[seed.admissionIndex].id,
  physician_id: physicianIds[seed.physicianKey],
  department_id: seed.department_id,
  encounter_type: seed.encounter_type,
  chief_complaint: seed.chief_complaint,
  clinical_status: seed.clinical_status,
  started_at: isoAt(seed.dayOffset, seed.hour),
  completed_at:
    seed.clinical_status === "completed"
      ? isoAt(seed.dayOffset, seed.hour + 1)
      : null,
  created_by: PHYSICIAN_PROFILE_BY_KEY[seed.physicianKey],
  created_at: isoAt(seed.dayOffset, seed.hour),
  updated_at: isoAt(seed.dayOffset, seed.hour + 1),
}));

export const encounterById = new Map(
  encounters.map((encounter) => [encounter.id, encounter])
);

export const encounterListRows: EncounterListRow[] = encounters
  .map((encounter) => ({
    id: encounter.id,
    encounter_number: encounter.encounter_number,
    patient_id: encounter.patient_id,
    patient_name: patientNameById.get(encounter.patient_id) ?? "Test Patient",
    patient_mrn: patientMrnById.get(encounter.patient_id) ?? "MRN-2026-0000",
    department_id: encounter.department_id,
    department_name:
      departmentNameById.get(encounter.department_id) ?? "Unassigned",
    physician_id: encounter.physician_id,
    physician_name: encounter.physician_id
      ? physicianNameById.get(encounter.physician_id) ?? null
      : null,
    encounter_type: encounter.encounter_type,
    chief_complaint: encounter.chief_complaint,
    clinical_status: encounter.clinical_status,
    started_at: encounter.started_at,
    completed_at: encounter.completed_at,
  }))
  .sort((a, b) =>
    a.started_at === b.started_at ? 0 : a.started_at < b.started_at ? 1 : -1
  );

const VITAL_SEEDS = [
  { systolic_bp: 120, diastolic_bp: 80, heart_rate: 78, respiratory_rate: 18, temperature: 36.7, oxygen_saturation: 98, weight_kg: 68, height_cm: 165 },
  { systolic_bp: 118, diastolic_bp: 76, heart_rate: 82, respiratory_rate: 17, temperature: 36.5, oxygen_saturation: 99, weight_kg: 74, height_cm: 172 },
  { systolic_bp: 132, diastolic_bp: 86, heart_rate: 90, respiratory_rate: 20, temperature: 37.4, oxygen_saturation: 96, weight_kg: 61, height_cm: 158 },
  { systolic_bp: 126, diastolic_bp: 82, heart_rate: 76, respiratory_rate: 18, temperature: 36.8, oxygen_saturation: 98, weight_kg: 70, height_cm: 170 },
  { systolic_bp: 140, diastolic_bp: 92, heart_rate: 88, respiratory_rate: 19, temperature: 36.6, oxygen_saturation: 97, weight_kg: 80, height_cm: 168 },
  { systolic_bp: 116, diastolic_bp: 74, heart_rate: 72, respiratory_rate: 16, temperature: 36.4, oxygen_saturation: 99, weight_kg: 59, height_cm: 160 },
  { systolic_bp: 128, diastolic_bp: 84, heart_rate: 84, respiratory_rate: 18, temperature: 36.9, oxygen_saturation: 98, weight_kg: 66, height_cm: 163 },
  { systolic_bp: 110, diastolic_bp: 70, heart_rate: 96, respiratory_rate: 22, temperature: 38.1, oxygen_saturation: 95, weight_kg: 55, height_cm: 156 },
  { systolic_bp: 124, diastolic_bp: 78, heart_rate: 74, respiratory_rate: 17, temperature: 36.6, oxygen_saturation: 99, weight_kg: 72, height_cm: 175 },
  { systolic_bp: 136, diastolic_bp: 88, heart_rate: 86, respiratory_rate: 19, temperature: 36.7, oxygen_saturation: 97, weight_kg: 78, height_cm: 169 },
  { systolic_bp: 122, diastolic_bp: 80, heart_rate: 80, respiratory_rate: 18, temperature: 36.5, oxygen_saturation: 98, weight_kg: 63, height_cm: 162 },
  { systolic_bp: 130, diastolic_bp: 85, heart_rate: 92, respiratory_rate: 21, temperature: 37.8, oxygen_saturation: 96, weight_kg: 69, height_cm: 166 },
  { systolic_bp: 119, diastolic_bp: 77, heart_rate: 75, respiratory_rate: 17, temperature: 36.6, oxygen_saturation: 99, weight_kg: 65, height_cm: 164 },
  { systolic_bp: 127, diastolic_bp: 81, heart_rate: 79, respiratory_rate: 18, temperature: 36.8, oxygen_saturation: 98, weight_kg: 71, height_cm: 171 },
];

export const vitalSigns: VitalSigns[] = encounters.map((encounter, index) => {
  const seed = VITAL_SEEDS[index];
  const recordedAt = new Date(
    Date.parse(encounter.started_at) + 30 * 60_000
  ).toISOString();

  return {
    id: previewUuid(20, index + 1),
    patient_id: encounter.patient_id,
    encounter_id: encounter.id,
    systolic_bp: seed.systolic_bp,
    diastolic_bp: seed.diastolic_bp,
    heart_rate: seed.heart_rate,
    respiratory_rate: seed.respiratory_rate,
    temperature: seed.temperature,
    oxygen_saturation: seed.oxygen_saturation,
    weight_kg: seed.weight_kg,
    height_cm: seed.height_cm,
    recorded_by: index % 2 === 0 ? profileIds.nurseA : profileIds.nurseB,
    recorded_at: recordedAt,
    created_at: recordedAt,
  };
});

const DIAGNOSIS_SEEDS = [
  { code: "I10", name: "Essential hypertension", type: "Primary" },
  { code: "E11.9", name: "Type 2 diabetes mellitus", type: "Primary" },
  { code: "J45.9", name: "Asthma, unspecified", type: "Primary" },
  { code: "J06.9", name: "Acute upper respiratory infection", type: "Primary" },
  { code: "R51", name: "Headache", type: "Primary" },
  { code: "K35.80", name: "Acute appendicitis", type: "Primary" },
  { code: "A09", name: "Infectious gastroenteritis", type: "Primary" },
  { code: "N39.0", name: "Urinary tract infection", type: "Primary" },
  { code: "M54.5", name: "Low back pain", type: "Primary" },
  { code: "J18.9", name: "Pneumonia, unspecified", type: "Primary" },
  { code: "E78.5", name: "Hyperlipidemia", type: "Secondary" },
  { code: "L30.9", name: "Dermatitis, unspecified", type: "Primary" },
];

export const diagnoses: Diagnosis[] = DIAGNOSIS_SEEDS.map((seed, index) => {
  const encounter = encounters[index];

  return {
    id: previewUuid(21, index + 1),
    patient_id: encounter.patient_id,
    encounter_id: encounter.id,
    diagnosis_code: seed.code,
    diagnosis_name: seed.name,
    diagnosis_type: seed.type,
    clinical_notes: "Synthetic preview diagnosis.",
    is_primary: seed.type === "Primary",
    recorded_by:
      index % 2 === 0 ? profileIds.physicianA : profileIds.physicianB,
    recorded_at: encounter.started_at,
    created_at: encounter.started_at,
  };
});

const CLINICAL_NOTE_SEEDS = [
  { note_type: "Progress", content: "Patient stable; continue current monitoring.", status: "finalized" as const },
  { note_type: "SOAP", content: "Subjective findings reviewed; objective findings stable.", status: "finalized" as const },
  { note_type: "Consultation", content: "Consultation completed with follow-up plan.", status: "finalized" as const },
  { note_type: "Progress", content: "Vital signs within expected range.", status: "draft" as const },
  { note_type: "SOAP", content: "Assessment pending additional laboratory review.", status: "draft" as const },
  { note_type: "Progress", content: "Patient reports improvement in symptoms.", status: "finalized" as const },
  { note_type: "Discharge", content: "Discharge instructions reviewed with patient.", status: "finalized" as const },
  { note_type: "Progress", content: "Medication response under observation.", status: "amended" as const },
  { note_type: "Consultation", content: "Specialist review requested.", status: "draft" as const },
  { note_type: "Progress", content: "Care plan updated after reassessment.", status: "finalized" as const },
];

export const clinicalNotes: ClinicalNote[] = CLINICAL_NOTE_SEEDS.map(
  (seed, index) => {
    const encounter = encounters[index];

    return {
      id: previewUuid(22, index + 1),
      patient_id: encounter.patient_id,
      encounter_id: encounter.id,
      note_type: seed.note_type,
      content: seed.content,
      status: seed.status,
      authored_by:
        index % 2 === 0 ? profileIds.physicianA : profileIds.physicianC,
      finalized_at:
        seed.status === "finalized"
          ? isoAt(-10 + index, 12)
          : null,
      created_at: isoAt(-10 + index, 11),
      updated_at: isoAt(-10 + index, 12),
    };
  }
);

const NURSING_ASSESSMENT_TYPES = [
  "Fall risk assessment",
  "Pain assessment",
  "Skin integrity assessment",
  "Nutrition assessment",
  "Safety assessment",
];

export const nursingAssessments: NursingAssessment[] =
  NURSING_ASSESSMENT_TYPES.map((assessmentType, index) => {
    const admission = admissions[index];
    const encounter = encounters[index + 3];

    return {
      id: previewUuid(23, index + 1),
      patient_id: admission.patient_id,
      encounter_id: encounter.id,
      assessment_type: assessmentType,
      assessment_data: {
        fall_risk: index % 2 === 0 ? "low" : "moderate",
        pain_score: index + 1,
      },
      notes: "Synthetic preview nursing assessment.",
      assessed_by: index % 2 === 0 ? profileIds.nurseA : profileIds.nurseB,
      assessed_at: isoAt(-1 - index, 7),
      created_at: isoAt(-1 - index, 7),
    };
  });

export const nursingNotes: NursingNote[] = admissions
  .slice(0, 8)
  .map((admission, index) => ({
    id: previewUuid(24, index + 1),
    patient_id: admission.patient_id,
    encounter_id: encounters[(index + 3) % encounters.length].id,
    note: "Synthetic preview nursing note; patient monitored during shift.",
    recorded_by: index % 2 === 0 ? profileIds.nurseA : profileIds.nurseB,
    recorded_at: isoAt(-1 - index, 6),
    created_at: isoAt(-1 - index, 6),
  }));

import type {
  EmergencyContact,
  MedicalHistory,
  Patient,
  PatientAllergy,
  PatientListRow,
} from "@/types/hospital";
import { isoAt, joinName, previewUuid } from "./base";

type PatientSeed = {
  last_name: string;
  date_of_birth: string;
  sex: string;
  civil_status: string;
  registration_status: Patient["registration_status"];
};

const PATIENT_SEEDS: PatientSeed[] = [
  { last_name: "Patient A", date_of_birth: "1985-03-14", sex: "Female", civil_status: "Married", registration_status: "active" },
  { last_name: "Patient B", date_of_birth: "1992-07-22", sex: "Male", civil_status: "Single", registration_status: "active" },
  { last_name: "Patient C", date_of_birth: "1978-11-02", sex: "Female", civil_status: "Married", registration_status: "active" },
  { last_name: "Patient D", date_of_birth: "2001-01-30", sex: "Male", civil_status: "Single", registration_status: "active" },
  { last_name: "Patient E", date_of_birth: "1965-05-18", sex: "Female", civil_status: "Widowed", registration_status: "active" },
  { last_name: "Patient F", date_of_birth: "1989-09-09", sex: "Male", civil_status: "Married", registration_status: "active" },
  { last_name: "Patient G", date_of_birth: "1996-12-01", sex: "Female", civil_status: "Single", registration_status: "active" },
  { last_name: "Patient H", date_of_birth: "1972-04-25", sex: "Male", civil_status: "Married", registration_status: "active" },
  { last_name: "Patient I", date_of_birth: "1983-08-13", sex: "Female", civil_status: "Separated", registration_status: "active" },
  { last_name: "Patient J", date_of_birth: "1999-02-07", sex: "Male", civil_status: "Single", registration_status: "active" },
  { last_name: "Patient K", date_of_birth: "1958-06-29", sex: "Female", civil_status: "Widowed", registration_status: "inactive" },
  { last_name: "Patient L", date_of_birth: "1990-10-16", sex: "Male", civil_status: "Married", registration_status: "active" },
  { last_name: "Patient M", date_of_birth: "2004-03-05", sex: "Female", civil_status: "Single", registration_status: "inactive" },
  { last_name: "Patient N", date_of_birth: "1969-07-11", sex: "Male", civil_status: "Married", registration_status: "archived" },
];

const PROVINCES = ["Sample Province", "Test Province", "Preview Province"];

export const patients: Patient[] = PATIENT_SEEDS.map((seed, index) => {
  const letter = String.fromCharCode(65 + index);

  return {
    id: previewUuid(10, index + 1),
    medical_record_number: `MRN-2026-${String(index + 1).padStart(4, "0")}`,
    first_name: "Test",
    middle_name: null,
    last_name: seed.last_name,
    suffix: null,
    date_of_birth: seed.date_of_birth,
    sex: seed.sex,
    civil_status: seed.civil_status,
    nationality: "Filipino",
    contact_number: `0917-200-${String(index + 1).padStart(4, "0")}`,
    email: `test.patient.${letter.toLowerCase()}@example.test`,
    address_line: `${100 + index} Sample Street`,
    barangay: "Sample Barangay",
    city: "Sample City",
    province: PROVINCES[index % PROVINCES.length],
    postal_code: "0000",
    registration_date: isoAt(-60 + index * 4, 9),
    registration_status: seed.registration_status,
    created_by: previewUuid(2, 3),
    created_at: isoAt(-60 + index * 4, 9),
    updated_at: isoAt(-60 + index * 4, 9),
  };
});

export const patientById = new Map(
  patients.map((patient) => [patient.id, patient])
);

export const patientListRows: PatientListRow[] = patients.map((patient) => ({
  id: patient.id,
  medical_record_number: patient.medical_record_number,
  first_name: patient.first_name,
  middle_name: patient.middle_name,
  last_name: patient.last_name,
  suffix: patient.suffix,
  full_name: joinName(
    patient.first_name,
    patient.last_name,
    patient.middle_name,
    patient.suffix
  ),
  date_of_birth: patient.date_of_birth,
  sex: patient.sex,
  contact_number: patient.contact_number,
  email: patient.email,
  address_line: patient.address_line,
  city: patient.city,
  province: patient.province,
  registration_date: patient.registration_date,
  registration_status: patient.registration_status,
}));

export const patientNameById = new Map(
  patientListRows.map((patient) => [patient.id, patient.full_name])
);

export const patientMrnById = new Map(
  patientListRows.map((patient) => [patient.id, patient.medical_record_number])
);

export const emergencyContacts: EmergencyContact[] = patients.map(
  (patient, index) => ({
    id: previewUuid(14, index + 1),
    patient_id: patient.id,
    full_name: `Test Contact ${String.fromCharCode(65 + index)}`,
    relationship: ["Spouse", "Parent", "Sibling", "Guardian"][index % 4],
    contact_number: `0918-300-${String(index + 1).padStart(4, "0")}`,
    address: `${100 + index} Sample Street, Sample City`,
    is_primary: true,
    created_at: patient.created_at,
    updated_at: patient.updated_at,
  })
);

const ALLERGY_SEEDS = [
  { allergen: "Penicillin", reaction: "Rash", severity: "moderate" },
  { allergen: "Seafood", reaction: "Hives", severity: "mild" },
  { allergen: "Latex", reaction: "Contact dermatitis", severity: "mild" },
  { allergen: "Aspirin", reaction: "Wheezing", severity: "severe" },
  { allergen: "Peanuts", reaction: "Swelling", severity: "severe" },
  { allergen: "Dust", reaction: "Sneezing", severity: "mild" },
  { allergen: "Shellfish", reaction: "Nausea", severity: "moderate" },
  { allergen: "Sulfa drugs", reaction: "Rash", severity: "moderate" },
];

export const patientAllergies: PatientAllergy[] = ALLERGY_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(12, index + 1),
    patient_id: patients[index].id,
    allergen: seed.allergen,
    reaction: seed.reaction,
    severity: seed.severity,
    notes: "Synthetic preview allergy record.",
    recorded_by: previewUuid(2, 7),
    created_at: isoAt(-40 + index, 10),
    updated_at: isoAt(-40 + index, 10),
  })
);

const HISTORY_SEEDS = [
  { history_type: "Medical", description: "Hypertension, diagnosed previously." },
  { history_type: "Medical", description: "Type 2 diabetes mellitus." },
  { history_type: "Medical", description: "Bronchial asthma." },
  { history_type: "Surgical", description: "Previous appendectomy." },
  { history_type: "Family", description: "Family history of cardiovascular disease." },
  { history_type: "Medical", description: "Dyslipidemia." },
  { history_type: "Surgical", description: "Previous cesarean section." },
  { history_type: "Family", description: "Family history of diabetes mellitus." },
  { history_type: "Medical", description: "Chronic allergic rhinitis." },
  { history_type: "Surgical", description: "Previous cholecystectomy." },
];

export const medicalHistories: MedicalHistory[] = HISTORY_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(13, index + 1),
    patient_id: patients[index].id,
    history_type: seed.history_type,
    description: seed.description,
    recorded_by: previewUuid(2, 4),
    recorded_at: isoAt(-30 + index, 10),
    created_at: isoAt(-30 + index, 10),
  })
);

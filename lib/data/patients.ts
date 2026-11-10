import type {
  PatientListRow,
  PatientSummary,
} from "@/types/hospital";
import {
  admissionListRows,
  appointmentListRows,
  encounters,
  invoiceListRows,
  laboratoryResultsByPatientId,
  medicalHistories,
  patientAllergies,
  patientById,
  patientListRows,
  prescriptionListRows,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice, sortByDateDesc } from "./query";
import type { DataResult, PagedResult } from "./result";

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested patient record could not be found.",
} as const;

function emptySummary(): PatientSummary {
  return {
    allergies: [],
    history: [],
    appointments: [],
    admissions: [],
    encounters: [],
    labResults: [],
    prescriptions: [],
    invoices: [],
  };
}

export async function listPatients(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<PatientListRow>> {
  // TODO(supabase): replace with supabase.from("patients").select("*")
  if (!isPreviewMode) {
    return emptyPage<PatientListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = sortByDateDesc(
    patientListRows.filter((patient) => {
      if (params.status && patient.registration_status !== params.status) {
        return false;
      }

      return matchesQuery(params.q, [
        patient.medical_record_number,
        patient.first_name,
        patient.middle_name,
        patient.last_name,
        patient.contact_number,
        patient.email,
      ]);
    }),
    (patient) => patient.registration_date
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getPatient(
  id: string
): Promise<DataResult<PatientListRow>> {
  // TODO(supabase): replace with supabase.from("patients").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: null, error: NOT_FOUND };
  }

  await Promise.resolve();

  const patient = patientListRows.find((row) => row.id === id);

  if (!patient) {
    return { data: null, error: NOT_FOUND };
  }

  return { data: patient, error: null };
}

export async function getPatientSummary(
  id: string
): Promise<DataResult<PatientSummary>> {
  // TODO(supabase): replace with supabase.from("patients").select("*").eq("id", id)
  if (!isPreviewMode) {
    return { data: emptySummary(), error: null };
  }

  await Promise.resolve();

  if (!patientById.has(id)) {
    return { data: null, error: NOT_FOUND };
  }

  return {
    data: {
      allergies: patientAllergies.filter((allergy) => allergy.patient_id === id),
      history: medicalHistories.filter((history) => history.patient_id === id),
      appointments: appointmentListRows.filter(
        (appointment) => appointment.patient_id === id
      ),
      admissions: admissionListRows.filter(
        (admission) => admission.patient_id === id
      ),
      encounters: encounters.filter((encounter) => encounter.patient_id === id),
      labResults: laboratoryResultsByPatientId.get(id) ?? [],
      prescriptions: prescriptionListRows.filter(
        (prescription) => prescription.patient_id === id
      ),
      invoices: invoiceListRows.filter((invoice) => invoice.patient_id === id),
    },
    error: null,
  };
}

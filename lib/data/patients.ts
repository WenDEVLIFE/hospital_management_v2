import type {
  Admission,
  AdmissionListRow,
  Appointment,
  AppointmentListRow,
  Encounter,
  Invoice,
  InvoiceListRow,
  LaboratoryResult,
  MedicalHistory,
  PatientAllergy,
  PatientListRow,
  PatientSummary,
  Prescription,
  PrescriptionListRow,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { normalizePagination, sanitizeSearchTerm } from "./query";
import {
  toDataError,
  type DataResult,
  type PagedResult,
} from "./result";

const NOT_FOUND = {
  code: "NOT_FOUND",
  message: "The requested patient record could not be found.",
} as const;

const PATIENT_COLUMNS =
  "id, medical_record_number, first_name, middle_name, last_name, suffix, date_of_birth, sex, contact_number, email, address_line, city, province, registration_date, registration_status";

type PatientDbRow = {
  id: string;
  medical_record_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  date_of_birth: string | null;
  sex: string | null;
  contact_number: string | null;
  email: string | null;
  address_line: string | null;
  city: string | null;
  province: string | null;
  registration_date: string;
  registration_status: "active" | "inactive" | "archived";
};

type PatientNameRow = {
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  medical_record_number: string;
};

type AppointmentJoinRow = Appointment & {
  departments: { name: string } | null;
  physicians: {
    staff_profiles: { first_name: string; last_name: string } | null;
  } | null;
};

type AdmissionBedJoinRow = {
  released_at: string | null;
  beds: {
    bed_number: string;
    rooms: { room_number: string } | null;
  } | null;
};

type AdmissionJoinRow = Admission & {
  departments: { name: string } | null;
  physicians: {
    staff_profiles: { first_name: string; last_name: string } | null;
  } | null;
  admission_bed_assignments: AdmissionBedJoinRow[] | null;
};

type PrescriptionJoinRow = Prescription & {
  profiles: { full_name: string } | null;
  prescription_items: Array<{
    medications: { generic_name: string } | null;
  }> | null;
};

function fullName(row: {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
}): string {
  return [row.first_name, row.middle_name, row.last_name, row.suffix]
    .filter(Boolean)
    .join(" ");
}

function toPatientListRow(row: PatientDbRow): PatientListRow {
  return {
    id: row.id,
    medical_record_number: row.medical_record_number,
    first_name: row.first_name,
    middle_name: row.middle_name,
    last_name: row.last_name,
    suffix: row.suffix,
    full_name: fullName(row),
    date_of_birth: row.date_of_birth,
    sex: row.sex,
    contact_number: row.contact_number,
    email: row.email,
    address_line: row.address_line,
    city: row.city,
    province: row.province,
    registration_date: row.registration_date,
    registration_status: row.registration_status,
  };
}

/**
 * PostgREST `or` filters use commas and parentheses as syntax. Strip those
 * characters from free-text search so a patient search cannot break the filter.
 */
export async function listPatients(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<PatientListRow>> {
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("patients")
    .select(PATIENT_COLUMNS, { count: "exact" });

  if (params.status) {
    query = query.eq("registration_status", params.status);
  }

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      [
        `medical_record_number.ilike.${term}`,
        `first_name.ilike.${term}`,
        `middle_name.ilike.${term}`,
        `last_name.ilike.${term}`,
        `contact_number.ilike.${term}`,
        `email.ilike.${term}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query
    .order("registration_date", { ascending: false })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: {
      rows: ((data ?? []) as PatientDbRow[]).map(toPatientListRow),
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function getPatient(
  id: string
): Promise<DataResult<PatientListRow>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("patients")
    .select(PATIENT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  if (!data) {
    return { data: null, error: NOT_FOUND };
  }

  return { data: toPatientListRow(data as PatientDbRow), error: null };
}

export async function getPatientSummary(
  id: string
): Promise<DataResult<PatientSummary>> {
  const supabase = await getSupabaseServerClient();

  const { data: patientRow, error: patientError } = await supabase
    .from("patients")
    .select("first_name, middle_name, last_name, suffix, medical_record_number")
    .eq("id", id)
    .maybeSingle();

  if (patientError) {
    return { data: null, error: toDataError(patientError) };
  }

  if (!patientRow) {
    return { data: null, error: NOT_FOUND };
  }

  const patient = patientRow as PatientNameRow;
  const patientName = fullName(patient);

  const [
    allergiesResult,
    historyResult,
    appointmentsResult,
    admissionsResult,
    encountersResult,
    prescriptionsResult,
    invoicesResult,
  ] = await Promise.all([
    supabase
      .from("patient_allergies")
      .select("*")
      .eq("patient_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("medical_histories")
      .select("*")
      .eq("patient_id", id)
      .order("recorded_at", { ascending: false }),
    supabase
      .from("appointments")
      .select(
        "*, departments(name), physicians(staff_profiles(first_name, last_name))"
      )
      .eq("patient_id", id)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("admissions")
      .select(
        "*, departments(name), physicians(staff_profiles(first_name, last_name)), admission_bed_assignments(released_at, beds(bed_number, rooms(room_number)))"
      )
      .eq("patient_id", id)
      .order("admission_date", { ascending: false }),
    supabase
      .from("encounters")
      .select("*")
      .eq("patient_id", id)
      .order("started_at", { ascending: false }),
    supabase
      .from("prescriptions")
      .select(
        "*, profiles!prescriptions_prescribed_by_fkey(full_name), prescription_items(medications(generic_name))"
      )
      .eq("patient_id", id)
      .order("prescription_date", { ascending: false }),
    supabase
      .from("invoices")
      .select("*")
      .eq("patient_id", id)
      .order("invoice_date", { ascending: false }),
  ]);

  // Laboratory results are reached through orders -> items. Querying in steps
  // avoids an ambiguous embedded filter across two relationships.
  let labResults: LaboratoryResult[] = [];

  const { data: labOrders } = await supabase
    .from("laboratory_orders")
    .select("id")
    .eq("patient_id", id);

  const labOrderIds = ((labOrders ?? []) as Array<{ id: string }>).map(
    (order) => order.id
  );

  if (labOrderIds.length > 0) {
    const { data: labItems } = await supabase
      .from("laboratory_order_items")
      .select("id")
      .in("order_id", labOrderIds);

    const labItemIds = ((labItems ?? []) as Array<{ id: string }>).map(
      (item) => item.id
    );

    if (labItemIds.length > 0) {
      const { data: results } = await supabase
        .from("laboratory_results")
        .select("*")
        .in("order_item_id", labItemIds)
        .order("created_at", { ascending: false });

      labResults = (results ?? []) as LaboratoryResult[];
    }
  }

  const allergies = allergiesResult.error
    ? []
    : ((allergiesResult.data ?? []) as PatientAllergy[]);

  const history = historyResult.error
    ? []
    : ((historyResult.data ?? []) as MedicalHistory[]);

  const appointments: AppointmentListRow[] = appointmentsResult.error
    ? []
    : ((appointmentsResult.data ?? []) as AppointmentJoinRow[]).map((row) => ({
        id: row.id,
        appointment_number: row.appointment_number,
        patient_id: row.patient_id,
        patient_name: patientName,
        patient_mrn: patient.medical_record_number,
        department_id: row.department_id,
        department_name: row.departments?.name ?? "Unknown department",
        physician_id: row.physician_id,
        physician_name: row.physicians?.staff_profiles
          ? fullName(row.physicians.staff_profiles)
          : null,
        scheduled_at: row.scheduled_at,
        duration_minutes: row.duration_minutes,
        appointment_type: row.appointment_type,
        reason_for_visit: row.reason_for_visit,
        status: row.status,
        notes: row.notes,
        created_at: row.created_at,
      }));

  const admissions: AdmissionListRow[] = admissionsResult.error
    ? []
    : ((admissionsResult.data ?? []) as AdmissionJoinRow[]).map((row) => {
        const assignments = row.admission_bed_assignments ?? [];
        const activeAssignment =
          assignments.find((assignment) => assignment.released_at === null) ??
          assignments[0] ??
          null;

        return {
          id: row.id,
          admission_number: row.admission_number,
          patient_id: row.patient_id,
          patient_name: patientName,
          patient_mrn: patient.medical_record_number,
          department_id: row.department_id,
          department_name: row.departments?.name ?? "Unknown department",
          attending_physician_id: row.attending_physician_id,
          attending_physician_name: row.physicians?.staff_profiles
            ? fullName(row.physicians.staff_profiles)
            : null,
          admission_date: row.admission_date,
          discharge_date: row.discharge_date,
          admission_type: row.admission_type,
          status: row.status,
          room_number: activeAssignment?.beds?.rooms?.room_number ?? null,
          bed_number: activeAssignment?.beds?.bed_number ?? null,
        };
      });

  const encounters = encountersResult.error
    ? []
    : ((encountersResult.data ?? []) as Encounter[]);

  const prescriptions: PrescriptionListRow[] = prescriptionsResult.error
    ? []
    : ((prescriptionsResult.data ?? []) as PrescriptionJoinRow[]).map((row) => {
        const items = row.prescription_items ?? [];
        const medications = items
          .map((item) => item.medications?.generic_name)
          .filter((name): name is string => Boolean(name));

        return {
          id: row.id,
          prescription_number: row.prescription_number,
          patient_id: row.patient_id,
          patient_name: patientName,
          patient_mrn: patient.medical_record_number,
          encounter_id: row.encounter_id,
          prescribed_by_name: row.profiles?.full_name ?? "Unknown physician",
          prescription_date: row.prescription_date,
          status: row.status,
          item_count: items.length,
          medications,
        };
      });

  const invoices: InvoiceListRow[] = invoicesResult.error
    ? []
    : ((invoicesResult.data ?? []) as Invoice[]).map((row) => ({
        id: row.id,
        invoice_number: row.invoice_number,
        patient_id: row.patient_id,
        patient_name: patientName,
        patient_mrn: patient.medical_record_number,
        admission_id: row.admission_id,
        encounter_id: row.encounter_id,
        invoice_date: row.invoice_date,
        subtotal: Number(row.subtotal),
        discount_amount: Number(row.discount_amount),
        total_amount: Number(row.total_amount),
        amount_paid: Number(row.amount_paid),
        balance: Number(row.balance),
        status: row.status,
      }));

  return {
    data: {
      allergies,
      history,
      appointments,
      admissions,
      encounters,
      labResults,
      prescriptions,
      invoices,
    },
    error: null,
  };
}

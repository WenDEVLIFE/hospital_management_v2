import { cache } from "react";

import type {
  MedicationStockRow,
  PharmacyStats,
  Prescription,
  PrescriptionEncounterOption,
  PrescriptionListRow,
  PrescriptionMedicationOption,
  StockStatus,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizePagination,
  pageSlice,
  sanitizeSearchTerm,
} from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const PRESCRIPTION_COLUMNS =
  "*, patients(first_name, middle_name, last_name, suffix, medical_record_number), profiles!prescriptions_prescribed_by_fkey(full_name), prescription_items(id, medication_id, dosage, frequency, duration_days, quantity, medications(generic_name), medication_dispenses(quantity_dispensed))";

type Relation<T> = T | T[] | null;

type PrescriptionJoinRow = Prescription & {
  patients: Relation<{
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    medical_record_number: string;
  }>;
  profiles: Relation<{ full_name: string }>;
  prescription_items: Array<{
    id: string;
    medication_id: string;
    dosage: string;
    frequency: string;
    duration_days: number | null;
    quantity: number;
    medications: Relation<{ generic_name: string }>;
    medication_dispenses: Array<{ quantity_dispensed: number }> | null;
  }> | null;
};

type MedicationStockBalance = Omit<MedicationStockRow, "stock_status" | "expiring_soon">;

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function emptyStats(): PharmacyStats {
  return {
    totalPrescriptions: 0,
    pending: 0,
    partiallyDispensed: 0,
    dispensed: 0,
    cancelled: 0,
    lowStock: 0,
    outOfStock: 0,
    expiringSoon: 0,
  };
}

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

function isExpiringSoon(date: string | null): boolean {
  if (!date) {
    return false;
  }

  const expiration = new Date(`${date}T23:59:59+08:00`);

  if (Number.isNaN(expiration.getTime())) {
    return false;
  }

  const threshold = Date.now() + 90 * 24 * 60 * 60 * 1000;

  return expiration.getTime() <= threshold;
}

const loadMedicationStock = cache(
  async (): Promise<DataResult<MedicationStockRow[]>> => {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("medication_stock_balances")
      .select("*")
      .order("generic_name")
      .order("id");

    if (error) {
      return { data: null, error: toDataError(error) };
    }

    const rows = ((data ?? []) as MedicationStockBalance[]).map((row) => {
      const quantityOnHand = Number(row.quantity_on_hand);
      const reorderLevel = Number(row.reorder_level);
      const stockStatus: StockStatus = quantityOnHand <= 0
        ? "out_of_stock"
        : quantityOnHand <= reorderLevel ? "low_stock" : "available";

      return {
        ...row,
        quantity_on_hand: quantityOnHand,
        reorder_level: reorderLevel,
        stock_status: stockStatus,
        expiring_soon: isExpiringSoon(row.nearest_expiration),
      };
    });

    return { data: rows, error: null };
  }
);

export async function listPrescriptions(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<PrescriptionListRow>> {
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("prescriptions")
    .select(PRESCRIPTION_COLUMNS, { count: "exact" });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    query = query.ilike("prescription_number", `%${search}%`);
  }

  const { data, error, count } = await query
    .order("prescription_date", { ascending: false })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const rows: PrescriptionListRow[] = (
    (data ?? []) as PrescriptionJoinRow[]
  ).map((row) => {
    const patient = firstRelation(row.patients);
    const prescriber = firstRelation(row.profiles);
    const items = row.prescription_items ?? [];
    const dispenseItems = items.map((item) => {
      const medication = firstRelation(item.medications);
      const dispensedQuantity = (item.medication_dispenses ?? []).reduce(
        (total, dispense) =>
          total + Number(dispense.quantity_dispensed ?? 0),
        0
      );
      const quantity = Number(item.quantity);

      return {
        id: item.id,
        medication_id: item.medication_id,
        medication_name: medication?.generic_name ?? "Unknown medication",
        dosage: item.dosage,
        frequency: item.frequency,
        duration_days: item.duration_days,
        quantity,
        dispensed_quantity: dispensedQuantity,
        remaining_quantity: Math.max(quantity - dispensedQuantity, 0),
      };
    });
    const medications = Array.from(
      new Set(dispenseItems.map((item) => item.medication_name))
    );

    return {
      id: row.id,
      prescription_number: row.prescription_number,
      patient_id: row.patient_id,
      patient_name: patient ? fullName(patient) : "Unknown patient",
      patient_mrn: patient?.medical_record_number ?? "\u2014",
      encounter_id: row.encounter_id,
      prescribed_by_name: prescriber?.full_name ?? "Unknown physician",
      prescription_date: row.prescription_date,
      status: row.status,
      item_count: items.length,
      medications,
      items: dispenseItems,
    };
  });

  return {
    data: {
      rows,
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function listMedicationStock(
  params: {
    q?: string;
    stockStatus?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<MedicationStockRow>> {
  const result = await loadMedicationStock();

  if (result.error) {
    return { data: null, error: result.error };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";
  const filtered = (result.data ?? []).filter((row) => {
    if (params.stockStatus && row.stock_status !== params.stockStatus) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [
      row.medication_code,
      row.generic_name,
      row.brand_name,
      row.strength,
      row.dosage_form,
      row.unit,
    ].some((value) => (value ?? "").toLowerCase().includes(search));
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getPharmacyStats(): Promise<DataResult<PharmacyStats>> {
  const supabase = await getSupabaseServerClient();

  const [prescriptionResult, stockResult] = await Promise.all([
    supabase.from("prescriptions").select("status"),
    loadMedicationStock(),
  ]);

  if (prescriptionResult.error) {
    return { data: null, error: toDataError(prescriptionResult.error) };
  }

  const stats = emptyStats();

  for (const prescription of (prescriptionResult.data ?? []) as Array<
    Pick<Prescription, "status">
  >) {
    stats.totalPrescriptions += 1;

    switch (prescription.status) {
      case "pending":
        stats.pending += 1;
        break;
      case "partially_dispensed":
        stats.partiallyDispensed += 1;
        break;
      case "dispensed":
        stats.dispensed += 1;
        break;
      case "cancelled":
        stats.cancelled += 1;
        break;
    }
  }

  // Stock failures show an error on the inventory tab; prescription stats
  // remain visible instead of failing the whole dashboard.
  for (const row of stockResult.data ?? []) {
    if (row.stock_status === "low_stock") {
      stats.lowStock += 1;
    }

    if (row.stock_status === "out_of_stock") {
      stats.outOfStock += 1;
    }

    if (row.expiring_soon) {
      stats.expiringSoon += 1;
    }
  }

  return { data: stats, error: null };
}

type PrescriptionEncounterOptionRow = {
  id: string;
  encounter_number: string;
  patient_id: string;
  started_at: string;
  patients: Relation<{
    first_name: string;
    middle_name: string | null;
    last_name: string;
    suffix: string | null;
    medical_record_number: string;
  }>;
};

type PrescriptionMedicationOptionRow = {
  id: string;
  generic_name: string;
  brand_name: string | null;
  strength: string | null;
  dosage_form: string | null;
  unit: string | null;
};

export type PrescriptionFormOptions = {
  encounters: PrescriptionEncounterOption[];
  medications: PrescriptionMedicationOption[];
};

/**
 * Options for the new-prescription form: encounters that can still receive
 * orders and medications that are active in the catalogue. Both lists are
 * already constrained by RLS, so a caller without clinical access receives
 * empty arrays rather than another user's patients.
 */
export async function listPrescriptionFormOptions(): Promise<
  DataResult<PrescriptionFormOptions>
> {
  const supabase = await getSupabaseServerClient();

  const [encounterResult, medicationResult] = await Promise.all([
    supabase
      .from("encounters")
      .select(
        "id, encounter_number, patient_id, started_at, patients(first_name, middle_name, last_name, suffix, medical_record_number)"
      )
      .in("clinical_status", ["open", "in_progress"])
      .order("started_at", { ascending: false })
      .limit(200),
    supabase
      .from("medications")
      .select("id, generic_name, brand_name, strength, dosage_form, unit")
      .eq("is_active", true)
      .order("generic_name"),
  ]);

  if (encounterResult.error) {
    return { data: null, error: toDataError(encounterResult.error) };
  }

  if (medicationResult.error) {
    return { data: null, error: toDataError(medicationResult.error) };
  }

  const encounters = (
    (encounterResult.data ?? []) as PrescriptionEncounterOptionRow[]
  ).flatMap((row) => {
    const patient = firstRelation(row.patients);

    if (!patient) {
      return [];
    }

    const patientName = fullName(patient);
    const patientMrn = patient.medical_record_number;

    return [
      {
        id: row.id,
        encounter_number: row.encounter_number,
        patient_id: row.patient_id,
        patient_name: patientName,
        patient_mrn: patientMrn,
        label: `${row.encounter_number} · ${patientName} (${patientMrn})`,
      },
    ];
  });

  const medications = (
    (medicationResult.data ?? []) as PrescriptionMedicationOptionRow[]
  ).map((row) => {
    const descriptor = [row.generic_name, row.strength, row.dosage_form]
      .filter(Boolean)
      .join(" · ");

    return {
      id: row.id,
      generic_name: row.generic_name,
      label: row.brand_name
        ? `${descriptor} (${row.brand_name})`
        : descriptor,
    };
  });

  return { data: { encounters, medications }, error: null };
}

import { cache } from "react";

import type {
  MedicationStockRow,
  PharmacyStats,
  Prescription,
  PrescriptionListRow,
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
  "*, patients(first_name, middle_name, last_name, suffix, medical_record_number), profiles!prescriptions_prescribed_by_fkey(full_name), prescription_items(medications(generic_name))";

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
    medications: Relation<{ generic_name: string }>;
  }> | null;
};

type MedicationCatalogRow = {
  id: string;
  medication_code: string;
  generic_name: string;
  brand_name: string | null;
  strength: string | null;
  dosage_form: string | null;
  unit: string | null;
};

type InventoryStockJoinRow = {
  item_code: string;
  reorder_level: number;
  inventory_batches: Array<{
    quantity_remaining: number;
    expiration_date: string | null;
  }> | null;
};

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

/**
 * Medication stock is currently represented by inventory items whose item_code
 * matches the medication code, with quantities and expiries in inventory
 * batches. A dedicated stock table remains Phase 8 debt.
 */
const loadMedicationStock = cache(
  async (): Promise<DataResult<MedicationStockRow[]>> => {
    const supabase = await getSupabaseServerClient();

    const { data: medicationRows, error: medicationError } = await supabase
      .from("medications")
      .select(
        "id, medication_code, generic_name, brand_name, strength, dosage_form, unit"
      )
      .eq("is_active", true)
      .order("generic_name", { ascending: true });

    if (medicationError) {
      return { data: null, error: toDataError(medicationError) };
    }

    const medications = (medicationRows ?? []) as MedicationCatalogRow[];

    if (medications.length === 0) {
      return { data: [], error: null };
    }

    const codes = medications.map((medication) => medication.medication_code);
    const { data: inventoryRows, error: inventoryError } = await supabase
      .from("inventory_items")
      .select(
        "item_code, reorder_level, inventory_batches(quantity_remaining, expiration_date)"
      )
      .in("item_code", codes);

    if (inventoryError) {
      return { data: null, error: toDataError(inventoryError) };
    }

    const inventoryByCode = new Map<string, InventoryStockJoinRow>();

    for (const inventory of (inventoryRows ?? []) as InventoryStockJoinRow[]) {
      inventoryByCode.set(inventory.item_code, inventory);
    }

    const rows: MedicationStockRow[] = [];

    for (const medication of medications) {
      const inventory = inventoryByCode.get(medication.medication_code);

      // No inventory record means stock is not tracked for this medication yet.
      // Do not present that as a confirmed zero balance.
      if (!inventory) {
        continue;
      }

      const batches = inventory.inventory_batches ?? [];
      const quantityOnHand = batches.reduce(
        (total, batch) => total + Number(batch.quantity_remaining ?? 0),
        0
      );
      const expirations = batches
        .map((batch) => batch.expiration_date)
        .filter((date): date is string => Boolean(date))
        .sort();
      const nearestExpiration = expirations[0] ?? null;
      const reorderLevel = Number(inventory.reorder_level ?? 0);

      let stockStatus: StockStatus = "available";

      if (quantityOnHand <= 0) {
        stockStatus = "out_of_stock";
      } else if (quantityOnHand <= reorderLevel) {
        stockStatus = "low_stock";
      }

      rows.push({
        id: medication.id,
        medication_code: medication.medication_code,
        generic_name: medication.generic_name,
        brand_name: medication.brand_name,
        strength: medication.strength,
        dosage_form: medication.dosage_form,
        unit: medication.unit,
        quantity_on_hand: quantityOnHand,
        reorder_level: reorderLevel,
        nearest_expiration: nearestExpiration,
        stock_status: stockStatus,
        expiring_soon: isExpiringSoon(nearestExpiration),
      });
    }

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
    const medications = Array.from(
      new Set(
        items
          .map((item) => firstRelation(item.medications)?.generic_name)
          .filter((name): name is string => Boolean(name))
      )
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

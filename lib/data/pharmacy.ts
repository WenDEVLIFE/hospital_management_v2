import type {
  MedicationStockRow,
  PharmacyStats,
  PrescriptionListRow,
} from "@/types/hospital";
import {
  medicationStockRows,
  prescriptionListRows,
  prescriptions,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

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

export async function listPrescriptions(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<PrescriptionListRow>> {
  // TODO(supabase): replace with supabase.from("prescriptions").select("*")
  if (!isPreviewMode) {
    return emptyPage<PrescriptionListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = prescriptionListRows.filter((prescription) => {
    if (params.status && prescription.status !== params.status) {
      return false;
    }

    return matchesQuery(params.q, [
      prescription.prescription_number,
      prescription.patient_name,
      prescription.patient_mrn,
      prescription.prescribed_by_name,
      prescription.medications.join(" "),
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
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
  // TODO(supabase): replace with supabase.from("medications").select("*")
  if (!isPreviewMode) {
    return emptyPage<MedicationStockRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = medicationStockRows.filter((medication) => {
    if (params.stockStatus && medication.stock_status !== params.stockStatus) {
      return false;
    }

    return matchesQuery(params.q, [
      medication.medication_code,
      medication.generic_name,
      medication.brand_name,
      medication.strength,
      medication.dosage_form,
      medication.unit,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function getPharmacyStats(): Promise<DataResult<PharmacyStats>> {
  // TODO(supabase): replace with supabase.from("prescriptions").select("status")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const stats = emptyStats();

  for (const prescription of prescriptions) {
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

  for (const medication of medicationStockRows) {
    if (medication.stock_status === "low_stock") {
      stats.lowStock += 1;
    }

    if (medication.stock_status === "out_of_stock") {
      stats.outOfStock += 1;
    }

    if (medication.expiring_soon) {
      stats.expiringSoon += 1;
    }
  }

  return { data: stats, error: null };
}

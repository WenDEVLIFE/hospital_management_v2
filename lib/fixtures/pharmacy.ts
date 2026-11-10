import type {
  Medication,
  MedicationDispense,
  MedicationStockRow,
  Prescription,
  PrescriptionItem,
  PrescriptionListRow,
  StockStatus,
} from "@/types/hospital";
import { isoAt, isoDate, previewUuid, profileIds, profileNameById } from "./base";
import { patientMrnById, patientNameById } from "./patients";

const MEDICATION_SEEDS = [
  { code: "MED-0001", generic: "Paracetamol", brand: "Biogesic", strength: "500 mg", form: "Tablet", unit: "tablet" },
  { code: "MED-0002", generic: "Amoxicillin", brand: "Amoxil", strength: "500 mg", form: "Capsule", unit: "capsule" },
  { code: "MED-0003", generic: "Losartan", brand: "Cozaar", strength: "50 mg", form: "Tablet", unit: "tablet" },
  { code: "MED-0004", generic: "Metformin", brand: "Glucophage", strength: "500 mg", form: "Tablet", unit: "tablet" },
  { code: "MED-0005", generic: "Salbutamol", brand: "Ventolin", strength: "2.5 mg", form: "Nebule", unit: "nebule" },
  { code: "MED-0006", generic: "Omeprazole", brand: "Losec", strength: "20 mg", form: "Capsule", unit: "capsule" },
  { code: "MED-0007", generic: "Cetirizine", brand: "Zyrtec", strength: "10 mg", form: "Tablet", unit: "tablet" },
  { code: "MED-0008", generic: "Amlodipine", brand: "Norvasc", strength: "5 mg", form: "Tablet", unit: "tablet" },
  { code: "MED-0009", generic: "Ceftriaxone", brand: "Rocephin", strength: "1 g", form: "Vial", unit: "vial" },
  { code: "MED-0010", generic: "Insulin (Human)", brand: "Humulin", strength: "100 IU/mL", form: "Vial", unit: "vial" },
  { code: "MED-0011", generic: "Ibuprofen", brand: "Advil", strength: "200 mg", form: "Tablet", unit: "tablet" },
  { code: "MED-0012", generic: "Tranexamic Acid", brand: "Cyklokapron", strength: "500 mg", form: "Tablet", unit: "tablet" },
];

export const medications: Medication[] = MEDICATION_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(32, index + 1),
    medication_code: seed.code,
    generic_name: seed.generic,
    brand_name: seed.brand,
    strength: seed.strength,
    dosage_form: seed.form,
    unit: seed.unit,
    description: "Synthetic preview medication catalog entry.",
    is_active: true,
    created_at: isoAt(-300, 8),
    updated_at: isoAt(-300, 8),
  })
);

type PrescriptionSeed = {
  patientIndex: number;
  encounterIndex: number;
  prescribedBy: string;
  dayOffset: number;
  hour: number;
  status: Prescription["status"];
  medicationIndexes: number[];
};

const PRESCRIPTION_SEEDS: PrescriptionSeed[] = [
  { patientIndex: 0, encounterIndex: 0, prescribedBy: profileIds.physicianA, dayOffset: 0, hour: 9, status: "pending", medicationIndexes: [0, 6] },
  { patientIndex: 1, encounterIndex: 1, prescribedBy: profileIds.physicianB, dayOffset: 0, hour: 8, status: "pending", medicationIndexes: [2] },
  { patientIndex: 2, encounterIndex: 2, prescribedBy: profileIds.physicianB, dayOffset: -1, hour: 10, status: "pending", medicationIndexes: [4, 0] },
  { patientIndex: 3, encounterIndex: 3, prescribedBy: profileIds.physicianA, dayOffset: -2, hour: 11, status: "pending", medicationIndexes: [7] },
  { patientIndex: 4, encounterIndex: 4, prescribedBy: profileIds.physicianA, dayOffset: -3, hour: 9, status: "pending", medicationIndexes: [3, 5] },
  { patientIndex: 5, encounterIndex: 5, prescribedBy: profileIds.physicianC, dayOffset: -4, hour: 10, status: "partially_dispensed", medicationIndexes: [1, 0] },
  { patientIndex: 6, encounterIndex: 6, prescribedBy: profileIds.physicianC, dayOffset: -5, hour: 11, status: "partially_dispensed", medicationIndexes: [8] },
  { patientIndex: 7, encounterIndex: 7, prescribedBy: profileIds.physicianB, dayOffset: -6, hour: 8, status: "partially_dispensed", medicationIndexes: [2, 7] },
  { patientIndex: 8, encounterIndex: 8, prescribedBy: profileIds.physicianA, dayOffset: -7, hour: 9, status: "partially_dispensed", medicationIndexes: [5] },
  { patientIndex: 9, encounterIndex: 9, prescribedBy: profileIds.physicianC, dayOffset: -8, hour: 10, status: "dispensed", medicationIndexes: [3, 7] },
  { patientIndex: 10, encounterIndex: 10, prescribedBy: profileIds.physicianA, dayOffset: -9, hour: 11, status: "dispensed", medicationIndexes: [0] },
  { patientIndex: 11, encounterIndex: 11, prescribedBy: profileIds.physicianB, dayOffset: -10, hour: 9, status: "dispensed", medicationIndexes: [9, 0] },
  { patientIndex: 12, encounterIndex: 12, prescribedBy: profileIds.physicianA, dayOffset: -11, hour: 10, status: "dispensed", medicationIndexes: [6] },
  { patientIndex: 13, encounterIndex: 13, prescribedBy: profileIds.physicianA, dayOffset: -12, hour: 11, status: "cancelled", medicationIndexes: [1] },
];

export const prescriptions: Prescription[] = PRESCRIPTION_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(33, index + 1),
    prescription_number: `RX-2026-${String(index + 1).padStart(4, "0")}`,
    patient_id: previewUuid(10, seed.patientIndex + 1),
    encounter_id: previewUuid(19, seed.encounterIndex + 1),
    prescribed_by: seed.prescribedBy,
    prescription_date: isoAt(seed.dayOffset, seed.hour),
    status: seed.status,
    notes: null,
    created_at: isoAt(seed.dayOffset, seed.hour),
    updated_at: isoAt(seed.dayOffset, seed.hour + 1),
  })
);

export const prescriptionItems: PrescriptionItem[] = [];

PRESCRIPTION_SEEDS.forEach((seed, prescriptionIndex) => {
  const prescription = prescriptions[prescriptionIndex];

  seed.medicationIndexes.forEach((medicationIndex, itemIndex) => {
    prescriptionItems.push({
      id: previewUuid(34, prescriptionItems.length + 1),
      prescription_id: prescription.id,
      medication_id: medications[medicationIndex].id,
      dosage: medicationIndex % 2 === 0 ? "1 tablet" : "1 capsule",
      frequency: medicationIndex % 3 === 0 ? "Twice daily" : "Once daily",
      duration_days: 5 + itemIndex * 2,
      quantity: 10 + itemIndex * 10,
      instructions: "Take as directed by the prescribing physician.",
      created_at: prescription.created_at,
    });
  });
});

const prescriptionById = new Map(
  prescriptions.map((prescription) => [prescription.id, prescription])
);

const medicationById = new Map(
  medications.map((medication) => [medication.id, medication])
);

const partialDispensedPrescriptions = new Set<string>();

export const medicationDispenses: MedicationDispense[] = [];

for (const item of prescriptionItems) {
  const prescription = prescriptionById.get(item.prescription_id);

  if (!prescription) {
    continue;
  }

  if (prescription.status === "dispensed") {
    medicationDispenses.push({
      id: previewUuid(35, medicationDispenses.length + 1),
      prescription_item_id: item.id,
      quantity_dispensed: item.quantity,
      dispensed_by: profileIds.pharmacist,
      dispensed_at: isoAt(-1, 13),
      notes: null,
      created_at: isoAt(-1, 13),
    });
    continue;
  }

  if (
    prescription.status === "partially_dispensed" &&
    !partialDispensedPrescriptions.has(prescription.id)
  ) {
    partialDispensedPrescriptions.add(prescription.id);
    medicationDispenses.push({
      id: previewUuid(35, medicationDispenses.length + 1),
      prescription_item_id: item.id,
      quantity_dispensed: item.quantity / 2,
      dispensed_by: profileIds.pharmacist,
      dispensed_at: isoAt(-1, 14),
      notes: "Partial dispensing recorded in preview mode.",
      created_at: isoAt(-1, 14),
    });
  }
}

const medicationNamesByPrescriptionId = new Map<string, string[]>();
const itemCountByPrescriptionId = new Map<string, number>();

for (const item of prescriptionItems) {
  const medication = medicationById.get(item.medication_id);

  itemCountByPrescriptionId.set(
    item.prescription_id,
    (itemCountByPrescriptionId.get(item.prescription_id) ?? 0) + 1
  );

  if (!medication) {
    continue;
  }

  const existing =
    medicationNamesByPrescriptionId.get(item.prescription_id) ?? [];
  existing.push(medication.generic_name);
  medicationNamesByPrescriptionId.set(item.prescription_id, existing);
}

export const prescriptionListRows: PrescriptionListRow[] = prescriptions
  .map((prescription) => ({
    id: prescription.id,
    prescription_number: prescription.prescription_number,
    patient_id: prescription.patient_id,
    patient_name:
      patientNameById.get(prescription.patient_id) ?? "Test Patient",
    patient_mrn:
      patientMrnById.get(prescription.patient_id) ?? "MRN-2026-0000",
    encounter_id: prescription.encounter_id,
    prescribed_by_name:
      profileNameById.get(prescription.prescribed_by) ?? "Test Physician",
    prescription_date: prescription.prescription_date,
    status: prescription.status,
    item_count: itemCountByPrescriptionId.get(prescription.id) ?? 0,
    medications: medicationNamesByPrescriptionId.get(prescription.id) ?? [],
  }))
  .sort((a, b) =>
    a.prescription_date === b.prescription_date
      ? 0
      : a.prescription_date < b.prescription_date
        ? 1
        : -1
  );

const MEDICATION_STOCK_SEEDS: {
  quantity: number;
  reorder: number;
  expirationOffset: number;
}[] = [
  { quantity: 1200, reorder: 300, expirationOffset: 200 },
  { quantity: 80, reorder: 150, expirationOffset: 45 },
  { quantity: 420, reorder: 100, expirationOffset: 300 },
  { quantity: 0, reorder: 200, expirationOffset: 60 },
  { quantity: 65, reorder: 40, expirationOffset: 120 },
  { quantity: 30, reorder: 60, expirationOffset: 25 },
  { quantity: 250, reorder: 80, expirationOffset: 400 },
  { quantity: 150, reorder: 100, expirationOffset: 180 },
  { quantity: 0, reorder: 50, expirationOffset: 90 },
  { quantity: 18, reorder: 25, expirationOffset: 30 },
  { quantity: 300, reorder: 100, expirationOffset: 220 },
  { quantity: 12, reorder: 40, expirationOffset: 70 },
];

function stockStatus(quantity: number, reorder: number): StockStatus {
  if (quantity <= 0) {
    return "out_of_stock";
  }

  if (quantity <= reorder) {
    return "low_stock";
  }

  return "available";
}

export const medicationStockRows: MedicationStockRow[] = medications.map(
  (medication, index) => {
    const seed = MEDICATION_STOCK_SEEDS[index];
    const expiration = isoDate(seed.expirationOffset);

    return {
      id: medication.id,
      medication_code: medication.medication_code,
      generic_name: medication.generic_name,
      brand_name: medication.brand_name,
      strength: medication.strength,
      dosage_form: medication.dosage_form,
      unit: medication.unit,
      quantity_on_hand: seed.quantity,
      reorder_level: seed.reorder,
      nearest_expiration: expiration,
      stock_status: stockStatus(seed.quantity, seed.reorder),
      expiring_soon: seed.expirationOffset <= 90,
    };
  }
);

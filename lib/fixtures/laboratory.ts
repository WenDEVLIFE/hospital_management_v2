import type {
  LabOrderListRow,
  LaboratoryOrder,
  LaboratoryOrderItem,
  LaboratoryResult,
  LaboratorySpecimen,
  LaboratoryTest,
} from "@/types/hospital";
import {
  isoAt,
  previewUuid,
  profileIds,
  profileNameById,
} from "./base";
import { patientMrnById, patientNameById } from "./patients";

const LAB_TEST_SEEDS = [
  { code: "CBC", name: "Complete Blood Count", category: "Hematology", specimen: "Whole blood" },
  { code: "UA", name: "Urinalysis", category: "Clinical Microscopy", specimen: "Urine" },
  { code: "FEC", name: "Fecalysis", category: "Clinical Microscopy", specimen: "Stool" },
  { code: "CHEM", name: "Blood Chemistry", category: "Clinical Chemistry", specimen: "Serum" },
  { code: "LIPID", name: "Lipid Profile", category: "Clinical Chemistry", specimen: "Serum" },
  { code: "FBS", name: "Blood Glucose", category: "Clinical Chemistry", specimen: "Blood" },
  { code: "PT", name: "Pregnancy Test", category: "Clinical Microscopy", specimen: "Urine" },
  { code: "HBA1C", name: "Hemoglobin A1c", category: "Clinical Chemistry", specimen: "Whole blood" },
];

export const laboratoryTests: LaboratoryTest[] = LAB_TEST_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(25, index + 1),
    test_code: seed.code,
    test_name: seed.name,
    category: seed.category,
    description: `Synthetic preview catalog entry for ${seed.name}.`,
    specimen_type: seed.specimen,
    is_active: true,
    created_at: isoAt(-300, 8),
    updated_at: isoAt(-300, 8),
  })
);

type LabOrderSeed = {
  patientIndex: number;
  encounterIndex: number;
  orderedBy: string;
  priority: LaboratoryOrder["priority"];
  status: LaboratoryOrder["status"];
  dayOffset: number;
  hour: number;
  testIndexes: number[];
  specimenStatus: LaboratorySpecimen["collection_status"];
};

const LAB_ORDER_SEEDS: LabOrderSeed[] = [
  { patientIndex: 0, encounterIndex: 0, orderedBy: profileIds.physicianA, priority: "routine", status: "pending", dayOffset: 0, hour: 7, testIndexes: [0, 1], specimenStatus: "pending" },
  { patientIndex: 1, encounterIndex: 1, orderedBy: profileIds.physicianB, priority: "urgent", status: "collection", dayOffset: -1, hour: 8, testIndexes: [5], specimenStatus: "collected" },
  { patientIndex: 2, encounterIndex: 2, orderedBy: profileIds.physicianB, priority: "stat", status: "processing", dayOffset: 0, hour: 7, testIndexes: [0, 3, 4], specimenStatus: "collected" },
  { patientIndex: 3, encounterIndex: 3, orderedBy: profileIds.physicianA, priority: "routine", status: "completed", dayOffset: -3, hour: 9, testIndexes: [0, 1], specimenStatus: "collected" },
  { patientIndex: 4, encounterIndex: 4, orderedBy: profileIds.physicianA, priority: "routine", status: "cancelled", dayOffset: -2, hour: 10, testIndexes: [2], specimenStatus: "pending" },
  { patientIndex: 5, encounterIndex: 5, orderedBy: profileIds.physicianC, priority: "urgent", status: "pending", dayOffset: 0, hour: 9, testIndexes: [6], specimenStatus: "pending" },
];

export const laboratoryOrders: LaboratoryOrder[] = LAB_ORDER_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(26, index + 1),
    order_number: `LAB-2026-${String(index + 1).padStart(4, "0")}`,
    patient_id: previewUuid(10, seed.patientIndex + 1),
    encounter_id: previewUuid(19, seed.encounterIndex + 1),
    ordered_by: seed.orderedBy,
    priority: seed.priority,
    status: seed.status,
    ordered_at: isoAt(seed.dayOffset, seed.hour),
    created_at: isoAt(seed.dayOffset, seed.hour),
    updated_at: isoAt(seed.dayOffset, seed.hour + 1),
  })
);

export const laboratoryOrderItems: LaboratoryOrderItem[] = [];
export const laboratorySpecimens: LaboratorySpecimen[] = [];

LAB_ORDER_SEEDS.forEach((seed, orderIndex) => {
  const order = laboratoryOrders[orderIndex];

  seed.testIndexes.forEach((testIndex) => {
    laboratoryOrderItems.push({
      id: previewUuid(27, laboratoryOrderItems.length + 1),
      order_id: order.id,
      test_id: laboratoryTests[testIndex].id,
      status: seed.status,
      created_at: order.ordered_at,
    });
  });

  laboratorySpecimens.push({
    id: previewUuid(28, orderIndex + 1),
    order_id: order.id,
    specimen_type: laboratoryTests[seed.testIndexes[0]].specimen_type ?? "Whole blood",
    collection_status: seed.specimenStatus,
    collected_by:
      seed.specimenStatus === "collected" ? profileIds.labTech : null,
    collected_at:
      seed.specimenStatus === "collected"
        ? isoAt(seed.dayOffset, seed.hour + 1)
        : null,
    notes: null,
    created_at: order.ordered_at,
  });
});

const RESULT_VALUES = [
  { value: "7.2", unit: "10^9/L", range: "4.0 - 11.0", interpretation: "Normal" },
  { value: "Negative", unit: null, range: "Negative", interpretation: "Normal" },
  { value: "5.4", unit: "mmol/L", range: "3.9 - 5.6", interpretation: "Normal" },
  { value: "120", unit: "mg/dL", range: "70 - 110", interpretation: "High" },
  { value: "185", unit: "mg/dL", range: "< 200", interpretation: "Normal" },
  { value: "Negative", unit: null, range: "Negative", interpretation: "Normal" },
];

const itemById = new Map(
  laboratoryOrderItems.map((item) => [item.id, item])
);

const orderById = new Map(
  laboratoryOrders.map((order) => [order.id, order])
);

export const laboratoryResults: LaboratoryResult[] = laboratoryOrderItems
  .filter((item) => {
    const order = orderById.get(item.order_id);

    return order?.status === "completed" || order?.status === "processing";
  })
  .map((item, index) => {
    const order = orderById.get(item.order_id);
    const sample = RESULT_VALUES[index % RESULT_VALUES.length];
    const verified = order?.status === "completed";

    return {
      id: previewUuid(29, index + 1),
      order_item_id: item.id,
      result_value: sample.value,
      result_unit: sample.unit,
      reference_range: sample.range,
      interpretation: sample.interpretation,
      verification_status: verified ? "verified" : "pending",
      performed_by: profileIds.labTech,
      verified_by: verified ? profileIds.labTech : null,
      performed_at: order ? isoAt(0, 11) : null,
      verified_at: verified ? isoAt(0, 12) : null,
      created_at: order ? isoAt(0, 11) : isoAt(0, 10),
      updated_at: order ? isoAt(0, 12) : isoAt(0, 11),
    };
  });

export const laboratoryResultsByPatientId = new Map<
  string,
  LaboratoryResult[]
>();

for (const result of laboratoryResults) {
  const item = itemById.get(result.order_item_id);
  const order = item ? orderById.get(item.order_id) : undefined;

  if (!order) {
    continue;
  }

  const existing = laboratoryResultsByPatientId.get(order.patient_id) ?? [];
  existing.push(result);
  laboratoryResultsByPatientId.set(order.patient_id, existing);
}

const specimenByOrderId = new Map(
  laboratorySpecimens.map((specimen) => [specimen.order_id, specimen])
);

const testsByOrderId = new Map<string, LaboratoryTest[]>();

for (const item of laboratoryOrderItems) {
  const test = laboratoryTests.find((entry) => entry.id === item.test_id);

  if (!test) {
    continue;
  }

  const existing = testsByOrderId.get(item.order_id) ?? [];
  existing.push(test);
  testsByOrderId.set(item.order_id, existing);
}

const itemCountByOrderId = new Map<string, number>();

for (const item of laboratoryOrderItems) {
  itemCountByOrderId.set(
    item.order_id,
    (itemCountByOrderId.get(item.order_id) ?? 0) + 1
  );
}

export const labOrderListRows: LabOrderListRow[] = laboratoryOrders
  .map((order) => {
    const tests = testsByOrderId.get(order.id) ?? [];
    const specimen = specimenByOrderId.get(order.id);

    return {
      id: order.id,
      order_number: order.order_number,
      patient_id: order.patient_id,
      patient_name: patientNameById.get(order.patient_id) ?? "Test Patient",
      patient_mrn: patientMrnById.get(order.patient_id) ?? "MRN-2026-0000",
      encounter_id: order.encounter_id,
      ordered_by_name:
        profileNameById.get(order.ordered_by) ?? "Test Physician",
      priority: order.priority,
      status: order.status,
      ordered_at: order.ordered_at,
      tests: tests.map((test) => test.test_name),
      item_count: itemCountByOrderId.get(order.id) ?? 0,
      specimen_status: specimen?.collection_status ?? null,
    };
  })
  .sort((a, b) =>
    a.ordered_at === b.ordered_at ? 0 : a.ordered_at < b.ordered_at ? 1 : -1
  );

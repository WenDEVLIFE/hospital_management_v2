import type {
  RadiologyOrder,
  RadiologyOrderListRow,
  RadiologyReport,
} from "@/types/hospital";
import { isoAt, previewUuid, profileIds, profileNameById } from "./base";
import { patientMrnById, patientNameById } from "./patients";

type RadiologySeed = {
  patientIndex: number;
  encounterIndex: number;
  orderedBy: string;
  scheduledBy: string;
  examination_type: string;
  body_part: string;
  dayOffset: number;
  scheduledOffset: number | null;
  status: RadiologyOrder["status"];
};

const RADIOLOGY_SEEDS: RadiologySeed[] = [
  { patientIndex: 0, encounterIndex: 0, orderedBy: profileIds.physicianA, scheduledBy: profileIds.radiologist, examination_type: "Chest X-Ray", body_part: "Chest", dayOffset: 0, scheduledOffset: null, status: "pending" },
  { patientIndex: 1, encounterIndex: 1, orderedBy: profileIds.physicianB, scheduledBy: profileIds.radiologist, examination_type: "Abdominal Ultrasound", body_part: "Abdomen", dayOffset: -1, scheduledOffset: null, status: "pending" },
  { patientIndex: 2, encounterIndex: 2, orderedBy: profileIds.physicianB, scheduledBy: profileIds.radiologist, examination_type: "Head CT Scan", body_part: "Head", dayOffset: 0, scheduledOffset: null, status: "pending" },
  { patientIndex: 3, encounterIndex: 3, orderedBy: profileIds.physicianA, scheduledBy: profileIds.radiologist, examination_type: "Knee X-Ray", body_part: "Right knee", dayOffset: -2, scheduledOffset: 1, status: "scheduled" },
  { patientIndex: 4, encounterIndex: 4, orderedBy: profileIds.physicianA, scheduledBy: profileIds.radiologist, examination_type: "Pelvic Ultrasound", body_part: "Pelvis", dayOffset: -2, scheduledOffset: 2, status: "scheduled" },
  { patientIndex: 5, encounterIndex: 5, orderedBy: profileIds.physicianC, scheduledBy: profileIds.radiologist, examination_type: "MRI Lumbar Spine", body_part: "Lumbar spine", dayOffset: -3, scheduledOffset: 3, status: "scheduled" },
  { patientIndex: 6, encounterIndex: 6, orderedBy: profileIds.physicianC, scheduledBy: profileIds.radiologist, examination_type: "Chest X-Ray", body_part: "Chest", dayOffset: -20, scheduledOffset: -1, status: "in_progress" },
  { patientIndex: 7, encounterIndex: 7, orderedBy: profileIds.physicianB, scheduledBy: profileIds.radiologist, examination_type: "Abdominal CT Scan", body_part: "Abdomen", dayOffset: -26, scheduledOffset: 0, status: "in_progress" },
  { patientIndex: 8, encounterIndex: 8, orderedBy: profileIds.physicianA, scheduledBy: profileIds.radiologist, examination_type: "Chest X-Ray", body_part: "Chest", dayOffset: -33, scheduledOffset: -32, status: "completed" },
  { patientIndex: 9, encounterIndex: 9, orderedBy: profileIds.physicianC, scheduledBy: profileIds.radiologist, examination_type: "Abdominal Ultrasound", body_part: "Abdomen", dayOffset: -46, scheduledOffset: -45, status: "completed" },
  { patientIndex: 10, encounterIndex: 10, orderedBy: profileIds.physicianA, scheduledBy: profileIds.radiologist, examination_type: "Shoulder X-Ray", body_part: "Left shoulder", dayOffset: -60, scheduledOffset: -59, status: "completed" },
  { patientIndex: 11, encounterIndex: 11, orderedBy: profileIds.physicianB, scheduledBy: profileIds.radiologist, examination_type: "Head CT Scan", body_part: "Head", dayOffset: -4, scheduledOffset: null, status: "cancelled" },
];

export const radiologyOrders: RadiologyOrder[] = RADIOLOGY_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(30, index + 1),
    order_number: `RAD-2026-${String(index + 1).padStart(4, "0")}`,
    patient_id: previewUuid(10, seed.patientIndex + 1),
    encounter_id: previewUuid(19, seed.encounterIndex + 1),
    examination_type: seed.examination_type,
    body_part: seed.body_part,
    ordered_by: seed.orderedBy,
    scheduled_at:
      seed.scheduledOffset === null
        ? null
        : isoAt(seed.scheduledOffset, 10),
    status: seed.status,
    created_at: isoAt(seed.dayOffset, 9),
    updated_at: isoAt(seed.dayOffset, 10),
  })
);

const REPORT_SEEDS: {
  orderIndex: number;
  status: RadiologyReport["report_status"];
}[] = [
  { orderIndex: 6, status: "draft" },
  { orderIndex: 8, status: "verified" },
  { orderIndex: 9, status: "verified" },
  { orderIndex: 10, status: "draft" },
];

export const radiologyReports: RadiologyReport[] = REPORT_SEEDS.map(
  (seed, index) => {
    const order = radiologyOrders[seed.orderIndex];

    return {
      id: previewUuid(31, index + 1),
      order_id: order.id,
      report_content: "Synthetic preview imaging report content.",
      report_status: seed.status,
      reported_by: profileIds.radiologist,
      verified_by:
        seed.status === "verified" ? profileIds.radiologist : null,
      reported_at: isoAt(-1, 13),
      verified_at: seed.status === "verified" ? isoAt(0, 9) : null,
      created_at: isoAt(-1, 13),
      updated_at: isoAt(0, 9),
    };
  }
);

const reportByOrderId = new Map(
  radiologyReports.map((report) => [report.order_id, report])
);

export const radiologyOrderListRows: RadiologyOrderListRow[] = radiologyOrders
  .map((order) => ({
    id: order.id,
    order_number: order.order_number,
    patient_id: order.patient_id,
    patient_name: patientNameById.get(order.patient_id) ?? "Test Patient",
    patient_mrn: patientMrnById.get(order.patient_id) ?? "MRN-2026-0000",
    encounter_id: order.encounter_id,
    ordered_by_name:
      profileNameById.get(order.ordered_by) ?? "Test Physician",
    examination_type: order.examination_type,
    body_part: order.body_part,
    scheduled_at: order.scheduled_at,
    status: order.status,
    report_status: reportByOrderId.get(order.id)?.report_status ?? null,
    created_at: order.created_at,
  }))
  .sort((a, b) =>
    a.created_at === b.created_at ? 0 : a.created_at < b.created_at ? 1 : -1
  );

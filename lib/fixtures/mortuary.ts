import type {
  BodyIdentificationStatus,
  MortuaryAccessLog,
  MortuaryRecord,
  MortuaryRecordDetail,
  MortuaryRecordListRow,
  MortuaryRelease,
  MortuaryReleaseListRow,
  MortuaryStats,
  MortuaryStatus,
  MortuaryStorageUnit,
  MortuaryStorageUnitListRow,
} from "@/types/hospital";
import { PREVIEW_NOW, isoAt, previewUuid } from "./base";
import { patientMrnById, patientNameById, patients } from "./patients";

function manilaDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

const STAFF_NAME = "Test Mortuary Staff A";
const ADMIN_NAME = "Test Admin B";

export const mortuaryStorageUnits: MortuaryStorageUnit[] = [
  {
    id: previewUuid(150, 1),
    unit_number: "M-01",
    location: "Mortuary refrigerator 1",
    status: "occupied",
    current_record_id: previewUuid(151, 1),
  },
  {
    id: previewUuid(150, 2),
    unit_number: "M-02",
    location: "Mortuary refrigerator 1",
    status: "occupied",
    current_record_id: previewUuid(151, 2),
  },
  {
    id: previewUuid(150, 3),
    unit_number: "M-03",
    location: "Mortuary refrigerator 2",
    status: "occupied",
    current_record_id: previewUuid(151, 3),
  },
  {
    id: previewUuid(150, 4),
    unit_number: "M-04",
    location: "Cold room",
    status: "occupied",
    current_record_id: previewUuid(151, 5),
  },
  {
    id: previewUuid(150, 5),
    unit_number: "M-05",
    location: "Cold room",
    status: "available",
    current_record_id: null,
  },
  {
    id: previewUuid(150, 6),
    unit_number: "M-06",
    location: "Maintenance bay",
    status: "maintenance",
    current_record_id: null,
  },
];

export const mortuaryStorageUnitById = new Map(
  mortuaryStorageUnits.map((unit) => [unit.id, unit])
);

type RecordSeed = {
  patientIndex: number;
  declaredOffset: number;
  declaredHour: number;
  declaredMinute: number;
  placeOfDeath: string;
  bodyTag: string;
  identificationStatus: BodyIdentificationStatus;
  storageIndex: number | null;
  status: MortuaryStatus;
  nextOfKinName: string | null;
  nextOfKinRelationship: string | null;
  nextOfKinContact: string | null;
  nextOfKinVerified: boolean;
  admittedOffset: number;
  admittedHour: number;
  admittedMinute: number;
  releasedOffset: number | null;
  releasedHour: number | null;
  releasedMinute: number | null;
  releasedToName: string | null;
  releaseAuthorizedBy: string | null;
  releaseDocument: string | null;
  notes: string | null;
};

const RECORD_SEEDS: RecordSeed[] = [
  {
    patientIndex: 0,
    declaredOffset: -2,
    declaredHour: 22,
    declaredMinute: 30,
    placeOfDeath: "SPMC Emergency Department",
    bodyTag: "BT-2026-0001",
    identificationStatus: "verified",
    storageIndex: 0,
    status: "release_pending",
    nextOfKinName: "Test Next of Kin A",
    nextOfKinRelationship: "Spouse",
    nextOfKinContact: "0917-500-0001",
    nextOfKinVerified: true,
    admittedOffset: -2,
    admittedHour: 23,
    admittedMinute: 0,
    releasedOffset: null,
    releasedHour: null,
    releasedMinute: null,
    releasedToName: null,
    releaseAuthorizedBy: ADMIN_NAME,
    releaseDocument: "REL-2026-0001",
    notes: "Release pending funeral service coordination.",
  },
  {
    patientIndex: 1,
    declaredOffset: -1,
    declaredHour: 14,
    declaredMinute: 10,
    placeOfDeath: "Ward 3",
    bodyTag: "BT-2026-0002",
    identificationStatus: "verified",
    storageIndex: 1,
    status: "admitted",
    nextOfKinName: "Test Next of Kin B",
    nextOfKinRelationship: "Sibling",
    nextOfKinContact: "0917-500-0002",
    nextOfKinVerified: true,
    admittedOffset: -1,
    admittedHour: 14,
    admittedMinute: 40,
    releasedOffset: null,
    releasedHour: null,
    releasedMinute: null,
    releasedToName: null,
    releaseAuthorizedBy: null,
    releaseDocument: null,
    notes: null,
  },
  {
    patientIndex: 2,
    declaredOffset: 0,
    declaredHour: 6,
    declaredMinute: 20,
    placeOfDeath: "Emergency Department",
    bodyTag: "BT-2026-0003",
    identificationStatus: "pending",
    storageIndex: 2,
    status: "admitted",
    nextOfKinName: "Test Next of Kin C",
    nextOfKinRelationship: "Parent",
    nextOfKinContact: "0917-500-0003",
    nextOfKinVerified: false,
    admittedOffset: 0,
    admittedHour: 6,
    admittedMinute: 50,
    releasedOffset: null,
    releasedHour: null,
    releasedMinute: null,
    releasedToName: null,
    releaseAuthorizedBy: null,
    releaseDocument: null,
    notes: "Body identification and next-of-kin verification pending.",
  },
  {
    patientIndex: 3,
    declaredOffset: -3,
    declaredHour: 9,
    declaredMinute: 0,
    placeOfDeath: "Ward 5",
    bodyTag: "BT-2026-0004",
    identificationStatus: "verified",
    storageIndex: 4,
    status: "released",
    nextOfKinName: "Test Next of Kin D",
    nextOfKinRelationship: "Child",
    nextOfKinContact: "0917-500-0004",
    nextOfKinVerified: true,
    admittedOffset: -3,
    admittedHour: 9,
    admittedMinute: 30,
    releasedOffset: 0,
    releasedHour: 7,
    releasedMinute: 30,
    releasedToName: "Test Next of Kin D",
    releaseAuthorizedBy: ADMIN_NAME,
    releaseDocument: "REL-2026-0002",
    notes: "Released to family.",
  },
  {
    patientIndex: 4,
    declaredOffset: -5,
    declaredHour: 17,
    declaredMinute: 45,
    placeOfDeath: "Ward 6",
    bodyTag: "BT-2026-0005",
    identificationStatus: "discrepancy",
    storageIndex: 3,
    status: "unclaimed",
    nextOfKinName: null,
    nextOfKinRelationship: null,
    nextOfKinContact: null,
    nextOfKinVerified: false,
    admittedOffset: -5,
    admittedHour: 18,
    admittedMinute: 10,
    releasedOffset: null,
    releasedHour: null,
    releasedMinute: null,
    releasedToName: null,
    releaseAuthorizedBy: null,
    releaseDocument: null,
    notes: "Unclaimed; identification discrepancy under review.",
  },
];

export const mortuaryRecords: MortuaryRecord[] = RECORD_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(151, index + 1),
    case_number: `MOR-2026-${String(index + 1).padStart(4, "0")}`,
    patient_id: previewUuid(10, seed.patientIndex + 1),
    declared_at: isoAt(
      seed.declaredOffset,
      seed.declaredHour,
      seed.declaredMinute
    ),
    place_of_death: seed.placeOfDeath,
    body_tag_number: seed.bodyTag,
    identification_status: seed.identificationStatus,
    storage_unit_id:
      seed.storageIndex === null
        ? null
        : mortuaryStorageUnits[seed.storageIndex].id,
    status: seed.status,
    next_of_kin_name: seed.nextOfKinName,
    next_of_kin_relationship: seed.nextOfKinRelationship,
    next_of_kin_contact: seed.nextOfKinContact,
    next_of_kin_verified: seed.nextOfKinVerified,
    admitted_at: isoAt(
      seed.admittedOffset,
      seed.admittedHour,
      seed.admittedMinute
    ),
    released_at:
      seed.releasedOffset === null
        ? null
        : isoAt(seed.releasedOffset, seed.releasedHour ?? 0, seed.releasedMinute ?? 0),
    released_to_name: seed.releasedToName,
    release_authorized_by_name: seed.releaseAuthorizedBy,
    release_document_reference: seed.releaseDocument,
    notes: seed.notes,
  })
);

export const mortuaryRecordById = new Map(
  mortuaryRecords.map((record) => [record.id, record])
);

export const mortuaryReleases: MortuaryRelease[] = [
  {
    id: previewUuid(152, 1),
    record_id: mortuaryRecords[0].id,
    status: "authorized",
    requested_at: isoAt(-2, 23, 30),
    authorized_by_name: ADMIN_NAME,
    authorized_at: isoAt(-1, 9),
    released_to_name: "Test Next of Kin A",
    relationship: "Spouse",
    document_reference: "REL-2026-0001",
    released_at: null,
    notes: "Awaiting funeral service release.",
  },
  {
    id: previewUuid(152, 2),
    record_id: mortuaryRecords[3].id,
    status: "completed",
    requested_at: isoAt(-1, 10),
    authorized_by_name: ADMIN_NAME,
    authorized_at: isoAt(-1, 11),
    released_to_name: "Test Next of Kin D",
    relationship: "Child",
    document_reference: "REL-2026-0002",
    released_at: isoAt(0, 7, 30),
    notes: "Release documents verified.",
  },
  {
    id: previewUuid(152, 3),
    record_id: mortuaryRecords[4].id,
    status: "pending",
    requested_at: isoAt(-4, 10),
    authorized_by_name: null,
    authorized_at: null,
    released_to_name: null,
    relationship: null,
    document_reference: null,
    released_at: null,
    notes: "No next-of-kin contact yet.",
  },
];

export const mortuaryReleaseByRecordId = new Map(
  mortuaryReleases.map((release) => [release.record_id, release])
);

export const mortuaryAccessLog: MortuaryAccessLog[] = [
  {
    id: previewUuid(153, 1),
    record_id: mortuaryRecords[0].id,
    action: "Mortuary admission",
    actor_name: STAFF_NAME,
    created_at: isoAt(-2, 23, 0),
    notes: null,
  },
  {
    id: previewUuid(153, 2),
    record_id: mortuaryRecords[0].id,
    action: "Record viewed",
    actor_name: ADMIN_NAME,
    created_at: isoAt(-1, 8, 0),
    notes: null,
  },
  {
    id: previewUuid(153, 3),
    record_id: mortuaryRecords[0].id,
    action: "Release authorized",
    actor_name: ADMIN_NAME,
    created_at: isoAt(-1, 9, 0),
    notes: "Release documents verified.",
  },
  {
    id: previewUuid(153, 4),
    record_id: mortuaryRecords[1].id,
    action: "Mortuary admission",
    actor_name: STAFF_NAME,
    created_at: isoAt(-1, 14, 40),
    notes: null,
  },
  {
    id: previewUuid(153, 5),
    record_id: mortuaryRecords[2].id,
    action: "Mortuary admission",
    actor_name: STAFF_NAME,
    created_at: isoAt(0, 6, 50),
    notes: null,
  },
  {
    id: previewUuid(153, 6),
    record_id: mortuaryRecords[2].id,
    action: "Identification pending",
    actor_name: STAFF_NAME,
    created_at: isoAt(0, 7, 15),
    notes: "Awaiting confirmatory identification.",
  },
  {
    id: previewUuid(153, 7),
    record_id: mortuaryRecords[3].id,
    action: "Mortuary admission",
    actor_name: STAFF_NAME,
    created_at: isoAt(-3, 9, 30),
    notes: null,
  },
  {
    id: previewUuid(153, 8),
    record_id: mortuaryRecords[3].id,
    action: "Release authorized",
    actor_name: ADMIN_NAME,
    created_at: isoAt(-1, 11, 0),
    notes: null,
  },
  {
    id: previewUuid(153, 9),
    record_id: mortuaryRecords[3].id,
    action: "Body released",
    actor_name: STAFF_NAME,
    created_at: isoAt(0, 7, 30),
    notes: "Released to Test Next of Kin D.",
  },
  {
    id: previewUuid(153, 10),
    record_id: mortuaryRecords[4].id,
    action: "Mortuary admission",
    actor_name: STAFF_NAME,
    created_at: isoAt(-5, 18, 10),
    notes: null,
  },
  {
    id: previewUuid(153, 11),
    record_id: mortuaryRecords[4].id,
    action: "Identification discrepancy",
    actor_name: STAFF_NAME,
    created_at: isoAt(-4, 9, 0),
    notes: "Discrepancy noted for review.",
  },
  {
    id: previewUuid(153, 12),
    record_id: mortuaryRecords[4].id,
    action: "Record viewed",
    actor_name: ADMIN_NAME,
    created_at: isoAt(-2, 10, 0),
    notes: null,
  },
];

const accessLogByRecordId = new Map<string, MortuaryAccessLog[]>();

for (const log of mortuaryAccessLog) {
  const list = accessLogByRecordId.get(log.record_id) ?? [];
  list.push(log);
  accessLogByRecordId.set(log.record_id, list);
}

export const mortuaryRecordListRows: MortuaryRecordListRow[] =
  mortuaryRecords.map((record) => ({
    ...record,
    patient_name:
      patientNameById.get(record.patient_id) ?? "Test Patient",
    patient_mrn:
      patientMrnById.get(record.patient_id) ?? "MRN-2026-0000",
    storage_unit_label: record.storage_unit_id
      ? (() => {
          const unit = mortuaryStorageUnitById.get(record.storage_unit_id);
          return unit ? `${unit.unit_number} · ${unit.location}` : null;
        })()
      : null,
  }));

export const mortuaryReleaseListRows: MortuaryReleaseListRow[] =
  mortuaryReleases.map((release) => {
    const record = mortuaryRecordById.get(release.record_id);

    return {
      ...release,
      case_number: record?.case_number ?? "Unknown case",
      patient_name: record
        ? patientNameById.get(record.patient_id) ?? "Test Patient"
        : "Test Patient",
      patient_mrn: record
        ? patientMrnById.get(record.patient_id) ?? "MRN-2026-0000"
        : "MRN-2026-0000",
    };
  });

export const mortuaryStorageUnitListRows: MortuaryStorageUnitListRow[] =
  mortuaryStorageUnits.map((unit) => {
    const record = unit.current_record_id
      ? mortuaryRecordById.get(unit.current_record_id)
      : null;

    return {
      ...unit,
      current_case_number: record?.case_number ?? null,
      current_patient_name: record
        ? patientNameById.get(record.patient_id) ?? "Test Patient"
        : null,
    };
  });

export const mortuaryRecordDetailById = new Map<string, MortuaryRecordDetail>(
  mortuaryRecords.map((record) => {
    const patient = patients.find((item) => item.id === record.patient_id);
    const storageUnit = record.storage_unit_id
      ? mortuaryStorageUnitById.get(record.storage_unit_id) ?? null
      : null;

    if (!patient) {
      throw new Error(`Mortuary fixture is missing patient ${record.patient_id}`);
    }

    return [
      record.id,
      {
        record,
        patient,
        storageUnit,
        release: mortuaryReleaseByRecordId.get(record.id) ?? null,
        accessLog: accessLogByRecordId.get(record.id) ?? [],
      },
    ];
  })
);

export const mortuaryStats: MortuaryStats = {
  bodiesInCustody: mortuaryRecords.filter(
    (record) =>
      record.status === "admitted" ||
      record.status === "identified" ||
      record.status === "release_pending" ||
      record.status === "unclaimed"
  ).length,
  admittedToday: mortuaryRecords.filter(
    (record) => manilaDate(record.admitted_at) === manilaDate(PREVIEW_NOW)
  ).length,
  releasedToday: mortuaryReleases.filter(
    (release) =>
      release.status === "completed" &&
      release.released_at !== null &&
      manilaDate(release.released_at) === manilaDate(PREVIEW_NOW)
  ).length,
  pendingRelease: mortuaryRecords.filter(
    (record) => record.status === "release_pending"
  ).length,
  storageOccupied: mortuaryStorageUnits.filter(
    (unit) => unit.status === "occupied"
  ).length,
  storageTotal: mortuaryStorageUnits.length,
  unidentified: mortuaryRecords.filter(
    (record) =>
      record.identification_status !== "verified" &&
      record.status !== "released"
  ).length,
};

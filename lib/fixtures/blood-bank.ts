import type {
  BloodBankStats,
  BloodCrossmatch,
  BloodDonation,
  BloodDonor,
  BloodDonorDetail,
  BloodDonorListRow,
  BloodIssue,
  BloodRequest,
  BloodRequestDetail,
  BloodRequestListRow,
  BloodScreening,
  BloodUnit,
  BloodUnitDetail,
  BloodUnitListRow,
  TransfusionRecord,
} from "@/types/hospital";
import {
  PREVIEW_NOW,
  isoAt,
  isoDate,
  previewUuid,
  profileIds,
  profileNameById,
} from "./base";
import { patientMrnById, patientNameById, patients } from "./patients";

const labTechnologistName =
  profileNameById.get(profileIds.labTech) ?? "Test Lab Staff A";

export const bloodDonors: BloodDonor[] = [
  {
    id: previewUuid(100, 1),
    donor_number: "DON-2026-0001",
    full_name: "Test Donor A",
    date_of_birth: isoDate(-12000),
    sex: "Male",
    blood_type: "O+",
    contact_number: "0917-300-0001",
    address: "Sample City",
    eligibility_status: "eligible",
    last_donation_date: isoDate(-7),
    total_donations: 5,
    notes: null,
  },
  {
    id: previewUuid(100, 2),
    donor_number: "DON-2026-0002",
    full_name: "Test Donor B",
    date_of_birth: isoDate(-11000),
    sex: "Female",
    blood_type: "A+",
    contact_number: "0917-300-0002",
    address: "Sample City",
    eligibility_status: "eligible",
    last_donation_date: isoDate(-18),
    total_donations: 3,
    notes: null,
  },
  {
    id: previewUuid(100, 3),
    donor_number: "DON-2026-0003",
    full_name: "Test Donor C",
    date_of_birth: isoDate(-13000),
    sex: "Male",
    blood_type: "B+",
    contact_number: "0917-300-0003",
    address: "Sample City",
    eligibility_status: "eligible",
    last_donation_date: isoDate(-15),
    total_donations: 7,
    notes: null,
  },
  {
    id: previewUuid(100, 4),
    donor_number: "DON-2026-0004",
    full_name: "Test Donor D",
    date_of_birth: isoDate(-12500),
    sex: "Female",
    blood_type: "AB+",
    contact_number: "0917-300-0004",
    address: "Sample City",
    eligibility_status: "deferred",
    last_donation_date: isoDate(-30),
    total_donations: 1,
    notes: "Deferred at screening due to low hemoglobin.",
  },
  {
    id: previewUuid(100, 5),
    donor_number: "DON-2026-0005",
    full_name: "Test Donor E",
    date_of_birth: isoDate(-11500),
    sex: "Male",
    blood_type: "O-",
    contact_number: "0917-300-0005",
    address: "Sample City",
    eligibility_status: "eligible",
    last_donation_date: isoDate(-12),
    total_donations: 2,
    notes: null,
  },
  {
    id: previewUuid(100, 6),
    donor_number: "DON-2026-0006",
    full_name: "Test Donor F",
    date_of_birth: isoDate(-14000),
    sex: "Female",
    blood_type: "A-",
    contact_number: "0917-300-0006",
    address: "Sample City",
    eligibility_status: "eligible",
    last_donation_date: isoDate(-10),
    total_donations: 4,
    notes: null,
  },
  {
    id: previewUuid(100, 7),
    donor_number: "DON-2026-0007",
    full_name: "Test Donor G",
    date_of_birth: isoDate(-15000),
    sex: "Male",
    blood_type: "B-",
    contact_number: "0917-300-0007",
    address: "Sample City",
    eligibility_status: "inactive",
    last_donation_date: isoDate(-500),
    total_donations: 6,
    notes: "Inactive donor; no donation in the last 12 months.",
  },
  {
    id: previewUuid(100, 8),
    donor_number: "DON-2026-0008",
    full_name: "Test Donor H",
    date_of_birth: isoDate(-10000),
    sex: "Female",
    blood_type: "AB-",
    contact_number: "0917-300-0008",
    address: "Sample City",
    eligibility_status: "eligible",
    last_donation_date: isoDate(-8),
    total_donations: 1,
    notes: null,
  },
];

export const bloodDonorById = new Map(
  bloodDonors.map((donor) => [donor.id, donor])
);

type DonationSeed = {
  donorIndex: number;
  dayOffset: number;
  bloodType: BloodDonation["blood_type"];
  status: BloodDonation["status"];
  notes: string | null;
};

const DONATION_SEEDS: DonationSeed[] = [
  { donorIndex: 0, dayOffset: -20, bloodType: "O+", status: "released", notes: null },
  { donorIndex: 1, dayOffset: -18, bloodType: "A+", status: "released", notes: null },
  { donorIndex: 2, dayOffset: -15, bloodType: "B+", status: "released", notes: null },
  { donorIndex: 4, dayOffset: -12, bloodType: "O-", status: "released", notes: null },
  { donorIndex: 5, dayOffset: -10, bloodType: "A-", status: "released", notes: null },
  { donorIndex: 7, dayOffset: -8, bloodType: "AB-", status: "tested", notes: null },
  { donorIndex: 0, dayOffset: -7, bloodType: "O+", status: "tested", notes: null },
  { donorIndex: 3, dayOffset: -30, bloodType: "AB+", status: "discarded", notes: "Reactive screening result." },
  { donorIndex: 2, dayOffset: -40, bloodType: "B+", status: "released", notes: null },
  { donorIndex: 1, dayOffset: -35, bloodType: "A+", status: "released", notes: null },
];

export const bloodDonations: BloodDonation[] = DONATION_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(101, index + 1),
    donation_number: `DNT-2026-${String(index + 1).padStart(4, "0")}`,
    donor_id: bloodDonors[seed.donorIndex].id,
    donation_date: isoDate(seed.dayOffset),
    blood_type: seed.bloodType,
    units_collected: 1,
    collection_site: "SPMC Blood Bank",
    status: seed.status,
    notes: seed.notes,
  })
);

export const bloodDonationById = new Map(
  bloodDonations.map((donation) => [donation.id, donation])
);

type UnitSeed = {
  donationIndex: number;
  component: BloodUnit["component"];
  status: BloodUnit["status"];
  shelfLifeDays: number;
  storage: string;
  screeningStatus: BloodUnit["screening_status"];
};

const UNIT_SEEDS: UnitSeed[] = [
  { donationIndex: 0, component: "packed_rbc", status: "issued", shelfLifeDays: 35, storage: "Refrigerator 1", screeningStatus: "passed" },
  { donationIndex: 0, component: "plasma", status: "available", shelfLifeDays: 365, storage: "Freezer 1", screeningStatus: "passed" },
  { donationIndex: 1, component: "packed_rbc", status: "issued", shelfLifeDays: 35, storage: "Refrigerator 1", screeningStatus: "passed" },
  { donationIndex: 1, component: "platelets", status: "available", shelfLifeDays: 5, storage: "Platelet agitator", screeningStatus: "passed" },
  { donationIndex: 2, component: "packed_rbc", status: "crossmatched", shelfLifeDays: 35, storage: "Refrigerator 2", screeningStatus: "passed" },
  { donationIndex: 3, component: "packed_rbc", status: "available", shelfLifeDays: 35, storage: "Refrigerator 2", screeningStatus: "passed" },
  { donationIndex: 4, component: "packed_rbc", status: "available", shelfLifeDays: 35, storage: "Refrigerator 2", screeningStatus: "passed" },
  { donationIndex: 5, component: "packed_rbc", status: "reserved", shelfLifeDays: 35, storage: "Refrigerator 3", screeningStatus: "passed" },
  { donationIndex: 6, component: "packed_rbc", status: "issued", shelfLifeDays: 35, storage: "Refrigerator 3", screeningStatus: "passed" },
  { donationIndex: 8, component: "packed_rbc", status: "available", shelfLifeDays: 35, storage: "Refrigerator 1", screeningStatus: "passed" },
  { donationIndex: 7, component: "whole_blood", status: "discarded", shelfLifeDays: 35, storage: "Quarantine", screeningStatus: "failed" },
  { donationIndex: 9, component: "packed_rbc", status: "expired", shelfLifeDays: 35, storage: "Refrigerator 2", screeningStatus: "passed" },
  { donationIndex: 2, component: "plasma", status: "available", shelfLifeDays: 365, storage: "Freezer 1", screeningStatus: "passed" },
  { donationIndex: 3, component: "plasma", status: "available", shelfLifeDays: 365, storage: "Freezer 1", screeningStatus: "passed" },
];

export const bloodUnits: BloodUnit[] = UNIT_SEEDS.map((seed, index) => {
  const donation = bloodDonations[seed.donationIndex];
  const donationSeed = DONATION_SEEDS[seed.donationIndex];

  return {
    id: previewUuid(102, index + 1),
    unit_number: `BU-2026-${String(index + 1).padStart(4, "0")}`,
    donation_id: donation.id,
    donor_id: donation.donor_id,
    blood_type: donation.blood_type,
    component: seed.component,
    collection_date: donation.donation_date,
    expiry_date: isoDate(donationSeed.dayOffset + seed.shelfLifeDays),
    status: seed.status,
    storage_location: seed.storage,
    screening_status: seed.screeningStatus,
    notes:
      seed.status === "discarded"
        ? "Reactive screening result; unit quarantined."
        : seed.status === "expired"
          ? "Expired; pending disposal."
          : null,
  };
});

export const bloodUnitById = new Map(
  bloodUnits.map((unit) => [unit.id, unit])
);

export const bloodScreenings: BloodScreening[] = [];
const screeningsByUnitId = new Map<string, BloodScreening[]>();
let screeningIndex = 0;

bloodUnits.forEach((unit, unitIndex) => {
  const donationSeed = DONATION_SEEDS[UNIT_SEEDS[unitIndex].donationIndex];
  const tests = ["HIV", "Hepatitis B", "Hepatitis C"];
  const list: BloodScreening[] = [];

  for (const test of tests) {
    screeningIndex += 1;
    const positive = unit.screening_status === "failed" && test === "Hepatitis B";

    list.push({
      id: previewUuid(103, screeningIndex),
      unit_id: unit.id,
      test_name: test,
      result: positive ? "positive" : "negative",
      tested_at: isoAt(donationSeed.dayOffset + 1, 10),
      tested_by_name: labTechnologistName,
      notes: positive ? "Reactive; unit quarantined." : null,
    });
  }

  screeningsByUnitId.set(unit.id, list);
  bloodScreenings.push(...list);
});

type RequestSeed = {
  patientIndex: number;
  bloodType: BloodRequest["blood_type"];
  component: BloodRequest["component"];
  unitsRequested: number;
  unitsFulfilled: number;
  priority: BloodRequest["priority"];
  status: BloodRequest["status"];
  requestedBy: string;
  department: string;
  requestedOffset: number;
  requiredOffset: number;
  notes: string;
};

const REQUEST_SEEDS: RequestSeed[] = [
  {
    patientIndex: 0,
    bloodType: "O+",
    component: "packed_rbc",
    unitsRequested: 2,
    unitsFulfilled: 2,
    priority: "emergency",
    status: "completed",
    requestedBy: "Test Physician B",
    department: "Emergency Department",
    requestedOffset: -2,
    requiredOffset: -2,
    notes: "Emergency transfusion; two units issued and transfused.",
  },
  {
    patientIndex: 2,
    bloodType: "B+",
    component: "packed_rbc",
    unitsRequested: 1,
    unitsFulfilled: 0,
    priority: "urgent",
    status: "crossmatched",
    requestedBy: "Test Physician C",
    department: "Inpatient Department",
    requestedOffset: -1,
    requiredOffset: 0,
    notes: "Pre-operative preparation; compatible unit identified.",
  },
  {
    patientIndex: 4,
    bloodType: "A+",
    component: "packed_rbc",
    unitsRequested: 2,
    unitsFulfilled: 1,
    priority: "urgent",
    status: "issued",
    requestedBy: "Test Physician A",
    department: "Inpatient Department",
    requestedOffset: -1,
    requiredOffset: 0,
    notes: "One unit issued; second unit pending.",
  },
  {
    patientIndex: 5,
    bloodType: "A-",
    component: "packed_rbc",
    unitsRequested: 1,
    unitsFulfilled: 0,
    priority: "routine",
    status: "pending",
    requestedBy: "Test Physician C",
    department: "Surgery & OR",
    requestedOffset: 0,
    requiredOffset: 2,
    notes: "Scheduled surgical reserve.",
  },
  {
    patientIndex: 6,
    bloodType: "AB-",
    component: "packed_rbc",
    unitsRequested: 1,
    unitsFulfilled: 0,
    priority: "routine",
    status: "reserved",
    requestedBy: "Test Physician A",
    department: "Inpatient Department",
    requestedOffset: 0,
    requiredOffset: 1,
    notes: "Reserved unit awaiting crossmatch.",
  },
  {
    patientIndex: 7,
    bloodType: "B+",
    component: "plasma",
    unitsRequested: 2,
    unitsFulfilled: 0,
    priority: "emergency",
    status: "pending",
    requestedBy: "Test Physician B",
    department: "Emergency Department",
    requestedOffset: 0,
    requiredOffset: 0,
    notes: "Coagulopathy; plasma requested.",
  },
  {
    patientIndex: 3,
    bloodType: "A+",
    component: "packed_rbc",
    unitsRequested: 1,
    unitsFulfilled: 0,
    priority: "routine",
    status: "cancelled",
    requestedBy: "Test Physician C",
    department: "Inpatient Department",
    requestedOffset: -3,
    requiredOffset: -1,
    notes: "Cancelled after hemoglobin improved.",
  },
];

export const bloodRequests: BloodRequest[] = REQUEST_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(104, index + 1),
    request_number: `BR-2026-${String(index + 1).padStart(4, "0")}`,
    patient_id: previewUuid(10, seed.patientIndex + 1),
    blood_type: seed.bloodType,
    component: seed.component,
    units_requested: seed.unitsRequested,
    units_fulfilled: seed.unitsFulfilled,
    priority: seed.priority,
    status: seed.status,
    requested_by_name: seed.requestedBy,
    department_name: seed.department,
    requested_at: isoAt(seed.requestedOffset, 9),
    required_by: isoAt(seed.requiredOffset, 12),
    notes: seed.notes,
  })
);

export const bloodRequestById = new Map(
  bloodRequests.map((request) => [request.id, request])
);

type CrossmatchSeed = {
  requestIndex: number;
  unitIndex: number;
  result: BloodCrossmatch["result"];
  crossmatchedOffset: number | null;
  notes: string | null;
};

const CROSSMATCH_SEEDS: CrossmatchSeed[] = [
  { requestIndex: 0, unitIndex: 0, result: "compatible", crossmatchedOffset: -1, notes: "Compatible at immediate spin and AHG." },
  { requestIndex: 0, unitIndex: 8, result: "compatible", crossmatchedOffset: -1, notes: "Compatible at immediate spin and AHG." },
  { requestIndex: 1, unitIndex: 4, result: "compatible", crossmatchedOffset: 0, notes: "Compatible; reserved for surgery." },
  { requestIndex: 2, unitIndex: 2, result: "compatible", crossmatchedOffset: -1, notes: "Compatible; unit issued." },
  { requestIndex: 4, unitIndex: 7, result: "compatible", crossmatchedOffset: 0, notes: "Compatible; unit reserved." },
  { requestIndex: 5, unitIndex: 12, result: "pending", crossmatchedOffset: null, notes: "Crossmatch in progress." },
];

export const bloodCrossmatches: BloodCrossmatch[] = CROSSMATCH_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(105, index + 1),
    request_id: bloodRequests[seed.requestIndex].id,
    unit_id: bloodUnits[seed.unitIndex].id,
    result: seed.result,
    crossmatched_at:
      seed.crossmatchedOffset === null
        ? null
        : isoAt(seed.crossmatchedOffset, 11),
    crossmatched_by_name:
      seed.crossmatchedOffset === null ? null : labTechnologistName,
    notes: seed.notes,
  })
);

const crossmatchesByRequestId = new Map<string, BloodCrossmatch[]>();
const crossmatchByUnitId = new Map<string, BloodCrossmatch>();

for (const crossmatch of bloodCrossmatches) {
  const list = crossmatchesByRequestId.get(crossmatch.request_id) ?? [];
  list.push(crossmatch);
  crossmatchesByRequestId.set(crossmatch.request_id, list);
  crossmatchByUnitId.set(crossmatch.unit_id, crossmatch);
}

type IssueSeed = {
  requestIndex: number;
  unitIndex: number;
  issuedOffset: number;
  receivedBy: string;
};

const ISSUE_SEEDS: IssueSeed[] = [
  { requestIndex: 0, unitIndex: 0, issuedOffset: -1, receivedBy: "Test Nurse A" },
  { requestIndex: 0, unitIndex: 8, issuedOffset: -1, receivedBy: "Test Nurse A" },
  { requestIndex: 2, unitIndex: 2, issuedOffset: 0, receivedBy: "Test Nurse B" },
];

export const bloodIssues: BloodIssue[] = ISSUE_SEEDS.map((seed, index) => ({
  id: previewUuid(106, index + 1),
  request_id: bloodRequests[seed.requestIndex].id,
  unit_id: bloodUnits[seed.unitIndex].id,
  issued_at: isoAt(seed.issuedOffset, 9),
  issued_by_name: labTechnologistName,
  received_by_name: seed.receivedBy,
  notes: null,
}));

const issuesByRequestId = new Map<string, BloodIssue[]>();
const issueByUnitId = new Map<string, BloodIssue>();

for (const issue of bloodIssues) {
  const list = issuesByRequestId.get(issue.request_id) ?? [];
  list.push(issue);
  issuesByRequestId.set(issue.request_id, list);
  issueByUnitId.set(issue.unit_id, issue);
}

export const transfusionRecords: TransfusionRecord[] = [
  {
    id: previewUuid(107, 1),
    request_id: bloodRequests[0].id,
    unit_id: bloodUnits[0].id,
    transfused_at: isoAt(-1, 10),
    transfused_by_name: "Test Nurse A",
    reaction_severity: "none",
    reaction_notes: null,
  },
  {
    id: previewUuid(107, 2),
    request_id: bloodRequests[0].id,
    unit_id: bloodUnits[8].id,
    transfused_at: isoAt(-1, 12),
    transfused_by_name: "Test Nurse A",
    reaction_severity: "mild",
    reaction_notes: "Mild febrile reaction; transfusion completed under monitoring.",
  },
];

const transfusionsByRequestId = new Map<string, TransfusionRecord[]>();
const transfusionByUnitId = new Map<string, TransfusionRecord>();

for (const record of transfusionRecords) {
  const list = transfusionsByRequestId.get(record.request_id) ?? [];
  list.push(record);
  transfusionsByRequestId.set(record.request_id, list);
  transfusionByUnitId.set(record.unit_id, record);
}

const requestByUnitId = new Map<string, BloodRequest>();

for (const crossmatch of bloodCrossmatches) {
  const request = bloodRequestById.get(crossmatch.request_id);

  if (request) {
    requestByUnitId.set(crossmatch.unit_id, request);
  }
}

for (const issue of bloodIssues) {
  const request = bloodRequestById.get(issue.request_id);

  if (request) {
    requestByUnitId.set(issue.unit_id, request);
  }
}

export const bloodUnitListRows: BloodUnitListRow[] = bloodUnits.map((unit) => ({
  ...unit,
  donor_name: bloodDonorById.get(unit.donor_id)?.full_name ?? "Unknown donor",
  request_number: requestByUnitId.get(unit.id)?.request_number ?? null,
  days_to_expiry: Math.ceil(
    (Date.parse(unit.expiry_date) - Date.parse(PREVIEW_NOW)) / 86_400_000
  ),
}));

export const bloodRequestListRows: BloodRequestListRow[] = bloodRequests
  .map((request) => {
    const crossmatches = crossmatchesByRequestId.get(request.id) ?? [];
    const latestCrossmatch = crossmatches[crossmatches.length - 1] ?? null;

    return {
      ...request,
      patient_name:
        patientNameById.get(request.patient_id) ?? "Test Patient",
      patient_mrn:
        patientMrnById.get(request.patient_id) ?? "MRN-2026-0000",
      crossmatch_status: latestCrossmatch?.result ?? null,
      issued_units: (issuesByRequestId.get(request.id) ?? []).length,
    };
  })
  .sort((a, b) =>
    a.requested_at === b.requested_at
      ? 0
      : a.requested_at < b.requested_at
        ? 1
        : -1
  );

export const bloodDonorListRows: BloodDonorListRow[] = bloodDonors.map(
  (donor) => ({
    ...donor,
    donations_this_year: bloodDonations.filter(
      (donation) => donation.donor_id === donor.id
    ).length,
  })
);

const bloodRequestRowById = new Map(
  bloodRequestListRows.map((request) => [request.id, request])
);

export const bloodUnitDetailById = new Map<string, BloodUnitDetail>(
  bloodUnits.map((unit) => {
    const donor = bloodDonorById.get(unit.donor_id);
    const donation = bloodDonationById.get(unit.donation_id);

    if (!donor || !donation) {
      throw new Error(`Blood bank fixture is missing unit dependencies for ${unit.id}`);
    }

    return [
      unit.id,
      {
        unit,
        donor,
        donation,
        screenings: screeningsByUnitId.get(unit.id) ?? [],
        request: requestByUnitId.get(unit.id)
          ? bloodRequestRowById.get(requestByUnitId.get(unit.id)!.id) ?? null
          : null,
        issue: issueByUnitId.get(unit.id) ?? null,
        transfusion: transfusionByUnitId.get(unit.id) ?? null,
      },
    ];
  })
);

export const bloodRequestDetailById = new Map<string, BloodRequestDetail>(
  bloodRequests.map((request) => {
    const patient = patients.find((item) => item.id === request.patient_id);

    if (!patient) {
      throw new Error(`Blood bank fixture is missing patient ${request.patient_id}`);
    }

    return [
      request.id,
      {
        request,
        patient,
        crossmatches: (crossmatchesByRequestId.get(request.id) ?? []).map(
          (crossmatch) => {
            const unit = bloodUnitById.get(crossmatch.unit_id);

            return {
              ...crossmatch,
              unit_number: unit?.unit_number ?? "Unknown unit",
              blood_type: unit?.blood_type ?? request.blood_type,
              component: unit?.component ?? request.component,
            };
          }
        ),
        issues: (issuesByRequestId.get(request.id) ?? []).map((issue) => {
          const unit = bloodUnitById.get(issue.unit_id);

          return {
            ...issue,
            unit_number: unit?.unit_number ?? "Unknown unit",
            blood_type: unit?.blood_type ?? request.blood_type,
            component: unit?.component ?? request.component,
          };
        }),
        transfusions: (transfusionsByRequestId.get(request.id) ?? []).map(
          (record) => ({
            ...record,
            unit_number:
              bloodUnitById.get(record.unit_id)?.unit_number ?? "Unknown unit",
          })
        ),
      },
    ];
  })
);

export const bloodDonorDetailById = new Map<string, BloodDonorDetail>(
  bloodDonors.map((donor) => [
    donor.id,
    {
      donor,
      donations: bloodDonations.filter(
        (donation) => donation.donor_id === donor.id
      ),
      units: bloodUnitListRows.filter((unit) => unit.donor_id === donor.id),
    },
  ])
);

const unitsInStock = bloodUnitListRows.filter(
  (unit) =>
    unit.status === "available" ||
    unit.status === "reserved" ||
    unit.status === "crossmatched"
);

export const bloodBankStats: BloodBankStats = {
  unitsInStock: unitsInStock.length,
  availableUnits: bloodUnitListRows.filter(
    (unit) => unit.status === "available"
  ).length,
  expiringSoon: unitsInStock.filter(
    (unit) => unit.days_to_expiry >= 0 && unit.days_to_expiry <= 7
  ).length,
  pendingRequests: bloodRequestListRows.filter(
    (request) =>
      request.status === "pending" ||
      request.status === "reserved" ||
      request.status === "crossmatched"
  ).length,
  crossmatchesPending: bloodCrossmatches.filter(
    (crossmatch) => crossmatch.result === "pending"
  ).length,
  issuedToday: bloodIssues.filter(
    (issue) => issue.issued_at.slice(0, 10) === isoDate(0)
  ).length,
};

import type {
  Diagnosis,
  EmergencyDisposition,
  EmergencyMonitoringEntry,
  EmergencyNoteSummary,
  EmergencyOrderSummary,
  EmergencyStats,
  EmergencyTriageLevel,
  EmergencyVisit,
  EmergencyVisitDetail,
  EmergencyVisitListRow,
  EmergencyVisitStatus,
  Encounter,
  VitalSigns,
} from "@/types/hospital";
import {
  PREVIEW_NOW,
  departmentIds,
  isoAt,
  physicianIds,
  physicianNameById,
  previewUuid,
  profileIds,
  profileNameById,
  staffIds,
  staffNameById,
} from "./base";
import { patientMrnById, patientNameById, patients } from "./patients";

type VitalsSeed = {
  systolic: number;
  diastolic: number;
  heart: number;
  resp: number;
  temp: number;
  spo2: number;
};

type EmergencySeed = {
  patientIndex: number;
  physicianKey: "a" | "b" | "c" | null;
  nurseKey: "nurseA" | "nurseB";
  dayOffset: number;
  hour: number;
  minute: number;
  arrivalMode: EmergencyVisit["arrival_mode"];
  triageLevel: EmergencyTriageLevel;
  status: EmergencyVisitStatus;
  chiefComplaint: string;
  treatmentArea: string | null;
  disposition: EmergencyDisposition;
  dispositionOffset: { day: number; hour: number; minute: number } | null;
  triageNote: string;
  diagnosisCode: string;
  diagnosisName: string;
  procedures: string[];
  labs: string[];
  imaging: string[];
  vitals: VitalsSeed;
  reassessment?: VitalsSeed;
};

const EMERGENCY_SEEDS: EmergencySeed[] = [
  {
    patientIndex: 0,
    physicianKey: "b",
    nurseKey: "nurseA",
    dayOffset: 0,
    hour: 7,
    minute: 5,
    arrivalMode: "ambulance",
    triageLevel: "critical",
    status: "in_treatment",
    chiefComplaint: "Chest pain with diaphoresis",
    treatmentArea: "Resuscitation 1",
    disposition: null,
    dispositionOffset: null,
    triageNote:
      "Hypotensive and cool clammy on arrival. ECG and troponin ordered; continuous cardiac monitoring started.",
    diagnosisCode: "I24.9",
    diagnosisName: "Acute coronary syndrome, suspected",
    procedures: ["12-lead ECG", "IV access", "Oxygen therapy"],
    labs: ["Troponin I", "CBC", "Creatinine"],
    imaging: ["Chest X-ray"],
    vitals: { systolic: 88, diastolic: 56, heart: 118, resp: 24, temp: 36.8, spo2: 92 },
    reassessment: { systolic: 96, diastolic: 60, heart: 110, resp: 22, temp: 36.7, spo2: 94 },
  },
  {
    patientIndex: 1,
    physicianKey: "b",
    nurseKey: "nurseB",
    dayOffset: 0,
    hour: 7,
    minute: 30,
    arrivalMode: "walk_in",
    triageLevel: "emergent",
    status: "triage",
    chiefComplaint: "Severe right lower abdominal pain",
    treatmentArea: "Triage 2",
    disposition: null,
    dispositionOffset: null,
    triageNote:
      "Pain rated 8/10 with guarding in the right lower quadrant. Awaiting surgical review.",
    diagnosisCode: "K35.80",
    diagnosisName: "Acute appendicitis, suspected",
    procedures: ["IV access", "Pain assessment"],
    labs: ["CBC", "Urinalysis"],
    imaging: ["Abdominal ultrasound"],
    vitals: { systolic: 138, diastolic: 88, heart: 102, resp: 20, temp: 37.9, spo2: 96 },
  },
  {
    patientIndex: 2,
    physicianKey: null,
    nurseKey: "nurseA",
    dayOffset: 0,
    hour: 7,
    minute: 40,
    arrivalMode: "walk_in",
    triageLevel: "urgent",
    status: "waiting",
    chiefComplaint: "Fever and productive cough",
    treatmentArea: "Waiting area",
    disposition: null,
    dispositionOffset: null,
    triageNote:
      "Febrile at 38.4 C with oxygen saturation 95% on room air. Awaiting physician assignment.",
    diagnosisCode: "J18.9",
    diagnosisName: "Community-acquired pneumonia, suspected",
    procedures: ["Triage vitals"],
    labs: ["CBC"],
    imaging: ["Chest X-ray"],
    vitals: { systolic: 128, diastolic: 82, heart: 96, resp: 22, temp: 38.4, spo2: 95 },
  },
  {
    patientIndex: 3,
    physicianKey: null,
    nurseKey: "nurseB",
    dayOffset: 0,
    hour: 7,
    minute: 50,
    arrivalMode: "walk_in",
    triageLevel: "less_urgent",
    status: "waiting",
    chiefComplaint: "Ankle injury after a fall",
    treatmentArea: "Waiting area",
    disposition: null,
    dispositionOffset: null,
    triageNote:
      "Ambulating with assistance. No open wound or neurovascular deficit. Awaiting imaging.",
    diagnosisCode: "S93.40",
    diagnosisName: "Ankle sprain, suspected",
    procedures: ["Splint application"],
    labs: [],
    imaging: ["Ankle X-ray"],
    vitals: { systolic: 122, diastolic: 78, heart: 84, resp: 18, temp: 36.6, spo2: 99 },
  },
  {
    patientIndex: 4,
    physicianKey: "a",
    nurseKey: "nurseA",
    dayOffset: 0,
    hour: 6,
    minute: 20,
    arrivalMode: "referral",
    triageLevel: "critical",
    status: "observation",
    chiefComplaint: "Shortness of breath and wheezing",
    treatmentArea: "Observation 1",
    disposition: null,
    dispositionOffset: null,
    triageNote:
      "Oxygen saturation 89% on room air, improved to 94% on 2 L nasal cannula. Continuous monitoring.",
    diagnosisCode: "J45.901",
    diagnosisName: "Acute asthma exacerbation",
    procedures: ["Nebulization", "Oxygen therapy"],
    labs: ["Arterial blood gas"],
    imaging: ["Chest X-ray"],
    vitals: { systolic: 150, diastolic: 92, heart: 110, resp: 28, temp: 37.1, spo2: 89 },
    reassessment: { systolic: 142, diastolic: 88, heart: 104, resp: 24, temp: 37.0, spo2: 94 },
  },
  {
    patientIndex: 5,
    physicianKey: "c",
    nurseKey: "nurseB",
    dayOffset: 0,
    hour: 6,
    minute: 50,
    arrivalMode: "ambulance",
    triageLevel: "emergent",
    status: "in_treatment",
    chiefComplaint: "Laceration to the right forearm",
    treatmentArea: "Treatment 3",
    disposition: null,
    dispositionOffset: null,
    triageNote:
      "Bleeding controlled with a pressure dressing. Tetanus status is being verified before repair.",
    diagnosisCode: "S51.811",
    diagnosisName: "Open laceration, right forearm",
    procedures: ["Wound irrigation", "Laceration repair"],
    labs: ["CBC"],
    imaging: [],
    vitals: { systolic: 126, diastolic: 80, heart: 88, resp: 18, temp: 36.7, spo2: 98 },
  },
  {
    patientIndex: 6,
    physicianKey: "b",
    nurseKey: "nurseA",
    dayOffset: 0,
    hour: 5,
    minute: 30,
    arrivalMode: "walk_in",
    triageLevel: "urgent",
    status: "admitted",
    chiefComplaint: "Persistent vomiting and dehydration",
    treatmentArea: "Treatment 2",
    disposition: "admit",
    dispositionOffset: { day: 0, hour: 7, minute: 20 },
    triageNote:
      "Two liters of IV fluid started. Admission requested for hydration and monitoring.",
    diagnosisCode: "A09",
    diagnosisName: "Acute gastroenteritis with dehydration",
    procedures: ["IV fluid resuscitation"],
    labs: ["CBC", "Electrolytes"],
    imaging: [],
    vitals: { systolic: 112, diastolic: 70, heart: 104, resp: 20, temp: 37.6, spo2: 96 },
  },
  {
    patientIndex: 7,
    physicianKey: "a",
    nurseKey: "nurseB",
    dayOffset: -1,
    hour: 22,
    minute: 10,
    arrivalMode: "walk_in",
    triageLevel: "non_urgent",
    status: "discharged",
    chiefComplaint: "Generalized rash",
    treatmentArea: "Treatment 4",
    disposition: "discharge",
    dispositionOffset: { day: -1, hour: 23, minute: 0 },
    triageNote:
      "Rash assessed as non-urgent. Discharged with antihistamine and return precautions.",
    diagnosisCode: "L23.9",
    diagnosisName: "Allergic contact dermatitis",
    procedures: ["Skin assessment"],
    labs: [],
    imaging: [],
    vitals: { systolic: 124, diastolic: 76, heart: 76, resp: 16, temp: 36.5, spo2: 99 },
  },
  {
    patientIndex: 8,
    physicianKey: "c",
    nurseKey: "nurseA",
    dayOffset: -1,
    hour: 20,
    minute: 0,
    arrivalMode: "referral",
    triageLevel: "less_urgent",
    status: "transferred",
    chiefComplaint: "Closed wrist injury",
    treatmentArea: "Treatment 1",
    disposition: "transfer",
    dispositionOffset: { day: -1, hour: 21, minute: 30 },
    triageNote:
      "Stabilized in a splint. Transfer accepted by the receiving orthopedic facility.",
    diagnosisCode: "S52.501",
    diagnosisName: "Distal radius fracture, suspected",
    procedures: ["Splint application"],
    labs: [],
    imaging: ["Wrist X-ray"],
    vitals: { systolic: 118, diastolic: 74, heart: 82, resp: 18, temp: 36.6, spo2: 98 },
  },
];

const PHYSICIAN_PROFILE_BY_KEY = {
  a: profileIds.physicianA,
  b: profileIds.physicianB,
  c: profileIds.physicianC,
} as const;

function arrivalAt(seed: EmergencySeed): string {
  return isoAt(seed.dayOffset, seed.hour, seed.minute);
}

function dispositionAt(seed: EmergencySeed): string | null {
  return seed.dispositionOffset
    ? isoAt(
        seed.dispositionOffset.day,
        seed.dispositionOffset.hour,
        seed.dispositionOffset.minute
      )
    : null;
}

function addMinutes(value: string, minutes: number): string {
  return new Date(Date.parse(value) + minutes * 60_000).toISOString();
}

const nurseProfileByKey = {
  nurseA: profileIds.nurseA,
  nurseB: profileIds.nurseB,
} as const;

const nurseStaffByKey = {
  nurseA: staffIds.nurseA,
  nurseB: staffIds.nurseB,
} as const;

const physicianIdByKey = {
  a: physicianIds.a,
  b: physicianIds.b,
  c: physicianIds.c,
} as const;

export const emergencyEncounters: Encounter[] = EMERGENCY_SEEDS.map(
  (seed, index) => {
    const arrived = arrivalAt(seed);
    const completed = dispositionAt(seed);
    const physicianId = seed.physicianKey
      ? physicianIdByKey[seed.physicianKey]
      : null;

    return {
      id: previewUuid(61, index + 1),
      encounter_number: `ER-ENC-2026-${String(index + 1).padStart(4, "0")}`,
      patient_id: previewUuid(10, seed.patientIndex + 1),
      appointment_id: null,
      admission_id: null,
      physician_id: physicianId,
      department_id: departmentIds.er,
      encounter_type: "Emergency",
      chief_complaint: seed.chiefComplaint,
      clinical_status:
        completed !== null
          ? "completed"
          : seed.status === "in_treatment" || seed.status === "observation"
            ? "in_progress"
            : "open",
      started_at: arrived,
      completed_at: completed,
      created_by: seed.physicianKey
        ? PHYSICIAN_PROFILE_BY_KEY[seed.physicianKey]
        : profileIds.receptionist,
      created_at: arrived,
      updated_at: completed ?? addMinutes(arrived, 30),
    };
  }
);

export const emergencyEncounterById = new Map(
  emergencyEncounters.map((encounter) => [encounter.id, encounter])
);

export const emergencyVisits: EmergencyVisit[] = EMERGENCY_SEEDS.map(
  (seed, index) => {
    const arrived = arrivalAt(seed);
    const completed = dispositionAt(seed);

    return {
      id: previewUuid(60, index + 1),
      visit_number: `ER-2026-${String(index + 1).padStart(4, "0")}`,
      encounter_id: emergencyEncounters[index].id,
      patient_id: previewUuid(10, seed.patientIndex + 1),
      arrival_at: arrived,
      arrival_mode: seed.arrivalMode,
      triage_level: seed.triageLevel,
      triage_note: seed.triageNote,
      chief_complaint: seed.chiefComplaint,
      status: seed.status,
      attending_physician_id: seed.physicianKey
        ? physicianIdByKey[seed.physicianKey]
        : null,
      triage_nurse_id: nurseStaffByKey[seed.nurseKey],
      treatment_area: seed.treatmentArea,
      disposition: seed.disposition,
      disposition_at: completed,
      created_by: profileIds.receptionist,
      created_at: arrived,
      updated_at: completed ?? addMinutes(arrived, 30),
    };
  }
);

export const emergencyVisitById = new Map(
  emergencyVisits.map((visit) => [visit.id, visit])
);

function createVitals(
  seed: EmergencySeed,
  encounter: Encounter,
  values: VitalsSeed,
  recordedAt: string,
  index: number
): VitalSigns {
  return {
    id: previewUuid(62, index),
    patient_id: encounter.patient_id,
    encounter_id: encounter.id,
    systolic_bp: values.systolic,
    diastolic_bp: values.diastolic,
    heart_rate: values.heart,
    respiratory_rate: values.resp,
    temperature: values.temp,
    oxygen_saturation: values.spo2,
    weight_kg: null,
    height_cm: null,
    recorded_by: nurseProfileByKey[seed.nurseKey],
    recorded_at: recordedAt,
    created_at: recordedAt,
  };
}

export const emergencyVitals: VitalSigns[] = [];
let vitalIndex = 0;

EMERGENCY_SEEDS.forEach((seed, index) => {
  const encounter = emergencyEncounters[index];
  const arrived = arrivalAt(seed);

  vitalIndex += 1;
  emergencyVitals.push(
    createVitals(seed, encounter, seed.vitals, addMinutes(arrived, 10), vitalIndex)
  );

  if (seed.reassessment) {
    vitalIndex += 1;
    emergencyVitals.push(
      createVitals(
        seed,
        encounter,
        seed.reassessment,
        addMinutes(arrived, 45),
        vitalIndex
      )
    );
  }
});

const latestVitalsByEncounterId = new Map<string, VitalSigns>();

for (const vital of emergencyVitals) {
  const existing = latestVitalsByEncounterId.get(vital.encounter_id);

  if (!existing || existing.recorded_at < vital.recorded_at) {
    latestVitalsByEncounterId.set(vital.encounter_id, vital);
  }
}

export const emergencyNotes: EmergencyNoteSummary[] = [];

EMERGENCY_SEEDS.forEach((seed, index) => {
  const encounter = emergencyEncounters[index];
  const authoredBy = seed.physicianKey
    ? PHYSICIAN_PROFILE_BY_KEY[seed.physicianKey]
    : nurseProfileByKey[seed.nurseKey];
  const isCompleted =
    seed.status === "admitted" ||
    seed.status === "transferred" ||
    seed.status === "discharged";
  const createdAt = addMinutes(arrivalAt(seed), 15);

  emergencyNotes.push({
    id: previewUuid(63, index * 2 + 1),
    patient_id: encounter.patient_id,
    encounter_id: encounter.id,
    note_type: "Triage",
    content: seed.triageNote,
    status: isCompleted ? "finalized" : "draft",
    authored_by: nurseProfileByKey[seed.nurseKey],
    author_name:
      profileNameById.get(nurseProfileByKey[seed.nurseKey]) ?? "Triage nurse",
    author_role: "Triage nurse",
    finalized_at: isCompleted ? createdAt : null,
    created_at: createdAt,
    updated_at: createdAt,
  });

  emergencyNotes.push({
    id: previewUuid(63, index * 2 + 2),
    patient_id: encounter.patient_id,
    encounter_id: encounter.id,
    note_type: "Emergency progress",
    content: isCompleted
      ? `Disposition recorded: ${seed.disposition ?? "completed"}.`
      : "Patient reassessed; treatment plan under review.",
    status: isCompleted ? "finalized" : "draft",
    authored_by: authoredBy,
    author_name:
      profileNameById.get(authoredBy) ??
      (seed.physicianKey ? "Emergency physician" : "Triage nurse"),
    author_role: seed.physicianKey ? "Emergency physician" : "Triage nurse",
    finalized_at: isCompleted ? createdAt : null,
    created_at: createdAt,
    updated_at: createdAt,
  });
});

export const emergencyDiagnoses: Diagnosis[] = EMERGENCY_SEEDS.flatMap(
  (seed, index) => {
    if (!seed.physicianKey) {
      return [];
    }

    const encounter = emergencyEncounters[index];

    return [
      {
        id: previewUuid(64, index + 1),
        patient_id: encounter.patient_id,
        encounter_id: encounter.id,
        diagnosis_code: seed.diagnosisCode,
        diagnosis_name: seed.diagnosisName,
        diagnosis_type: "Working",
        clinical_notes:
          "Working diagnosis documented in the emergency record; confirm after diagnostic review.",
        is_primary: true,
        recorded_by: PHYSICIAN_PROFILE_BY_KEY[seed.physicianKey],
        recorded_at: addMinutes(arrivalAt(seed), 25),
        created_at: addMinutes(arrivalAt(seed), 25),
      },
    ];
  }
);

const ordersByVisitId = new Map<string, EmergencyOrderSummary[]>();
const monitoringByVisitId = new Map<string, EmergencyMonitoringEntry[]>();

EMERGENCY_SEEDS.forEach((seed, index) => {
  const visit = emergencyVisits[index];
  const orderedAt = addMinutes(arrivalAt(seed), 20);
  const orderedByName = seed.physicianKey
    ? physicianNameById.get(physicianIdByKey[seed.physicianKey]) ??
      "Unassigned physician"
    : "Unassigned physician";
  const orderStatus =
    seed.status === "admitted" ||
    seed.status === "transferred" ||
    seed.status === "discharged"
      ? "completed"
      : seed.status === "in_treatment" || seed.status === "observation"
        ? "processing"
        : "pending";

  const orders: EmergencyOrderSummary[] = [
    ...seed.labs.map((label, itemIndex) => ({
      id: previewUuid(65, index * 10 + itemIndex + 1),
      kind: "laboratory" as const,
      label,
      status: orderStatus,
      ordered_at: orderedAt,
      ordered_by_name: orderedByName,
    })),
    ...seed.imaging.map((label, itemIndex) => ({
      id: previewUuid(65, index * 10 + 5 + itemIndex),
      kind: "radiology" as const,
      label,
      status: orderStatus,
      ordered_at: orderedAt,
      ordered_by_name: orderedByName,
    })),
  ];

  ordersByVisitId.set(visit.id, orders);

  const monitoring: EmergencyMonitoringEntry[] = [
    {
      recorded_at: addMinutes(arrivalAt(seed), 10),
      note: "Initial emergency vital signs recorded at triage.",
      recorded_by_name:
        staffNameById.get(nurseStaffByKey[seed.nurseKey]) ?? "Triage nurse",
    },
  ];

  if (seed.reassessment) {
    monitoring.push({
      recorded_at: addMinutes(arrivalAt(seed), 45),
      note: "Reassessment after initial treatment; continue monitoring.",
      recorded_by_name:
        staffNameById.get(nurseStaffByKey[seed.nurseKey]) ?? "Triage nurse",
    });
  }

  monitoringByVisitId.set(visit.id, monitoring);
});

const patientById = new Map(patients.map((patient) => [patient.id, patient]));

export const emergencyVisitDetailById = new Map<string, EmergencyVisitDetail>(
  emergencyVisits.map((visit, index) => {
    const seed = EMERGENCY_SEEDS[index];
    const encounter = emergencyEncounterById.get(visit.encounter_id);
    const patient = patientById.get(visit.patient_id);

    if (!encounter || !patient) {
      throw new Error(`Emergency fixture is missing encounter or patient for ${visit.id}`);
    }

    return [
      visit.id,
      {
        visit,
        patient,
        encounter,
        attending_physician_name: visit.attending_physician_id
          ? physicianNameById.get(visit.attending_physician_id) ?? null
          : null,
        triage_nurse_name: visit.triage_nurse_id
          ? staffNameById.get(visit.triage_nurse_id) ?? null
          : null,
        vitals: emergencyVitals.filter(
          (vital) => vital.encounter_id === encounter.id
        ),
        notes: emergencyNotes.filter(
          (note) => note.encounter_id === encounter.id
        ),
        diagnoses: emergencyDiagnoses.filter(
          (diagnosis) => diagnosis.encounter_id === encounter.id
        ),
        orders: ordersByVisitId.get(visit.id) ?? [],
        procedures: seed.procedures,
        monitoring: monitoringByVisitId.get(visit.id) ?? [],
      },
    ];
  })
);

export const emergencyVisitListRows: EmergencyVisitListRow[] = emergencyVisits
  .map((visit) => {
    const end = visit.disposition_at ?? PREVIEW_NOW;
    const waitMinutes = Math.max(
      0,
      Math.round((Date.parse(end) - Date.parse(visit.arrival_at)) / 60_000)
    );

    return {
      id: visit.id,
      visit_number: visit.visit_number,
      encounter_id: visit.encounter_id,
      patient_id: visit.patient_id,
      patient_name: patientNameById.get(visit.patient_id) ?? "Test Patient",
      patient_mrn:
        patientMrnById.get(visit.patient_id) ?? "MRN-2026-0000",
      arrival_at: visit.arrival_at,
      arrival_mode: visit.arrival_mode,
      triage_level: visit.triage_level,
      chief_complaint: visit.chief_complaint,
      status: visit.status,
      attending_physician_id: visit.attending_physician_id,
      attending_physician_name: visit.attending_physician_id
        ? physicianNameById.get(visit.attending_physician_id) ?? null
        : null,
      triage_nurse_name: visit.triage_nurse_id
        ? staffNameById.get(visit.triage_nurse_id) ?? null
        : null,
      treatment_area: visit.treatment_area,
      wait_minutes: waitMinutes,
      latest_vitals: latestVitalsByEncounterId.get(visit.encounter_id) ?? null,
      disposition: visit.disposition,
    };
  })
  .sort((a, b) => (a.arrival_at < b.arrival_at ? 1 : -1));

const ACTIVE_STATUSES = new Set<EmergencyVisitStatus>([
  "waiting",
  "triage",
  "in_treatment",
  "observation",
]);

const waitingRows = emergencyVisitListRows.filter(
  (row) => row.status === "waiting" || row.status === "triage"
);

export const emergencyStats: EmergencyStats = {
  total: emergencyVisitListRows.length,
  waiting: emergencyVisitListRows.filter((row) => row.status === "waiting")
    .length,
  triage: emergencyVisitListRows.filter((row) => row.status === "triage")
    .length,
  inTreatment: emergencyVisitListRows.filter(
    (row) => row.status === "in_treatment"
  ).length,
  observation: emergencyVisitListRows.filter(
    (row) => row.status === "observation"
  ).length,
  critical: emergencyVisitListRows.filter(
    (row) => row.triage_level === "critical" && ACTIVE_STATUSES.has(row.status)
  ).length,
  admitted: emergencyVisitListRows.filter(
    (row) => row.status === "admitted"
  ).length,
  transferred: emergencyVisitListRows.filter(
    (row) => row.status === "transferred"
  ).length,
  discharged: emergencyVisitListRows.filter(
    (row) => row.status === "discharged"
  ).length,
  averageWaitMinutes:
    waitingRows.length === 0
      ? 0
      : Math.round(
          waitingRows.reduce((total, row) => total + row.wait_minutes, 0) /
            waitingRows.length
        ),
};

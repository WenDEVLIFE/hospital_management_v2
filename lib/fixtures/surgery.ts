import type {
  AnesthesiaType,
  OperatingRoom,
  OperatingRoomBoardRow,
  SurgeryBillingSummary,
  SurgeryCase,
  SurgeryChecklistItem,
  SurgeryDetail,
  SurgeryListRow,
  SurgeryMonitoringEntry,
  SurgeryNote,
  SurgeryPriority,
  SurgeryStats,
  SurgeryStatus,
  SurgerySupplyUsage,
} from "@/types/hospital";
import {
  PREVIEW_NOW,
  departmentIds,
  isoAt,
  physicianIds,
  physicianNameById,
  previewUuid,
  profileIds,
  staffIds,
  staffNameById,
} from "./base";
import { patientMrnById, patientNameById, patients } from "./patients";

export const operatingRooms: OperatingRoom[] = [
  {
    id: previewUuid(70, 1),
    room_name: "OR 1",
    status: "in_use",
    department_id: departmentIds.ipd,
    utilization_today: 82,
    notes: "General surgery.",
  },
  {
    id: previewUuid(70, 2),
    room_name: "OR 2",
    status: "in_use",
    department_id: departmentIds.ipd,
    utilization_today: 76,
    notes: "Obstetric and orthopedic cases.",
  },
  {
    id: previewUuid(70, 3),
    room_name: "OR 3",
    status: "cleaning",
    department_id: departmentIds.ipd,
    utilization_today: 64,
    notes: "Turnover cleaning after a cancelled case.",
  },
  {
    id: previewUuid(70, 4),
    room_name: "OR 4",
    status: "available",
    department_id: departmentIds.ipd,
    utilization_today: 48,
    notes: "Available for add-on cases.",
  },
  {
    id: previewUuid(70, 5),
    room_name: "OR 5",
    status: "maintenance",
    department_id: departmentIds.ipd,
    utilization_today: 0,
    notes: "Anesthesia machine service.",
  },
];

type SurgerySeed = {
  patientIndex: number;
  procedure_code: string;
  procedure_name: string;
  roomIndex: number;
  dayOffset: number;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  status: SurgeryStatus;
  priority: SurgeryPriority;
  surgeonKey: "a" | "b" | "c";
  anesthesiologistKey: "a" | "b" | "c" | null;
  scrubKey: "nurseA" | "nurseB";
  circulatingKey: "nurseA" | "nurseB";
  anesthesiaType: AnesthesiaType;
  preOpCompleted: boolean;
  consentSigned: boolean;
  safetyChecklistCompleted: boolean;
  notes: string;
  preOpNote: string;
  intraOpNote: string | null;
  postOpNote: string | null;
  anesthesiaRecord: string | null;
  recoveryStatus: string | null;
  supplies: SurgerySupplyUsage[];
  billing: Omit<SurgeryBillingSummary, "estimated_total">;
};

const SURGERY_SEEDS: SurgerySeed[] = [
  {
    patientIndex: 0,
    procedure_code: "CHOL",
    procedure_name: "Laparoscopic cholecystectomy",
    roomIndex: 0,
    dayOffset: 0,
    startHour: 8,
    startMinute: 0,
    durationMinutes: 120,
    status: "in_progress",
    priority: "elective",
    surgeonKey: "c",
    anesthesiologistKey: "b",
    scrubKey: "nurseA",
    circulatingKey: "nurseB",
    anesthesiaType: "general",
    preOpCompleted: true,
    consentSigned: true,
    safetyChecklistCompleted: true,
    notes: "Laparoscopic approach; critical view of safety planned.",
    preOpNote:
      "Pre-operative checklist complete. Consent and surgical site marking verified.",
    intraOpNote:
      "Critical view of safety achieved; dissection of the gallbladder is in progress.",
    postOpNote: null,
    anesthesiaRecord:
      "General anesthesia with endotracheal intubation. Hemodynamically stable.",
    recoveryStatus: null,
    supplies: [
      { name: "Laparoscopic tower", quantity: "1 unit", category: "instrument" },
      { name: "Trocar set", quantity: "1 set", category: "instrument" },
      { name: "Clip applier", quantity: "1 unit", category: "instrument" },
      { name: "Suture pack", quantity: "2 packs", category: "supply" },
      { name: "Sterile drapes", quantity: "1 pack", category: "supply" },
    ],
    billing: {
      or_fee: 28000,
      professional_fee: 35000,
      supplies_total: 12500,
      invoice_status: "not_billed",
    },
  },
  {
    patientIndex: 1,
    procedure_code: "APPY",
    procedure_name: "Appendectomy",
    roomIndex: 0,
    dayOffset: 0,
    startHour: 10,
    startMinute: 30,
    durationMinutes: 90,
    status: "scheduled",
    priority: "urgent",
    surgeonKey: "c",
    anesthesiologistKey: "a",
    scrubKey: "nurseB",
    circulatingKey: "nurseA",
    anesthesiaType: "general",
    preOpCompleted: true,
    consentSigned: true,
    safetyChecklistCompleted: false,
    notes: "Acute appendicitis; scheduled after the current OR 1 case.",
    preOpNote:
      "Consent signed. Awaiting final safety checklist at surgical time-out.",
    intraOpNote: null,
    postOpNote: null,
    anesthesiaRecord: null,
    recoveryStatus: null,
    supplies: [
      { name: "Laparotomy set", quantity: "1 set", category: "instrument" },
      { name: "Suture pack", quantity: "2 packs", category: "supply" },
      { name: "Sterile drapes", quantity: "1 pack", category: "supply" },
    ],
    billing: {
      or_fee: 22000,
      professional_fee: 28000,
      supplies_total: 8000,
      invoice_status: "not_billed",
    },
  },
  {
    patientIndex: 2,
    procedure_code: "CS",
    procedure_name: "Cesarean section",
    roomIndex: 1,
    dayOffset: 0,
    startHour: 7,
    startMinute: 30,
    durationMinutes: 90,
    status: "in_progress",
    priority: "emergency",
    surgeonKey: "a",
    anesthesiologistKey: "b",
    scrubKey: "nurseA",
    circulatingKey: "nurseB",
    anesthesiaType: "regional",
    preOpCompleted: true,
    consentSigned: true,
    safetyChecklistCompleted: true,
    notes: "Category 2 cesarean; neonatal team on standby.",
    preOpNote:
      "Consent signed by the patient. Neonatal resuscitation team notified.",
    intraOpNote: "Lower segment approach; delivery is imminent.",
    postOpNote: null,
    anesthesiaRecord: "Spinal anesthesia. Maternal vital signs stable.",
    recoveryStatus: null,
    supplies: [
      { name: "Cesarean set", quantity: "1 set", category: "instrument" },
      { name: "Suture pack", quantity: "2 packs", category: "supply" },
      { name: "Sterile drapes", quantity: "1 pack", category: "supply" },
    ],
    billing: {
      or_fee: 30000,
      professional_fee: 40000,
      supplies_total: 15000,
      invoice_status: "not_billed",
    },
  },
  {
    patientIndex: 3,
    procedure_code: "ORIF",
    procedure_name: "ORIF distal radius",
    roomIndex: 1,
    dayOffset: 0,
    startHour: 11,
    startMinute: 0,
    durationMinutes: 120,
    status: "scheduled",
    priority: "elective",
    surgeonKey: "c",
    anesthesiologistKey: "a",
    scrubKey: "nurseB",
    circulatingKey: "nurseA",
    anesthesiaType: "general",
    preOpCompleted: false,
    consentSigned: true,
    safetyChecklistCompleted: false,
    notes: "Distal radius fracture; implant set reserved.",
    preOpNote: "Imaging reviewed. Pre-operative laboratories are pending.",
    intraOpNote: null,
    postOpNote: null,
    anesthesiaRecord: null,
    recoveryStatus: null,
    supplies: [
      {
        name: "Orthopedic instrument set",
        quantity: "1 set",
        category: "instrument",
      },
      {
        name: "Bone plate and screws",
        quantity: "1 set",
        category: "supply",
      },
      { name: "Suture pack", quantity: "1 pack", category: "supply" },
    ],
    billing: {
      or_fee: 26000,
      professional_fee: 32000,
      supplies_total: 18000,
      invoice_status: "not_billed",
    },
  },
  {
    patientIndex: 4,
    procedure_code: "HERNIA",
    procedure_name: "Laparoscopic hernia repair",
    roomIndex: 2,
    dayOffset: 0,
    startHour: 13,
    startMinute: 30,
    durationMinutes: 90,
    status: "pre_op",
    priority: "elective",
    surgeonKey: "c",
    anesthesiologistKey: "b",
    scrubKey: "nurseA",
    circulatingKey: "nurseB",
    anesthesiaType: "general",
    preOpCompleted: false,
    consentSigned: false,
    safetyChecklistCompleted: false,
    notes: "Elective repair; pre-operative assessment in progress.",
    preOpNote: "Awaiting consent and anesthesia review.",
    intraOpNote: null,
    postOpNote: null,
    anesthesiaRecord: null,
    recoveryStatus: null,
    supplies: [
      { name: "Laparoscopic tower", quantity: "1 unit", category: "instrument" },
      { name: "Mesh", quantity: "1 unit", category: "supply" },
      { name: "Trocar set", quantity: "1 set", category: "instrument" },
    ],
    billing: {
      or_fee: 24000,
      professional_fee: 30000,
      supplies_total: 14000,
      invoice_status: "not_billed",
    },
  },
  {
    patientIndex: 5,
    procedure_code: "DEBRIDE",
    procedure_name: "Urgent wound debridement",
    roomIndex: 3,
    dayOffset: 0,
    startHour: 15,
    startMinute: 30,
    durationMinutes: 60,
    status: "requested",
    priority: "urgent",
    surgeonKey: "c",
    anesthesiologistKey: null,
    scrubKey: "nurseB",
    circulatingKey: "nurseA",
    anesthesiaType: "local",
    preOpCompleted: false,
    consentSigned: false,
    safetyChecklistCompleted: false,
    notes: "Urgent wound debridement; request received from the ward.",
    preOpNote:
      "Request received. Awaiting consent and operating room slot confirmation.",
    intraOpNote: null,
    postOpNote: null,
    anesthesiaRecord: null,
    recoveryStatus: null,
    supplies: [
      { name: "Debridement set", quantity: "1 set", category: "instrument" },
      { name: "Sterile dressings", quantity: "1 pack", category: "supply" },
    ],
    billing: {
      or_fee: 12000,
      professional_fee: 15000,
      supplies_total: 4000,
      invoice_status: "not_billed",
    },
  },
  {
    patientIndex: 6,
    procedure_code: "THYROID",
    procedure_name: "Total thyroidectomy",
    roomIndex: 3,
    dayOffset: -1,
    startHour: 9,
    startMinute: 0,
    durationMinutes: 150,
    status: "recovery",
    priority: "elective",
    surgeonKey: "c",
    anesthesiologistKey: "b",
    scrubKey: "nurseA",
    circulatingKey: "nurseB",
    anesthesiaType: "general",
    preOpCompleted: true,
    consentSigned: true,
    safetyChecklistCompleted: true,
    notes: "Total thyroidectomy completed; patient in PACU.",
    preOpNote:
      "Consent, imaging, and anesthesia review complete. Airway assessment documented.",
    intraOpNote:
      "Total thyroidectomy completed. Recurrent laryngeal nerves identified and preserved.",
    postOpNote:
      "Patient extubated and transferred to the post-anesthesia care unit. Vital signs stable.",
    anesthesiaRecord: "General anesthesia. Uneventful emergence.",
    recoveryStatus: "PACU Phase 1",
    supplies: [
      { name: "Thyroid instrument set", quantity: "1 set", category: "instrument" },
      { name: "Suture pack", quantity: "2 packs", category: "supply" },
      { name: "Sterile drapes", quantity: "1 pack", category: "supply" },
    ],
    billing: {
      or_fee: 32000,
      professional_fee: 45000,
      supplies_total: 10000,
      invoice_status: "draft",
    },
  },
  {
    patientIndex: 7,
    procedure_code: "CATARACT",
    procedure_name: "Cataract extraction with IOL",
    roomIndex: 4,
    dayOffset: -1,
    startHour: 13,
    startMinute: 0,
    durationMinutes: 60,
    status: "completed",
    priority: "elective",
    surgeonKey: "a",
    anesthesiologistKey: "b",
    scrubKey: "nurseB",
    circulatingKey: "nurseA",
    anesthesiaType: "sedation",
    preOpCompleted: true,
    consentSigned: true,
    safetyChecklistCompleted: true,
    notes: "Phacoemulsification with intraocular lens implantation.",
    preOpNote: "Consent and biometry confirmed.",
    intraOpNote:
      "Phacoemulsification and intraocular lens placement completed without complication.",
    postOpNote:
      "Discharged with eye drop instructions and follow-up appointment.",
    anesthesiaRecord: "Monitored anesthesia care with topical anesthesia.",
    recoveryStatus: "Discharged",
    supplies: [
      {
        name: "Phacoemulsification set",
        quantity: "1 set",
        category: "instrument",
      },
      { name: "Intraocular lens", quantity: "1 unit", category: "supply" },
    ],
    billing: {
      or_fee: 18000,
      professional_fee: 25000,
      supplies_total: 16000,
      invoice_status: "billed",
    },
  },
  {
    patientIndex: 8,
    procedure_code: "EXLAP",
    procedure_name: "Exploratory laparotomy",
    roomIndex: 2,
    dayOffset: -1,
    startHour: 16,
    startMinute: 0,
    durationMinutes: 120,
    status: "cancelled",
    priority: "emergency",
    surgeonKey: "c",
    anesthesiologistKey: "a",
    scrubKey: "nurseA",
    circulatingKey: "nurseB",
    anesthesiaType: "general",
    preOpCompleted: false,
    consentSigned: false,
    safetyChecklistCompleted: false,
    notes: "Cancelled after conservative management.",
    preOpNote: "Case cancelled before the pre-operative checklist was completed.",
    intraOpNote: null,
    postOpNote: null,
    anesthesiaRecord: null,
    recoveryStatus: null,
    supplies: [
      { name: "Laparotomy set", quantity: "1 set", category: "instrument" },
    ],
    billing: {
      or_fee: 0,
      professional_fee: 0,
      supplies_total: 0,
      invoice_status: "not_billed",
    },
  },
];

const PHYSICIAN_PROFILE_BY_KEY = {
  a: profileIds.physicianA,
  b: profileIds.physicianB,
  c: profileIds.physicianC,
} as const;

const physicianIdByKey = {
  a: physicianIds.a,
  b: physicianIds.b,
  c: physicianIds.c,
} as const;

const nurseStaffByKey = {
  nurseA: staffIds.nurseA,
  nurseB: staffIds.nurseB,
} as const;

function addMinutes(value: string, minutes: number): string {
  return new Date(Date.parse(value) + minutes * 60_000).toISOString();
}

function buildSurgeryCase(seed: SurgerySeed, index: number): SurgeryCase {
  const scheduledStart = isoAt(seed.dayOffset, seed.startHour, seed.startMinute);
  const scheduledEnd = addMinutes(scheduledStart, seed.durationMinutes);
  const isStarted =
    seed.status === "in_progress" ||
    seed.status === "recovery" ||
    seed.status === "completed";
  const isFinished =
    seed.status === "recovery" || seed.status === "completed";

  return {
    id: previewUuid(71, index + 1),
    case_number: `SURG-2026-${String(index + 1).padStart(4, "0")}`,
    patient_id: previewUuid(10, seed.patientIndex + 1),
    procedure_code: seed.procedure_code,
    procedure_name: seed.procedure_name,
    room_id: operatingRooms[seed.roomIndex].id,
    scheduled_start: scheduledStart,
    scheduled_end: scheduledEnd,
    actual_start: isStarted ? addMinutes(scheduledStart, 10) : null,
    actual_end: isFinished ? addMinutes(scheduledStart, seed.durationMinutes + 15) : null,
    status: seed.status,
    priority: seed.priority,
    surgeon_id: physicianIdByKey[seed.surgeonKey],
    anesthesiologist_id: seed.anesthesiologistKey
      ? physicianIdByKey[seed.anesthesiologistKey]
      : null,
    scrub_nurse_id: nurseStaffByKey[seed.scrubKey],
    circulating_nurse_id: nurseStaffByKey[seed.circulatingKey],
    anesthesia_type: seed.anesthesiaType,
    pre_op_completed: seed.preOpCompleted,
    consent_signed: seed.consentSigned,
    safety_checklist_completed: seed.safetyChecklistCompleted,
    notes: seed.notes,
    created_by: PHYSICIAN_PROFILE_BY_KEY[seed.surgeonKey],
    created_at: isoAt(seed.dayOffset - 1, 14),
    updated_at: isStarted
      ? addMinutes(scheduledStart, 10)
      : isoAt(seed.dayOffset - 1, 14),
  };
}

export const surgeryCases: SurgeryCase[] = SURGERY_SEEDS.map(
  buildSurgeryCase
);

export const surgeryCaseById = new Map(
  surgeryCases.map((surgery) => [surgery.id, surgery])
);

const patientById = new Map(patients.map((patient) => [patient.id, patient]));

export const surgeryListRows: SurgeryListRow[] = surgeryCases.map(
  (surgery, index) => {
    const seed = SURGERY_SEEDS[index];
    const room = operatingRooms[seed.roomIndex];
    const patientName =
      patientNameById.get(surgery.patient_id) ?? "Test Patient";
    const patientMrn =
      patientMrnById.get(surgery.patient_id) ?? "MRN-2026-0000";
    const surgeonName =
      physicianNameById.get(surgery.surgeon_id) ?? "Surgeon unassigned";
    const anesthesiologistName = surgery.anesthesiologist_id
      ? physicianNameById.get(surgery.anesthesiologist_id) ?? null
      : null;
    const scrubName =
      staffNameById.get(surgery.scrub_nurse_id ?? "") ?? "Scrub nurse unassigned";
    const circulatingName =
      staffNameById.get(surgery.circulating_nurse_id ?? "") ??
      "Circulating nurse unassigned";

    return {
      id: surgery.id,
      case_number: surgery.case_number,
      patient_id: surgery.patient_id,
      patient_name: patientName,
      patient_mrn: patientMrn,
      procedure_name: surgery.procedure_name,
      procedure_code: surgery.procedure_code,
      room_id: surgery.room_id,
      room_name: room.room_name,
      scheduled_start: surgery.scheduled_start,
      scheduled_end: surgery.scheduled_end,
      status: surgery.status,
      priority: surgery.priority,
      surgeon_id: surgery.surgeon_id,
      surgeon_name: surgeonName,
      anesthesiologist_name: anesthesiologistName,
      team_summary: `${scrubName} · ${circulatingName}`,
      pre_op_ready:
        surgery.pre_op_completed &&
        surgery.consent_signed &&
        surgery.safety_checklist_completed,
      recovery_status: seed.recoveryStatus,
    };
  }
);

const surgeryRowById = new Map(surgeryListRows.map((row) => [row.id, row]));

function buildChecklist(surgery: SurgeryCase): SurgeryChecklistItem[] {
  return [
    {
      key: "consent",
      label: "Surgical consent signed",
      completed: surgery.consent_signed,
      note: surgery.consent_signed
        ? "Consent on file."
        : "Awaiting patient or guardian signature.",
    },
    {
      key: "npo",
      label: "NPO status confirmed",
      completed: surgery.pre_op_completed,
      note: surgery.pre_op_completed ? null : "NPO status not confirmed.",
    },
    {
      key: "labs",
      label: "Pre-operative laboratories reviewed",
      completed: surgery.pre_op_completed,
      note: surgery.pre_op_completed
        ? null
        : "Pre-operative laboratories pending.",
    },
    {
      key: "imaging",
      label: "Imaging reviewed",
      completed: surgery.pre_op_completed,
      note: surgery.pre_op_completed ? null : "Imaging review pending.",
    },
    {
      key: "anesthesia",
      label: "Anesthesia consult completed",
      completed: Boolean(surgery.anesthesiologist_id) && surgery.pre_op_completed,
      note: surgery.anesthesiologist_id
        ? null
        : "Anesthesiologist not assigned.",
    },
    {
      key: "site",
      label: "Surgical site marked",
      completed: surgery.safety_checklist_completed,
      note: surgery.safety_checklist_completed
        ? null
        : "Site marking not documented.",
    },
    {
      key: "allergies",
      label: "Allergies and medication review",
      completed: surgery.pre_op_completed,
      note: surgery.pre_op_completed
        ? null
        : "Medication and allergy review pending.",
    },
  ];
}

const notesByCaseId = new Map<string, SurgeryNote[]>();
const monitoringByCaseId = new Map<string, SurgeryMonitoringEntry[]>();

SURGERY_SEEDS.forEach((seed, index) => {
  const surgery = surgeryCases[index];
  const surgeonName =
    physicianNameById.get(surgery.surgeon_id) ?? "Surgeon";
  const scrubName =
    staffNameById.get(surgery.scrub_nurse_id ?? "") ?? "Scrub nurse";
  const scheduledStart = surgery.scheduled_start;
  const scheduledEnd = surgery.scheduled_end;
  const actualEnd = surgery.actual_end ?? scheduledEnd;
  const notes: SurgeryNote[] = [
    {
      id: previewUuid(72, index * 3 + 1),
      note_type: "Pre-operative",
      content: seed.preOpNote,
      author_name: surgery.pre_op_completed ? surgeonName : scrubName,
      recorded_at: addMinutes(scheduledStart, -60),
    },
  ];

  if (seed.intraOpNote) {
    notes.push({
      id: previewUuid(72, index * 3 + 2),
      note_type: "Intra-operative",
      content: seed.intraOpNote,
      author_name: surgeonName,
      recorded_at: surgery.actual_start ?? scheduledStart,
    });
  }

  if (seed.postOpNote) {
    notes.push({
      id: previewUuid(72, index * 3 + 3),
      note_type: "Post-operative",
      content: seed.postOpNote,
      author_name: surgeonName,
      recorded_at: actualEnd,
    });
  }

  notesByCaseId.set(surgery.id, notes);

  const monitoring: SurgeryMonitoringEntry[] = [];

  if (seed.recoveryStatus) {
    const nurseName =
      staffNameById.get(surgery.circulating_nurse_id ?? "") ?? "Recovery nurse";

    monitoring.push(
      {
        recorded_at: addMinutes(actualEnd, 15),
        note: "Admitted to the post-anesthesia care unit; vital signs stable.",
        recorded_by_name: nurseName,
      },
      {
        recorded_at: addMinutes(actualEnd, 30),
        note: "Pain and nausea assessment completed; comfort measures provided.",
        recorded_by_name: nurseName,
      },
      {
        recorded_at: addMinutes(actualEnd, 60),
        note:
          seed.recoveryStatus === "Discharged"
            ? "Discharged with postoperative instructions and follow-up."
            : "Continue PACU monitoring and reassessment.",
        recorded_by_name: nurseName,
      }
    );
  }

  monitoringByCaseId.set(surgery.id, monitoring);
});

export const surgeryDetailById = new Map<string, SurgeryDetail>(
  surgeryCases.map((surgery, index) => {
    const seed = SURGERY_SEEDS[index];
    const patient = patientById.get(surgery.patient_id);
    const room = operatingRooms[seed.roomIndex];

    if (!patient) {
      throw new Error(`Surgery fixture is missing patient ${surgery.patient_id}`);
    }

    const estimatedTotal =
      seed.billing.or_fee +
      seed.billing.professional_fee +
      seed.billing.supplies_total;

    return [
      surgery.id,
      {
        surgery,
        patient,
        room,
        checklist: buildChecklist(surgery),
        notes: notesByCaseId.get(surgery.id) ?? [],
        supplies: seed.supplies,
        anesthesia_record: seed.anesthesiaRecord,
        intra_op_notes: seed.intraOpNote,
        post_op_monitoring: monitoringByCaseId.get(surgery.id) ?? [],
        billing: {
          ...seed.billing,
          estimated_total: estimatedTotal,
        },
      },
    ];
  })
);

export const operatingRoomBoardRows: OperatingRoomBoardRow[] =
  operatingRooms.map((room) => {
    const currentCase =
      surgeryListRows.find(
        (row) => row.room_id === room.id && row.status === "in_progress"
      ) ?? null;
    const nextCase =
      surgeryListRows
        .filter(
          (row) =>
            row.room_id === room.id &&
            (row.status === "scheduled" || row.status === "pre_op")
        )
        .sort((a, b) =>
          a.scheduled_start === b.scheduled_start
            ? 0
            : a.scheduled_start < b.scheduled_start
              ? -1
              : 1
        )[0] ?? null;

    return {
      ...room,
      current_case: currentCase ? surgeryRowById.get(currentCase.id) ?? null : null,
      next_case: nextCase ? surgeryRowById.get(nextCase.id) ?? null : null,
    };
  });

export const surgeryStats: SurgeryStats = {
  total: surgeryListRows.length,
  requested: surgeryListRows.filter((row) => row.status === "requested").length,
  scheduled: surgeryListRows.filter((row) => row.status === "scheduled").length,
  preOp: surgeryListRows.filter((row) => row.status === "pre_op").length,
  inProgress: surgeryListRows.filter((row) => row.status === "in_progress")
    .length,
  recovery: surgeryListRows.filter((row) => row.status === "recovery").length,
  completed: surgeryListRows.filter((row) => row.status === "completed").length,
  cancelled: surgeryListRows.filter((row) => row.status === "cancelled").length,
  today: surgeryListRows.filter(
    (row) => row.scheduled_start.slice(0, 10) === PREVIEW_NOW.slice(0, 10)
  ).length,
  orUtilization: Math.round(
    operatingRooms.reduce((total, room) => total + room.utilization_today, 0) /
      operatingRooms.length
  ),
};

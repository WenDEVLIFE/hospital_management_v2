import type {
  Admission,
  AdmissionBedAssignment,
  AdmissionListRow,
  BedBoardRow,
  PatientTransfer,
} from "@/types/hospital";
import {
  availableBeds,
  bedById,
  beds,
  departmentIds,
  departmentNameById,
  isoAt,
  occupiedBeds,
  physicianIds,
  physicianNameById,
  previewUuid,
  profileIds,
  roomById,
} from "./base";
import { patientMrnById, patientNameById } from "./patients";

type AdmissionSeed = {
  patientIndex: number;
  physicianKey: "a" | "b" | "c";
  department_id: string;
  admissionOffset: number;
  dischargeOffset: number | null;
  admission_type: string;
  status: Admission["status"];
  admission_notes: string;
};

const ADMISSION_SEEDS: AdmissionSeed[] = [
  { patientIndex: 0, physicianKey: "c", department_id: departmentIds.ipd, admissionOffset: -1, dischargeOffset: null, admission_type: "Inpatient", status: "admitted", admission_notes: "For continued observation." },
  { patientIndex: 1, physicianKey: "c", department_id: departmentIds.ipd, admissionOffset: 0, dischargeOffset: null, admission_type: "Inpatient", status: "admitted", admission_notes: "For intravenous therapy." },
  { patientIndex: 2, physicianKey: "a", department_id: departmentIds.ipd, admissionOffset: -4, dischargeOffset: null, admission_type: "Inpatient", status: "admitted", admission_notes: "For diagnostic workup." },
  { patientIndex: 3, physicianKey: "b", department_id: departmentIds.er, admissionOffset: -9, dischargeOffset: null, admission_type: "Emergency", status: "admitted", admission_notes: "Observation after emergency visit." },
  { patientIndex: 4, physicianKey: "a", department_id: departmentIds.ipd, admissionOffset: -12, dischargeOffset: null, admission_type: "Inpatient", status: "admitted", admission_notes: "For medication adjustment." },
  { patientIndex: 5, physicianKey: "c", department_id: departmentIds.ipd, admissionOffset: -18, dischargeOffset: null, admission_type: "Inpatient", status: "admitted", admission_notes: "Post-operative monitoring." },
  { patientIndex: 6, physicianKey: "c", department_id: departmentIds.ipd, admissionOffset: -22, dischargeOffset: null, admission_type: "Inpatient", status: "transferred", admission_notes: "Transferred to a different ward bed." },
  { patientIndex: 7, physicianKey: "b", department_id: departmentIds.er, admissionOffset: -27, dischargeOffset: null, admission_type: "Emergency", status: "transferred", admission_notes: "Transferred after stabilization." },
  { patientIndex: 8, physicianKey: "a", department_id: departmentIds.ipd, admissionOffset: -35, dischargeOffset: -30, admission_type: "Inpatient", status: "discharged", admission_notes: "Completed treatment course." },
  { patientIndex: 9, physicianKey: "c", department_id: departmentIds.ipd, admissionOffset: -48, dischargeOffset: -44, admission_type: "Inpatient", status: "discharged", admission_notes: "Discharged with follow-up instructions." },
  { patientIndex: 10, physicianKey: "a", department_id: departmentIds.opd, admissionOffset: -62, dischargeOffset: -58, admission_type: "Observation", status: "discharged", admission_notes: "Short observation stay." },
  { patientIndex: 11, physicianKey: "b", department_id: departmentIds.er, admissionOffset: -6, dischargeOffset: null, admission_type: "Emergency", status: "cancelled", admission_notes: "Admission request cancelled." },
];

export const admissions: Admission[] = ADMISSION_SEEDS.map((seed, index) => ({
  id: previewUuid(16, index + 1),
  admission_number: `ADM-2026-${String(index + 1).padStart(4, "0")}`,
  patient_id: previewUuid(10, seed.patientIndex + 1),
  attending_physician_id: physicianIds[seed.physicianKey],
  department_id: seed.department_id,
  admission_date: isoAt(seed.admissionOffset, 10),
  discharge_date:
    seed.dischargeOffset === null ? null : isoAt(seed.dischargeOffset, 14),
  admission_type: seed.admission_type,
  status: seed.status,
  admission_notes: seed.admission_notes,
  discharge_notes:
    seed.status === "discharged"
      ? "Synthetic preview discharge instructions."
      : null,
  admitted_by: profileIds.receptionist,
  discharged_by: seed.status === "discharged" ? profileIds.physicianA : null,
  created_at: isoAt(seed.admissionOffset, 10),
  updated_at: isoAt(seed.dischargeOffset ?? seed.admissionOffset, 14),
}));

export const admissionById = new Map(
  admissions.map((admission) => [admission.id, admission])
);

export const admissionBedAssignments: AdmissionBedAssignment[] = admissions
  .filter((admission) => admission.status !== "cancelled")
  .map((admission, index) => {
    const bed =
      admission.status === "discharged"
        ? availableBeds[index % availableBeds.length]
        : occupiedBeds[index % occupiedBeds.length];

    return {
      id: previewUuid(17, index + 1),
      admission_id: admission.id,
      bed_id: bed.id,
      assigned_at: isoAt(0, 11),
      released_at: admission.discharge_date,
      assigned_by: profileIds.nurseA,
      created_at: isoAt(0, 11),
    };
  })
  .map((assignment) => {
    const admission = admissionById.get(assignment.admission_id);
    const admissionDate = admission?.admission_date;

    return admissionDate
      ? {
          ...assignment,
          assigned_at: isoAt(
            Math.round(
              (Date.parse(admissionDate) - Date.parse(isoAt(0, 10))) / 86_400_000
            ),
            11
          ),
          created_at: isoAt(
            Math.round(
              (Date.parse(admissionDate) - Date.parse(isoAt(0, 10))) / 86_400_000
            ),
            11
          ),
        }
      : assignment;
  });

const assignmentByAdmissionId = new Map(
  admissionBedAssignments.map((assignment) => [
    assignment.admission_id,
    assignment,
  ])
);

const activeAssignmentByBedId = new Map(
  admissionBedAssignments
    .filter((assignment) => assignment.released_at === null)
    .map((assignment) => [assignment.bed_id, assignment])
);

function bedLabel(bedId: string | undefined): {
  room_number: string | null;
  bed_number: string | null;
} {
  if (!bedId) {
    return { room_number: null, bed_number: null };
  }

  const bed = bedById.get(bedId);

  if (!bed) {
    return { room_number: null, bed_number: null };
  }

  const room = roomById.get(bed.room_id);

  return {
    room_number: room?.room_number ?? null,
    bed_number: bed.bed_number,
  };
}

export const admissionListRows: AdmissionListRow[] = admissions
  .map((admission) => {
    const assignment = assignmentByAdmissionId.get(admission.id);
    const label = bedLabel(assignment?.bed_id);

    return {
      id: admission.id,
      admission_number: admission.admission_number,
      patient_id: admission.patient_id,
      patient_name: patientNameById.get(admission.patient_id) ?? "Test Patient",
      patient_mrn: patientMrnById.get(admission.patient_id) ?? "MRN-2026-0000",
      department_id: admission.department_id,
      department_name:
        departmentNameById.get(admission.department_id) ?? "Unassigned",
      attending_physician_id: admission.attending_physician_id,
      attending_physician_name: admission.attending_physician_id
        ? physicianNameById.get(admission.attending_physician_id) ?? null
        : null,
      admission_date: admission.admission_date,
      discharge_date: admission.discharge_date,
      admission_type: admission.admission_type,
      status: admission.status,
      room_number: label.room_number,
      bed_number: label.bed_number,
    };
  })
  .sort((a, b) =>
    a.admission_date === b.admission_date
      ? 0
      : a.admission_date < b.admission_date
        ? 1
        : -1
  );

export const patientTransfers: PatientTransfer[] = admissions
  .filter((admission) => admission.status === "transferred")
  .map((admission, index) => {
    const activeAssignment = activeAssignmentByBedId.get(
      admissionBedAssignments.find(
        (assignment) => assignment.admission_id === admission.id
      )?.bed_id ?? ""
    );
    const fromBed = availableBeds[availableBeds.length - 1 - index];

    return {
      id: previewUuid(18, index + 1),
      admission_id: admission.id,
      from_bed_id: fromBed.id,
      to_bed_id: activeAssignment?.bed_id ?? occupiedBeds[index].id,
      transfer_reason: "Synthetic preview bed transfer.",
      transferred_by: profileIds.nurseA,
      transferred_at: isoAt(-20 + index, 12),
      created_at: isoAt(-20 + index, 12),
    };
  });

export const bedBoardRows: BedBoardRow[] = beds.map((bed) => {
  const assignment = activeAssignmentByBedId.get(bed.id);
  const admission = assignment
    ? admissionById.get(assignment.admission_id)
    : undefined;
  const room = roomById.get(bed.room_id);

  return {
    bed_id: bed.id,
    bed_number: bed.bed_number,
    status: bed.status,
    room_id: bed.room_id,
    room_number: room?.room_number ?? "Unassigned",
    room_type: room?.room_type ?? null,
    floor_number: room?.floor_number ?? null,
    department_id: room?.department_id ?? departmentIds.ipd,
    department_name: room
      ? departmentNameById.get(room.department_id) ?? "Unassigned"
      : "Unassigned",
    patient_id: admission?.patient_id ?? null,
    patient_name: admission
      ? patientNameById.get(admission.patient_id) ?? "Test Patient"
      : null,
    admission_id: admission?.id ?? null,
  };
});

export const admissionTrend = [
  { month: "2026-06", admissions: 24, discharges: 20 },
  { month: "2026-07", admissions: 31, discharges: 27 },
  { month: "2026-08", admissions: 28, discharges: 25 },
  { month: "2026-09", admissions: 35, discharges: 31 },
  { month: "2026-10", admissions: 40, discharges: 36 },
  { month: "2026-11", admissions: 12, discharges: 8 },
];

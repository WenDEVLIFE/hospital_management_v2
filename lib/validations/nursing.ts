import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MEASUREMENT_KEYS = [
  "systolicBp",
  "diastolicBp",
  "heartRate",
  "respiratoryRate",
  "temperature",
  "oxygenSaturation",
  "weightKg",
  "heightCm",
] as const;

const measurement = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      (Number.isFinite(Number(value)) && Number(value) > 0),
    "Enter a measurement greater than zero."
  )
  .optional();

export const vitalSignsSchema = z
  .object({
    patientId: z.string().trim().regex(UUID_PATTERN, "Select a valid patient."),
    encounterId: z
      .string()
      .trim()
      .regex(UUID_PATTERN, "Select a valid encounter."),
    systolicBp: measurement,
    diastolicBp: measurement,
    heartRate: measurement,
    respiratoryRate: measurement,
    temperature: measurement,
    oxygenSaturation: measurement,
    weightKg: measurement,
    heightCm: measurement,
  })
  .superRefine((value, ctx) => {
    const recorded = MEASUREMENT_KEYS.some((key) => {
      const entry = value[key];

      return entry !== undefined && entry !== "";
    });

    if (!recorded) {
      ctx.addIssue({
        code: "custom",
        path: ["systolicBp"],
        message: "Record at least one measurement.",
      });
    }
  });

export type VitalSignsInput = z.infer<typeof vitalSignsSchema>;

export const nursingNoteSchema = z.object({
  patientId: z.string().trim().regex(UUID_PATTERN, "Select a valid patient."),
  encounterId: z.string().trim().regex(UUID_PATTERN, "Select a valid encounter."),
  note: z
    .string()
    .trim()
    .min(1, "Write the nursing note.")
    .max(2000, "Keep the note under 2,000 characters."),
});

export type NursingNoteInput = z.infer<typeof nursingNoteSchema>;

export const nurseAssignmentSchema = z.object({
  patientId: z.string().trim().regex(UUID_PATTERN, "Select a valid patient."),
  staffId: z.string().trim().regex(UUID_PATTERN, "Select a nurse."),
});

export type NurseAssignmentInput = z.infer<typeof nurseAssignmentSchema>;

export const nurseUnassignSchema = z.object({
  patientId: z.string().trim().regex(UUID_PATTERN, "Select a valid patient."),
});

export type NurseUnassignInput = z.infer<typeof nurseUnassignSchema>;

export const nursingAssessmentSchema = z.object({
  patientId: z.string().trim().regex(UUID_PATTERN, "Select a valid patient."),
  encounterId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select a valid encounter."),
  assessmentType: z
    .string()
    .trim()
    .min(1, "Select an assessment type.")
    .max(80, "Keep the assessment type under 80 characters."),
  notes: z
    .string()
    .trim()
    .max(2000, "Keep the notes under 2,000 characters.")
    .optional(),
});

export type NursingAssessmentInput = z.infer<typeof nursingAssessmentSchema>;

import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const TRIAGE_LEVELS = [
  "critical",
  "emergent",
  "urgent",
  "less_urgent",
  "non_urgent",
] as const;

export const ARRIVAL_MODES = ["walk_in", "ambulance", "referral"] as const;

export const startEmergencyVisitSchema = z.object({
  patientId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select a patient."),
  chiefComplaint: z
    .string()
    .trim()
    .min(1, "Record the chief complaint.")
    .max(300, "Keep the chief complaint under 300 characters."),
  triageLevel: z
    .string()
    .trim()
    .refine(
      (value) => (TRIAGE_LEVELS as readonly string[]).includes(value),
      "Select a triage level."
    ),
  arrivalMode: z
    .string()
    .trim()
    .refine(
      (value) => (ARRIVAL_MODES as readonly string[]).includes(value),
      "Select an arrival mode."
    ),
  triageNote: z
    .string()
    .trim()
    .max(500, "Keep the triage note under 500 characters.")
    .optional(),
});

export type StartEmergencyVisitInput = z.infer<
  typeof startEmergencyVisitSchema
>;

import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const admitMortuarySchema = z.object({
  patientId: z.string().trim().regex(UUID_PATTERN, "Select a patient."),
  bodyTagNumber: z
    .string()
    .trim()
    .min(2, "Enter the body tag number.")
    .max(40, "Keep the tag number short."),
  placeOfDeath: z.string().trim().max(120, "Keep the place short."),
  identificationStatus: z
    .string()
    .trim()
    .refine(
      (value) => ["pending", "verified", "discrepancy"].includes(value),
      "Select an identification status."
    ),
  nextOfKinName: z.string().trim().max(160, "Keep the name short."),
  nextOfKinRelationship: z.string().trim().max(60, "Keep the relationship short."),
  nextOfKinContact: z.string().trim().max(30, "Keep the contact short."),
  notes: z.string().trim().max(500, "Keep notes under 500 characters."),
});

export type AdmitMortuaryInput = z.infer<typeof admitMortuarySchema>;

export const releaseMortuarySchema = z.object({
  recordId: z.string().trim().regex(UUID_PATTERN, "Select a case."),
  releasedTo: z
    .string()
    .trim()
    .min(2, "Record who received the body.")
    .max(160, "Keep the name short."),
  relationship: z.string().trim().max(60, "Keep the relationship short."),
  documentReference: z
    .string()
    .trim()
    .min(2, "Enter the release document reference.")
    .max(60, "Keep the reference short."),
  notes: z.string().trim().max(500, "Keep notes under 500 characters."),
});

export type ReleaseMortuaryInput = z.infer<typeof releaseMortuarySchema>;

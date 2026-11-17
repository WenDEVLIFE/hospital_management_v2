import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const COMPONENTS = [
  "whole_blood",
  "packed_rbc",
  "plasma",
  "platelets",
  "cryoprecipitate",
] as const;

export const bloodTypeSchema = z
  .string()
  .trim()
  .refine(
    (value) => (BLOOD_TYPES as readonly string[]).includes(value),
    "Select a blood type."
  );

export const componentSchema = z
  .string()
  .trim()
  .refine(
    (value) => (COMPONENTS as readonly string[]).includes(value),
    "Select a blood component."
  );

export const registerDonorSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter the donor's full name.")
    .max(160, "Keep the name under 160 characters."),
  dateOfBirth: z
    .string()
    .trim()
    .refine((value) => DATE_PATTERN.test(value), "Enter a valid date of birth."),
  sex: z.string().trim().max(20, "Keep the sex value short."),
  bloodType: bloodTypeSchema,
  contactNumber: z
    .string()
    .trim()
    .max(30, "Keep the contact number short."),
  address: z.string().trim().max(300, "Keep the address under 300 characters."),
});

export type RegisterDonorInput = z.infer<typeof registerDonorSchema>;

export const createBloodRequestSchema = z.object({
  patientId: z.string().trim().regex(UUID_PATTERN, "Select a patient."),
  bloodType: bloodTypeSchema,
  component: componentSchema,
  unitsRequested: z.coerce
    .number()
    .refine(
      (value) => Number.isInteger(value) && value >= 1 && value <= 10,
      "Request between 1 and 10 units."
    ),
  priority: z
    .string()
    .trim()
    .refine(
      (value) => ["routine", "urgent", "emergency"].includes(value),
      "Select a priority."
    ),
  requiredBy: z
    .string()
    .trim()
    .min(1, "Select the required time."),
  notes: z.string().trim().max(500, "Keep notes under 500 characters."),
});

export type CreateBloodRequestInput = z.infer<typeof createBloodRequestSchema>;

export const recordDonationSchema = z.object({
  donorId: z.string().trim().regex(UUID_PATTERN, "Select a donor."),
  units: z.coerce
    .number()
    .refine(
      (value) => Number.isInteger(value) && value >= 1 && value <= 4,
      "Collect between 1 and 4 units."
    ),
  component: componentSchema,
  expiryDays: z.coerce
    .number()
    .refine(
      (value) => Number.isInteger(value) && value >= 1 && value <= 365,
      "Expiry must be between 1 and 365 days."
    ),
  collectionSite: z
    .string()
    .trim()
    .max(120, "Keep the site under 120 characters."),
});

export type RecordDonationInput = z.infer<typeof recordDonationSchema>;

export const screenUnitSchema = z.object({
  unitId: z.string().trim().regex(UUID_PATTERN, "Select a blood unit."),
  result: z
    .string()
    .trim()
    .refine(
      (value) => ["negative", "positive"].includes(value),
      "Select a screening result."
    ),
  notes: z.string().trim().max(500, "Keep notes under 500 characters."),
});

export type ScreenUnitInput = z.infer<typeof screenUnitSchema>;

export const crossmatchSchema = z.object({
  requestId: z.string().trim().regex(UUID_PATTERN, "Select a blood request."),
  unitId: z.string().trim().regex(UUID_PATTERN, "Select a blood unit."),
  result: z
    .string()
    .trim()
    .refine(
      (value) => ["compatible", "incompatible"].includes(value),
      "Select a crossmatch result."
    ),
});

export type CrossmatchInput = z.infer<typeof crossmatchSchema>;

export const issueUnitSchema = z.object({
  requestId: z.string().trim().regex(UUID_PATTERN, "Select a blood request."),
  unitId: z.string().trim().regex(UUID_PATTERN, "Select a blood unit."),
  receivedBy: z
    .string()
    .trim()
    .min(2, "Record who received the unit.")
    .max(160, "Keep the name under 160 characters."),
  notes: z.string().trim().max(500, "Keep notes under 500 characters."),
});

export type IssueUnitInput = z.infer<typeof issueUnitSchema>;

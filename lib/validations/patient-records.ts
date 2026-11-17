import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_CHARACTER_PATTERN = /^[\d\s+-]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const PATIENT_STATUSES = ["active", "inactive", "archived"] as const;

export const ALLERGY_SEVERITIES = [
  "mild",
  "moderate",
  "severe",
  "life_threatening",
] as const;

function isValidContactNumber(value: string): boolean {
  if (!CONTACT_CHARACTER_PATTERN.test(value)) {
    return false;
  }

  const digits = value.replace(/\D/g, "");

  return digits.length >= 7 && digits.length <= 15;
}

export const patientUpdateSchema = z.object({
  patientId: z.string().trim().regex(UUID_PATTERN, "Select a valid patient."),
  first_name: z.string().trim().min(1, "First name is required."),
  middle_name: z.string().trim(),
  last_name: z.string().trim().min(1, "Last name is required."),
  suffix: z.string().trim(),
  date_of_birth: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || DATE_PATTERN.test(value),
      "Enter a valid date of birth."
    ),
  sex: z.string().trim(),
  civil_status: z.string().trim(),
  nationality: z.string().trim(),
  contact_number: z
    .string()
    .trim()
    .refine(
      (value) => !value || isValidContactNumber(value),
      "Enter a valid contact number (7-15 digits)."
    ),
  email: z
    .string()
    .trim()
    .refine(
      (value) => !value || EMAIL_PATTERN.test(value),
      "Enter a valid email address."
    ),
  address_line: z.string().trim(),
  city: z.string().trim(),
  province: z.string().trim(),
  registration_status: z
    .string()
    .trim()
    .refine(
      (value) => (PATIENT_STATUSES as readonly string[]).includes(value),
      "Select a valid registration status."
    ),
});

export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

export const patientBackfillSchema = z.object({
  patientId: z.string().trim().regex(UUID_PATTERN, "Select a valid patient."),
});

export const patientAllergySchema = z.object({
  patientId: z.string().trim().regex(UUID_PATTERN, "Select a valid patient."),
  allergen: z
    .string()
    .trim()
    .min(1, "Enter the allergen.")
    .max(120, "Keep the allergen under 120 characters."),
  reaction: z
    .string()
    .trim()
    .max(200, "Keep the reaction under 200 characters.")
    .optional(),
  severity: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" ||
        (ALLERGY_SEVERITIES as readonly string[]).includes(value),
      "Select a valid severity."
    )
    .optional(),
  notes: z
    .string()
    .trim()
    .max(500, "Keep notes under 500 characters.")
    .optional(),
});

export type PatientAllergyInput = z.infer<typeof patientAllergySchema>;

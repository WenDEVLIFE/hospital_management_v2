import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_CHARACTER_PATTERN = /^[\d\s+-]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidContactNumber(value: string): boolean {
  if (!CONTACT_CHARACTER_PATTERN.test(value)) {
    return false;
  }

  const digits = value.replace(/\D/g, "");

  return digits.length >= 7 && digits.length <= 15;
}

const optionalContactNumber = z
  .string()
  .trim()
  .refine(
    (value) => !value || isValidContactNumber(value),
    "Enter a valid contact number (7-15 digits)."
  );

const optionalEmail = z
  .string()
  .trim()
  .refine(
    (value) => !value || EMAIL_PATTERN.test(value),
    "Enter a valid email address."
  );

export const patientRegistrationSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required."),
  middle_name: z.string().trim(),
  last_name: z.string().trim().min(1, "Last name is required."),
  suffix: z.string().trim(),
  date_of_birth: z
    .string()
    .trim()
    .min(1, "Date of birth is required.")
    .refine((value) => DATE_PATTERN.test(value), "Enter a valid date of birth."),
  sex: z.string().trim().min(1, "Sex is required."),
  civil_status: z.string().trim(),
  nationality: z.string().trim(),
  contact_number: optionalContactNumber,
  email: optionalEmail,
  address_line: z.string().trim(),
  barangay: z.string().trim(),
  city: z.string().trim(),
  province: z.string().trim(),
  postal_code: z.string().trim(),
  emergency_full_name: z
    .string()
    .trim()
    .min(1, "Emergency contact name is required."),
  emergency_relationship: z.string().trim(),
  emergency_contact_number: z
    .string()
    .trim()
    .min(1, "Emergency contact number is required.")
    .refine(
      isValidContactNumber,
      "Enter a valid contact number (7-15 digits)."
    ),
  emergency_is_primary: z.boolean(),
});

export type PatientRegistrationInput = z.infer<
  typeof patientRegistrationSchema
>;

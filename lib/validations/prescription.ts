import { z } from "zod";

export const prescriptionItemInputSchema = z.object({
  medicationId: z.string().uuid("Select a valid medication."),
  dosage: z
    .string()
    .trim()
    .min(1, "Dosage is required.")
    .max(120, "Dosage must be 120 characters or fewer."),
  frequency: z
    .string()
    .trim()
    .min(1, "Frequency is required.")
    .max(120, "Frequency must be 120 characters or fewer."),
  durationDays: z
    .number()
    .int("Duration must be a whole number of days.")
    .min(1, "Duration must be at least one day.")
    .max(3650, "Duration must be 3650 days or fewer.")
    .nullable()
    .optional(),
  quantity: z
    .number()
    .positive("Quantity must be greater than zero.")
    .max(100000, "Quantity is too large."),
  instructions: z
    .string()
    .trim()
    .max(500, "Instructions must be 500 characters or fewer.")
    .optional(),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().uuid("Select a valid patient."),
  encounterId: z.string().uuid("Select a patient encounter."),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be 1000 characters or fewer.")
    .optional(),
  items: z
    .array(prescriptionItemInputSchema)
    .min(1, "Add at least one medication.")
    .max(20, "A prescription cannot exceed 20 medications."),
});

export type PrescriptionItemInput = z.infer<typeof prescriptionItemInputSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const invoiceLineSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Describe the charge.")
    .max(200, "Keep the description under 200 characters."),
  quantity: z.coerce
    .number()
    .refine(
      (value) => Number.isFinite(value) && value > 0,
      "Quantity must be greater than zero."
    ),
  unitPrice: z.coerce
    .number()
    .refine(
      (value) => Number.isFinite(value) && value >= 0,
      "Unit price cannot be negative."
    ),
});

export const createInvoiceSchema = z.object({
  patientId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select a patient."),
  discountAmount: z.coerce
    .number()
    .refine(
      (value) => Number.isFinite(value) && value >= 0,
      "Discount cannot be negative."
    )
    .optional(),
  items: z
    .array(invoiceLineSchema)
    .min(1, "Add at least one charge line.")
    .max(30, "An invoice can hold at most 30 charge lines."),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const PAYMENT_METHODS = [
  "Cash",
  "Credit card",
  "Debit card",
  "Bank transfer",
  "Check",
  "HMO",
  "Insurance",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const recordPaymentSchema = z.object({
  invoiceId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select a valid invoice."),
  amount: z.coerce
    .number()
    .refine(
      (value) => Number.isFinite(value) && value > 0,
      "Enter a payment amount greater than zero."
    )
    .refine(
      (value) => Number.isFinite(value) && Math.round(value * 100) === value * 100,
      "Enter an amount with at most two decimal places."
    )
    .refine(
      (value) => value <= 99_999_999.99,
      "Enter an amount below 100,000,000."
    ),
  paymentMethod: z
    .string()
    .trim()
    .refine(
      (value) => (PAYMENT_METHODS as readonly string[]).includes(value),
      "Select a payment method."
    ),
  notes: z
    .string()
    .trim()
    .max(500, "Keep notes under 500 characters.")
    .optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const refundPaymentSchema = z.object({
  paymentId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select a valid payment."),
  reason: z
    .string()
    .trim()
    .max(500, "Keep the reason under 500 characters.")
    .optional(),
});

export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;

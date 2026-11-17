import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const verifyCoverageSchema = z.object({
  policyId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select an insurance policy."),
  status: z
    .string()
    .trim()
    .refine(
      (value) => value === "verified" || value === "failed",
      "Select a verification result."
    ),
  referenceNumber: z
    .string()
    .trim()
    .min(2, "Enter the payer reference number.")
    .max(60, "Keep the reference under 60 characters."),
  notes: z
    .string()
    .trim()
    .max(500, "Keep notes under 500 characters.")
    .optional(),
});

export type VerifyCoverageInput = z.infer<typeof verifyCoverageSchema>;

export const createClaimSchema = z
  .object({
    policyId: z
      .string()
      .trim()
      .regex(UUID_PATTERN, "Select an insurance policy."),
    claimType: z
      .string()
      .trim()
      .min(2, "Enter the claim type.")
      .max(120, "Keep the claim type under 120 characters."),
    diagnosis: z
      .string()
      .trim()
      .min(2, "Enter the diagnosis.")
      .max(200, "Keep the diagnosis under 200 characters."),
    totalCharged: z.coerce
      .number()
      .refine(
        (value) => Number.isFinite(value) && value > 0,
        "Enter the total charged amount."
      ),
    amountClaimed: z.coerce
      .number()
      .refine(
        (value) => Number.isFinite(value) && value > 0,
        "Enter the amount claimed."
      ),
  })
  .refine((value) => value.amountClaimed <= value.totalCharged, {
    path: ["amountClaimed"],
    message: "The claimed amount cannot exceed the total charged.",
  });

export type CreateClaimInput = z.infer<typeof createClaimSchema>;

import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const providerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the provider name.")
    .max(160, "Keep the name under 160 characters."),
  code: z
    .string()
    .trim()
    .min(2, "Enter a provider code.")
    .max(20, "Keep the code under 20 characters.")
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, or hyphens only."),
  type: z
    .string()
    .trim()
    .refine(
      (value) =>
        ["philhealth", "private_hmo", "private_insurer", "government"].includes(
          value
        ),
      "Select a provider type."
    ),
  contactNumber: z.string().trim().max(40, "Keep the contact number short."),
});

export type ProviderInput = z.infer<typeof providerSchema>;

export const policySchema = z
  .object({
    patientId: z.string().trim().regex(UUID_PATTERN, "Select a patient."),
    providerId: z.string().trim().regex(UUID_PATTERN, "Select a provider."),
    policyNumber: z
      .string()
      .trim()
      .min(2, "Enter the policy number.")
      .max(60, "Keep the policy number short."),
    memberNumber: z
      .string()
      .trim()
      .min(2, "Enter the member number.")
      .max(60, "Keep the member number short."),
    coverageType: z
      .string()
      .trim()
      .max(120, "Keep the coverage type short."),
    effectiveDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Select the effective date."),
    expiryDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Select the expiry date."),
    notes: z.string().trim().max(500, "Keep notes under 500 characters."),
  })
  .refine((value) => value.expiryDate > value.effectiveDate, {
    path: ["expiryDate"],
    message: "The expiry date must be after the effective date.",
  });

export type PolicyInput = z.infer<typeof policySchema>;

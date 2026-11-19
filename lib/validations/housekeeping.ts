import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createCleaningRequestSchema = z.object({
  locationType: z
    .string()
    .trim()
    .refine(
      (value) =>
        ["room", "bed", "common_area", "isolation_room"].includes(value),
      "Select a location type."
    ),
  locationLabel: z
    .string()
    .trim()
    .min(1, "Enter the location.")
    .max(120, "Keep the location under 120 characters."),
  requestType: z
    .string()
    .trim()
    .refine(
      (value) =>
        ["routine", "discharge", "terminal", "spill", "isolation"].includes(
          value
        ),
      "Select a request type."
    ),
  priority: z
    .string()
    .trim()
    .refine(
      (value) => ["routine", "urgent", "emergency"].includes(value),
      "Select a priority."
    ),
  dueAt: z.string().trim().min(1, "Select the due time."),
  notes: z.string().trim().max(500, "Keep notes under 500 characters."),
});

export type CreateCleaningRequestInput = z.infer<
  typeof createCleaningRequestSchema
>;

export const advanceCleaningRequestSchema = z
  .object({
    requestId: z
      .string()
      .trim()
      .regex(UUID_PATTERN, "Select a cleaning request."),
    action: z
      .string()
      .trim()
      .refine(
        (value) =>
          ["assign", "start", "complete", "verify", "cancel"].includes(value),
        "Select an action."
      ),
    staffId: z.string().trim().optional(),
    method: z.string().trim().max(120, "Keep the method short.").optional(),
    chemical: z.string().trim().max(120, "Keep the chemical short.").optional(),
    contactMinutes: z.string().trim().optional(),
    notes: z.string().trim().max(500, "Keep notes under 500 characters.").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "assign" && !value.staffId) {
      ctx.addIssue({
        code: "custom",
        path: ["staffId"],
        message: "Select a housekeeping staff member.",
      });
    }

    if (value.action === "complete") {
      if (!value.method?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["method"],
          message: "Record the disinfection method.",
        });
      }

      if (!value.chemical?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["chemical"],
          message: "Record the chemical used.",
        });
      }

      const minutes = Number(value.contactMinutes);

      if (!Number.isFinite(minutes) || minutes <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["contactMinutes"],
          message: "Enter the contact time in minutes.",
        });
      }
    }
  });

export type AdvanceCleaningRequestInput = z.infer<
  typeof advanceCleaningRequestSchema
>;

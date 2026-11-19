import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export const createDietaryOrderSchema = z.object({
  patientId: z.string().trim().regex(UUID_PATTERN, "Select a patient."),
  therapeuticDietId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select a therapeutic diet."),
  allergies: z.string().trim().max(300, "Keep allergies under 300 characters."),
  restrictions: z
    .string()
    .trim()
    .max(300, "Keep restrictions under 300 characters."),
  mealSchedule: z
    .array(
      z
        .string()
        .trim()
        .refine(
          (value) => (MEAL_TYPES as readonly string[]).includes(value),
          "Select a supported meal."
        )
    )
    .min(1, "Select at least one meal."),
  notes: z.string().trim().max(500, "Keep notes under 500 characters."),
});

export type CreateDietaryOrderInput = z.infer<typeof createDietaryOrderSchema>;

export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const advanceMealSchema = z.object({
  mealId: z.string().trim().regex(UUID_PATTERN, "Select a meal order."),
  status: z
    .string()
    .trim()
    .refine(
      (value) => ["preparing", "ready", "delivered", "cancelled"].includes(value),
      "Select a meal status."
    ),
});

export type AdvanceMealInput = z.infer<typeof advanceMealSchema>;

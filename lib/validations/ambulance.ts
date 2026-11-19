import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const AMBULANCE_TYPES = [
  "basic_life_support",
  "advanced_life_support",
  "patient_transport",
  "mobile_icu",
] as const;

export const registerAmbulanceSchema = z.object({
  vehicleNumber: z
    .string()
    .trim()
    .min(2, "Enter the vehicle number.")
    .max(30, "Keep the vehicle number short."),
  plateNumber: z
    .string()
    .trim()
    .min(3, "Enter the plate number.")
    .max(20, "Keep the plate number short."),
  type: z
    .string()
    .trim()
    .refine(
      (value) => (AMBULANCE_TYPES as readonly string[]).includes(value),
      "Select an ambulance type."
    ),
  location: z.string().trim().max(120, "Keep the location short."),
  nextServiceDue: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || DATE_PATTERN.test(value),
      "Select a valid service date."
    ),
});

export type RegisterAmbulanceInput = z.infer<typeof registerAmbulanceSchema>;

export const dispatchAmbulanceSchema = z.object({
  patientId: z.string().trim().regex(UUID_PATTERN, "Select a patient."),
  pickupLocation: z
    .string()
    .trim()
    .min(2, "Enter the pickup location.")
    .max(200, "Keep the pickup location short."),
  destination: z
    .string()
    .trim()
    .min(2, "Enter the destination.")
    .max(200, "Keep the destination short."),
  priority: z
    .string()
    .trim()
    .refine(
      (value) => ["routine", "urgent", "emergency"].includes(value),
      "Select a priority."
    ),
  notes: z.string().trim().max(500, "Keep notes under 500 characters."),
});

export type DispatchAmbulanceInput = z.infer<typeof dispatchAmbulanceSchema>;

export const advanceAmbulanceTripSchema = z
  .object({
    tripId: z.string().trim().regex(UUID_PATTERN, "Select a dispatch."),
    action: z
      .string()
      .trim()
      .refine(
        (value) =>
          ["assign", "en_route", "on_scene", "transporting", "complete", "cancel"].includes(
            value
          ),
        "Select an action."
      ),
    vehicleId: z.string().trim().optional(),
  })
  .refine((value) => value.action !== "assign" || Boolean(value.vehicleId), {
    path: ["vehicleId"],
    message: "Select an ambulance.",
  });

export type AdvanceAmbulanceTripInput = z.infer<
  typeof advanceAmbulanceTripSchema
>;

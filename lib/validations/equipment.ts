import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Select a valid date.",
  });

export const registerEquipmentSchema = z.object({
  assetNumber: z
    .string()
    .trim()
    .min(2, "Enter the asset number.")
    .max(40, "Keep the asset number under 40 characters."),
  name: z
    .string()
    .trim()
    .min(2, "Enter the equipment name.")
    .max(120, "Keep the name under 120 characters."),
  serialNumber: z
    .string()
    .trim()
    .min(2, "Enter the serial number.")
    .max(80, "Keep the serial number under 80 characters."),
  categoryId: z
    .string()
    .trim()
    .refine((value) => value === "" || UUID_PATTERN.test(value), {
      message: "Select a category.",
    }),
  departmentId: z
    .string()
    .trim()
    .refine((value) => value === "" || UUID_PATTERN.test(value), {
      message: "Select a department.",
    }),
  manufacturer: z.string().trim().max(120, "Keep the manufacturer short."),
  model: z.string().trim().max(120, "Keep the model short."),
  location: z.string().trim().max(120, "Keep the location short."),
  nextMaintenanceDue: optionalDate,
  nextCalibrationDue: optionalDate,
});

export type RegisterEquipmentInput = z.infer<typeof registerEquipmentSchema>;

export const createWorkOrderSchema = z.object({
  equipmentId: z.string().trim().regex(UUID_PATTERN, "Select equipment."),
  issueDescription: z
    .string()
    .trim()
    .min(5, "Describe the issue.")
    .max(500, "Keep the issue under 500 characters."),
  priority: z
    .string()
    .trim()
    .refine(
      (value) => ["routine", "urgent", "emergency"].includes(value),
      "Select a priority."
    ),
  notes: z.string().trim().max(500, "Keep notes under 500 characters."),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;

export const completeWorkOrderSchema = z.object({
  workOrderId: z.string().trim().regex(UUID_PATTERN, "Select a work order."),
  resolutionNotes: z
    .string()
    .trim()
    .min(5, "Record the resolution.")
    .max(500, "Keep the resolution under 500 characters."),
  partsUsed: z.string().trim().max(200, "Keep the parts list short."),
  cost: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0),
      "Enter a valid cost."
    ),
});

export type CompleteWorkOrderInput = z.infer<typeof completeWorkOrderSchema>;

export const recordCalibrationSchema = z.object({
  equipmentId: z.string().trim().regex(UUID_PATTERN, "Select equipment."),
  calibrationType: z
    .string()
    .trim()
    .min(2, "Enter the calibration type.")
    .max(120, "Keep the type under 120 characters."),
  result: z
    .string()
    .trim()
    .refine(
      (value) => ["passed", "failed", "adjusted"].includes(value),
      "Select a result."
    ),
  certificateNumber: z
    .string()
    .trim()
    .min(2, "Enter the certificate number.")
    .max(80, "Keep the certificate number short."),
  nextDueDate: optionalDate,
  notes: z.string().trim().max(500, "Keep notes under 500 characters."),
});

export type RecordCalibrationInput = z.infer<typeof recordCalibrationSchema>;

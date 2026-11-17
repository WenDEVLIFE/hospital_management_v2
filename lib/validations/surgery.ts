import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const OPERATING_ROOM_STATUSES = [
  "available",
  "in_use",
  "cleaning",
  "maintenance",
] as const;

export const SURGERY_PRIORITIES = ["elective", "urgent", "emergency"] as const;

export const ANESTHESIA_TYPES = [
  "general",
  "regional",
  "local",
  "sedation",
] as const;

export const registerRoomSchema = z.object({
  roomName: z
    .string()
    .trim()
    .min(1, "Enter a room name.")
    .max(60, "Keep the room name under 60 characters."),
  departmentId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select a department."),
  status: z
    .string()
    .trim()
    .refine(
      (value) => (OPERATING_ROOM_STATUSES as readonly string[]).includes(value),
      "Select a room status."
    ),
  notes: z
    .string()
    .trim()
    .max(500, "Keep notes under 500 characters.")
    .optional(),
});

export type RegisterRoomInput = z.infer<typeof registerRoomSchema>;

export const scheduleSurgerySchema = z
  .object({
    patientId: z.string().trim().regex(UUID_PATTERN, "Select a patient."),
    roomId: z
      .string()
      .trim()
      .regex(UUID_PATTERN, "Select an operating room."),
    procedureCode: z
      .string()
      .trim()
      .min(2, "Enter a procedure code.")
      .max(20, "Keep the procedure code under 20 characters."),
    procedureName: z
      .string()
      .trim()
      .min(2, "Enter the procedure name.")
      .max(160, "Keep the procedure name under 160 characters."),
    scheduledStart: z
      .string()
      .trim()
      .min(1, "Select the start time."),
    scheduledEnd: z.string().trim().min(1, "Select the end time."),
    priority: z
      .string()
      .trim()
      .refine(
        (value) => (SURGERY_PRIORITIES as readonly string[]).includes(value),
        "Select a priority."
      ),
    surgeonId: z
      .string()
      .trim()
      .regex(UUID_PATTERN, "Select the surgeon."),
    anesthesiaType: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          (ANESTHESIA_TYPES as readonly string[]).includes(value),
        "Select an anesthesia type."
      )
      .optional(),
    notes: z
      .string()
      .trim()
      .max(500, "Keep notes under 500 characters.")
      .optional(),
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.scheduledStart).getTime();
    const end = new Date(value.scheduledEnd).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduledStart"],
        message: "Select a valid date and time.",
      });
      return;
    }

    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        path: ["scheduledEnd"],
        message: "The end time must be after the start time.",
      });
    }
  });

export type ScheduleSurgeryInput = z.infer<typeof scheduleSurgerySchema>;

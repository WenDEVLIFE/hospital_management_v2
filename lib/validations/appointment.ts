import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const appointmentSchema = z.object({
  patient_id: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select a patient."),
  department_id: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select a department."),
  physician_id: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || UUID_PATTERN.test(value),
      "Select a valid physician."
    ),
  scheduled_at: z
    .string()
    .trim()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,
      "Select a valid date and time."
    )
    .refine(
      (value) => {
        const scheduled = new Date(`${value}:00+08:00`);

        return (
          !Number.isNaN(scheduled.getTime()) && scheduled.getTime() > Date.now()
        );
      },
      "Appointments cannot be scheduled in the past."
    ),
  duration_minutes: z
    .string()
    .trim()
    .refine((value) => {
      const duration = Number(value);

      return (
        Number.isInteger(duration) && duration > 0 && duration <= 480
      );
    }, "Enter a duration between 1 and 480 minutes."),
  appointment_type: z.string().trim(),
  reason_for_visit: z.string().trim(),
  notes: z.string().trim(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

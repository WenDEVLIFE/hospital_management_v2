import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

export const SHIFT_TYPES = [
  "morning",
  "afternoon",
  "night",
  "off",
] as const;

export const LEAVE_TYPES = [
  "vacation",
  "sick",
  "maternity",
  "paternity",
  "emergency",
  "study",
] as const;

export const scheduleShiftSchema = z.object({
  employeeId: z.string().trim().regex(UUID_PATTERN, "Select an employee."),
  shiftDate: z
    .string()
    .trim()
    .refine((value) => DATE_PATTERN.test(value), "Select a shift date."),
  shiftType: z
    .string()
    .trim()
    .refine(
      (value) => (SHIFT_TYPES as readonly string[]).includes(value),
      "Select a shift type."
    ),
  startTime: z
    .string()
    .trim()
    .refine((value) => TIME_PATTERN.test(value), "Enter a start time."),
  endTime: z
    .string()
    .trim()
    .refine((value) => TIME_PATTERN.test(value), "Enter an end time."),
});

export type ScheduleShiftInput = z.infer<typeof scheduleShiftSchema>;

export const fileLeaveSchema = z
  .object({
    employeeId: z.string().trim().regex(UUID_PATTERN, "Select an employee."),
    leaveType: z
      .string()
      .trim()
      .refine(
        (value) => (LEAVE_TYPES as readonly string[]).includes(value),
        "Select a leave type."
      ),
    startDate: z
      .string()
      .trim()
      .refine((value) => DATE_PATTERN.test(value), "Select a start date."),
    endDate: z
      .string()
      .trim()
      .refine((value) => DATE_PATTERN.test(value), "Select an end date."),
    reason: z
      .string()
      .trim()
      .min(1, "Record the reason for leave.")
      .max(500, "Keep the reason under 500 characters."),
  })
  .superRefine((value, ctx) => {
    if (value.endDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "The end date must be on or after the start date.",
      });
    }
  });

export type FileLeaveInput = z.infer<typeof fileLeaveSchema>;

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

export const createEmployeeSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter the employee's full name.")
      .max(200, "Keep the full name under 200 characters."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Enter a valid email address.")),
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(72, "Keep the password under 72 characters."),
    confirmPassword: z.string(),
    staffNumber: z
      .string()
      .trim()
      .min(2, "Enter the employee number.")
      .max(40, "Keep the employee number under 40 characters."),
    firstName: z.string().trim().min(1, "First name is required."),
    middleName: z.string().trim().max(80, "Keep the middle name short."),
    lastName: z.string().trim().min(1, "Last name is required."),
    departmentId: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || UUID_PATTERN.test(value),
        "Select a valid department."
      ),
    employmentType: z.string().trim().max(60, "Keep the employment type short."),
    licenseNumber: z.string().trim().max(60, "Keep the license number short."),
    roleId: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || UUID_PATTERN.test(value),
        "Select a valid role."
      ),
    position: z
      .string()
      .trim()
      .min(2, "Enter the position.")
      .max(120, "Keep the position under 120 characters."),
    hireDate: z
      .string()
      .trim()
      .refine((value) => DATE_PATTERN.test(value), "Select the hire date."),
    monthlyRate: z
      .string()
      .trim()
      .refine(
        (value) => value !== "" && Number(value) >= 0 && Number.isFinite(Number(value)),
        "Enter the monthly rate."
      ),
    licenseExpiry: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || DATE_PATTERN.test(value),
        "Select a valid expiry date."
      ),
    leaveBalance: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || (Number(value) >= 0 && Number.isFinite(Number(value))),
        "Enter the leave balance."
      ),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords do not match.",
  });

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const runPayrollSchema = z.object({
  periodStart: z
    .string()
    .trim()
    .refine((value) => DATE_PATTERN.test(value), "Select the period start."),
  periodEnd: z
    .string()
    .trim()
    .refine((value) => DATE_PATTERN.test(value), "Select the period end."),
  payDate: z
    .string()
    .trim()
    .refine((value) => DATE_PATTERN.test(value), "Select the pay date."),
  deductionRate: z
    .string()
    .trim()
    .refine(
      (value) => value !== "" && Number(value) >= 0 && Number(value) <= 100,
      "Enter a deduction rate between 0 and 100."
    ),
});

export type RunPayrollInput = z.infer<typeof runPayrollSchema>;

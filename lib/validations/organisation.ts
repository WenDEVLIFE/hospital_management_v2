import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const departmentSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Enter a department code.")
    .max(12, "Keep the code under 12 characters.")
    .regex(
      /^[A-Za-z0-9-]+$/,
      "Use letters, numbers, or hyphens only."
    ),
  name: z
    .string()
    .trim()
    .min(2, "Enter a department name.")
    .max(120, "Keep the name under 120 characters."),
  description: z
    .string()
    .trim()
    .max(500, "Keep the description under 500 characters.")
    .optional(),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;

export const roomSchema = z.object({
  departmentId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select a department."),
  roomNumber: z
    .string()
    .trim()
    .min(1, "Enter a room number.")
    .max(30, "Keep the room number under 30 characters."),
  roomType: z
    .string()
    .trim()
    .max(60, "Keep the room type under 60 characters.")
    .optional(),
  floorNumber: z
    .string()
    .trim()
    .max(20, "Keep the floor under 20 characters.")
    .optional(),
});

export type RoomInput = z.infer<typeof roomSchema>;

export const staffUpdateSchema = z.object({
  staffId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select a valid staff record."),
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
  licenseNumber: z
    .string()
    .trim()
    .max(60, "Keep the license number short."),
});

export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;

export const staffCreateSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter the staff member's full name.")
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
      .min(2, "Enter the staff number.")
      .max(40, "Keep the staff number under 40 characters."),
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
    licenseNumber: z
      .string()
      .trim()
      .max(60, "Keep the license number short."),
    roleId: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || UUID_PATTERN.test(value),
        "Select a valid role."
      ),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords do not match.",
  });

export type StaffCreateInput = z.infer<typeof staffCreateSchema>;

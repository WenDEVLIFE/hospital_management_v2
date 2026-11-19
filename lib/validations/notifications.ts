import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const notificationIdSchema = z
  .string()
  .trim()
  .regex(UUID_PATTERN, "Select a notification.");

export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Enter an announcement title.")
    .max(160, "Keep the title under 160 characters."),
  body: z
    .string()
    .trim()
    .min(5, "Write the announcement body.")
    .max(2000, "Keep the body under 2000 characters."),
  audience: z
    .string()
    .trim()
    .refine(
      (value) =>
        ["all_staff", "physicians", "nurses", "department"].includes(value),
      "Select an audience."
    ),
  departmentId: z
    .string()
    .trim()
    .refine((value) => value === "" || UUID_PATTERN.test(value), {
      message: "Select a department.",
    }),
  pinned: z.boolean(),
  publish: z.boolean(),
  expiresAt: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Select a valid expiry date.",
    }),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const notificationPreferencesSchema = z.object({
  preferences: z
    .array(
      z.object({
        category: z.string().trim().min(1),
        in_app: z.boolean(),
      })
    )
    .min(1, "No preferences to save."),
});

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;

import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your work email.")
  .refine(
    (value) => EMAIL_PATTERN.test(value),
    "Enter a valid email address, such as name@spmc.gov.ph."
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

const passwordField = z
  .string()
  .min(1, "Enter a new password.")
  .refine((value) => value.length >= 8, "Use at least 8 characters.")
  .refine(
    (value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value),
    "Use at least one letter and one number."
  );

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, "Re-enter the new password."),
  })
  .superRefine((value, ctx) => {
    if (value.confirmPassword !== value.password) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "The passwords do not match.",
      });
    }
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Re-enter the new password."),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword === value.currentPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Choose a password different from your current password.",
      });
    }

    if (value.confirmPassword !== value.newPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "The passwords do not match.",
      });
    }
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

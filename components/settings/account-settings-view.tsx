"use client";

import * as React from "react";
import Link from "next/link";
import {
  AltArrowLeftIcon,
  Buildings2Icon,
  CalendarMinimalisticIcon,
  LetterIcon,
  LockPasswordIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "@solar-icons/react/linear";

import { PageSection } from "@/components/layout/page-section";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/lib/format";
import { usePreviewSessionEmail } from "@/lib/use-preview-session";
import type { UserListRow } from "@/types/hospital";

type PasswordFieldErrors = {
  current?: string;
  next?: string;
  confirm?: string;
};

function getInitials(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || "Account";
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function validatePassword(
  current: string,
  next: string,
  confirm: string
): PasswordFieldErrors {
  const errors: PasswordFieldErrors = {};

  if (!current) {
    errors.current = "Enter your current password.";
  }

  if (!next) {
    errors.next = "Enter a new password.";
  } else if (next.length < 8) {
    errors.next = "Use at least 8 characters.";
  } else if (!/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
    errors.next = "Use at least one letter and one number.";
  } else if (next === current) {
    errors.next = "Choose a password different from your current password.";
  }

  if (!confirm) {
    errors.confirm = "Re-enter the new password.";
  } else if (confirm !== next) {
    errors.confirm = "The passwords do not match.";
  }

  return errors;
}

function DetailField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium text-hospital-text-muted">
        <span aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 text-sm text-hospital-text">{children}</dd>
    </div>
  );
}

export interface AccountSettingsViewProps {
  users: UserListRow[];
}

export function AccountSettingsView({ users }: AccountSettingsViewProps) {
  const sessionEmail = usePreviewSessionEmail();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errors, setErrors] = React.useState<PasswordFieldErrors>({});
  const [submitted, setSubmitted] = React.useState(false);

  const account = React.useMemo(() => {
    if (!sessionEmail) {
      return null;
    }

    const needle = sessionEmail.toLowerCase();

    return (
      users.find((user) => user.email.toLowerCase() === needle) ?? null
    );
  }, [sessionEmail, users]);

  const displayName = account?.full_name ?? "Hospital staff account";
  const displayEmail = account?.email ?? sessionEmail ?? "Not available";
  const initials = getInitials(displayName, displayEmail);

  const errorSummary = Object.values(errors).filter(Boolean).join(" ");

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validatePassword(
      currentPassword,
      newPassword,
      confirmPassword
    );

    setErrors(nextErrors);
    setSubmitted(false);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    // TODO(supabase): await supabase.auth.updateUser({ password: newPassword })
    // and map auth errors to field-level messages.
    setSubmitted(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-6">
      <PageSection
        title="Account details"
        description="Your hospital account profile and current status."
      >
        {!sessionEmail ? (
          <Alert
            variant="warning"
            title="Preview session unavailable"
            className="mb-4"
          >
            No active preview session was found. Sign in again to view your
            account.
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-4 border-b border-hospital-border-subtle pb-4">
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-hospital-green-light text-sm font-semibold text-hospital-green"
            aria-hidden="true"
          >
            {initials}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-hospital-text">
              {displayName}
            </p>
            <p className="mt-0.5 break-words text-xs text-hospital-text-muted">
              {displayEmail}
            </p>
          </div>

          {account ? (
            <StatusBadge status={account.is_active ? "active" : "inactive"} />
          ) : null}
        </div>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailField
            label="Full name"
            icon={<UserCircleIcon className="size-3.5" />}
          >
            {account?.full_name ?? "Not available in preview"}
          </DetailField>

          <DetailField label="Email" icon={<LetterIcon className="size-3.5" />}>
            <span className="break-words">{displayEmail}</span>
          </DetailField>

          <DetailField
            label="Role(s)"
            icon={<ShieldCheckIcon className="size-3.5" />}
          >
            {account && account.role_names.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {account.role_names.map((role) => (
                  <Badge key={role} variant="info">
                    {role}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-hospital-text-muted">
                {account ? "No role assigned" : "Not available in preview"}
              </span>
            )}
          </DetailField>

          <DetailField
            label="Department"
            icon={<Buildings2Icon className="size-3.5" />}
          >
            {account?.department_name ?? "Not available in preview"}
          </DetailField>

          <DetailField
            label="Contact number"
            icon={<PhoneIcon className="size-3.5" />}
          >
            {account?.contact_number ?? "Not provided"}
          </DetailField>

          <DetailField
            label="Account status"
            icon={<ShieldCheckIcon className="size-3.5" />}
          >
            {account ? (
              <StatusBadge status={account.is_active ? "active" : "inactive"} />
            ) : (
              "Not available in preview"
            )}
          </DetailField>

          <DetailField
            label="Last activity"
            icon={<CalendarMinimalisticIcon className="size-3.5" />}
          >
            {account?.last_activity
              ? formatDateTime(account.last_activity)
              : "No activity recorded"}
          </DetailField>

          <DetailField
            label="Member since"
            icon={<CalendarMinimalisticIcon className="size-3.5" />}
          >
            {account?.created_at
              ? formatDate(account.created_at)
              : "Not available in preview"}
          </DetailField>
        </dl>

        {!account && sessionEmail ? (
          <Alert variant="info" className="mt-4">
            Profile details for this preview session are not available. Sign in
            with one of the preview staff accounts to see the full profile.
          </Alert>
        ) : null}
      </PageSection>

      <PageSection
        title="Change password"
        description="Update the password used to sign in to this account."
      >
        <Alert variant="info" className="mb-4">
          Password changes are not connected to Supabase Auth in this build. The
          form validates locally, but nothing is saved.
        </Alert>

        {submitted ? (
          <Alert
            variant="info"
            title="Password not changed"
            className="mb-4"
          >
            The form passed validation, but Supabase Auth is not connected yet.
            No password was updated.
          </Alert>
        ) : null}

        <form
          onSubmit={handlePasswordSubmit}
          noValidate
          className="max-w-md space-y-4"
        >
          <div aria-live="polite" className="sr-only">
            {errorSummary}
          </div>

          <FormField
            label="Current password"
            htmlFor="current-password"
            required
            error={errors.current}
          >
            <PasswordInput
              name="current-password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setSubmitted(false);

                if (errors.current) {
                  setErrors((current) => ({
                    ...current,
                    current: undefined,
                  }));
                }
              }}
            />
          </FormField>

          <FormField
            label="New password"
            htmlFor="new-password"
            required
            error={errors.next}
          >
            <PasswordInput
              name="new-password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value);
                setSubmitted(false);

                if (errors.next) {
                  setErrors((current) => ({ ...current, next: undefined }));
                }
              }}
            />
          </FormField>

          <FormField
            label="Confirm new password"
            htmlFor="confirm-password"
            required
            error={errors.confirm}
          >
            <PasswordInput
              name="confirm-password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setSubmitted(false);

                if (errors.confirm) {
                  setErrors((current) => ({
                    ...current,
                    confirm: undefined,
                  }));
                }
              }}
            />
          </FormField>

          <div className="rounded-md border border-hospital-border-subtle bg-hospital-surface p-3">
            <p className="text-[11px] font-medium text-hospital-text">
              Password requirements
            </p>
            <ul className="mt-1.5 space-y-1 text-[11px] text-hospital-text-muted">
              <li>At least 8 characters.</li>
              <li>At least one letter and one number.</li>
              <li>Different from your current password.</li>
              <li>Confirmation matches the new password.</li>
            </ul>
          </div>

          <Button type="submit" size="md">
            <LockPasswordIcon className="size-4" aria-hidden="true" />
            Update password
          </Button>
        </form>
      </PageSection>

      <Link
        href="/settings"
        className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-hospital-text-muted hover:text-hospital-green"
      >
        <AltArrowLeftIcon className="size-3.5" aria-hidden="true" />
        Back to settings
      </Link>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AltArrowLeftIcon } from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PasswordFieldErrors = {
  next?: string;
  confirm?: string;
};

type ResetStatus = "loading" | "ready" | "invalid" | "done";

function validatePassword(next: string, confirm: string): PasswordFieldErrors {
  const errors: PasswordFieldErrors = {};

  if (!next) {
    errors.next = "Enter a new password.";
  } else if (next.length < 8) {
    errors.next = "Use at least 8 characters.";
  } else if (!/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
    errors.next = "Use at least one letter and one number.";
  }

  if (!confirm) {
    errors.confirm = "Re-enter the new password.";
  } else if (confirm !== next) {
    errors.confirm = "The passwords do not match.";
  }

  return errors;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = React.useState<ResetStatus>("loading");
  const [email, setEmail] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [errors, setErrors] = React.useState<PasswordFieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (data.session) {
        setEmail(data.session.user.email ?? null);
        setStatus("ready");
      } else {
        setStatus("invalid");
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  const errorSummary = Object.values(errors).filter(Boolean).join(" ");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading || status !== "ready") {
      return;
    }

    const nextErrors = validatePassword(password, confirmPassword);
    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const message = error.message.toLowerCase();

        if (message.includes("different from the old")) {
          setErrors({
            next: "Choose a password different from your current password.",
          });
        } else if (message.includes("at least")) {
          setErrors({ next: "Use at least 8 characters." });
        } else {
          setFormError(
            "We could not update your password. Request a new reset link and try again."
          );
        }

        return;
      }

      setPassword("");
      setConfirmPassword("");
      setStatus("done");
    } catch {
      setFormError(
        "We could not update your password. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div>
        <h1 className="text-xl font-bold text-hospital-text">
          Set a new password
        </h1>
        <p className="mt-1 text-[13px] text-hospital-text-muted">
          Checking your reset link...
        </p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div>
        <h1 className="text-xl font-bold text-hospital-text">
          Reset link expired
        </h1>
        <p className="mt-1 text-[13px] text-hospital-text-muted">
          This password reset link is invalid or has expired. Request a new link
          to continue.
        </p>

        <Link
          href="/forgot-password"
          className="mt-5 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-hospital-green px-3.5 text-sm font-medium text-white transition-colors hover:bg-hospital-green-hover"
        >
          Request a new link
        </Link>

        <Link
          href="/login"
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-hospital-text-muted hover:text-hospital-green"
        >
          <AltArrowLeftIcon className="size-3.5" aria-hidden="true" />
          Back to sign in
        </Link>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div>
        <h1 className="text-xl font-bold text-hospital-text">
          Password updated
        </h1>
        <p className="mt-1 text-[13px] text-hospital-text-muted">
          Your password was changed successfully. Use it the next time you sign
          in.
        </p>

        <Button
          type="button"
          className="mt-5 w-full"
          onClick={() => {
            router.replace("/dashboard");
            router.refresh();
          }}
        >
          Continue to dashboard
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-hospital-text">
        Set a new password
      </h1>
      <p className="mt-1 text-[13px] text-hospital-text-muted">
        {email
          ? `Choose a new password for ${email}.`
          : "Choose a new password for your account."}
      </p>

      {formError ? (
        <Alert variant="danger" title="Unable to update password" className="mt-4">
          {formError}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <div aria-live="polite" className="sr-only">
          {errorSummary}
        </div>

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
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);

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

              if (errors.confirm) {
                setErrors((current) => ({ ...current, confirm: undefined }));
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
          </ul>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Update password
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-hospital-text-muted hover:text-hospital-green"
      >
        <AltArrowLeftIcon className="size-3.5" aria-hidden="true" />
        Back to sign in
      </Link>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  email?: string;
  password?: string;
};

function validateLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email.trim()) {
    errors.email = "Enter your work email.";
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Enter a valid email address, such as name@spmc.gov.ph.";
  }

  if (!password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

function mapSignInError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirm your email address before signing in.";
  }

  if (normalized.includes("too many")) {
    return "Too many sign-in attempts. Wait a moment and try again.";
  }

  return "We could not sign you in. Try again.";
}

function initialErrorMessage(code: string | null): string | null {
  switch (code) {
    case "disabled":
      return "This account is disabled. Contact hospital administration if you believe this is a mistake.";
    case "profile":
      return "Your staff profile is not available. Contact hospital administration.";
    case "reset":
      return "The password reset link is invalid or has expired. Request a new one.";
    default:
      return null;
  }
}

export interface LoginFormProps {
  initialError: string | null;
  initialNext: string | null;
}

export function LoginForm({ initialError, initialNext }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(() =>
    initialErrorMessage(initialError)
  );
  const [loading, setLoading] = React.useState(false);

  // A disabled or unprovisioned account may still hold a stale session. Clear
  // it so the proxy stops redirecting the user back into the workspace.
  React.useEffect(() => {
    if (initialError === "disabled" || initialError === "profile") {
      void getSupabaseBrowserClient().auth.signOut();
    }
  }, [initialError]);

  const errorSummary = Object.values(errors)
    .filter(Boolean)
    .join(" ");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const nextErrors = validateLogin(email, password);
    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        setFormError(mapSignInError(error?.message ?? ""));
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.auth.signOut();
        setFormError(
          "Your staff profile is not available. Contact hospital administration."
        );
        return;
      }

      if (profile.is_active === false) {
        await supabase.auth.signOut();
        setFormError(
          "This account is disabled. Contact hospital administration if you believe this is a mistake."
        );
        return;
      }

      const next =
        initialNext &&
        initialNext.startsWith("/") &&
        !initialNext.startsWith("//")
          ? initialNext
          : "/dashboard";

      router.replace(next);
      router.refresh();
    } catch {
      setFormError(
        "We could not sign you in. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-hospital-text">Sign in</h1>
      <p className="mt-1 text-[13px] text-hospital-text-muted">
        Use your hospital work account to continue.
      </p>

      {formError ? (
        <Alert variant="danger" title="Unable to sign in" className="mt-4">
          {formError}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <div aria-live="polite" className="sr-only">
          {errorSummary}
        </div>

        <FormField
          label="Work email"
          htmlFor="work-email"
          required
          error={errors.email}
        >
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="name@spmc.gov.ph"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) {
                setErrors((current) => ({ ...current, email: undefined }));
              }
            }}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          required
          error={errors.password}
        >
          <PasswordInput
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password) {
                setErrors((current) => ({ ...current, password: undefined }));
              }
            }}
          />
        </FormField>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Link
            href="/forgot-password"
            className="shrink-0 cursor-pointer text-xs font-medium text-hospital-green hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-4 border-t border-hospital-border-subtle pt-4 text-[11px] text-hospital-text-muted">
        Accounts are provisioned by hospital administration.
      </p>
    </div>
  );
}

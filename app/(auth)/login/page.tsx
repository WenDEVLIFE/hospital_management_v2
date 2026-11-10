"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const errorSummary = Object.values(errors)
    .filter(Boolean)
    .join(" ");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
      localStorage.setItem(
        "spmc_auth_session",
        JSON.stringify({ email: email.trim() })
      );
      router.replace("/dashboard");
    } catch {
      setFormError(
        "We could not create a local session in this browser. Check that site storage is enabled and try again."
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

      <Alert variant="info" className="mt-4">
        Authentication is not yet connected to Supabase. Signing in creates a
        local session only.
      </Alert>

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
          <Input
            type="password"
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

        <div className="flex items-center justify-between gap-3 pt-1">
          <Checkbox
            name="remember"
            label="Remember this device"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
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

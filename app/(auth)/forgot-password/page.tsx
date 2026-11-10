"use client";

import * as React from "react";
import Link from "next/link";
import { AltArrowLeftIcon } from "@solar-icons/react/linear";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState<string | undefined>();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const validate = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Enter your work email.";
    }

    if (!EMAIL_PATTERN.test(value.trim())) {
      return "Enter a valid email address, such as name@spmc.gov.ph.";
    }

    return undefined;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const nextError = validate(email);
    setEmailError(nextError);
    setFormError(null);

    if (nextError) {
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      localStorage.setItem(
        "spmc_password_reset_request",
        JSON.stringify({
          email: email.trim(),
          requestedAt: new Date().toISOString(),
        })
      );
      setSubmitted(true);
    } catch {
      setFormError(
        "We could not record the reset request in this browser. Check that site storage is enabled and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <h1 className="text-xl font-bold text-hospital-text">Check your email</h1>
        <p className="mt-1 text-[13px] text-hospital-text-muted">
          If the address belongs to an account, a reset link will be sent.
        </p>

        <Alert variant="info" className="mt-4">
          The reset request was recorded locally. Email delivery is not
          configured yet.
        </Alert>

        <Link
          href="/login"
          className="mt-5 inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-hospital-border bg-white px-3.5 text-sm font-medium text-hospital-green transition-colors hover:bg-hospital-green-light"
        >
          <AltArrowLeftIcon className="size-4" aria-hidden="true" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-hospital-text">Reset password</h1>
      <p className="mt-1 text-[13px] text-hospital-text-muted">
        Enter your work email to request a reset link.
      </p>

      {formError ? (
        <Alert variant="danger" title="Unable to record request" className="mt-4">
          {formError}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <div aria-live="polite" className="sr-only">
          {emailError ?? ""}
        </div>

        <FormField
          label="Work email"
          htmlFor="work-email"
          required
          error={emailError}
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
              if (emailError) {
                setEmailError(undefined);
              }
            }}
          />
        </FormField>

        <Button type="submit" loading={loading} className="w-full">
          Send reset link
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

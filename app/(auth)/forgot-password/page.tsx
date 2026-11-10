"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [email, setEmail] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Card className="border-hospital-border shadow-xs">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Provide your registered SPMC staff email to receive a password reset token.
        </CardDescription>
      </CardHeader>

      {submitted ? (
        <CardContent className="space-y-4">
          <Alert variant="success" title="Recovery Token Dispatched">
            A password recovery link has been dispatched to <strong>{email}</strong>. Please check your official hospital inbox.
          </Alert>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-hospital-green hover:underline font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Input
              label="Staff Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="username@spmc.gov.ph"
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full">
              Send Password Reset Link
            </Button>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs text-hospital-text-muted hover:text-hospital-green"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Login
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("m.santos@spmc.gov.ph");
  const [password, setPassword] = React.useState("••••••••••••");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const name = email.includes("santos")
        ? "Dr. Maria Santos"
        : email.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase());

      localStorage.setItem(
        "spmc_auth_session",
        JSON.stringify({
          email,
          name,
          role: "project_manager",
        })
      );
    } catch {
      // Ignore
    }

    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 400);
  };

  return (
    <Card className="border-hospital-border shadow-xs">
      <CardHeader>
        <CardTitle>Staff Authentication</CardTitle>
        <CardDescription>
          Sign in using your authorized SPMC medical or engineering credentials.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Alert variant="info" title="Hospital Network Access">
            Authorized personnel only. All access attempts and document generation jobs are audited under Republic Act 10173.
          </Alert>

          <Input
            label="Hospital Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="username@spmc.gov.ph"
          />

          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-hospital-text-muted flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-hospital-green" />
              Role-based RLS
            </span>
            <Link
              href="/forgot-password"
              className="text-hospital-green hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button type="submit" className="w-full" isLoading={loading}>
            Sign In to Platform
          </Button>
          <p className="text-[11px] text-center text-hospital-text-muted">
            Department of Health • Republic of the Philippines
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

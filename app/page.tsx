"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  React.useEffect(() => {
    try {
      const session = localStorage.getItem("spmc_auth_session");
      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-hospital-surface text-xs text-hospital-text-muted">
      Checking SPMC staff authorization...
    </div>
  );
}

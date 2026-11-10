"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const SESSION_KEY = "spmc_auth_session";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(SESSION_KEY)) {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  return <>{children}</>;
}

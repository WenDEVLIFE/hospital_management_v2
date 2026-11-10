"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HospitalProvider } from "@/lib/context/hospital-context";
import { AppShell } from "@/components/layout/app-shell";

function WorkspaceAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  React.useEffect(() => {
    try {
      const session = localStorage.getItem("spmc_auth_session");
      if (!session) {
        router.replace("/login");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  return <>{children}</>;
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HospitalProvider>
      <WorkspaceAuthGuard>
        <AppShell>{children}</AppShell>
      </WorkspaceAuthGuard>
    </HospitalProvider>
  );
}

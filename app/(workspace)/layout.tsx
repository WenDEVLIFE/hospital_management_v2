import * as React from "react";
import { AuthGuard } from "@/components/layout/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { PermissionProvider } from "@/components/providers/permission-provider";
import { ToastProvider } from "@/components/ui/toast";
import { getCurrentUserAccess } from "@/lib/auth/access";

export const instant = false;

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getCurrentUserAccess();

  return (
    <AuthGuard>
      <PermissionProvider
        value={{ isAdmin: access.isAdmin, permissions: access.permissions }}
      >
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </PermissionProvider>
    </AuthGuard>
  );
}

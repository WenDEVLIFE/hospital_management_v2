import * as React from "react";

import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AdminChangeAlerts } from "@/components/providers/admin-change-alerts";
import { PermissionProvider } from "@/components/providers/permission-provider";
import { ToastProvider } from "@/components/ui/toast";
import { getCurrentUserAccess } from "@/lib/auth/access";

/**
 * The workspace shell reads cookies and the database for every request, so the
 * access read sits behind a Suspense boundary. That gives the route a static
 * shell instead of opting the whole subtree out with `instant = false`.
 */
async function WorkspaceContent({ children }: { children: React.ReactNode }) {
  const access = await getCurrentUserAccess();

  if (!access.userId) redirect("/login");
  if (access.profileStatus === "missing") redirect("/login?error=profile");
  if (access.profileStatus === "disabled") redirect("/login?error=disabled");

  return (
    <PermissionProvider
      value={{ isAdmin: access.isAdmin, permissions: access.permissions }}
    >
      <ToastProvider>
        <AdminChangeAlerts />
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </PermissionProvider>
  );
}

function WorkspaceFallback() {
  return (
    <div
      aria-hidden="true"
      className="flex h-dvh flex-col overflow-hidden bg-hospital-surface"
    >
      <div className="h-16 w-full shrink-0 border-b border-hospital-border bg-hospital-green" />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden h-full w-64 shrink-0 bg-hospital-green sm:block" />
        <div className="flex-1 p-6">
          <div className="h-6 w-48 rounded bg-hospital-surface-muted" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-24 rounded-md border border-hospital-border bg-white" />
            <div className="h-24 rounded-md border border-hospital-border bg-white" />
            <div className="h-24 rounded-md border border-hospital-border bg-white" />
            <div className="h-24 rounded-md border border-hospital-border bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={<WorkspaceFallback />}>
      <WorkspaceContent>{children}</WorkspaceContent>
    </React.Suspense>
  );
}

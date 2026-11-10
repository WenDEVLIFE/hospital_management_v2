import * as React from "react";
import { HospitalHeader } from "./hospital-header";
import { HospitalSidebar } from "./hospital-sidebar";
import { Breadcrumbs } from "./breadcrumbs";
import { PreviewNotice } from "./preview-notice";
import { SidebarProvider } from "./sidebar-provider";
import { isPreviewMode } from "@/lib/data/config";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-hospital-surface">
        <React.Suspense
          fallback={
            <div
              aria-hidden="true"
              className="h-16 w-full shrink-0 border-b border-hospital-border bg-white"
            />
          }
        >
          <HospitalHeader />
        </React.Suspense>

        {isPreviewMode ? <PreviewNotice /> : null}

        <div className="flex flex-1 overflow-hidden">
          <React.Suspense
            fallback={
              <div
                aria-hidden="true"
                className="hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-hospital-border bg-white sm:block"
              />
            }
          >
            <HospitalSidebar />
          </React.Suspense>

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1440px] space-y-6 p-6">
              <React.Suspense fallback={null}>
                <Breadcrumbs />
              </React.Suspense>
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

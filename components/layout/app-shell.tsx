"use client";

import * as React from "react";
import { HospitalHeader } from "./hospital-header";
import { HospitalSidebar } from "./hospital-sidebar";
import { Breadcrumbs } from "./breadcrumbs";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-hospital-surface">
      {/* Anchored Hospital Header */}
      <HospitalHeader />

      {/* Main Split Layout: Fixed Sidebar + Scrollable Viewport */}
      <div className="flex flex-1 overflow-hidden">
        <React.Suspense
          fallback={
            <div className="w-64 shrink-0 bg-hospital-white border-r border-hospital-border" />
          }
        >
          <HospitalSidebar />
        </React.Suspense>

        <main className="flex-1 h-full overflow-y-auto flex flex-col">
          <React.Suspense
            fallback={
              <div className="h-10 bg-hospital-white border-b border-hospital-border" />
            }
          >
            <Breadcrumbs />
          </React.Suspense>

          <div className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            <React.Suspense
              fallback={
                <div className="p-6 text-xs text-hospital-text-muted">
                  Loading workspace...
                </div>
              }
            >
              {children}
            </React.Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

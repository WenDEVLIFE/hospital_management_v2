import * as React from "react";
import { BrandPanel } from "@/components/auth/brand-panel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full bg-hospital-surface lg:grid-cols-[minmax(0,1fr)_480px]">
      <BrandPanel />
      <main className="flex items-center justify-center bg-hospital-surface px-4 py-10 sm:px-6 lg:px-4">
        <div className="w-full max-w-md rounded-md border border-hospital-border bg-white p-6 shadow-xs">
          {children}
        </div>
      </main>
    </div>
  );
}

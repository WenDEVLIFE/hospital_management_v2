import * as React from "react";
import { Activity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-hospital-surface p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-hospital-green text-white shadow-xs mb-3">
            <Activity className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-bold text-hospital-green-dark">
            Southern Philippines Medical Center
          </h1>
          <p className="text-xs text-hospital-text-muted mt-1">
            Integrated System & Documentation Generation Platform
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

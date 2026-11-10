"use client";

import * as React from "react";
import { useHospital } from "@/lib/context/hospital-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Save, Shield, Hospital } from "lucide-react";

export default function SettingsPage() {
  const { systemMode } = useHospital();
  const [saved, setSaved] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-hospital-green-dark">
          Platform Settings
        </h1>
        <p className="text-xs text-hospital-text-muted mt-0.5">
          Configure hospital institution defaults, generation parameters, and governance policies
        </p>
      </div>

      {saved && (
        <Alert variant="success" title="Settings Saved">
          Hospital platform configuration updated successfully.
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hospital Institution Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hospital className="w-4 h-4 text-hospital-green" />
              Hospital Institution Profile
            </CardTitle>
            <CardDescription>
              Hospital branding injected into auto-generated documentation and forms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Hospital Name"
                defaultValue="Southern Philippines Medical Center"
                disabled
              />
              <Input
                label="Facility Code"
                defaultValue="DOH-SPMC-DVO-001"
                disabled
              />
            </div>
            <Input
              label="Location / Address"
              defaultValue="J.P. Laurel Avenue, Bajada, Davao City, 8000 Davao del Sur, Philippines"
            />
          </CardContent>
        </Card>

        {/* System Mode Governance (PROJECT.MD §5) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-hospital-green" />
              Governance & System Modes
            </CardTitle>
            <CardDescription>
              Define approval thresholds for Standard vs Complex System Modes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Default System Mode for New Projects"
                defaultValue={systemMode}
                options={[
                  { label: "Standard Mode (1 Sign-off Required)", value: "standard" },
                  { label: "Complex Mode (2+ Multi-Reviewer Sign-offs)", value: "complex" },
                ]}
              />

              <Select
                label="Statutory Audit Retention Policy"
                defaultValue="7_years"
                options={[
                  { label: "7 Years (Standard Clinical DOH Audit)", value: "7_years" },
                  { label: "10 Years (Permanent Statutory Archive)", value: "10_years" },
                ]}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">
              <Save className="w-4 h-4 mr-1.5" /> Save Preferences
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

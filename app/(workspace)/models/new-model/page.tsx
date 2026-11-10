"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHospital } from "@/lib/context/hospital-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  ArrowLeft,
  Cpu,
  Layers,
  Save,
  Building2,
  CheckCircle2,
} from "lucide-react";

export default function CreateSystemModelPage() {
  const router = useRouter();
  const { activeProject } = useHospital();

  const [modelName, setModelName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [systemMode, setSystemMode] = React.useState<"standard" | "complex">("complex");
  const [created, setCreated] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim()) return;

    setCreated(true);
    setTimeout(() => {
      router.push("/models");
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link href="/models">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-1 text-hospital-green" /> Back to Models
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-hospital-green-dark">
            Create System Model Baseline
          </h1>
          <p className="text-xs text-hospital-text-muted mt-0.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-hospital-green" /> Scoped for:{" "}
            <strong>{activeProject.name}</strong> ({activeProject.code})
          </p>
        </div>
      </div>

      {created && (
        <Alert variant="success" title="System Model Initialized">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>New model baseline registered. Redirecting to models workspace...</span>
          </div>
        </Alert>
      )}

      {/* Model Definition Card */}
      <Card className="border border-hospital-border bg-hospital-white">
        <CardHeader className="pb-3 border-b border-hospital-border">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-hospital-green" />
            <CardTitle className="text-sm font-bold text-hospital-text">
              Model Baseline Metadata
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-hospital-text-muted mt-0.5">
            Initial version 1.0 snapshot conforming to SPMC engineering and clinical compliance standards
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Model Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-hospital-text block">
                Model Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. Inpatient Medication Dispensing & High-Alert Verification Model"
                className="w-full bg-hospital-surface px-3 py-2 text-xs text-hospital-text rounded-md border border-hospital-border focus:outline-none focus:ring-1 focus:ring-hospital-green"
              />
            </div>

            {/* System Mode Selection */}
            <div className="space-y-1.5">
              <label className="font-bold text-hospital-text block">
                System Mode (PROJECT.MD §5)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSystemMode("standard")}
                  className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                    systemMode === "standard"
                      ? "border-hospital-green bg-hospital-green-light/40 shadow-xs"
                      : "border-hospital-border bg-hospital-surface hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-hospital-text">Standard Mode</span>
                    <Badge variant="standard" className="text-[9px]">1 Reviewer</Badge>
                  </div>
                  <p className="text-[11px] text-hospital-text-muted leading-relaxed">
                    Designed for single-department modules with direct verification workflow.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSystemMode("complex")}
                  className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                    systemMode === "complex"
                      ? "border-amber-600 bg-amber-50/50 shadow-xs"
                      : "border-hospital-border bg-hospital-surface hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-hospital-text">Complex Mode</span>
                    <Badge variant="complex" className="text-[9px]">2+ Reviewers</Badge>
                  </div>
                  <p className="text-[11px] text-hospital-text-muted leading-relaxed">
                    Cross-department clinical safety, dual sign-off, and impact analysis required.
                  </p>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="font-bold text-hospital-text block">
                Clinical Scope & Architecture Summary
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the medical requirements, primary subsystems, and integration protocols..."
                className="w-full bg-hospital-surface px-3 py-2 text-xs text-hospital-text rounded-md border border-hospital-border focus:outline-none focus:ring-1 focus:ring-hospital-green resize-none leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-hospital-border flex items-center justify-between">
              <Link href="/models">
                <Button size="sm" variant="ghost">
                  Cancel
                </Button>
              </Link>
              <Button size="sm" type="submit">
                <Save className="w-3.5 h-3.5 mr-1.5" /> Initialize Model Baseline
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

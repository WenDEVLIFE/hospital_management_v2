"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useHospital } from "@/lib/context/hospital-context";
import { mockModels } from "@/lib/mock-data/models-data";
import { mockTemplates } from "@/lib/mock-data/documents-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  ArrowLeft,
  Sparkles,
  Building2,
  Cpu,
  CheckCircle2,
} from "lucide-react";

function CreateDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateParam = searchParams.get("template");

  const { activeProject } = useHospital();

  const [selectedTemplateId, setSelectedTemplateId] = React.useState(
    templateParam && mockTemplates.some((t) => t.id === templateParam)
      ? templateParam
      : mockTemplates[0]?.id || "tmpl-sad"
  );
  const [selectedModelId, setSelectedModelId] = React.useState(mockModels[0]?.id || "model-ehr-core");
  const [docTitle, setDocTitle] = React.useState("");
  const [generating, setGenerating] = React.useState(false);

  // Update title default when template is selected
  React.useEffect(() => {
    const tmpl = mockTemplates.find((t) => t.id === selectedTemplateId);
    if (tmpl && !docTitle) {
      setDocTitle(`${activeProject.code} — ${tmpl.name}`);
    }
  }, [selectedTemplateId, activeProject.code, docTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setTimeout(() => {
      router.push("/documents/doc-1");
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link href="/documents">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-1 text-hospital-green" /> Back to Documents
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-hospital-green-dark">
            Generate Document from System Model
          </h1>
          <p className="text-xs text-hospital-text-muted mt-0.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-hospital-green" /> Scoped for:{" "}
            <strong>{activeProject.name}</strong> ({activeProject.code})
          </p>
        </div>
      </div>

      {generating && (
        <Alert variant="success" title="Document Compiled from Model">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Document generated. Redirecting to live split-pane editor...</span>
          </div>
        </Alert>
      )}

      {/* Generator Form Card */}
      <Card className="border border-hospital-border bg-hospital-white">
        <CardHeader className="pb-3 border-b border-hospital-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-hospital-green" />
            <CardTitle className="text-sm font-bold text-hospital-text">
              Document Compilation Parameters
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-hospital-text-muted mt-0.5">
            Select a verified hospital template and source system model baseline
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Template Selection */}
            <div className="space-y-1.5">
              <label className="font-bold text-hospital-text block">
                Select Document Template <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mockTemplates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(t.id);
                      setDocTitle(`${activeProject.code} — ${t.name}`);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      selectedTemplateId === t.id
                        ? "border-hospital-green bg-hospital-green-light/40 shadow-xs"
                        : "border-hospital-border bg-hospital-surface hover:bg-slate-100"
                    }`}
                  >
                    <Badge variant="outline" className="text-[9px] capitalize mb-1">
                      {t.docType.replace("_", " ")}
                    </Badge>
                    <span className="font-bold text-xs text-hospital-text block">
                      {t.name}
                    </span>
                    <span className="text-[10px] text-hospital-text-muted line-clamp-2 mt-0.5 block">
                      {t.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Source Model */}
            <div className="space-y-1.5">
              <label className="font-bold text-hospital-text block">
                Source System Model Baseline <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Cpu className="w-4 h-4 text-hospital-green absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="w-full bg-hospital-surface pl-9 pr-3 py-2 text-xs text-hospital-text font-semibold rounded-md border border-hospital-border focus:outline-none focus:ring-1 focus:ring-hospital-green cursor-pointer"
                >
                  {mockModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (v{m.versionNo}.0 — {m.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Document Title */}
            <div className="space-y-1.5">
              <label className="font-bold text-hospital-text block">
                Document Title
              </label>
              <input
                type="text"
                required
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. SPMC-EHR System Architecture Document v3.0"
                className="w-full bg-hospital-surface px-3 py-2 text-xs text-hospital-text rounded-md border border-hospital-border focus:outline-none focus:ring-1 focus:ring-hospital-green"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-hospital-border flex items-center justify-between">
              <Link href="/documents">
                <Button size="sm" variant="ghost">
                  Cancel
                </Button>
              </Link>
              <Button size="sm" type="submit" isLoading={generating}>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Compile & Open Editor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateDocumentPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-hospital-text-muted">
          Loading document compilation wizard...
        </div>
      }
    >
      <CreateDocumentContent />
    </React.Suspense>
  );
}

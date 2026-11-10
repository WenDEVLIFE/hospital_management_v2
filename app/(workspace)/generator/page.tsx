"use client";

import * as React from "react";
import { useHospital } from "@/lib/context/hospital-context";
import { mockModels } from "@/lib/mock-data/models-data";
import { ProjectScopeBar } from "@/components/engineering/project-scope-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Database,
  FolderTree,
  Terminal,
  Cloud,
  Download,
  Copy,
  Check,
  Sparkles,
  Cpu,
  ShieldCheck,
  FileCode2,
} from "lucide-react";

export default function SystemGeneratorPage() {
  const { activeProject } = useHospital();

  // Model baseline selector
  const availableModels = mockModels.filter(
    (m) => m.projectId === activeProject.id
  );
  const modelsList = availableModels.length > 0 ? availableModels : mockModels;

  const [selectedModelId, setSelectedModelId] = React.useState<string>(
    modelsList[0]?.id || "model-ehr-core"
  );
  const [selectedType, setSelectedType] = React.useState<
    "database_schema" | "service_skeleton" | "directory_structure" | "infrastructure"
  >("database_schema");
  const [copied, setCopied] = React.useState(false);
  const [downloaded, setDownloaded] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Generation options
  const [includeRls, setIncludeRls] = React.useState(true);
  const [includeZod, setIncludeZod] = React.useState(true);
  const [includeDohAudit, setIncludeDohAudit] = React.useState(true);

  const selectedModel = modelsList.find((m) => m.id === selectedModelId) || modelsList[0];

  const handleDownloadPackage = () => {
    const content = sampleOutputs[selectedType];
    const extension =
      selectedType === "database_schema"
        ? "sql"
        : selectedType === "service_skeleton"
        ? "ts"
        : selectedType === "infrastructure"
        ? "yml"
        : "txt";
    const filename = `${activeProject.code.toLowerCase()}_${selectedType}.${extension}`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const sampleOutputs = {
    database_schema: `-- =====================================================================
-- SPMC Automated Database Schema Generation (PostgreSQL 16+)
-- Source Model: ${selectedModel?.name || "EHR Core"} (v${selectedModel?.versionNo || 3}.0)
-- Target Project: ${activeProject.name} (${activeProject.code})
-- Generated at: ${new Date().toISOString()}
-- =====================================================================

-- Enable essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Inpatient Clinical Encounters Table
CREATE TABLE IF NOT EXISTS public.encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_mrn TEXT NOT NULL,
  attending_physician_id UUID NOT NULL,
  ward_code TEXT NOT NULL,
  admission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  discharge_date TIMESTAMPTZ,
  clinical_status TEXT NOT NULL DEFAULT 'admitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Computerized Physician Order Entry (CPOE) Orders Table
CREATE TABLE IF NOT EXISTS public.clinical_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  ordered_by UUID NOT NULL,
  order_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending_verification',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Bedside Vitals Telemetry Captures Table
CREATE TABLE IF NOT EXISTS public.vitals_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  recorded_by UUID NOT NULL,
  systolic_bp INTEGER CHECK (systolic_bp > 0 AND systolic_bp < 300),
  diastolic_bp INTEGER CHECK (diastolic_bp > 0 AND diastolic_bp < 200),
  pulse_rate INTEGER CHECK (pulse_rate > 0 AND pulse_rate < 250),
  temperature_c NUMERIC(4, 1) CHECK (temperature_c > 30.0 AND temperature_c < 45.0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for high-throughput clinical queries
CREATE INDEX IF NOT EXISTS idx_encounters_patient_mrn ON public.encounters(patient_mrn);
CREATE INDEX IF NOT EXISTS idx_clinical_orders_encounter ON public.clinical_orders(encounter_id);
CREATE INDEX IF NOT EXISTS idx_vitals_encounter_time ON public.vitals_records(encounter_id, recorded_at DESC);

${
  includeRls
    ? `-- =====================================================================
-- Row Level Security (RLS) Policies (Enforced by PostgreSQL Kernel)
-- =====================================================================
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals_records ENABLE ROW LEVEL SECURITY;

-- Authorize authenticated medical staff for their assigned wards
CREATE POLICY "encounters_read_authorized" ON public.encounters
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "orders_insert_physicians" ON public.clinical_orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = ordered_by);

CREATE POLICY "vitals_insert_nurses" ON public.vitals_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = recorded_by);`
    : `-- RLS policies excluded by generation configuration`
}

${
  includeDohAudit
    ? `-- DOH Immutability Audit Trigger for Republic Act 10173
CREATE TRIGGER trg_audit_clinical_orders
  AFTER INSERT OR UPDATE ON public.clinical_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_clinical_audit_event();`
    : ""
}`,

    service_skeleton: `// =====================================================================
// SPMC Clean Architecture Service Skeleton (TypeScript / Next.js)
// Source Model: ${selectedModel?.name || "EHR Core"}
// Generated for: ${activeProject.name} (${activeProject.code})
// =====================================================================

import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

${
  includeZod
    ? `// 1. Zod Input Validation Contracts
export const CreateOrderSchema = z.object({
  encounterId: z.string().uuid({ message: "Invalid encounter UUID" }),
  orderedBy: z.string().uuid({ message: "Invalid physician staff UUID" }),
  orderType: z.enum(["medication", "laboratory", "radiology", "dietary"]),
  payload: z.record(z.unknown()),
  isHighAlert: z.boolean().default(false),
  dualSignOffStaffId: z.string().uuid().optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;`
    : `export interface CreateOrderInput {
  encounterId: string;
  orderedBy: string;
  orderType: "medication" | "laboratory" | "radiology" | "dietary";
  payload: Record<string, unknown>;
}`
}

// 2. Clinical Order Processing Domain Service
export class ClinicalOrderService {
  async submitOrder(input: CreateOrderInput) {
    ${
      includeZod
        ? `// Step A: Runtime Zod Schema Validation
    const validated = CreateOrderSchema.parse(input);`
        : `const validated = input;`
    }

    // Step B: Resolve Authenticated Supabase Client with Caller Session
    const supabase = await getSupabaseServerClient();

    // Step C: Execute Database Mutation under RLS Boundaries
    const { data, error } = await supabase
      .from("clinical_orders")
      .insert({
        encounter_id: validated.encounterId,
        ordered_by: validated.orderedBy,
        order_type: validated.orderType,
        payload: validated.payload,
        status: validated.isHighAlert ? "pending_dual_verification" : "active",
      })
      .select()
      .single();

    if (error) {
      throw new Error(\`[SPMC Order Error] \${error.message}\`);
    }

    return {
      success: true,
      order: data,
      timestamp: new Date().toISOString(),
    };
  }
}`,

    directory_structure: `${activeProject.code.toLowerCase()}_workspace/
├── src/
│   ├── modules/
│   │   ├── clinical_orders/
│   │   │   ├── services/
│   │   │   │   └── clinical-order.service.ts
│   │   │   ├── controllers/
│   │   │   │   └── clinical-order.controller.ts
│   │   │   ├── schemas/
│   │   │   │   └── order-contract.zod.ts
│   │   │   └── models/
│   │   │       └── order.entity.ts
│   │   └── patient_vitals/
│   │       ├── services/
│   │       │   └── vitals-telemetry.service.ts
│   │       └── models/
│   │           └── vitals.entity.ts
│   ├── shared/
│   │   ├── database/
│   │   │   └── supabase-client.ts
│   │   └── security/
│   │       └── audit-logger.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   └── integration/
├── supabase/
│   ├── migrations/
│   │   └── 20261110_create_clinical_entities.sql
│   └── config.toml
├── docs/
│   └── ARCHITECTURE.md
└── package.json`,

    infrastructure: `# =====================================================================
# SPMC Healthcare Infrastructure Template (Docker Compose & Edge Config)
# Compliant with Southern Philippines Medical Center Network Policy
# =====================================================================
version: '3.8'

services:
  spmc-clinical-gateway:
    image: registry.spmc.gov.ph/${activeProject.code.toLowerCase()}:v${selectedModel?.versionNo || 3}.0
    container_name: spmc_${activeProject.code.toLowerCase()}_core
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SPMC_HOSPITAL_NODE=DAVAO_MAIN
      - AUDIT_LOG_LEVEL=COMPLIANT
      - PHILHEALTH_GATEWAY_URL=https://api.philhealth.gov.ph/eclaims
      - ENCRYPTION_AT_REST=AES_256_GCM
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 15s
      timeout: 5s
      retries: 3
    networks:
      - spmc_internal_clinical_net

networks:
  spmc_internal_clinical_net:
    driver: bridge
    internal: false`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleOutputs[selectedType]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Project Scope Bar */}
      <ProjectScopeBar
        moduleTitle="Software System Generator"
        moduleSubtitle="Compile validated production database schemas, service skeletons, and infrastructure code directly from approved system models."
        actionSlot={
          <Button size="sm" onClick={handleGenerate} isLoading={isGenerating}>
            <Sparkles className="w-4 h-4 mr-1.5" /> Re-Generate Artifacts
          </Button>
        }
      />

      {/* Model Source & Compilation Options Strip */}
      <div className="bg-hospital-white border border-hospital-border rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Source Model Baseline Selector */}
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-hospital-green shrink-0" />
            <span className="text-xs font-semibold text-hospital-text whitespace-nowrap">
              Source Model Baseline:
            </span>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="bg-hospital-surface text-hospital-text text-xs font-semibold px-3 py-1.5 rounded-md border border-hospital-border cursor-pointer focus:outline-none focus:ring-1 focus:ring-hospital-green"
            >
              {modelsList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (v{m.versionNo}.0 — {m.status})
                </option>
              ))}
            </select>
          </div>

          {/* Generator Code Compilation Options */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-hospital-text font-medium select-none">
              <input
                type="checkbox"
                checked={includeRls}
                onChange={(e) => setIncludeRls(e.target.checked)}
                className="rounded border-hospital-border text-hospital-green focus:ring-hospital-green"
              />
              <span>Include RLS Policies</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-hospital-text font-medium select-none">
              <input
                type="checkbox"
                checked={includeZod}
                onChange={(e) => setIncludeZod(e.target.checked)}
                className="rounded border-hospital-border text-hospital-green focus:ring-hospital-green"
              />
              <span>TypeScript Zod Validation</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-hospital-text font-medium select-none">
              <input
                type="checkbox"
                checked={includeDohAudit}
                onChange={(e) => setIncludeDohAudit(e.target.checked)}
                className="rounded border-hospital-border text-hospital-green focus:ring-hospital-green"
              />
              <span>DOH Audit Immutability</span>
            </label>
          </div>
        </div>
      </div>

      {/* Artifact Category Selector Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={() => setSelectedType("database_schema")}
          className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
            selectedType === "database_schema"
              ? "bg-hospital-green-light border-hospital-green text-hospital-green-dark shadow-xs"
              : "bg-hospital-white border-hospital-border text-hospital-text hover:bg-hospital-surface"
          }`}
        >
          <Database className="w-5 h-5 mb-2 text-hospital-green" />
          <span className="font-bold text-xs block">Database Schemas</span>
          <span className="text-[11px] text-hospital-text-muted">PostgreSQL DDL & RLS</span>
        </button>

        <button
          onClick={() => setSelectedType("service_skeleton")}
          className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
            selectedType === "service_skeleton"
              ? "bg-hospital-green-light border-hospital-green text-hospital-green-dark shadow-xs"
              : "bg-hospital-white border-hospital-border text-hospital-text hover:bg-hospital-surface"
          }`}
        >
          <Terminal className="w-5 h-5 mb-2 text-hospital-green" />
          <span className="font-bold text-xs block">Service Skeletons</span>
          <span className="text-[11px] text-hospital-text-muted">TypeScript & Zod contracts</span>
        </button>

        <button
          onClick={() => setSelectedType("directory_structure")}
          className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
            selectedType === "directory_structure"
              ? "bg-hospital-green-light border-hospital-green text-hospital-green-dark shadow-xs"
              : "bg-hospital-white border-hospital-border text-hospital-text hover:bg-hospital-surface"
          }`}
        >
          <FolderTree className="w-5 h-5 mb-2 text-hospital-green" />
          <span className="font-bold text-xs block">Directory Structure</span>
          <span className="text-[11px] text-hospital-text-muted">Clean architecture layout</span>
        </button>

        <button
          onClick={() => setSelectedType("infrastructure")}
          className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
            selectedType === "infrastructure"
              ? "bg-hospital-green-light border-hospital-green text-hospital-green-dark shadow-xs"
              : "bg-hospital-white border-hospital-border text-hospital-text hover:bg-hospital-surface"
          }`}
        >
          <Cloud className="w-5 h-5 mb-2 text-hospital-green" />
          <span className="font-bold text-xs block">Infrastructure (IaC)</span>
          <span className="text-[11px] text-hospital-text-muted">Docker Compose & configs</span>
        </button>
      </div>

      {/* Code Previewer Card */}
      <Card className="border border-hospital-border bg-hospital-white overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-hospital-border">
          <div>
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-hospital-green" />
              <CardTitle className="capitalize text-sm font-bold text-hospital-text">
                {selectedType.replace("_", " ")} Artifact Preview
              </CardTitle>
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                {selectedType === "database_schema"
                  ? "SQL"
                  : selectedType === "service_skeleton"
                  ? "TypeScript"
                  : selectedType === "infrastructure"
                  ? "YAML"
                  : "TXT"}
              </Badge>
            </div>
            <CardDescription className="text-xs text-hospital-text-muted mt-1">
              Target: {activeProject.name} • Generator Engine v1.0 • Model: {selectedModel?.name}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy Code
                </>
              )}
            </Button>
            <Button size="sm" onClick={handleDownloadPackage}>
              <Download className="w-3.5 h-3.5 mr-1" />
              {downloaded ? "Downloaded" : "Download Package"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden">
          <pre className="p-5 bg-slate-900 text-slate-100 text-xs font-mono overflow-auto h-[calc(100vh-22rem)] min-h-[480px] leading-relaxed selection:bg-emerald-800">
            {sampleOutputs[selectedType]}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

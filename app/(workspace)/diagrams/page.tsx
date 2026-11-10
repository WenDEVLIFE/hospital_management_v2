"use client";

import * as React from "react";
import { useHospital } from "@/lib/context/hospital-context";
import { ProjectScopeBar } from "@/components/engineering/project-scope-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Network,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowRight,
  ArrowDown,
  Layers,
  ShieldCheck,
  RotateCcw,
  GitBranch,
} from "lucide-react";

export default function DiagramsPage() {
  const { activeProject } = useHospital();
  const [diagramType, setDiagramType] = React.useState<
    "component" | "context" | "sequence" | "data_flow"
  >("component");
  const [zoomLevel, setZoomLevel] = React.useState(100);
  const [viewBoundary, setViewBoundary] = React.useState<"all" | "security">("all");
  const [exported, setExported] = React.useState(false);

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Project Scope Bar */}
      <ProjectScopeBar
        moduleTitle="System Architecture Diagrams"
        moduleSubtitle="Browser-rendered visual representations dynamically traceable to approved system models and security boundaries."
        actionSlot={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="w-3.5 h-3.5 mr-1 text-hospital-green" />
              {exported ? "Exported SVG" : "Export SVG / PNG"}
            </Button>
          </div>
        }
      />

      {/* Diagram Type Selector Tabs (PROJECT.MD §4.6) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            id: "component",
            label: "Component Diagram",
            desc: "Subsystems & execution tiers",
            badge: "Clean Architecture",
          },
          {
            id: "context",
            label: "Context Diagram",
            desc: "External clinical actors & APIs",
            badge: "Hospital Boundaries",
          },
          {
            id: "sequence",
            label: "Sequence Diagram",
            desc: "CPOE physician order lifecycle",
            badge: "Dual Sign-off Flow",
          },
          {
            id: "data_flow",
            label: "Data Flow (DFD)",
            desc: "Telemetry, vitals & audit logs",
            badge: "DOH Compliance",
          },
        ].map((type) => (
          <button
            key={type.id}
            onClick={() => setDiagramType(type.id as typeof diagramType)}
            className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
              diagramType === type.id
                ? "bg-hospital-green-light border-hospital-green text-hospital-green-dark shadow-xs"
                : "bg-hospital-white border-hospital-border text-hospital-text hover:bg-hospital-surface"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <Network className="w-4 h-4 text-hospital-green" />
              <Badge variant="outline" className="text-[9px] uppercase font-mono">
                {type.badge}
              </Badge>
            </div>
            <span className="font-bold text-xs block">{type.label}</span>
            <span className="text-[11px] text-hospital-text-muted mt-0.5 block">{type.desc}</span>
          </button>
        ))}
      </div>

      {/* Interactive Diagram Canvas Card */}
      <Card className="border border-hospital-border bg-hospital-white flex flex-col h-[650px] overflow-hidden">
        {/* Canvas Toolbar */}
        <CardHeader className="py-2.5 px-4 border-b border-hospital-border bg-hospital-surface flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <CardTitle className="text-sm font-bold capitalize text-hospital-text">
              {diagramType.replace("_", " ")}
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              Model Baseline: {activeProject.code} v3.0
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* View Boundary Filter */}
            <div className="hidden sm:flex items-center gap-1.5 bg-hospital-white px-2 py-1 rounded border border-hospital-border text-xs">
              <span className="text-[10px] uppercase font-bold text-hospital-text-muted">View:</span>
              <button
                onClick={() => setViewBoundary("all")}
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                  viewBoundary === "all"
                    ? "bg-hospital-green text-white font-semibold"
                    : "text-hospital-text hover:text-hospital-green"
                }`}
              >
                All Tiers
              </button>
              <button
                onClick={() => setViewBoundary("security")}
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium cursor-pointer ${
                  viewBoundary === "security"
                    ? "bg-hospital-green text-white font-semibold"
                    : "text-hospital-text hover:text-hospital-green"
                }`}
              >
                RLS Boundary
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border-l border-hospital-border pl-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5 text-hospital-text-muted" />
              </Button>
              <span className="text-[10px] font-mono font-bold text-hospital-text-muted w-9 text-center">
                {zoomLevel}%
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setZoomLevel((z) => Math.min(z + 15, 140))}
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5 text-hospital-text-muted" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setZoomLevel(100)}
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5 text-hospital-text-muted" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Diagram Canvas Body */}
        <CardContent className="flex-1 p-6 bg-hospital-surface flex items-center justify-center overflow-auto select-none">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
            className="transition-transform duration-150 w-full max-w-4xl"
          >
            {/* 1. Component Diagram */}
            {diagramType === "component" && (
              <div className="bg-hospital-white border-2 border-hospital-border rounded-xl p-8 shadow-xs space-y-6">
                <div className="text-center pb-3 border-b border-hospital-border">
                  <span className="text-[10px] font-bold text-hospital-green uppercase tracking-wider block">
                    Southern Philippines Medical Center • Clinical Architecture
                  </span>
                  <h3 className="text-base font-bold text-hospital-text">
                    {activeProject.name} — Component Boundaries
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Presentation Tier */}
                  <div className="p-5 rounded-lg border-2 border-emerald-500 bg-emerald-50/40 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
                      Presentation Tier (Web / Mobile)
                    </span>
                    <h4 className="text-xs font-bold text-hospital-text">
                      Bedside Vitals & CPOE Web App
                    </h4>
                    <p className="text-[11px] text-hospital-text-muted leading-relaxed">
                      Next.js 16 App Router, React 19, Tailwind CSS. Client-side state managed via React Context.
                    </p>
                    <div className="pt-2 text-[10px] font-mono text-emerald-700 font-semibold">
                      Endpoint: /dashboard, /models
                    </div>
                  </div>

                  {/* Core Domain Engine */}
                  <div className="p-5 rounded-lg border-2 border-hospital-green bg-hospital-green-light/40 space-y-2">
                    <span className="text-[10px] font-bold text-hospital-green-dark uppercase block tracking-wider">
                      Core Domain Engine
                    </span>
                    <h4 className="text-xs font-bold text-hospital-text">
                      Order Processing Service
                    </h4>
                    <p className="text-[11px] text-hospital-text-muted leading-relaxed">
                      TypeScript domain contracts, Zod runtime validation, and dual-authorization verification.
                    </p>
                    <div className="pt-2 text-[10px] font-mono text-hospital-green font-semibold">
                      Execution: Edge Functions / RPC
                    </div>
                  </div>

                  {/* Persistence Tier */}
                  <div className="p-5 rounded-lg border-2 border-sky-500 bg-sky-50/40 space-y-2">
                    <span className="text-[10px] font-bold text-sky-800 uppercase block tracking-wider">
                      Persistence Tier
                    </span>
                    <h4 className="text-xs font-bold text-hospital-text">
                      PostgreSQL Engine & RLS
                    </h4>
                    <p className="text-[11px] text-hospital-text-muted leading-relaxed">
                      Encrypted storage, Row Level Security authorization kernel, and immutable clinical audit logs.
                    </p>
                    <div className="pt-2 text-[10px] font-mono text-sky-700 font-semibold">
                      Policies: 8 Active Policies
                    </div>
                  </div>
                </div>

                {/* Statutory Security Guard Footer */}
                <div className="p-3.5 rounded-lg border border-hospital-border bg-hospital-surface text-center space-y-0.5">
                  <span className="text-[11px] font-bold text-hospital-green-dark flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Adhering to Republic Act 10173 & DOH Inpatient Safety Audits
                  </span>
                  <p className="text-[10px] text-hospital-text-muted">
                    No custom REST/Node backend. Frontend talks directly to Supabase with RLS-governed permissions.
                  </p>
                </div>
              </div>
            )}

            {/* 2. Context Diagram */}
            {diagramType === "context" && (
              <div className="bg-hospital-white border-2 border-hospital-border rounded-xl p-8 shadow-xs space-y-6">
                <div className="text-center pb-3 border-b border-hospital-border">
                  <span className="text-[10px] font-bold text-hospital-green uppercase tracking-wider block">
                    Context Diagram (External Hospital Actors & Subsystems)
                  </span>
                  <h3 className="text-base font-bold text-hospital-text">
                    SPMC Clinical Operating Environment
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg border border-hospital-border bg-hospital-surface text-center space-y-1">
                    <Badge variant="outline" className="text-[9px]">Actor</Badge>
                    <span className="font-bold text-xs block text-hospital-text">Attending Physician</span>
                    <span className="text-[10px] text-hospital-text-muted block">Enters orders via CPOE</span>
                  </div>

                  <div className="p-4 rounded-lg border border-hospital-border bg-hospital-surface text-center space-y-1">
                    <Badge variant="outline" className="text-[9px]">Actor</Badge>
                    <span className="font-bold text-xs block text-hospital-text">Ward Floor Nurse</span>
                    <span className="text-[10px] text-hospital-text-muted block">Records vitals & telemetry</span>
                  </div>

                  <div className="p-4 rounded-lg border border-hospital-border bg-hospital-surface text-center space-y-1">
                    <Badge variant="outline" className="text-[9px]">External API</Badge>
                    <span className="font-bold text-xs block text-hospital-text">PhilHealth e-Claims</span>
                    <span className="text-[10px] text-hospital-text-muted block">Automated claims filing</span>
                  </div>

                  <div className="p-4 rounded-lg border border-hospital-border bg-hospital-surface text-center space-y-1">
                    <Badge variant="outline" className="text-[9px]">Modality</Badge>
                    <span className="font-bold text-xs block text-hospital-text">PACS / Lab Analyzers</span>
                    <span className="text-[10px] text-hospital-text-muted block">HL7 / DICOM transmission</span>
                  </div>
                </div>

                <div className="p-6 rounded-xl border-2 border-hospital-green bg-hospital-green-light/30 text-center space-y-2">
                  <Badge variant="success" className="text-[10px] uppercase">
                    Centralized Platform Kernel
                  </Badge>
                  <h4 className="text-sm font-bold text-hospital-green-dark">
                    SPMC Integrated System Platform ({activeProject.code})
                  </h4>
                  <p className="text-xs text-hospital-text-muted max-w-lg mx-auto">
                    Manages models, generates artifacts, validates statutory compliance, and enforces role-based access.
                  </p>
                </div>
              </div>
            )}

            {/* 3. Sequence Diagram */}
            {diagramType === "sequence" && (
              <div className="bg-hospital-white border-2 border-hospital-border rounded-xl p-8 shadow-xs space-y-4">
                <div className="text-center pb-2 border-b border-hospital-border">
                  <span className="text-[10px] font-bold text-hospital-green uppercase tracking-wider block">
                    Clinical Order Entry Sequence (CPOE Flow)
                  </span>
                  <h3 className="text-base font-bold text-hospital-text">
                    Physician Sign-off to Pharmacy Dispatch Sequence
                  </h3>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-hospital-surface border border-hospital-border">
                    <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                    <div className="flex-1">
                      <span className="font-bold text-hospital-text">Physician (CPOE UI)</span>
                      <span className="text-hospital-text-muted"> ──▶ submitOrder(encounterId, medication, isHighAlert: true)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-hospital-surface border border-hospital-border">
                    <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                    <div className="flex-1">
                      <span className="font-bold text-hospital-text">Order Processing Service</span>
                      <span className="text-hospital-text-muted"> ──▶ validateWithZodSchema() ──▶ Verify Physician Staff MRN</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-hospital-surface border border-hospital-border">
                    <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                    <div className="flex-1">
                      <span className="font-bold text-hospital-text">PostgreSQL Kernel</span>
                      <span className="text-hospital-text-muted"> ──▶ Enforce RLS (orders_insert_physicians) ──▶ INSERT INTO clinical_orders</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-hospital-surface border border-hospital-border">
                    <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0">4</span>
                    <div className="flex-1">
                      <span className="font-bold text-hospital-text">Database Trigger</span>
                      <span className="text-hospital-text-muted"> ──▶ Append-Only INSERT INTO audit_logs ──▶ Dispatch Satellite Pharmacy Queue</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Data Flow Diagram */}
            {diagramType === "data_flow" && (
              <div className="bg-hospital-white border-2 border-hospital-border rounded-xl p-8 shadow-xs space-y-6">
                <div className="text-center pb-3 border-b border-hospital-border">
                  <span className="text-[10px] font-bold text-hospital-green uppercase tracking-wider block">
                    Data Flow Diagram (DFD Level 1)
                  </span>
                  <h3 className="text-base font-bold text-hospital-text">
                    Inpatient Encounter & Vitals Telemetry Flow
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-lg border border-hospital-border bg-hospital-surface space-y-1">
                    <span className="text-[10px] font-bold text-hospital-text-muted uppercase">Source (D1)</span>
                    <h5 className="font-bold text-xs text-hospital-text">Bedside Sensor / Nurse</h5>
                    <p className="text-[10px] text-hospital-text-muted">Vitals capture (BP, Pulse, Temp)</p>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-hospital-green bg-hospital-green-light/40 space-y-1">
                    <span className="text-[10px] font-bold text-hospital-green uppercase">Process (P1)</span>
                    <h5 className="font-bold text-xs text-hospital-text">Range Sanity & Validation</h5>
                    <p className="text-[10px] text-hospital-text-muted">Threshold & critical alarm check</p>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-sky-500 bg-sky-50/40 space-y-1">
                    <span className="text-[10px] font-bold text-sky-700 uppercase">Process (P2)</span>
                    <h5 className="font-bold text-xs text-hospital-text">RLS Authorized Write</h5>
                    <p className="text-[10px] text-hospital-text-muted">PostgreSQL with RLS policy</p>
                  </div>

                  <div className="p-4 rounded-lg border border-hospital-border bg-hospital-surface space-y-1">
                    <span className="text-[10px] font-bold text-hospital-text-muted uppercase">Store (S1)</span>
                    <h5 className="font-bold text-xs text-hospital-text">Immutable Audit Ledger</h5>
                    <p className="text-[10px] text-hospital-text-muted">DOH compliance store</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

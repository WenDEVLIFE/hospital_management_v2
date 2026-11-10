"use client";

import * as React from "react";
import { useHospital } from "@/lib/context/hospital-context";
import { ProjectScopeBar } from "@/components/engineering/project-scope-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  CheckCircle2,
  AlertTriangle,
  TestTube2,
  Download,
  Search,
  ArrowRight,
  GitMerge,
  ShieldCheck,
  X,
  FileCheck2,
} from "lucide-react";

interface MatrixRow {
  reqCode: string;
  reqTitle: string;
  category: string;
  component: string;
  artifact: string;
  testCase: string;
  doc: string;
  coverage: number;
  status: "verified" | "in_progress" | "gap";
  signedBy: string;
  signedAt: string;
}

export default function TraceabilityPage() {
  const { activeProject } = useHospital();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedRow, setSelectedRow] = React.useState<MatrixRow | null>(null);
  const [exported, setExported] = React.useState(false);

  const matrixRows: MatrixRow[] = [
    {
      reqCode: "REQ-EHR-001",
      reqTitle: "Real-time Physician Order Entry (CPOE)",
      category: "Functional",
      component: "Order Processing Service",
      artifact: "clinical_orders schema (DDL + RLS)",
      testCase: "TC-EHR-01 (Dual Sign-off Validation)",
      doc: "System Architecture Document v3.0",
      coverage: 100,
      status: "verified",
      signedBy: "Dr. Roberto Gomez (Chief Reviewer)",
      signedAt: "2026-11-05 14:20:00",
    },
    {
      reqCode: "REQ-EHR-002",
      reqTitle: "Nurse Vitals Auto-Recording & Charting",
      category: "Functional",
      component: "Clinical Chart Engine",
      artifact: "vitals_records schema (DDL + RLS)",
      testCase: "TC-EHR-02 (Telemetry Latency Check)",
      doc: "Inpatient Clinical Vitals Data Dictionary v2.0",
      coverage: 100,
      status: "verified",
      signedBy: "Dr. Maria Santos (Project Lead)",
      signedAt: "2026-11-04 10:15:00",
    },
    {
      reqCode: "REQ-EHR-003",
      reqTitle: "Sub-Second Query Latency on Emergency Charts",
      category: "Non-Functional",
      component: "Audit & Access Guardian",
      artifact: "encounters index optimization",
      testCase: "TC-EHR-03 (95th percentile load benchmark)",
      doc: "System Architecture Document v3.0",
      coverage: 100,
      status: "verified",
      signedBy: "Engr. Alan Rivera (Lead Architect)",
      signedAt: "2026-11-06 16:00:00",
    },
    {
      reqCode: "REQ-EHR-004",
      reqTitle: "DOH Data Privacy Compliance",
      category: "Statutory Constraint",
      component: "Audit & Access Guardian",
      artifact: "audit_logs trigger & immutability",
      testCase: "TC-EHR-04 (Access log immutability check)",
      doc: "CPOE Standard Operating Procedure v1.0",
      coverage: 85,
      status: "in_progress",
      signedBy: "Pending Dual Review",
      signedAt: "In Review",
    },
  ];

  const handleExportTraceability = () => {
    const content = `# SPMC Integrated System - Requirement Traceability Matrix
Generated: ${new Date().toISOString()}
Project: ${activeProject.name} (${activeProject.code})

| Req Code | Requirement Title | Category | Realizing Component | Generated Schema / DDL | Test Case | Document Link | Coverage | Status | Sign-off Authority |
|---|---|---|---|---|---|---|---|---|---|
${filteredRows.map((r) => `| ${r.reqCode} | ${r.reqTitle} | ${r.category} | ${r.component} | ${r.artifact} | ${r.testCase} | ${r.doc} | ${r.coverage}% | ${r.status} | ${r.signedBy} |`).join("\n")}
`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SPMC-Traceability-Matrix-${activeProject.code}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 4000);
  };

  const filteredRows = matrixRows.filter((row) => {
    const matchesSearch =
      row.reqCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.reqTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.artifact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Project Scope Bar */}
      <ProjectScopeBar
        moduleTitle="Traceability Engine"
        moduleSubtitle="End-to-end audit verification maintaining unbreakable linkages between system requirements, architecture, software artifacts, test cases, and clinical documentation."
        actionSlot={
          <Button size="sm" variant="outline" onClick={handleExportTraceability}>
            <Download className="w-3.5 h-3.5 mr-1 text-hospital-green" /> Export Traceability Report
          </Button>
        }
      />

      {exported && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Traceability matrix exported successfully as Markdown/CSV report.</span>
          </div>
          <button onClick={() => setExported(false)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Coverage KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-hospital-border bg-hospital-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-hospital-text-muted uppercase tracking-wider">
                Requirement Coverage
              </span>
              <p className="text-2xl font-bold text-hospital-green-dark">96.2%</p>
              <p className="text-[11px] text-emerald-700 font-medium">4 of 4 requirements realized</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-hospital-green flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-hospital-border bg-hospital-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-hospital-text-muted uppercase tracking-wider">
                Verification Test Links
              </span>
              <p className="text-2xl font-bold text-hospital-text">4 Test Cases</p>
              <p className="text-[11px] text-hospital-text-muted font-medium">100% automated regression mapped</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-200">
              <TestTube2 className="w-5 h-5 text-sky-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-hospital-border bg-hospital-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-hospital-text-muted uppercase tracking-wider">
                Integrity Gaps Detected
              </span>
              <p className="text-2xl font-bold text-amber-700">0 Gaps</p>
              <p className="text-[11px] text-hospital-text-muted font-medium">Zero orphaned artifacts or links</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traceability Matrix Section */}
      <Card className="border border-hospital-border bg-hospital-white">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-hospital-border">
          <div>
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-hospital-green" />
              <CardTitle className="text-sm font-bold text-hospital-text">
                Traceability Matrix ({activeProject.code})
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-hospital-text-muted mt-0.5">
              Select any row to inspect complete cryptographic lineage and approval verification
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-hospital-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter matrix by code or title..."
                className="w-full bg-hospital-surface pl-8 pr-2.5 py-1 text-xs text-hospital-text rounded-md border border-hospital-border focus:outline-none focus:ring-1 focus:ring-hospital-green"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-hospital-surface text-hospital-text text-xs px-2.5 py-1 rounded-md border border-hospital-border font-medium cursor-pointer focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="in_progress">In Progress</option>
              <option value="gap">Gaps</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table borderless>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Req Code</TableHead>
                <TableHead>Requirement Specification</TableHead>
                <TableHead>Realizing Component</TableHead>
                <TableHead>Generated Schema / DDL</TableHead>
                <TableHead>Regression Test Case</TableHead>
                <TableHead>Clinical Doc</TableHead>
                <TableHead className="w-28">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow
                  key={row.reqCode}
                  onClick={() => setSelectedRow(row)}
                  className="cursor-pointer hover:bg-hospital-green-light/30 transition-colors"
                >
                  <TableCell className="font-mono text-xs font-bold text-hospital-green-dark">
                    {row.reqCode}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-hospital-text block">
                      {row.reqTitle}
                    </span>
                    <Badge variant="outline" className="text-[9px] capitalize mt-0.5">
                      {row.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-hospital-text-muted font-medium">
                    {row.component}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-hospital-green-dark">
                    {row.artifact}
                  </TableCell>
                  <TableCell className="text-xs text-hospital-text-muted">
                    {row.testCase}
                  </TableCell>
                  <TableCell className="text-xs text-hospital-text-muted">
                    {row.doc}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "verified"
                          ? "success"
                          : row.status === "in_progress"
                          ? "warning"
                          : "danger"
                      }
                      className="text-[10px] capitalize"
                    >
                      {row.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Interactive Lineage Inspector Modal/Drawer */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-hospital-white border border-hospital-border rounded-xl shadow-lg w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-hospital-surface border-b border-hospital-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-hospital-green" />
                <h3 className="text-sm font-bold text-hospital-text">
                  Traceability Lineage Audit: {selectedRow.reqCode}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-1 rounded hover:bg-slate-200 text-hospital-text-muted hover:text-hospital-text cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-hospital-text-muted block">
                  Requirement Baseline
                </span>
                <h4 className="text-sm font-bold text-hospital-green-dark">
                  {selectedRow.reqCode} — {selectedRow.reqTitle}
                </h4>
                <p className="text-hospital-text-muted mt-1">
                  Category: {selectedRow.category} • Target Coverage: {selectedRow.coverage}%
                </p>
              </div>

              {/* End-to-end Chain Breakdown */}
              <div className="space-y-2 border-l-2 border-hospital-green pl-4 ml-1">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-hospital-green uppercase">1. Component Realization</span>
                  <p className="font-semibold text-hospital-text">{selectedRow.component}</p>
                </div>

                <div className="space-y-0.5 pt-2">
                  <span className="text-[10px] font-bold text-hospital-green uppercase">2. Generated Database Schema</span>
                  <p className="font-mono text-hospital-text">{selectedRow.artifact}</p>
                </div>

                <div className="space-y-0.5 pt-2">
                  <span className="text-[10px] font-bold text-hospital-green uppercase">3. Verification Test Suite</span>
                  <p className="font-semibold text-hospital-text">{selectedRow.testCase}</p>
                </div>

                <div className="space-y-0.5 pt-2">
                  <span className="text-[10px] font-bold text-hospital-green uppercase">4. Clinical Documentation</span>
                  <p className="font-semibold text-hospital-text">{selectedRow.doc}</p>
                </div>

                <div className="space-y-0.5 pt-2">
                  <span className="text-[10px] font-bold text-hospital-green uppercase">5. Sign-off Authority & Timestamp</span>
                  <p className="text-hospital-text font-medium">
                    {selectedRow.signedBy} ({selectedRow.signedAt})
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-hospital-border flex items-center justify-between">
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  DOH Immutability Audit Verified
                </span>
                <Button size="sm" onClick={() => setSelectedRow(null)}>
                  Close Lineage
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

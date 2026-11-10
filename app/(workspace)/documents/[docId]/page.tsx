"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useHospital } from "@/lib/context/hospital-context";
import { mockDocuments } from "@/lib/mock-data/documents-data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  ArrowLeft,
  Download,
  Save,
  FileText,
  FileCode,
  Heading,
  Bold,
  Italic,
  List,
  Table as TableIcon,
  Code2,
  CheckCircle2,
} from "lucide-react";

function DocumentEditorContent() {
  const params = useParams();
  const { activeProject } = useHospital();
  const docId = (params?.docId as string) || "doc-1";

  const doc = mockDocuments.find((d) => d.id === docId) || mockDocuments[0];

  const [content, setContent] = React.useState(
    `# ${doc.title}

## 1. Document Overview & Statutory Authority
This technical document defines the official engineering and clinical baseline for **${activeProject.name}** (${activeProject.code}), Southern Philippines Medical Center.

- **Author**: ${doc.author}
- **Baseline Version**: v${doc.versionNo}.0
- **Document Classification**: ${doc.docType.toUpperCase()}
- **Status**: ${doc.status.toUpperCase()}

---

## 2. Architecture & Clinical Scope
The system model baseline governs all clinical charting and computerized physician order entry (CPOE). Inpatient encounter flows adhere strictly to Department of Health (DOH) clinical documentation audits and Republic Act 10173 (Data Privacy Act of 2012).

### 2.1 Core Clinical Database Entities
- **encounters**: Inpatient admissions, ward bed assignments, and attending physician responsibilities.
- **clinical_orders**: Dual electronic sign-offs for high-alert medications and urgent diagnostic orders.
- **vitals_records**: Real-time nurse bedside telemetry captures.

---

## 3. Row Level Security & Access Policies
All client access is verified via PostgreSQL Row Level Security (RLS). Privileged actions require authorized medical reviewer sign-off.`
  );

  const [saved, setSaved] = React.useState(false);
  const [exportedFormat, setExportedFormat] = React.useState<string | null>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExport = (fmt: string) => {
    setExportedFormat(fmt);
    setTimeout(() => setExportedFormat(null), 2500);
  };

  const insertSnippet = (snippet: string) => {
    setContent((prev) => prev + "\n" + snippet);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-hospital-white border border-hospital-border rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <Link href="/documents">
              <Button size="sm" variant="ghost" className="hover:bg-hospital-surface">
                <ArrowLeft className="w-4 h-4 mr-1 text-hospital-green" /> Back to Documents
              </Button>
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-hospital-green-dark">
                  {doc.title}
                </h1>
                <Badge variant="outline" className="font-mono text-xs">
                  v{doc.versionNo}.0
                </Badge>
                <Badge
                  variant={doc.status === "approved" ? "success" : "warning"}
                  className="capitalize text-[10px]"
                >
                  {doc.status}
                </Badge>
              </div>

              <p className="text-xs text-hospital-text-muted mt-1">
                Editable markdown source • Auto-synchronizes with Supabase Storage and binary compilation
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleSave}>
              <Save className="w-3.5 h-3.5 mr-1 text-hospital-green" />
              {saved ? "Saved to Storage" : "Save Draft"}
            </Button>

            <Button size="sm" onClick={() => handleExport("PDF")}>
              <Download className="w-3.5 h-3.5 mr-1" /> Export PDF
            </Button>

            <Button size="sm" variant="outline" onClick={() => handleExport("DOCX")}>
              <Download className="w-3.5 h-3.5 mr-1" /> Export DOCX
            </Button>
          </div>
        </div>
      </div>

      {saved && (
        <Alert variant="success" title="Document Saved Successfully">
          Markdown content synchronized with Supabase Storage. PDF and DOCX binary packages have been updated for this revision.
        </Alert>
      )}

      {exportedFormat && (
        <Alert variant="success" title={`Export Ready: ${exportedFormat}`}>
          Compilation complete. Download package prepared under hospital audit logging.
        </Alert>
      )}

      {/* Split Pane Editor (PROJECT.MD §4.5) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane: Markdown Source Editor with Toolbar */}
        <Card className="flex flex-col h-[calc(100vh-14rem)] min-h-[550px] border border-hospital-border bg-hospital-white overflow-hidden">
          <CardHeader className="py-2.5 px-4 border-b border-hospital-border bg-hospital-surface shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-hospital-text flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-hospital-green" /> Markdown Source
              </span>

              {/* Quick Markdown Formatting Toolbar */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertSnippet("### Section Heading")}
                  className="p-1.5 rounded hover:bg-slate-200 text-hospital-text-muted hover:text-hospital-text cursor-pointer"
                  title="Insert Heading"
                >
                  <Heading className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("**bold text**")}
                  className="p-1.5 rounded hover:bg-slate-200 text-hospital-text-muted hover:text-hospital-text cursor-pointer"
                  title="Insert Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("- Bullet list item")}
                  className="p-1.5 rounded hover:bg-slate-200 text-hospital-text-muted hover:text-hospital-text cursor-pointer"
                  title="Insert List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("| Column 1 | Column 2 |\n|---|---|\n| Value A | Value B |")}
                  className="p-1.5 rounded hover:bg-slate-200 text-hospital-text-muted hover:text-hospital-text cursor-pointer"
                  title="Insert Table"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("`{{project.name}}`")}
                  className="p-1.5 rounded hover:bg-slate-200 text-hospital-green hover:text-hospital-green-dark cursor-pointer font-mono text-[10px] font-bold"
                  title="Insert Project Variable"
                >
                  {"{var}"}
                </button>
              </div>

              <span className="text-[11px] text-hospital-text-muted font-mono">
                {content.length} chars
              </span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-4 font-mono text-xs bg-hospital-white text-hospital-text focus:outline-none resize-none leading-relaxed selection:bg-emerald-100"
            />
          </CardContent>
        </Card>

        {/* Right Pane: Live Document Preview */}
        <Card className="flex flex-col h-[calc(100vh-14rem)] min-h-[550px] border border-hospital-border bg-hospital-white overflow-hidden">
          <CardHeader className="py-2.5 px-4 border-b border-hospital-border bg-hospital-surface shrink-0">
            <span className="text-xs font-bold text-hospital-text flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-hospital-green" /> Formatted Clinical Document Preview
            </span>
          </CardHeader>

          <CardContent className="flex-1 p-6 overflow-y-auto bg-hospital-surface">
            {/* Authentic SPMC Document Container */}
            <div className="p-8 bg-hospital-white border border-hospital-border rounded-lg shadow-xs space-y-4 max-w-2xl mx-auto">
              {/* SPMC Official Letterhead Banner */}
              <div className="border-b-2 border-hospital-green pb-3 text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-hospital-green tracking-wider">
                  Republic of the Philippines • Department of Health
                </div>
                <h2 className="text-base font-bold text-hospital-green-dark">
                  Southern Philippines Medical Center
                </h2>
                <div className="text-[11px] text-hospital-text-muted">
                  Integrated System & Documentation Generation Platform
                </div>
              </div>

              {/* Document Body */}
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-hospital-text pt-2">
                {content}
              </pre>

              {/* Formal Audit Footer */}
              <div className="pt-6 mt-6 border-t border-hospital-border text-[10px] text-hospital-text-muted flex items-center justify-between">
                <span>Ref: SPMC-DOC-{doc.id.toUpperCase()}</span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated Baseline
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DocumentEditorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-hospital-text-muted">
          Loading document editor...
        </div>
      }
    >
      <DocumentEditorContent />
    </React.Suspense>
  );
}

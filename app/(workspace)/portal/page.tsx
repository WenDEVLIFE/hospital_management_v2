"use client";

import * as React from "react";
import { mockDocuments } from "@/lib/mock-data/documents-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {
  Search,
  Download,
  Calendar,
  Lock,
  CheckCircle2,
} from "lucide-react";

export default function DocumentPortalPage() {
  const [search, setSearch] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");
  const [downloadingDocId, setDownloadingDocId] = React.useState<string | null>(null);
  const [downloadSuccessTitle, setDownloadSuccessTitle] = React.useState<string | null>(null);

  const approvedDocs = mockDocuments.filter(
    (d) => d.status === "approved" || d.status === "submitted"
  );

  const filteredDocs = approvedDocs.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.contentSnippet.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      filterType === "all" || d.docType === filterType;
    return matchesSearch && matchesType;
  });

  const handleDownloadDoc = (doc: (typeof mockDocuments)[0]) => {
    setDownloadingDocId(doc.id);
    setTimeout(() => {
      const content =
        `# ${doc.title}\n\n` +
        `Official SPMC Healthcare Document Specification\n` +
        `Document Classification: ${doc.docType.toUpperCase()}\n` +
        `Baseline Version: v${doc.versionNo}.0\n` +
        `Approval Status: ${doc.status.toUpperCase()}\n` +
        `Author: ${doc.author}\n` +
        `Last Updated: ${doc.updatedAt}\n\n` +
        `---\n\n` +
        `## 1. Executive Summary\n${doc.contentSnippet}\n\n` +
        `---\nSouthern Philippines Medical Center • Cryptographically Verified Clinical Baseline\n`;

      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadingDocId(null);
      setDownloadSuccessTitle(doc.title);
      setTimeout(() => setDownloadSuccessTitle(null), 3000);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hospital-green-dark">
            Hospital Documentation Portal
          </h1>
          <p className="text-xs text-hospital-text-muted mt-0.5">
            Published, approved technical and operational documentation repository for Southern Philippines Medical Center
          </p>
        </div>
      </div>

      {downloadSuccessTitle && (
        <Alert variant="success" title="Document Download Initialized">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>
              Secure download of <strong>{downloadSuccessTitle}</strong> completed under authenticated audit.
            </span>
          </div>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-hospital-white p-3 rounded-md border border-hospital-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-hospital-text-muted pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search approved specifications, manuals, and data dictionaries..."
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {["all", "technical", "data_dictionary", "operational"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize ${
                filterType === t
                  ? "bg-hospital-green text-white font-semibold"
                  : "bg-hospital-surface text-hospital-text hover:bg-hospital-surface-muted border border-hospital-border"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => (
          <Card key={doc.id} className="hover:border-hospital-green transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {doc.docType.replace("_", " ")}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-hospital-text-muted">
                    v{doc.versionNo}.0
                  </span>
                  <Badge variant={doc.status === "approved" ? "success" : "warning"}>
                    {doc.status}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-base mt-1.5">{doc.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {doc.contentSnippet}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-between text-xs pt-2 border-t border-hospital-border-subtle">
                <span className="text-hospital-text-muted flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1">
                  {doc.formats.map((fmt) => (
                    <span
                      key={fmt}
                      className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-700"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-hospital-text-muted flex items-center gap-1">
                  <Lock className="w-3 h-3 text-hospital-green" /> Authenticated Access
                </span>
                <Button
                  size="sm"
                  onClick={() => handleDownloadDoc(doc)}
                  isLoading={downloadingDocId === doc.id}
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

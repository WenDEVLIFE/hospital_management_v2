"use client";

import * as React from "react";
import Link from "next/link";
import { useHospital } from "@/lib/context/hospital-context";
import { mockDocuments, mockTemplates, GeneratedDocument } from "@/lib/mock-data/documents-data";
import { ProjectScopeBar } from "@/components/engineering/project-scope-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sparkles,
  ArrowRight,
  FileText,
  Search,
  BookOpen,
  Calendar,
  User,
} from "lucide-react";

function DocumentGeneratorContent() {
  const { activeProject } = useHospital();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");

  // Filter docs for active project
  const projectDocs = mockDocuments.filter(
    (d) => d.projectId === activeProject.id
  );
  const displayedDocs = projectDocs.length > 0 ? projectDocs : mockDocuments;

  const filteredDocs = displayedDocs.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || doc.docType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Project Scope Bar */}
      <ProjectScopeBar
        moduleTitle="Documentation Generator Engine"
        moduleSubtitle="Produce official hospital technical specifications, statutory clinical forms, and data dictionaries synchronized directly with approved models."
        actionSlot={
          <Link href="/documents/new">
            <Button size="sm">
              <Sparkles className="w-4 h-4 mr-1.5" /> Generate Document from Model
            </Button>
          </Link>
        }
      />

      {/* Standard Hospital Templates Gallery */}
      <Card className="border border-hospital-border bg-hospital-white">
        <CardHeader className="pb-3 border-b border-hospital-border">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-hospital-green" />
            <CardTitle className="text-sm font-bold text-hospital-text">
              Standard Hospital Document Templates
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-hospital-text-muted mt-0.5">
            Clinical and technical templates conforming to Southern Philippines Medical Center standards
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {mockTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-3.5 rounded-lg border border-hospital-border bg-hospital-surface hover:border-hospital-green hover:bg-hospital-green-light/20 transition-all flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {tmpl.docType.replace("_", " ")}
                </Badge>
                <h4 className="font-bold text-xs text-hospital-text">
                  {tmpl.name}
                </h4>
                <p className="text-[11px] text-hospital-text-muted leading-relaxed line-clamp-2">
                  {tmpl.description}
                </p>
              </div>

              <div className="pt-3">
                <Link href={`/documents/new?template=${tmpl.id}`}>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    Apply Template
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Generated Project Documents Section */}
      <Card className="border border-hospital-border bg-hospital-white">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-hospital-border">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-hospital-green" />
              <CardTitle className="text-sm font-bold text-hospital-text">
                Generated Documents
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {displayedDocs.length} compiled
              </Badge>
            </div>
            <CardDescription className="text-xs text-hospital-text-muted mt-0.5">
              Live documentation compiled for {activeProject.name}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-hospital-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by title..."
                className="w-full bg-hospital-surface pl-8 pr-2.5 py-1 text-xs text-hospital-text rounded-md border border-hospital-border focus:outline-none focus:ring-1 focus:ring-hospital-green"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-hospital-surface text-hospital-text text-xs px-2.5 py-1 rounded-md border border-hospital-border font-medium cursor-pointer focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="technical">Technical</option>
              <option value="system">System SRS</option>
              <option value="data_dictionary">Data Dictionary</option>
              <option value="operational">Operational SOP</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table borderless>
            <TableHeader>
              <TableRow>
                <TableHead>Document Title & Author</TableHead>
                <TableHead className="w-36">Category</TableHead>
                <TableHead className="w-24">Version</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-48">Export Formats</TableHead>
                <TableHead className="w-32 text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <span className="font-bold text-xs text-hospital-text block">
                      {doc.title}
                    </span>
                    <span className="text-[11px] text-hospital-text-muted mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {doc.author}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {doc.docType.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-hospital-green-dark">
                    v{doc.versionNo}.0
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        doc.status === "approved"
                          ? "success"
                          : doc.status === "submitted"
                          ? "warning"
                          : "default"
                      }
                      className="text-[10px] capitalize"
                    >
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Link href={`/documents/${doc.id}`}>
                      <Button size="sm" variant="outline">
                        Editor <ArrowRight className="w-3 h-3 ml-1 text-hospital-green" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DocumentGeneratorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-hospital-text-muted">
          Loading document generator...
        </div>
      }
    >
      <DocumentGeneratorContent />
    </React.Suspense>
  );
}

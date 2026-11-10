"use client";

import * as React from "react";
import Link from "next/link";
import { useHospital } from "@/lib/context/hospital-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockAuditLogs } from "@/lib/mock-data/audit-data";
import {
  FolderGit2,
  Cpu,
  FileCheck2,
  ClipboardCheck,
  Activity,
  ArrowRight,
  Boxes,
  Clock,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const { projects, activeProject } = useHospital();

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalModels = projects.reduce((acc, p) => acc + p.modelsCount, 0);
  const totalDocuments = projects.reduce((acc, p) => acc + p.documentsCount, 0);
  const totalPendingApprovals = projects.reduce((acc, p) => acc + p.pendingApprovalsCount, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-md border border-hospital-green-border bg-hospital-green-light/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-hospital-green-dark">
              Hospital Systems Dashboard
            </h1>
            <Badge variant={activeProject.systemMode === "complex" ? "complex" : "standard"}>
              {activeProject.systemMode === "complex" ? "Complex Mode" : "Standard Mode"}
            </Badge>
          </div>
          <p className="text-xs text-hospital-text-muted">
            Managing <strong className="text-hospital-text">{activeProject.name}</strong> ({activeProject.code})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/generator">
            <Button size="sm" variant="outline">
              <Boxes className="w-4 h-4 mr-1 text-hospital-green" />
              Artifact Generator
            </Button>
          </Link>
          <Link href="/documents">
            <Button size="sm">
              <Sparkles className="w-4 h-4 mr-1" />
              Generate Docs
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards (PROJECT.MD §10) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-hospital-text-muted uppercase tracking-wider">
                Total Projects
              </p>
              <p className="text-2xl font-bold text-hospital-text">{totalProjects}</p>
              <p className="text-[11px] text-emerald-700 font-medium">
                {activeProjects} currently active
              </p>
            </div>
            <div className="h-10 w-10 rounded-md bg-emerald-50 text-hospital-green flex items-center justify-center">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-hospital-text-muted uppercase tracking-wider">
                System Models
              </p>
              <p className="text-2xl font-bold text-hospital-text">{totalModels}</p>
              <p className="text-[11px] text-hospital-text-muted">
                Approved & verified
              </p>
            </div>
            <div className="h-10 w-10 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-hospital-text-muted uppercase tracking-wider">
                Generated Docs
              </p>
              <p className="text-2xl font-bold text-hospital-text">{totalDocuments}</p>
              <p className="text-[11px] text-hospital-text-muted">
                DOCX, PDF, HTML, MD
              </p>
            </div>
            <div className="h-10 w-10 rounded-md bg-hospital-green-light text-hospital-green flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-hospital-text-muted uppercase tracking-wider">
                Pending Approvals
              </p>
              <p className="text-2xl font-bold text-amber-700">{totalPendingApprovals}</p>
              <p className="text-[11px] text-amber-800 font-medium">
                Awaiting clinical sign-off
              </p>
            </div>
            <div className="h-10 w-10 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-hospital-text-muted uppercase tracking-wider">
                Generator Engine
              </p>
              <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </p>
              <p className="text-[11px] text-hospital-text-muted">
                Client-side ready
              </p>
            </div>
            <div className="h-10 w-10 rounded-md bg-hospital-surface-muted text-hospital-text flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Active Project Highlights & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Project Overview & Workspaces */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active System Scope</CardTitle>
                <CardDescription>
                  {activeProject.name} ({activeProject.code})
                </CardDescription>
              </div>
              <Link href={`/projects/${activeProject.id}`}>
                <Button size="sm" variant="ghost">
                  View Project Detail <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-hospital-text leading-relaxed">
                {activeProject.description}
              </p>

              <div className="p-3.5 rounded-md bg-hospital-surface border border-hospital-border text-xs space-y-2">
                <span className="font-semibold text-hospital-green-dark">Clinical Objectives:</span>
                <p className="text-hospital-text-muted">{activeProject.objectives}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-3 rounded-md bg-hospital-surface-muted border border-hospital-border text-center">
                  <span className="text-[11px] text-hospital-text-muted block">System Models</span>
                  <span className="text-lg font-bold text-hospital-green-dark">{activeProject.modelsCount}</span>
                </div>
                <div className="p-3 rounded-md bg-hospital-surface-muted border border-hospital-border text-center">
                  <span className="text-[11px] text-hospital-text-muted block">Generated Docs</span>
                  <span className="text-lg font-bold text-hospital-green-dark">{activeProject.documentsCount}</span>
                </div>
                <div className="p-3 rounded-md bg-hospital-surface-muted border border-hospital-border text-center">
                  <span className="text-[11px] text-hospital-text-muted block">Project Members</span>
                  <span className="text-lg font-bold text-hospital-green-dark">{activeProject.members.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Module Navigation Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Clinical Engineering Workspaces</CardTitle>
              <CardDescription>
                Direct access to core generation and modeling engines for {activeProject.code}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link
                href="/models"
                className="p-3 rounded-md border border-hospital-border bg-hospital-white hover:bg-hospital-green-light/40 hover:border-hospital-green transition-colors text-xs font-medium space-y-1"
              >
                <div className="text-hospital-green font-semibold">3. System Models</div>
                <div className="text-[11px] text-hospital-text-muted">Define Reqs, Comps & Entities</div>
              </Link>
              <Link
                href="/generator"
                className="p-3 rounded-md border border-hospital-border bg-hospital-white hover:bg-hospital-green-light/40 hover:border-hospital-green transition-colors text-xs font-medium space-y-1"
              >
                <div className="text-hospital-green font-semibold">4. System Generator</div>
                <div className="text-[11px] text-hospital-text-muted">Schemas, Skeletons & IaC</div>
              </Link>
              <Link
                href="/documents"
                className="p-3 rounded-md border border-hospital-border bg-hospital-white hover:bg-hospital-green-light/40 hover:border-hospital-green transition-colors text-xs font-medium space-y-1"
              >
                <div className="text-hospital-green font-semibold">5. Doc Generator</div>
                <div className="text-[11px] text-hospital-text-muted">SAD, SRS & Clinical Forms</div>
              </Link>
              <Link
                href="/diagrams"
                className="p-3 rounded-md border border-hospital-border bg-hospital-white hover:bg-hospital-green-light/40 hover:border-hospital-green transition-colors text-xs font-medium space-y-1"
              >
                <div className="text-hospital-green font-semibold">6. Diagrams</div>
                <div className="text-[11px] text-hospital-text-muted">Context, Component & Sequence</div>
              </Link>
              <Link
                href="/traceability"
                className="p-3 rounded-md border border-hospital-border bg-hospital-white hover:bg-hospital-green-light/40 hover:border-hospital-green transition-colors text-xs font-medium space-y-1"
              >
                <div className="text-hospital-green font-semibold">7. Traceability</div>
                <div className="text-[11px] text-hospital-text-muted">Requirements Matrix & Gaps</div>
              </Link>
              <Link
                href="/reviews"
                className="p-3 rounded-md border border-hospital-border bg-hospital-white hover:bg-hospital-green-light/40 hover:border-hospital-green transition-colors text-xs font-medium space-y-1"
              >
                <div className="text-hospital-green font-semibold">8. Reviews & Sign-offs</div>
                <div className="text-[11px] text-hospital-text-muted">Multi-Reviewer Workflow</div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Activity Timeline */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Audited hospital platform changes</CardDescription>
              </div>
              <Link href="/admin/audit" className="text-xs text-hospital-green hover:underline font-medium">
                Full Audit Log
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockAuditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-md border border-hospital-border-subtle bg-hospital-surface text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-hospital-green-dark">
                      {log.actorName}
                    </span>
                    <span className="text-[10px] text-hospital-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-hospital-text">{log.details}</p>
                  <Badge variant="outline" className="text-[10px] py-0 px-2">
                    {log.projectCode}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

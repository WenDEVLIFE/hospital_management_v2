"use client";

import * as React from "react";
import Link from "next/link";
import { useHospital } from "@/lib/context/hospital-context";
import { mockModels, SystemModel } from "@/lib/mock-data/models-data";
import { ProjectScopeBar } from "@/components/engineering/project-scope-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  GitBranch,
  ArrowRight,
  Calendar,
  Search,
  CheckCircle2,
  Cpu,
  Layers,
  FileCode2,
  Clock,
} from "lucide-react";

function SystemModelsContent() {
  const { activeProject } = useHospital();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [modeFilter, setModeFilter] = React.useState<"all" | "standard" | "complex">("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "approved" | "draft" | "submitted">("all");

  // Filter models belonging to active project (or matching active project id)
  const projectModels = mockModels.filter(
    (m) => m.projectId === activeProject.id
  );

  // If no models exist specifically for this project, fall back gracefully to all mock models for demo
  const displayedModels = projectModels.length > 0 ? projectModels : mockModels;

  const filteredModels = displayedModels.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = modeFilter === "all" || model.systemMode === modeFilter;
    const matchesStatus = statusFilter === "all" || model.status === statusFilter;
    return matchesSearch && matchesMode && matchesStatus;
  });

  const totalReqs = displayedModels.reduce((acc, m) => acc + m.requirements.length, 0);
  const totalComps = displayedModels.reduce((acc, m) => acc + m.components.length, 0);
  const approvedModels = displayedModels.filter((m) => m.status === "approved").length;

  return (
    <div className="space-y-6">
      {/* Project Scope Bar */}
      <ProjectScopeBar
        moduleTitle="System Modeling Workspace"
        moduleSubtitle="Author, version, and validate hospital system models as the single source of truth for generation and clinical compliance."
        actionSlot={
          <Link href="/models/new-model">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Create System Model
            </Button>
          </Link>
        }
      />

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-hospital-white border border-hospital-border rounded-lg shadow-xs space-y-1">
          <div className="flex items-center justify-between text-hospital-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Models</span>
            <Cpu className="w-4 h-4 text-hospital-green" />
          </div>
          <div className="text-2xl font-bold text-hospital-text">{displayedModels.length}</div>
          <p className="text-[11px] text-hospital-text-muted">Defined for {activeProject.code}</p>
        </div>

        <div className="p-4 bg-hospital-white border border-hospital-border rounded-lg shadow-xs space-y-1">
          <div className="flex items-center justify-between text-hospital-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Approved Baselines</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{approvedModels}</div>
          <p className="text-[11px] text-emerald-700">Eligible for generation</p>
        </div>

        <div className="p-4 bg-hospital-white border border-hospital-border rounded-lg shadow-xs space-y-1">
          <div className="flex items-center justify-between text-hospital-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Requirements</span>
            <FileCode2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-hospital-text">{totalReqs}</div>
          <p className="text-[11px] text-hospital-text-muted">Functional & statutory</p>
        </div>

        <div className="p-4 bg-hospital-white border border-hospital-border rounded-lg shadow-xs space-y-1">
          <div className="flex items-center justify-between text-hospital-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Components</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-hospital-text">{totalComps}</div>
          <p className="text-[11px] text-hospital-text-muted">Services & persistence</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-hospital-white p-3 rounded-lg border border-hospital-border">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-hospital-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models by name or clinical scope..."
            className="w-full bg-hospital-surface pl-9 pr-3 py-1.5 text-xs text-hospital-text rounded-md border border-hospital-border focus:outline-none focus:ring-1 focus:ring-hospital-green"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as typeof modeFilter)}
            className="bg-hospital-surface text-hospital-text text-xs px-2.5 py-1.5 rounded-md border border-hospital-border font-medium cursor-pointer focus:outline-none"
          >
            <option value="all">All Modes</option>
            <option value="complex">Complex Mode</option>
            <option value="standard">Standard Mode</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="bg-hospital-surface text-hospital-text text-xs px-2.5 py-1.5 rounded-md border border-hospital-border font-medium cursor-pointer focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="submitted">In Review</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Model Cards Grid */}
      {filteredModels.length === 0 ? (
        <div className="p-12 text-center bg-hospital-white border border-hospital-border rounded-lg space-y-2">
          <Cpu className="w-8 h-8 text-hospital-text-muted mx-auto" />
          <h3 className="text-sm font-semibold text-hospital-text">No models match criteria</h3>
          <p className="text-xs text-hospital-text-muted">
            Try adjusting your search query or mode filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModels.map((model) => (
            <Card
              key={model.id}
              className="flex flex-col justify-between hover:border-hospital-green hover:shadow-xs transition-all border border-hospital-border bg-hospital-white"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-hospital-green-dark flex items-center gap-1.5 font-mono">
                      <GitBranch className="w-3.5 h-3.5 text-hospital-green" />
                      v{model.versionNo}.0
                    </span>
                    <Badge
                      variant={model.systemMode === "complex" ? "complex" : "standard"}
                      className="text-[10px] uppercase font-semibold"
                    >
                      {model.systemMode}
                    </Badge>
                  </div>

                  <Badge
                    variant={
                      model.status === "approved"
                        ? "success"
                        : model.status === "submitted"
                        ? "warning"
                        : "default"
                    }
                    className="capitalize text-[10px]"
                  >
                    {model.status}
                  </Badge>
                </div>

                <CardTitle className="text-base text-hospital-text font-bold mt-2">
                  {model.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs text-hospital-text-muted mt-1 leading-relaxed">
                  {model.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Decomposition Metrics Matrix */}
                <div className="grid grid-cols-4 gap-2 py-2.5 px-3 rounded-md bg-hospital-surface border border-hospital-border-subtle text-center text-xs">
                  <div>
                    <span className="text-[10px] text-hospital-text-muted uppercase font-semibold block">
                      Reqs
                    </span>
                    <span className="font-bold text-hospital-text text-sm">
                      {model.requirements.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-hospital-text-muted uppercase font-semibold block">
                      Comps
                    </span>
                    <span className="font-bold text-hospital-text text-sm">
                      {model.components.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-hospital-text-muted uppercase font-semibold block">
                      Ifaces
                    </span>
                    <span className="font-bold text-hospital-text text-sm">
                      {model.interfaces.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-hospital-text-muted uppercase font-semibold block">
                      Entities
                    </span>
                    <span className="font-bold text-hospital-text text-sm">
                      {model.entities.length}
                    </span>
                  </div>
                </div>

                {/* Footer with Timestamp & Link */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-hospital-text-muted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-hospital-text-muted" />
                    Updated: {new Date(model.updatedAt).toLocaleDateString()}
                  </span>

                  <Link href={`/models/${model.id}`}>
                    <Button size="sm">
                      Open Workspace <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SystemModelsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-hospital-text-muted">
          Loading system models...
        </div>
      }
    >
      <SystemModelsContent />
    </React.Suspense>
  );
}

"use client";

import * as React from "react";
import { useHospital } from "@/lib/context/hospital-context";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  ChevronDown,
  ShieldCheck,
  Layers,
} from "lucide-react";

interface ProjectScopeBarProps {
  moduleTitle: string;
  moduleSubtitle?: string;
  actionSlot?: React.ReactNode;
}

export function ProjectScopeBar({
  moduleTitle,
  moduleSubtitle,
  actionSlot,
}: ProjectScopeBarProps) {
  const { projects, activeProject, setActiveProjectId, systemMode } = useHospital();

  return (
    <div className="bg-hospital-white border border-hospital-border rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Row: Module Heading & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hospital-green-dark tracking-tight">
            {moduleTitle}
          </h1>
          {moduleSubtitle && (
            <p className="text-xs text-hospital-text-muted mt-1 leading-relaxed">
              {moduleSubtitle}
            </p>
          )}
        </div>

        {actionSlot && <div className="flex items-center gap-2 shrink-0">{actionSlot}</div>}
      </div>

      {/* Bottom Context Strip: Active Scoped Hospital Project & Mode */}
      <div className="pt-3 border-t border-hospital-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-hospital-text-muted">
            Scoped Project:
          </span>

          {/* Quick Project Switcher Dropdown */}
          <div className="relative inline-flex items-center">
            <Building2 className="w-3.5 h-3.5 text-hospital-green absolute left-2.5 pointer-events-none" />
            <select
              value={activeProject.id}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="appearance-none bg-hospital-surface hover:bg-slate-100 text-hospital-text font-semibold text-xs pl-8 pr-7 py-1.5 rounded-md border border-hospital-border transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-hospital-green"
              title="Switch active hospital project"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-hospital-text-muted absolute right-2 pointer-events-none" />
          </div>

          {/* System Mode Pill */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-hospital-text-muted" />
            <Badge
              variant={systemMode === "complex" ? "complex" : "standard"}
              className="text-[10px] uppercase font-semibold"
            >
              {systemMode === "complex" ? "Complex Mode" : "Standard Mode"}
            </Badge>
          </div>
        </div>

        {/* Security & RLS Compliance Indicator */}
        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/80 text-[11px] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Project RLS Boundaries Active</span>
        </div>
      </div>
    </div>
  );
}

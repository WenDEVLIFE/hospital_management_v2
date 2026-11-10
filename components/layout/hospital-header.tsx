"use client";

import * as React from "react";
import { useHospital, UserRole } from "@/lib/context/hospital-context";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Layers,
  ShieldCheck,
  User,
  ChevronDown,
  Building2,
  LogOut,
} from "lucide-react";

export function HospitalHeader() {
  const {
    projects,
    activeProject,
    setActiveProjectId,
    systemMode,
    activeRole,
    setActiveRole,
    currentUser,
    logout,
  } = useHospital();

  const roleLabels: Record<UserRole, string> = {
    super_admin: "Super Admin",
    system_admin: "System Admin",
    project_manager: "Project Manager",
    system_analyst: "System Analyst",
    developer: "Developer",
    documentation_manager: "Doc Manager",
    reviewer: "Reviewer",
    viewer: "Viewer",
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-hospital-border bg-hospital-white px-6 shrink-0">
      {/* SPMC Brand Identity */}
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-hospital-green text-white shadow-xs shrink-0">
          <Activity className="h-6 w-6 stroke-[2.5]" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-hospital-green-dark">
              SPMC
            </span>
            <span className="text-xs text-hospital-border">|</span>
            <span className="text-xs font-semibold text-hospital-text truncate max-w-[200px] sm:max-w-none">
              Southern Philippines Medical Center
            </span>
          </div>
          <p className="text-[11px] text-hospital-text-muted hidden sm:block">
            Integrated System & Documentation Generation Platform
          </p>
        </div>
      </div>

      {/* Control Strip */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Active Project Dropdown Chip */}
        <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-hospital-border bg-hospital-surface max-w-[220px] sm:max-w-[260px]">
          <Building2 className="w-3.5 h-3.5 text-hospital-green shrink-0" />
          <div className="relative flex-1 flex items-center min-w-0">
            <select
              value={activeProject.id}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="w-full appearance-none bg-transparent pr-5 text-xs font-semibold text-hospital-text focus:outline-none cursor-pointer truncate"
              title={`${activeProject.code} — ${activeProject.name}`}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-hospital-text-muted pointer-events-none absolute right-0" />
          </div>
        </div>

        {/* System Mode Indicator Chip */}
        <div className="hidden md:flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-hospital-border bg-hospital-surface">
          <Layers className="w-3.5 h-3.5 text-hospital-text-muted shrink-0" />
          <Badge
            variant={systemMode === "complex" ? "complex" : "standard"}
            className="uppercase tracking-wide font-semibold text-[10px]"
          >
            {systemMode === "complex" ? "Complex Mode" : "Standard Mode"}
          </Badge>
        </div>

        {/* Live Role Simulation Switcher */}
        <div className="hidden lg:flex items-center gap-2 h-9 px-2.5 rounded-md border border-hospital-border bg-hospital-surface">
          <ShieldCheck className="w-3.5 h-3.5 text-hospital-green shrink-0" />
          <div className="relative flex items-center">
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as UserRole)}
              className="appearance-none bg-transparent pr-4 text-xs font-medium text-hospital-text cursor-pointer focus:outline-none"
            >
              {(Object.keys(roleLabels) as UserRole[]).map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-hospital-text-muted pointer-events-none absolute right-0" />
          </div>
        </div>

        {/* Staff User Avatar & Sign Out */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-hospital-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-hospital-green-light text-hospital-green border border-hospital-green-border font-semibold text-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden xl:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-hospital-text truncate max-w-[130px]">
                {currentUser?.name || "Dr. Maria Santos"}
              </span>
              <span className="text-[10px] text-hospital-text-muted truncate max-w-[130px]">
                {currentUser?.email || "m.santos@spmc.gov.ph"}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign out of hospital platform"
            className="flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors cursor-pointer select-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}

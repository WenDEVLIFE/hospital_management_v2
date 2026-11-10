"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useHospital } from "@/lib/context/hospital-context";
import {
  LayoutDashboard,
  FolderGit2,
  Cpu,
  Boxes,
  FileText,
  Network,
  GitMerge,
  ClipboardCheck,
  BookOpen,
  Users,
  Settings,
  History,
} from "lucide-react";

export function HospitalSidebar() {
  const pathname = usePathname();
  const { activeProject } = useHospital();

  const navigationSections = [
    {
      title: "Overview",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          moduleNumber: 1,
        },
        {
          name: "Projects",
          href: "/projects",
          icon: FolderGit2,
          moduleNumber: 2,
        },
      ],
    },
    {
      title: "Engineering & Modeling",
      items: [
        {
          name: "System Models",
          href: "/models",
          icon: Cpu,
          moduleNumber: 3,
        },
        {
          name: "System Generator",
          href: "/generator",
          icon: Boxes,
          moduleNumber: 4,
        },
        {
          name: "Doc Generator",
          href: "/documents",
          icon: FileText,
          moduleNumber: 5,
        },
        {
          name: "Diagrams",
          href: "/diagrams",
          icon: Network,
          moduleNumber: 6,
        },
        {
          name: "Traceability",
          href: "/traceability",
          icon: GitMerge,
          moduleNumber: 7,
        },
      ],
    },
    {
      title: "Governance & Reviews",
      items: [
        {
          name: "Reviews & Approvals",
          href: "/reviews",
          icon: ClipboardCheck,
          moduleNumber: 8,
          badge: activeProject?.pendingApprovalsCount || 0,
        },
        {
          name: "Document Portal",
          href: "/portal",
          icon: BookOpen,
          moduleNumber: 9,
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          name: "User Management",
          href: "/admin/users",
          icon: Users,
          moduleNumber: 10,
        },
        {
          name: "Settings",
          href: "/settings",
          icon: Settings,
          moduleNumber: 11,
        },
        {
          name: "Audit Logs",
          href: "/admin/audit",
          icon: History,
          moduleNumber: 12,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-hospital-border bg-hospital-white flex flex-col h-full select-none">
      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navigationSections.map((section, idx) => (
          <div
            key={section.title}
            className={cn("space-y-1", idx > 0 && "pt-3 border-t border-hospital-border-subtle")}
          >
            <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-hospital-text-muted/80">
              {section.title}
            </h4>
            <div className="space-y-0.5 mt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    item.href !== "/projects" &&
                    pathname.startsWith(item.href + "/"));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors border-l-2",
                      isActive
                        ? "bg-hospital-green-light text-hospital-green-dark font-semibold border-hospital-green"
                        : "border-transparent text-hospital-text hover:bg-hospital-surface-muted hover:text-hospital-green-dark"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive
                            ? "text-hospital-green"
                            : "text-hospital-text-muted group-hover:text-hospital-green"
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Hospital Footer Tag */}
      <div className="p-3 border-t border-hospital-border bg-hospital-surface text-[11px] text-hospital-text-muted flex items-center justify-between shrink-0">
        <span className="font-medium">SPMC v0.1.0</span>
        <span className="text-hospital-green font-semibold">Hospital Safe</span>
      </div>
    </aside>
  );
}

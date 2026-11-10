"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { mockModels } from "@/lib/mock-data/models-data";
import { mockDocuments } from "@/lib/mock-data/documents-data";
import { mockProjects } from "@/lib/mock-data/projects-data";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const segmentTitles: Record<string, string> = {
    dashboard: "Dashboard",
    projects: "Projects",
    new: "Create Project",
    "new-model": "Create System Model",
    models: "System Models",
    generator: "System Generator",
    documents: "Documentation Generator",
    diagrams: "System Architecture Diagrams",
    traceability: "Traceability Engine",
    reviews: "Reviews and Approvals",
    portal: "Documentation Portal",
    admin: "Admin",
    users: "User Management",
    settings: "Settings",
    audit: "Audit Logs",
  };

  const resolveSegmentTitle = (seg: string, idx: number): string => {
    if (segmentTitles[seg]) return segmentTitles[seg];

    // Check if previous segment gives context
    const prevSeg = idx > 0 ? segments[idx - 1] : "";

    if (prevSeg === "models") {
      const model = mockModels.find((m) => m.id === seg);
      if (model) return model.name;
    }

    if (prevSeg === "documents") {
      const doc = mockDocuments.find((d) => d.id === seg);
      if (doc) return doc.title;
    }

    if (prevSeg === "projects") {
      const project = mockProjects.find((p) => p.id === seg);
      if (project) return `${project.code} — ${project.name}`;
    }

    return seg;
  };

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-xs text-hospital-text-muted h-10 px-6 lg:px-8 bg-hospital-white border-b border-hospital-border shrink-0 select-none overflow-x-auto">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 hover:text-hospital-green transition-colors shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="font-medium">SPMC</span>
      </Link>

      {segments.map((seg, idx) => {
        const href = "/" + segments.slice(0, idx + 1).join("/");
        const isLast = idx === segments.length - 1;
        const title = resolveSegmentTitle(seg, idx);

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3 h-3 text-hospital-border shrink-0" />
            {isLast ? (
              <span className="font-semibold text-hospital-green-dark truncate max-w-[280px]">
                {title}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-hospital-green transition-colors font-medium truncate max-w-[200px]"
              >
                {title}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useHospital } from "@/lib/context/hospital-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderPlus,
  Search,
  Users,
  Cpu,
  FileText,
  Calendar,
  ArrowRight,
  Check,
} from "lucide-react";

export default function ProjectsPage() {
  const { projects, activeProject, setActiveProjectId } = useHospital();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & New Project Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hospital-green-dark">
            Hospital Projects
          </h1>
          <p className="text-xs text-hospital-text-muted mt-0.5">
            Southern Philippines Medical Center system portfolio and engineering workspaces
          </p>
        </div>
        <Link href="/projects/new">
          <Button size="sm">
            <FolderPlus className="w-4 h-4 mr-1.5" />
            Create Project
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-hospital-white p-3 rounded-md border border-hospital-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-hospital-text-muted pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project code or title..."
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["all", "active", "planning"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`h-9 px-3.5 text-xs font-medium rounded-md transition-colors cursor-pointer capitalize flex items-center justify-center shrink-0 ${
                statusFilter === status
                  ? "bg-hospital-green text-white font-semibold shadow-xs"
                  : "bg-hospital-surface text-hospital-text hover:bg-hospital-surface-muted border border-hospital-border"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((p) => (
          <Card key={p.id} className="hover:border-hospital-green transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-hospital-green-dark uppercase tracking-wider">
                  {p.code}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={p.systemMode === "complex" ? "complex" : "standard"}>
                    {p.systemMode === "complex" ? "Complex Mode" : "Standard Mode"}
                  </Badge>
                  <Badge variant={p.status === "active" ? "success" : "default"}>
                    {p.status}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-base mt-1.5">{p.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {p.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-hospital-border-subtle text-center text-xs">
                <div>
                  <span className="text-[11px] text-hospital-text-muted block">Models</span>
                  <span className="font-bold text-hospital-text flex items-center justify-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-hospital-green" /> {p.modelsCount}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-hospital-text-muted block">Documents</span>
                  <span className="font-bold text-hospital-text flex items-center justify-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-hospital-green" /> {p.documentsCount}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-hospital-text-muted block">Staff</span>
                  <span className="font-bold text-hospital-text flex items-center justify-center gap-1">
                    <Users className="w-3.5 h-3.5 text-hospital-green" /> {p.members.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-hospital-text-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Owner: {p.owner}
                </div>

                <div className="flex items-center gap-2">
                  {p.id === activeProject.id ? (
                    <Badge variant="success" className="py-1 px-2.5 text-xs font-semibold">
                      <Check className="w-3.5 h-3.5 mr-1" /> Active
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveProjectId(p.id)}
                    >
                      Set Active
                    </Button>
                  )}
                  <Link href={`/projects/${p.id}`}>
                    <Button size="sm">
                      Open <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

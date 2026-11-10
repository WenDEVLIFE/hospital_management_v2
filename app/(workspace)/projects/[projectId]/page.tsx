"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useHospital } from "@/lib/context/hospital-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Cpu,
  Boxes,
  FileText,
  GitMerge,
  Users,
  Calendar,
  UserCheck,
} from "lucide-react";

function ProjectDetailContent() {
  const params = useParams();
  const { projects, setActiveProjectId } = useHospital();
  const projectId = (params?.projectId as string) || "proj-ehr-01";

  const project = projects.find((p) => p.id === projectId) || projects[0];

  React.useEffect(() => {
    if (project) {
      setActiveProjectId(project.id);
    }
  }, [project, setActiveProjectId]);

  return (
    <div className="space-y-6">
      {/* Project Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-md border border-hospital-border bg-hospital-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-hospital-green-dark uppercase tracking-wider">
              {project.code}
            </span>
            <Badge variant={project.systemMode === "complex" ? "complex" : "standard"}>
              {project.systemMode === "complex" ? "Complex Mode" : "Standard Mode"}
            </Badge>
            <Badge variant={project.status === "active" ? "success" : "default"}>
              {project.status}
            </Badge>
          </div>
          <h1 className="text-xl font-bold text-hospital-text mt-1">
            {project.name}
          </h1>
          <p className="text-xs text-hospital-text-muted mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-hospital-green" /> Lead: {project.owner}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Registered: {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/generator">
            <Button size="sm" variant="outline">
              <Boxes className="w-4 h-4 mr-1 text-hospital-green" /> Artifact Generator
            </Button>
          </Link>
          <Link href="/models">
            <Button size="sm">
              <Cpu className="w-4 h-4 mr-1" /> System Models
            </Button>
          </Link>
        </div>
      </div>

      {/* Project Description & Objectives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Scope & Objectives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <h4 className="font-semibold text-hospital-text mb-1">Architecture Overview</h4>
                <p className="text-hospital-text-muted leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="p-3.5 rounded-md bg-hospital-surface border border-hospital-border">
                <h4 className="font-semibold text-hospital-green-dark mb-1">Target Clinical Objectives</h4>
                <p className="text-hospital-text-muted leading-relaxed">
                  {project.objectives}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Module Workspaces Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/models"
              className="p-3.5 rounded-md border border-hospital-border bg-hospital-white hover:border-hospital-green hover:bg-hospital-green-light/30 transition-colors text-center text-xs space-y-1"
            >
              <Cpu className="w-5 h-5 mx-auto text-hospital-green" />
              <span className="font-semibold text-hospital-text block">Models</span>
              <span className="text-[11px] text-hospital-text-muted">{project.modelsCount} defined</span>
            </Link>

            <Link
              href="/generator"
              className="p-3.5 rounded-md border border-hospital-border bg-hospital-white hover:border-hospital-green hover:bg-hospital-green-light/30 transition-colors text-center text-xs space-y-1"
            >
              <Boxes className="w-5 h-5 mx-auto text-hospital-green" />
              <span className="font-semibold text-hospital-text block">Generator</span>
              <span className="text-[11px] text-hospital-text-muted">Software artifacts</span>
            </Link>

            <Link
              href="/documents"
              className="p-3.5 rounded-md border border-hospital-border bg-hospital-white hover:border-hospital-green hover:bg-hospital-green-light/30 transition-colors text-center text-xs space-y-1"
            >
              <FileText className="w-5 h-5 mx-auto text-hospital-green" />
              <span className="font-semibold text-hospital-text block">Documents</span>
              <span className="text-[11px] text-hospital-text-muted">{project.documentsCount} docs</span>
            </Link>

            <Link
              href="/traceability"
              className="p-3.5 rounded-md border border-hospital-border bg-hospital-white hover:border-hospital-green hover:bg-hospital-green-light/30 transition-colors text-center text-xs space-y-1"
            >
              <GitMerge className="w-5 h-5 mx-auto text-hospital-green" />
              <span className="font-semibold text-hospital-text block">Traceability</span>
              <span className="text-[11px] text-hospital-text-muted">Coverage & gaps</span>
            </Link>
          </div>
        </div>

        {/* Member Roster (PROJECT.MD §4.2) */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assigned Members</CardTitle>
                <Users className="w-4 h-4 text-hospital-green" />
              </div>
              <CardDescription>Hospital personnel with project RLS rights</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Project Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="py-2.5">
                        <span className="font-medium text-xs block text-hospital-text">
                          {member.name}
                        </span>
                        <span className="text-[10px] text-hospital-text-muted">
                          {member.email}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {member.role.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-xs text-hospital-text-muted">Loading project details...</div>}>
      <ProjectDetailContent />
    </React.Suspense>
  );
}

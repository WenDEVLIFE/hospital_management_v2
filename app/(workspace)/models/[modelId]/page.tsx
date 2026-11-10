"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useHospital } from "@/lib/context/hospital-context";
import { mockModels, Requirement, SystemComponent } from "@/lib/mock-data/models-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  GitBranch,
  Search,
  Plus,
  Network,
  Database,
  History,
  FileCheck,
  Building2,
  Save,
} from "lucide-react";

function ModelWorkspaceContent() {
  const params = useParams();
  const { activeProject } = useHospital();
  const modelId = (params?.modelId as string) || "model-ehr-core";

  const model = mockModels.find((m) => m.id === modelId) || mockModels[0];
  const [submitted, setSubmitted] = React.useState(false);
  const [reqSearch, setReqSearch] = React.useState("");
  const [reqTypeFilter, setReqTypeFilter] = React.useState<string>("all");

  // Dynamic state for requirements and components
  const [requirements, setRequirements] = React.useState<Requirement[]>(model.requirements);
  const [components, setComponents] = React.useState<SystemComponent[]>(model.components);

  // Modal open states
  const [isAddReqOpen, setIsAddReqOpen] = React.useState(false);
  const [isAddCompOpen, setIsAddCompOpen] = React.useState(false);

  // Requirement form state
  const [reqCode, setReqCode] = React.useState(`REQ-${activeProject.code.slice(5, 8) || "MOD"}-00${requirements.length + 1}`);
  const [reqTitle, setReqTitle] = React.useState("");
  const [reqType, setReqType] = React.useState<Requirement["reqType"]>("functional");
  const [reqPriority, setReqPriority] = React.useState<Requirement["priority"]>("high");
  const [reqDesc, setReqDesc] = React.useState("");

  // Component form state
  const [compName, setCompName] = React.useState("");
  const [compType, setCompType] = React.useState("Core Domain Service");
  const [compTech, setCompTech] = React.useState("TypeScript / Supabase PostgreSQL");
  const [compDesc, setCompDesc] = React.useState("");

  const handleAddRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;

    const newReq: Requirement = {
      id: "req-" + Date.now(),
      code: reqCode.trim().toUpperCase(),
      title: reqTitle.trim(),
      description: reqDesc.trim(),
      reqType,
      priority: reqPriority,
      status: "approved",
    };

    setRequirements((prev) => [newReq, ...prev]);
    setReqTitle("");
    setReqDesc("");
    setIsAddReqOpen(false);
  };

  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) return;

    const newComp: SystemComponent = {
      id: "comp-" + Date.now(),
      name: compName.trim(),
      componentType: compType,
      technology: compTech.trim(),
      description: compDesc.trim(),
    };

    setComponents((prev) => [...prev, newComp]);
    setCompName("");
    setCompDesc("");
    setIsAddCompOpen(false);
  };

  const filteredRequirements = requirements.filter((req) => {
    const matchesSearch =
      req.code.toLowerCase().includes(reqSearch.toLowerCase()) ||
      req.title.toLowerCase().includes(reqSearch.toLowerCase()) ||
      req.description.toLowerCase().includes(reqSearch.toLowerCase());
    const matchesType = reqTypeFilter === "all" || req.reqType === reqTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="bg-hospital-white border border-hospital-border rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <Link href="/models">
              <Button size="sm" variant="ghost" className="hover:bg-hospital-surface">
                <ArrowLeft className="w-4 h-4 mr-1 text-hospital-green" /> Back to Models
              </Button>
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-hospital-green-dark">
                  {model.name}
                </h1>
                <Badge variant="outline" className="font-mono text-xs">
                  <GitBranch className="w-3 h-3 mr-1 text-hospital-green" />
                  v{model.versionNo}.0
                </Badge>
                <Badge
                  variant={model.systemMode === "complex" ? "complex" : "standard"}
                  className="text-[10px] uppercase font-semibold"
                >
                  {model.systemMode} Mode
                </Badge>
                <Badge
                  variant={model.status === "approved" ? "success" : "default"}
                  className="capitalize text-[10px]"
                >
                  {model.status}
                </Badge>
              </div>

              <p className="text-xs text-hospital-text-muted mt-1 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-hospital-green" />
                <span>
                  Source of truth for <strong>{activeProject.name}</strong> ({activeProject.code})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {submitted ? (
              <Badge variant="success" className="py-1.5 px-3 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Dispatched to Review Inbox
              </Badge>
            ) : (
              <Button size="sm" onClick={() => setSubmitted(true)}>
                <Send className="w-3.5 h-3.5 mr-1.5" /> Submit for Approval
              </Button>
            )}
          </div>
        </div>
      </div>

      {submitted && (
        <Alert variant="success" title="Approval Workflow Dispatched">
          Model version {model.versionNo}.0 snapshot submitted for clinical review. Under {model.systemMode.toUpperCase()} mode,{" "}
          {model.systemMode === "complex"
            ? "two authorized medical and engineering reviewers"
            : "one authorized reviewer"}{" "}
          must approve before downstream generation acceptance.
        </Alert>
      )}

      {/* Model Composition Tabs */}
      <Tabs defaultValue="requirements" className="space-y-4">
        <TabsList className="bg-hospital-white border border-hospital-border p-1 w-full justify-start overflow-x-auto rounded-lg">
          <TabsTrigger value="requirements" className="gap-1.5 text-xs font-medium">
            <FileCheck className="w-3.5 h-3.5 text-hospital-green" />
            Requirements ({requirements.length})
          </TabsTrigger>
          <TabsTrigger value="components" className="gap-1.5 text-xs font-medium">
            <Network className="w-3.5 h-3.5 text-hospital-green" />
            Components ({components.length})
          </TabsTrigger>
          <TabsTrigger value="interfaces" className="gap-1.5 text-xs font-medium">
            <Network className="w-3.5 h-3.5 text-hospital-green" />
            Interfaces ({model.interfaces.length})
          </TabsTrigger>
          <TabsTrigger value="entities" className="gap-1.5 text-xs font-medium">
            <Database className="w-3.5 h-3.5 text-hospital-green" />
            Data Entities ({model.entities.length})
          </TabsTrigger>
          <TabsTrigger value="diff" className="gap-1.5 text-xs font-medium">
            <History className="w-3.5 h-3.5 text-hospital-green" />
            Version History & Snapshot Diff
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Requirements */}
        <TabsContent value="requirements" className="space-y-4">
          <Card className="border border-hospital-border bg-hospital-white">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-hospital-border">
              <div>
                <CardTitle className="text-base text-hospital-text font-bold">
                  System Requirements
                </CardTitle>
                <CardDescription className="text-xs text-hospital-text-muted mt-0.5">
                  Functional, clinical, statutory, and non-functional baseline specifications
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-hospital-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={reqSearch}
                    onChange={(e) => setReqSearch(e.target.value)}
                    placeholder="Filter requirements..."
                    className="w-full bg-hospital-surface pl-8 pr-2.5 py-1 text-xs text-hospital-text rounded-md border border-hospital-border focus:outline-none focus:ring-1 focus:ring-hospital-green"
                  />
                </div>

                <select
                  value={reqTypeFilter}
                  onChange={(e) => setReqTypeFilter(e.target.value)}
                  className="bg-hospital-surface text-hospital-text text-xs px-2.5 py-1 rounded-md border border-hospital-border font-medium cursor-pointer focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="functional">Functional</option>
                  <option value="non_functional">Non-Functional</option>
                  <option value="constraint">Constraint / Statutory</option>
                </select>

                <Button size="sm" onClick={() => setIsAddReqOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Req
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table borderless>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Req Code</TableHead>
                    <TableHead>Title & Specification</TableHead>
                    <TableHead className="w-32">Category</TableHead>
                    <TableHead className="w-24">Priority</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequirements.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-xs font-semibold text-hospital-green-dark">
                        {req.code}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-xs block text-hospital-text">
                          {req.title}
                        </span>
                        <span className="text-[11px] text-hospital-text-muted mt-0.5 block leading-relaxed">
                          {req.description}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {req.reqType.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            req.priority === "critical"
                              ? "danger"
                              : req.priority === "high"
                              ? "warning"
                              : "default"
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {req.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" className="text-[10px] capitalize">
                          {req.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: System Components */}
        <TabsContent value="components" className="space-y-4">
          <Card className="border border-hospital-border bg-hospital-white">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-hospital-border">
              <div>
                <CardTitle className="text-base text-hospital-text font-bold">
                  System Architectural Components
                </CardTitle>
                <CardDescription className="text-xs text-hospital-text-muted mt-0.5">
                  Subsystems, backend microservices, and security boundaries
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsAddCompOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Component
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table borderless>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-64">Component Name</TableHead>
                    <TableHead className="w-44">Type</TableHead>
                    <TableHead className="w-64">Technology Stack</TableHead>
                    <TableHead>Role & Specification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {components.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-bold text-xs text-hospital-text">
                        {c.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {c.componentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-hospital-green-dark">
                        {c.technology}
                      </TableCell>
                      <TableCell className="text-xs text-hospital-text-muted leading-relaxed">
                        {c.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: System Interfaces */}
        <TabsContent value="interfaces" className="space-y-4">
          <Card className="border border-hospital-border bg-hospital-white">
            <CardHeader className="pb-3 border-b border-hospital-border">
              <CardTitle className="text-base text-hospital-text font-bold">
                System Communication Interfaces
              </CardTitle>
              <CardDescription className="text-xs text-hospital-text-muted mt-0.5">
                Protocols, payload contracts, and directionality between hospital subsystems
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table borderless>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-56">Interface Name</TableHead>
                    <TableHead>Source Component</TableHead>
                    <TableHead>Target Component</TableHead>
                    <TableHead>Protocol & Transport</TableHead>
                    <TableHead className="w-28">Direction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {model.interfaces.map((iface) => (
                    <TableRow key={iface.id}>
                      <TableCell className="font-bold text-xs text-hospital-text">
                        {iface.name}
                      </TableCell>
                      <TableCell className="text-xs text-hospital-text-muted font-medium">
                        {iface.sourceComponent}
                      </TableCell>
                      <TableCell className="text-xs text-hospital-text-muted font-medium">
                        {iface.targetComponent}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-hospital-green-dark">
                        {iface.protocol}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {iface.direction}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Data Entities */}
        <TabsContent value="entities" className="space-y-4">
          <Card className="border border-hospital-border bg-hospital-white">
            <CardHeader className="pb-3 border-b border-hospital-border">
              <CardTitle className="text-base text-hospital-text font-bold">
                Relational Data Entities & Schemas
              </CardTitle>
              <CardDescription className="text-xs text-hospital-text-muted mt-0.5">
                PostgreSQL table definitions, primary keys, and schema columns
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table borderless>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Entity Name</TableHead>
                    <TableHead className="w-48">PostgreSQL Table</TableHead>
                    <TableHead className="w-36">Primary Key</TableHead>
                    <TableHead className="w-32">Attributes</TableHead>
                    <TableHead>Clinical Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {model.entities.map((ent) => (
                    <TableRow key={ent.id}>
                      <TableCell className="font-bold text-xs text-hospital-text">
                        {ent.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-hospital-green-dark">
                        {ent.tableName}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-hospital-text-muted">
                        {ent.primaryKey.join(", ")}
                      </TableCell>
                      <TableCell className="text-xs text-hospital-text font-semibold">
                        {ent.attributesCount} columns
                      </TableCell>
                      <TableCell className="text-xs text-hospital-text-muted leading-relaxed">
                        {ent.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Version History & Diff */}
        <TabsContent value="diff" className="space-y-4">
          <Card className="border border-hospital-border bg-hospital-white">
            <CardHeader className="pb-3 border-b border-hospital-border">
              <CardTitle className="text-base text-hospital-text font-bold">
                Version History & Model Diff
              </CardTitle>
              <CardDescription className="text-xs text-hospital-text-muted mt-0.5">
                Immutable version snapshot comparisons and audit log
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Active Version */}
              <div className="p-4 rounded-lg border-2 border-emerald-500/80 bg-emerald-50/40 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Version 3.0 (Active Approved Baseline)
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Approved by Dr. Roberto Gomez on 2026-11-05
                  </span>
                </div>
                <p className="text-emerald-950 leading-relaxed">
                  Added REQ-EHR-004 (DOH Data Privacy Compliance) and updated clinical order routing schemas with strict RLS policies.
                </p>
                <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-800">
                  <span className="bg-emerald-100 px-2 py-0.5 rounded font-semibold">+1 Requirement</span>
                  <span className="bg-emerald-100 px-2 py-0.5 rounded font-semibold">+3 RLS Policies</span>
                  <span className="bg-emerald-100 px-2 py-0.5 rounded font-semibold">0 Breaking Changes</span>
                </div>
              </div>

              {/* Superseded Version */}
              <div className="p-4 rounded-lg border border-hospital-border bg-hospital-surface text-xs space-y-2 opacity-80">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-hospital-text flex items-center gap-1.5">
                    <History className="w-4 h-4 text-hospital-text-muted" />
                    Version 2.0 (Superseded Baseline)
                  </span>
                  <span className="text-[11px] text-hospital-text-muted">
                    Approved on 2026-09-20 by Dr. Maria Santos
                  </span>
                </div>
                <p className="text-hospital-text-muted leading-relaxed">
                  Initial definition of CPOE, Nurse Vitals telemetry schema, and satellite pharmacy webhook interface.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Requirement Modal */}
      <Modal
        isOpen={isAddReqOpen}
        onClose={() => setIsAddReqOpen(false)}
        title="Add System Requirement"
        description={`Define a verified clinical or architectural requirement for ${model.name}`}
      >
        <form onSubmit={handleAddRequirement} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Requirement Code"
              required
              value={reqCode}
              onChange={(e) => setReqCode(e.target.value)}
              placeholder="e.g. REQ-EHR-005"
            />
            <Select
              label="Requirement Type"
              value={reqType}
              onChange={(e) => setReqType(e.target.value as Requirement["reqType"])}
              options={[
                { label: "Functional Requirement", value: "functional" },
                { label: "Non-Functional Requirement", value: "non_functional" },
                { label: "Statutory Constraint (DOH / RA 10173)", value: "constraint" },
                { label: "Interface / Communication", value: "interface" },
                { label: "Data / Relational Schema", value: "data" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Requirement Title"
              required
              value={reqTitle}
              onChange={(e) => setReqTitle(e.target.value)}
              placeholder="e.g. Bedside Telemetry Alarm Escalation"
            />
            <Select
              label="Priority Level"
              value={reqPriority}
              onChange={(e) => setReqPriority(e.target.value as Requirement["priority"])}
              options={[
                { label: "Critical Priority", value: "critical" },
                { label: "High Priority", value: "high" },
                { label: "Medium Priority", value: "medium" },
                { label: "Low Priority", value: "low" },
              ]}
            />
          </div>

          <Textarea
            label="Detailed Specification & Acceptance Criteria"
            required
            value={reqDesc}
            onChange={(e) => setReqDesc(e.target.value)}
            placeholder="Describe the medical criteria, boundary checks, and sign-off conditions..."
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-hospital-border">
            <Button type="button" variant="ghost" onClick={() => setIsAddReqOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-3.5 h-3.5 mr-1" /> Add Requirement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Component Modal */}
      <Modal
        isOpen={isAddCompOpen}
        onClose={() => setIsAddCompOpen(false)}
        title="Add Architectural Component"
        description="Register a new subsystem, service pipeline, or security layer"
      >
        <form onSubmit={handleAddComponent} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Component Name"
              required
              value={compName}
              onChange={(e) => setCompName(e.target.value)}
              placeholder="e.g. Pharmacy Dispense Broker"
            />
            <Input
              label="Component Type"
              required
              value={compType}
              onChange={(e) => setCompType(e.target.value)}
              placeholder="e.g. Core Domain Service"
            />
          </div>

          <Input
            label="Technology Stack"
            required
            value={compTech}
            onChange={(e) => setCompTech(e.target.value)}
            placeholder="e.g. Next.js / TypeScript / Supabase PostgreSQL"
          />

          <Textarea
            label="Role & Boundary Description"
            required
            value={compDesc}
            onChange={(e) => setCompDesc(e.target.value)}
            placeholder="Specify what clinical events this component processes..."
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-hospital-border">
            <Button type="button" variant="ghost" onClick={() => setIsAddCompOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="w-3.5 h-3.5 mr-1" /> Add Component
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function ModelWorkspacePage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-hospital-text-muted">
          Loading model workspace...
        </div>
      }
    >
      <ModelWorkspaceContent />
    </React.Suspense>
  );
}

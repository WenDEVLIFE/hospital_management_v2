"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useHospital } from "@/lib/context/hospital-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { ArrowLeft, Save, CheckCircle2 } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();
  const { addProject } = useHospital();

  const [code, setCode] = React.useState("SPMC-");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [objectives, setObjectives] = React.useState("");
  const [systemMode, setSystemMode] = React.useState("standard");
  const [saved, setSaved] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    addProject({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      objectives: objectives.trim(),
      systemMode: systemMode as "standard" | "complex",
      status: "active",
    });

    setSaved(true);
    setTimeout(() => {
      router.push("/projects");
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/projects">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-1 text-hospital-green" /> Back to Projects
          </Button>
        </Link>
      </div>

      {saved && (
        <Alert variant="success" title="Hospital Project Registered">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>
              Project <strong>{code}</strong> created and set as active. Redirecting to projects workspace...
            </span>
          </div>
        </Alert>
      )}

      <Card className="border border-hospital-border bg-hospital-white">
        <CardHeader>
          <CardTitle>Create Hospital Project</CardTitle>
          <CardDescription>
            Register a new clinical system or healthcare integration project in the SPMC repository.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Alert variant="info" title="System Mode Requirement (PROJECT.MD §5)">
              Choose <strong>Standard System Mode</strong> for departmental or single-reviewer tools. Choose{" "}
              <strong>Complex System Mode</strong> for cross-departmental platforms requiring multi-reviewer clinical sign-off.
            </Alert>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Project Identifier Code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SPMC-ICU-004"
                required
              />

              <Select
                label="System Architecture Mode"
                value={systemMode}
                onChange={(e) => setSystemMode(e.target.value)}
                options={[
                  { label: "Standard Mode (Single Reviewer)", value: "standard" },
                  { label: "Complex Mode (Multi-Reviewer, Strict Traceability)", value: "complex" },
                ]}
              />
            </div>

            <Input
              label="System Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Intensive Care Unit Telemetry Monitoring Integration"
              required
            />

            <Textarea
              label="Scope & System Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what components and hospital workflows this system governs..."
              rows={3}
              required
            />

            <Textarea
              label="Clinical Objectives & Milestones"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Key clinical outcomes, safety goals, and hospital KPIs..."
              rows={3}
            />
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-hospital-border pt-4">
            <Link href="/projects">
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit">
              <Save className="w-4 h-4 mr-1.5" />
              Save Project Record
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

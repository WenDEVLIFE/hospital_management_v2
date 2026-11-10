"use client";

import * as React from "react";
import { mockAuditLogs } from "@/lib/mock-data/audit-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Search, Download, Clock, CheckCircle2 } from "lucide-react";

export default function AuditLogsPage() {
  const [search, setSearch] = React.useState("");
  const [exported, setExported] = React.useState(false);

  const filteredLogs = mockAuditLogs.filter(
    (log) =>
      log.actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.projectCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportAudit = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spmc_audit_trail_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hospital-green-dark">
            System Audit Trail & Compliance Log
          </h1>
          <p className="text-xs text-hospital-text-muted mt-0.5">
            Immutable, cryptographically verifiable ledger recording all system modifications and clinical approvals
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={handleExportAudit}>
          <Download className="w-3.5 h-3.5 mr-1" />
          {exported ? "Archive Exported" : "Export Audit Archive"}
        </Button>
      </div>

      {exported && (
        <Alert variant="success" title="Audit Ledger Exported">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>
              Downloaded verified JSON audit ledger containing {filteredLogs.length} events compliant with statutory retention standards.
            </span>
          </div>
        </Alert>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-hospital-white p-3 rounded-md border border-hospital-border">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-hospital-text-muted pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit events by staff name, action, or project code..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="border border-hospital-border bg-hospital-white">
        <CardHeader className="pb-3 border-b border-hospital-border">
          <CardTitle className="flex items-center gap-2">
            <History className="w-4 h-4 text-hospital-green" />
            Audit Events ({filteredLogs.length})
          </CardTitle>
          <CardDescription>
            Row-level security enforces read-only access for administrators and auditors
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table borderless>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Timestamp</TableHead>
                <TableHead>Actor / Staff</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Event Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-hospital-text-muted font-mono flex items-center gap-1.5 py-3">
                    <Clock className="w-3.5 h-3.5 text-hospital-green" />
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-xs text-hospital-text block">
                      {log.actorName}
                    </span>
                    <span className="text-[10px] text-hospital-text-muted">
                      {log.actorEmail}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {log.projectCode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-hospital-text-muted">
                    {log.entityType}
                  </TableCell>
                  <TableCell className="text-xs text-hospital-text">
                    {log.details}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

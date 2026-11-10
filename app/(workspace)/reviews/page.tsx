"use client";

import * as React from "react";
import Link from "next/link";
import { useHospital } from "@/lib/context/hospital-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight } from "lucide-react";

export default function ReviewsPage() {
  const { reviews } = useHospital();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-hospital-green-dark">
            Reviews & Approvals Inbox
          </h1>
          <p className="text-xs text-hospital-text-muted mt-0.5">
            Formal multi-reviewer clinical sign-off workflow governing models, generated artifacts, and hospital documents
          </p>
        </div>
      </div>

      {/* Review Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Submissions Awaiting Sign-off</CardTitle>
          <CardDescription>
            Enforces Standard Mode (1 reviewer) and Complex Mode (multi-reviewer) compliance
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table borderless>
            <TableHeader>
              <TableRow>
                <TableHead>Target Item</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Target Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approvals Met</TableHead>
                <TableHead>Assigned Reviewers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((rev) => (
                <TableRow key={rev.id}>
                  <TableCell>
                    <span className="font-semibold text-xs text-hospital-text block">
                      {rev.targetTitle}
                    </span>
                    <span className="text-[10px] text-hospital-text-muted">
                      Requested by {rev.requestedBy} • {new Date(rev.submittedAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {rev.projectCode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {rev.targetType.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rev.status === "approved"
                          ? "success"
                          : rev.status === "in_review"
                          ? "warning"
                          : "default"
                      }
                      className="capitalize"
                    >
                      {rev.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-xs text-hospital-green-dark">
                      {rev.currentApprovals} / {rev.requiredApprovals}
                    </span>
                    <span className="text-[10px] text-hospital-text-muted block">
                      required
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      {rev.assignedReviewers.map((r) => (
                        <span key={r} className="text-xs text-hospital-text font-medium">
                          • {r}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/reviews/${rev.id}`}>
                      <Button size="sm">
                        Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
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

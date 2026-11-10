"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useHospital } from "@/lib/context/hospital-context";
import { mockReviews, ReviewComment } from "@/lib/mock-data/reviews-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MessageSquare,
  Send,
} from "lucide-react";

function ReviewDetailContent() {
  const params = useParams();
  const { reviews, updateReviewStatus } = useHospital();
  const reviewId = (params?.reviewId as string) || "rev-01";
  const review = reviews.find((r) => r.id === reviewId) || mockReviews.find((r) => r.id === reviewId) || mockReviews[0];

  const [comments, setComments] = React.useState<ReviewComment[]>(review.comments);
  const [newComment, setNewComment] = React.useState("");
  const [decision, setDecision] = React.useState<string | null>(null);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentObj: ReviewComment = {
      id: "c-" + Date.now(),
      author: "Dr. Maria Santos",
      role: "Project Manager",
      body: newComment,
      createdAt: new Date().toISOString(),
    };

    setComments([...comments, commentObj]);
    setNewComment("");
  };

  const handleDecision = (type: "approved" | "revision_requested" | "rejected") => {
    setDecision(type);
    if (review) {
      updateReviewStatus(review.id, type);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link href="/reviews">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Reviews
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-md border border-hospital-border bg-hospital-white">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {review.projectCode}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {review.targetType.replace("_", " ")}
            </Badge>
            <Badge
              variant={
                review.status === "approved"
                  ? "success"
                  : review.status === "in_review"
                  ? "warning"
                  : "default"
              }
              className="capitalize"
            >
              {review.status.replace("_", " ")}
            </Badge>
          </div>
          <h1 className="text-lg font-bold text-hospital-text mt-1.5">
            {review.targetTitle}
          </h1>
          <p className="text-xs text-hospital-text-muted mt-0.5">
            Submitted by {review.requestedBy} • Required Sign-offs: {review.currentApprovals}/{review.requiredApprovals}
          </p>
        </div>
      </div>

      {decision && (
        <Alert
          variant={decision === "approved" ? "success" : "warning"}
          title={
            decision === "approved"
              ? "Clinical Sign-off Recorded"
              : "Revision Request Dispatched"
          }
        >
          Your decision has been committed to the append-only approval ledger and audit log.
        </Alert>
      )}

      {/* Decision Actions Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Reviewer Decision Panel</CardTitle>
          <CardDescription>
            Authorized clinical review actions conforming to SPMC governance rules
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            onClick={() => handleDecision("approved")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Sign Off
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDecision("revision_requested")}
          >
            <RotateCcw className="w-4 h-4 mr-1.5 text-amber-600" /> Request Revisions
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDecision("rejected")}
          >
            <XCircle className="w-4 h-4 mr-1.5" /> Reject Submission
          </Button>
        </CardContent>
      </Card>

      {/* Reviewer Comment Thread (PROJECT.MD §4.9) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-hospital-green" />
            Review Discussion Thread ({comments.length})
          </CardTitle>
          <CardDescription>
            Permanent clinical comments tied to this approval record
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3.5 rounded-md border border-hospital-border bg-hospital-surface space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-hospital-green-dark">
                    {comment.author}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    {comment.role}
                  </Badge>
                </div>
                <span className="text-[10px] text-hospital-text-muted">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-hospital-text leading-relaxed">{comment.body}</p>
            </div>
          ))}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="pt-2 space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your clinical review note or revision guidance..."
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm">
                <Send className="w-3.5 h-3.5 mr-1" /> Post Note
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReviewDetailPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-xs text-hospital-text-muted">Loading review details...</div>}>
      <ReviewDetailContent />
    </React.Suspense>
  );
}

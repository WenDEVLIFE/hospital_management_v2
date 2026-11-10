export interface ReviewComment {
  id: string;
  author: string;
  role: string;
  body: string;
  createdAt: string;
}

export interface ReviewRequest {
  id: string;
  projectId: string;
  projectCode: string;
  targetType: "system_model" | "model_version" | "generated_artifact" | "generated_document" | "diagram";
  targetTitle: string;
  requestedBy: string;
  status: "pending" | "in_review" | "approved" | "rejected" | "revision_requested";
  requiredApprovals: number;
  currentApprovals: number;
  submittedAt: string;
  assignedReviewers: string[];
  comments: ReviewComment[];
}

export const mockReviews: ReviewRequest[] = [
  {
    id: "rev-01",
    projectId: "proj-ehr-01",
    projectCode: "SPMC-EHR-2026",
    targetType: "generated_document",
    targetTitle: "Physician Order Entry (CPOE) Standard Operating Procedure v1.0",
    requestedBy: "Dr. Maria Santos",
    status: "in_review",
    requiredApprovals: 2,
    currentApprovals: 1,
    submittedAt: "2026-11-08T09:15:00Z",
    assignedReviewers: ["Dr. Roberto Gomez", "Dr. Francis Aquino"],
    comments: [
      {
        id: "c-1",
        author: "Dr. Roberto Gomez",
        role: "Chief Clinical Reviewer",
        body: "Section 4 dual sign-off protocol verified. Approved from clinical oncology perspective.",
        createdAt: "2026-11-08T14:20:00Z",
      },
      {
        id: "c-2",
        author: "Dr. Francis Aquino",
        role: "Emergency Medicine Reviewer",
        body: "Please verify statutory pediatric dosing override policy before final sign-off.",
        createdAt: "2026-11-09T08:30:00Z",
      },
    ],
  },
  {
    id: "rev-02",
    projectId: "proj-pharm-03",
    projectCode: "SPMC-PHARM-01",
    targetType: "system_model",
    targetTitle: "Automated Inpatient Pharmacy Dispensing Data Model v2",
    requestedBy: "Pharm. Elena Torres",
    status: "pending",
    requiredApprovals: 2,
    currentApprovals: 0,
    submittedAt: "2026-11-09T07:45:00Z",
    assignedReviewers: ["Dr. Roberto Gomez", "Engr. Alan Rivera"],
    comments: [],
  },
];

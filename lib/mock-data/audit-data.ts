export interface AuditLogItem {
  id: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  projectCode: string;
  createdAt: string;
  details: string;
}

export const mockAuditLogs: AuditLogItem[] = [
  {
    id: "log-101",
    actorName: "Dr. Roberto Gomez",
    actorEmail: "r.gomez@spmc.gov.ph",
    action: "APPROVE_ITEM",
    entityType: "review_request",
    entityId: "rev-01",
    projectCode: "SPMC-EHR-2026",
    createdAt: "2026-11-08T14:20:00Z",
    details: "Approved review assignment for CPOE Standard Operating Procedure v1.0",
  },
  {
    id: "log-102",
    actorName: "Dr. Maria Santos",
    actorEmail: "m.santos@spmc.gov.ph",
    action: "SUBMIT_FOR_REVIEW",
    entityType: "generated_document",
    entityId: "doc-3",
    projectCode: "SPMC-EHR-2026",
    createdAt: "2026-11-08T09:15:00Z",
    details: "Submitted CPOE Standard Operating Procedure v1.0 for multi-reviewer clinical sign-off",
  },
  {
    id: "log-103",
    actorName: "Engr. Alan Rivera",
    actorEmail: "a.rivera@spmc.gov.ph",
    action: "UPDATE_SYSTEM_MODEL",
    entityType: "system_model",
    entityId: "model-ehr-core",
    projectCode: "SPMC-EHR-2026",
    createdAt: "2026-11-05T16:20:00Z",
    details: "Added REQ-EHR-004 DOH Data Privacy Compliance to Inpatient Charting Subsystem",
  },
  {
    id: "log-104",
    actorName: "Engr. Carlos Reyes",
    actorEmail: "c.reyes@spmc.gov.ph",
    action: "GENERATE_ARTIFACT",
    entityType: "generated_artifact",
    entityId: "art-pacs-01",
    projectCode: "SPMC-PACS-002",
    createdAt: "2026-10-30T16:00:00Z",
    details: "Generated DICOM Modality Gateway skeleton archive (zip, 4.2 MB)",
  },
];

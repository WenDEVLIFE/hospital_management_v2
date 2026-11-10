export interface DocumentTemplate {
  id: string;
  name: string;
  slug: string;
  docType: "technical" | "system" | "hospital_form" | "report" | "data_dictionary" | "user_manual" | "deployment_guide" | "operational";
  description: string;
  variables: string[];
}

export interface GeneratedDocument {
  id: string;
  projectId: string;
  title: string;
  docType: "technical" | "system" | "hospital_form" | "report" | "data_dictionary" | "user_manual" | "deployment_guide" | "operational";
  versionNo: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  updatedAt: string;
  author: string;
  formats: ("docx" | "pdf" | "html" | "markdown")[];
  contentSnippet: string;
}

export const mockTemplates: DocumentTemplate[] = [
  {
    id: "tmpl-sad",
    name: "System Architecture Document (SAD)",
    slug: "system-architecture-doc",
    docType: "technical",
    description: "Enterprise technical document specifying high-level architecture, module decomposition, and security tiers.",
    variables: ["system_name", "components", "interfaces", "deployment_topology"],
  },
  {
    id: "tmpl-srs",
    name: "Software Requirements Specification (SRS)",
    slug: "software-requirements-spec",
    docType: "system",
    description: "Formal specification mapping all functional, non-functional, and interface requirements to approval sign-offs.",
    variables: ["requirements_table", "acceptance_criteria", "revision_history"],
  },
  {
    id: "tmpl-form",
    name: "DOH Hospital Clinical Form Specification",
    slug: "doh-hospital-form-spec",
    docType: "hospital_form",
    description: "Standardized clinical documentation template conforming to Southern Philippines Medical Center clinical audit standards.",
    variables: ["form_code", "clinical_fields", "validation_rules"],
  },
  {
    id: "tmpl-dict",
    name: "Clinical Data Dictionary & Schema Reference",
    slug: "clinical-data-dictionary",
    docType: "data_dictionary",
    description: "Complete relational database data dictionary specifying tables, columns, data types, indexes, and constraints.",
    variables: ["data_entities", "attribute_matrix", "foreign_keys"],
  },
];

export const mockDocuments: GeneratedDocument[] = [
  {
    id: "doc-1",
    projectId: "proj-ehr-01",
    title: "SPMC-EHR System Architecture Document v3.0",
    docType: "technical",
    versionNo: 3,
    status: "approved",
    updatedAt: "2026-11-06T14:30:00Z",
    author: "Engr. Alan Rivera",
    formats: ["pdf", "docx", "markdown"],
    contentSnippet: "This document establishes the architecture baseline for SPMC inpatient clinical charting and order management...",
  },
  {
    id: "doc-2",
    projectId: "proj-ehr-01",
    title: "Inpatient Clinical Vitals Data Dictionary",
    docType: "data_dictionary",
    versionNo: 2,
    status: "approved",
    updatedAt: "2026-11-04T10:15:00Z",
    author: "Kaye Villanueva",
    formats: ["pdf", "html"],
    contentSnippet: "Comprehensive database dictionary defining the encounters, clinical_orders, and vitals_records relations...",
  },
  {
    id: "doc-3",
    projectId: "proj-ehr-01",
    title: "Physician Order Entry (CPOE) Standard Operating Procedure",
    docType: "operational",
    versionNo: 1,
    status: "submitted",
    updatedAt: "2026-11-08T09:00:00Z",
    author: "Dr. Maria Santos",
    formats: ["docx", "markdown"],
    contentSnippet: "Operational clinical guideline for resident physicians entering high-alert medication orders through SPMC EHR...",
  },
  {
    id: "doc-4",
    projectId: "proj-pacs-02",
    title: "SPMC PACS DICOM Interface Specification",
    docType: "system",
    versionNo: 1,
    status: "approved",
    updatedAt: "2026-10-30T16:00:00Z",
    author: "Engr. Carlos Reyes",
    formats: ["pdf", "markdown"],
    contentSnippet: "Technical interface specification covering DICOM modality worklist feeds and diagnostic study routing...",
  },
];

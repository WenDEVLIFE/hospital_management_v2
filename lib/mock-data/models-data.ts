export interface Requirement {
  id: string;
  code: string;
  title: string;
  description: string;
  reqType: "functional" | "non_functional" | "business" | "interface" | "data" | "constraint";
  priority: "low" | "medium" | "high" | "critical";
  status: "draft" | "submitted" | "approved";
}

export interface SystemComponent {
  id: string;
  name: string;
  description: string;
  componentType: string;
  technology: string;
}

export interface SystemInterface {
  id: string;
  name: string;
  description: string;
  sourceComponent: string;
  targetComponent: string;
  protocol: string;
  direction: "inbound" | "outbound" | "bidirectional";
}

export interface DataEntity {
  id: string;
  name: string;
  tableName: string;
  description: string;
  primaryKey: string[];
  attributesCount: number;
}

export interface SystemModel {
  id: string;
  projectId: string;
  name: string;
  description: string;
  versionNo: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  systemMode: "standard" | "complex";
  updatedAt: string;
  requirements: Requirement[];
  components: SystemComponent[];
  interfaces: SystemInterface[];
  entities: DataEntity[];
}

export const mockModels: SystemModel[] = [
  {
    id: "model-ehr-core",
    projectId: "proj-ehr-01",
    name: "EHR Inpatient Charting & Clinical Orders Subsystem",
    description: "Core clinical documentation, computerized physician order entry (CPOE), and vitals management model.",
    versionNo: 3,
    status: "approved",
    systemMode: "complex",
    updatedAt: "2026-11-05T16:20:00Z",
    requirements: [
      {
        id: "req-1",
        code: "REQ-EHR-001",
        title: "Real-time Physician Order Entry (CPOE)",
        description: "Authorized medical doctors must be able to submit medication and diagnostic orders with dual electronic sign-off.",
        reqType: "functional",
        priority: "critical",
        status: "approved",
      },
      {
        id: "req-2",
        code: "REQ-EHR-002",
        title: "Nurse Vitals Auto-Recording & Charting",
        description: "Bedside nursing staff can record temperature, pulse rate, respiratory rate, and blood pressure with instant telemetry check.",
        reqType: "functional",
        priority: "high",
        status: "approved",
      },
      {
        id: "req-3",
        code: "REQ-EHR-003",
        title: "Sub-Second Query Latency on Emergency Charts",
        description: "Patient emergency record summary queries must return within 800 milliseconds under 95th percentile load.",
        reqType: "non_functional",
        priority: "critical",
        status: "approved",
      },
      {
        id: "req-4",
        code: "REQ-EHR-004",
        title: "DOH Data Privacy Compliance",
        description: "All patient health information must adhere strictly to Republic Act 10173 (Data Privacy Act of 2012) and DOH standards.",
        reqType: "constraint",
        priority: "critical",
        status: "approved",
      },
    ],
    components: [
      {
        id: "comp-1",
        name: "Clinical Chart Engine",
        description: "Handles active inpatient encounters, clinical histories, and progress notes.",
        componentType: "Core Domain Service",
        technology: "Next.js / TypeScript / PostgreSQL",
      },
      {
        id: "comp-2",
        name: "Order Processing Service",
        description: "Validates and routes medication, laboratory, and radiology orders.",
        componentType: "Workflow Pipeline",
        technology: "PostgreSQL Triggers & Supabase Realtime",
      },
      {
        id: "comp-3",
        name: "Audit & Access Guardian",
        description: "Logs every physician encounter and patient chart view with immutable timestamps.",
        componentType: "Security Layer",
        technology: "Row Level Security & Append-Only Log",
      },
    ],
    interfaces: [
      {
        id: "if-1",
        name: "Pharmacy Dispense Dispatcher",
        description: "Transmits verified doctor prescription orders to satellite pharmacy queue.",
        sourceComponent: "Order Processing Service",
        targetComponent: "SPMC Pharmacy Dispenser",
        protocol: "HL7 v2.5 / JSON Webhook",
        direction: "outbound",
      },
      {
        id: "if-2",
        name: "PACS Modality Worklist Feed",
        description: "Sends imaging orders to radiology modality schedule broker.",
        sourceComponent: "Order Processing Service",
        targetComponent: "DICOM MWL Broker",
        protocol: "DICOM Modality Worklist / TCP",
        direction: "outbound",
      },
    ],
    entities: [
      {
        id: "ent-1",
        name: "ClinicalEncounter",
        tableName: "encounters",
        description: "Stores individual admission, bed assignment, and attending physician details.",
        primaryKey: ["id"],
        attributesCount: 16,
      },
      {
        id: "ent-2",
        name: "PhysicianOrder",
        tableName: "clinical_orders",
        description: "Tracks individual doctor medication, diagnostic, or dietary orders.",
        primaryKey: ["id"],
        attributesCount: 22,
      },
      {
        id: "ent-3",
        name: "PatientVitalsRecord",
        tableName: "vitals_records",
        description: "Time-series vital signs metrics recorded by floor nurses.",
        primaryKey: ["id"],
        attributesCount: 12,
      },
    ],
  },
  {
    id: "model-pacs-core",
    projectId: "proj-pacs-02",
    name: "Radiology Modality Integration & DICOM Router",
    description: "Standard model for digital imaging transmission and physician report signing.",
    versionNo: 1,
    status: "approved",
    systemMode: "standard",
    updatedAt: "2026-10-28T11:00:00Z",
    requirements: [
      {
        id: "req-p1",
        code: "REQ-PACS-001",
        title: "DICOM C-STORE Storage Support",
        description: "Must receive and parse DICOM Part 10 files from MRI, CT, and X-ray modalities.",
        reqType: "interface",
        priority: "critical",
        status: "approved",
      },
    ],
    components: [
      {
        id: "comp-p1",
        name: "DICOM Storage Receiver",
        description: "Receives raw studies from hospital modalities.",
        componentType: "Gateway Service",
        technology: "DCMTK / C++ Wrapper",
      },
    ],
    interfaces: [],
    entities: [
      {
        id: "ent-p1",
        name: "RadiologyStudy",
        tableName: "studies",
        description: "Metadata container for series and instances.",
        primaryKey: ["id"],
        attributesCount: 14,
      },
    ],
  },
];

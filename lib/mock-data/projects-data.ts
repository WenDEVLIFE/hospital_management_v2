export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: "manager" | "analyst" | "developer" | "documentation_manager" | "reviewer" | "viewer";
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  objectives: string;
  status: "planning" | "active" | "on_hold" | "completed" | "archived";
  systemMode: "standard" | "complex";
  owner: string;
  createdAt: string;
  modelsCount: number;
  documentsCount: number;
  pendingApprovalsCount: number;
  members: ProjectMember[];
}

export const mockProjects: Project[] = [
  {
    id: "proj-ehr-01",
    code: "SPMC-EHR-2026",
    name: "Enterprise Electronic Health Record Modernization",
    description:
      "Centralized inpatient and outpatient clinical chart management, order entry, and vitals recording system for SPMC.",
    objectives:
      "Modernize legacy clinical systems to improve patient safety, real-time charting across 1,500 beds, and PhilHealth e-claims automation.",
    status: "active",
    systemMode: "complex",
    owner: "Dr. Maria Santos",
    createdAt: "2026-08-15T08:00:00Z",
    modelsCount: 4,
    documentsCount: 12,
    pendingApprovalsCount: 2,
    members: [
      { id: "u-1", name: "Dr. Maria Santos", email: "m.santos@spmc.gov.ph", role: "manager" },
      { id: "u-2", name: "Engr. Alan Rivera", email: "a.rivera@spmc.gov.ph", role: "analyst" },
      { id: "u-3", name: "Kaye Villanueva", email: "k.villanueva@spmc.gov.ph", role: "developer" },
      { id: "u-4", name: "Dr. Roberto Gomez", email: "r.gomez@spmc.gov.ph", role: "reviewer" },
    ],
  },
  {
    id: "proj-pacs-02",
    code: "SPMC-PACS-002",
    name: "Radiology PACS & Diagnostic Imaging Integration",
    description:
      "DICOM imaging routing, digital radiology review workstation connectors, and CT/MRI report archiving.",
    objectives:
      "Integrate hospital DICOM modalities with physician diagnostic viewers to lower turnaround from 24h to under 2h.",
    status: "active",
    systemMode: "standard",
    owner: "Engr. Carlos Reyes",
    createdAt: "2026-09-01T10:30:00Z",
    modelsCount: 2,
    documentsCount: 6,
    pendingApprovalsCount: 0,
    members: [
      { id: "u-5", name: "Engr. Carlos Reyes", email: "c.reyes@spmc.gov.ph", role: "manager" },
      { id: "u-6", name: "Leo Mendoza", email: "l.mendoza@spmc.gov.ph", role: "developer" },
    ],
  },
  {
    id: "proj-pharm-03",
    code: "SPMC-PHARM-01",
    name: "Automated Inpatient Pharmacy Dispensing & Verification",
    description:
      "Barcode medication administration verification, drug interaction checking, and satellite pharmacy inventory routing.",
    objectives:
      "Prevent dispensing errors and automate high-alert medication double-check sign-offs for inpatient wards.",
    status: "active",
    systemMode: "complex",
    owner: "Pharm. Elena Torres",
    createdAt: "2026-10-10T14:15:00Z",
    modelsCount: 3,
    documentsCount: 8,
    pendingApprovalsCount: 1,
    members: [
      { id: "u-7", name: "Pharm. Elena Torres", email: "e.torres@spmc.gov.ph", role: "manager" },
      { id: "u-8", name: "Bea Dimaculangan", email: "b.dimaculangan@spmc.gov.ph", role: "analyst" },
      { id: "u-9", name: "Dr. Francis Aquino", email: "f.aquino@spmc.gov.ph", role: "reviewer" },
    ],
  },
  {
    id: "proj-lis-04",
    code: "SPMC-LIS-003",
    name: "Laboratory Information System Analyzer Interfacing",
    description:
      "HL7 / ASTM bidirectional communication with clinical chemistry, hematology, and microbiology analyzers.",
    objectives:
      "Direct numerical result extraction and critical value SMS alerting for emergency room laboratory work.",
    status: "planning",
    systemMode: "standard",
    owner: "Tech. Michael Cruz",
    createdAt: "2026-11-01T09:00:00Z",
    modelsCount: 1,
    documentsCount: 2,
    pendingApprovalsCount: 0,
    members: [
      { id: "u-10", name: "Tech. Michael Cruz", email: "m.cruz@spmc.gov.ph", role: "manager" },
    ],
  },
];

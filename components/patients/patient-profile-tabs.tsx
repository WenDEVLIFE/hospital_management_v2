"use client";

import * as React from "react";
import {
  BillListIcon,
  CalendarMarkIcon,
  DangerTriangleIcon,
  LoginIcon,
  NotebookIcon,
  Pills2Icon,
  StethoscopeIcon,
  TestTubeIcon,
} from "@solar-icons/react/linear";

import { PageSection } from "@/components/layout/page-section";
import { RecordTable, type Column } from "@/components/module/record-table";
import { UnavailableActionDialog } from "@/components/module/unavailable-action";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import type {
  AdmissionListRow,
  AppointmentListRow,
  Encounter,
  InvoiceListRow,
  LaboratoryResult,
  MedicalHistory,
  PatientAllergy,
  PatientListRow,
  PatientSummary,
  PrescriptionListRow,
} from "@/types/hospital";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatIdentifier,
} from "@/lib/format";
import { formatPatientAddress, getPatientAge } from "./patient-utils";

export interface PatientProfileTabsProps {
  patient: PatientListRow;
  summary: PatientSummary;
}

function DefinitionList({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11px] font-medium text-hospital-text-muted">
            {item.label}
          </dt>
          <dd className="mt-0.5 break-words text-sm text-hospital-text">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SeverityValue({ severity }: { severity: string | null }) {
  if (!severity) {
    return <span className="text-hospital-text-muted">Not recorded</span>;
  }

  const label = severity.charAt(0).toUpperCase() + severity.slice(1);
  const isSevere = severity.toLowerCase() === "severe";

  return (
    <span className="inline-flex items-center gap-1 text-sm text-hospital-text">
      {isSevere ? (
        <DangerTriangleIcon
          className="size-3.5 text-red-600"
          aria-hidden="true"
        />
      ) : null}
      <span>{label}</span>
    </span>
  );
}

function OverviewPanel({ patient }: { patient: PatientListRow }) {
  const age = getPatientAge(patient.date_of_birth);
  const address = formatPatientAddress(patient);

  return (
    <div>
      <DefinitionList
        items={[
          {
            label: "Medical Record Number",
            value: (
              <span className="font-mono text-[13px]">
                {formatIdentifier(patient.medical_record_number)}
              </span>
            ),
          },
          {
            label: "Registration Status",
            value: <StatusBadge status={patient.registration_status} />,
          },
          { label: "Sex", value: patient.sex ?? "\u2014" },
          {
            label: "Date of Birth",
            value: patient.date_of_birth
              ? `${formatDate(patient.date_of_birth)}${
                  age !== null ? ` (${age} years old)` : ""
                }`
              : "\u2014",
          },
          {
            label: "Contact Number",
            value: patient.contact_number ?? "\u2014",
          },
          { label: "Email Address", value: patient.email ?? "\u2014" },
          { label: "Address", value: address || "\u2014" },
          {
            label: "Registration Date",
            value: formatDate(patient.registration_date),
          },
        ]}
      />

      <div className="mt-5 border-t border-hospital-border-subtle pt-5">
        <h3 className="text-sm font-semibold text-hospital-text">
          Emergency Contact
        </h3>
        <p className="mt-1 text-xs text-hospital-text-muted">
          Emergency contact details are not available in this record view.
        </p>
      </div>
    </div>
  );
}

function MedicalHistoryPanel({ rows }: { rows: MedicalHistory[] }) {
  const columns: Column<MedicalHistory>[] = [
    {
      key: "history_type",
      header: "Type",
      cell: (row) => row.history_type,
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => row.description,
    },
    {
      key: "recorded_at",
      header: "Recorded At",
      cell: (row) => formatDateTime(row.recorded_at),
    },
  ];

  return (
    <RecordTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      caption="Medical history"
      emptyTitle="No medical history recorded"
      emptyDescription="No medical history has been recorded for this patient."
      emptyIcon={<NotebookIcon className="size-5" aria-hidden="true" />}
    />
  );
}

function AllergiesPanel({
  rows,
  onAddAllergy,
}: {
  rows: PatientAllergy[];
  onAddAllergy: () => void;
}) {
  const columns: Column<PatientAllergy>[] = [
    {
      key: "allergen",
      header: "Allergen",
      cell: (row) => (
        <span className="font-medium text-hospital-text">{row.allergen}</span>
      ),
    },
    {
      key: "reaction",
      header: "Reaction",
      cell: (row) => row.reaction ?? "\u2014",
    },
    {
      key: "severity",
      header: "Severity",
      cell: (row) => <SeverityValue severity={row.severity} />,
    },
    {
      key: "notes",
      header: "Notes",
      cell: (row) => row.notes ?? "\u2014",
    },
    {
      key: "recorded_at",
      header: "Recorded",
      cell: (row) => formatDate(row.created_at),
    },
  ];

  return (
    <RecordTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      caption="Allergies"
      toolbarActions={
        <Button variant="outline" size="sm" onClick={onAddAllergy}>
          Add allergy
        </Button>
      }
      emptyTitle="No allergies recorded"
      emptyDescription="No allergies have been recorded for this patient."
      emptyIcon={<DangerTriangleIcon className="size-5" aria-hidden="true" />}
    />
  );
}

function AppointmentsPanel({ rows }: { rows: AppointmentListRow[] }) {
  const columns: Column<AppointmentListRow>[] = [
    {
      key: "appointment_number",
      header: "Appointment No.",
      cell: (row) => (
        <span className="font-mono text-[11px]">
          {formatIdentifier(row.appointment_number)}
        </span>
      ),
    },
    {
      key: "scheduled_at",
      header: "Scheduled",
      cell: (row) => formatDateTime(row.scheduled_at),
    },
    {
      key: "department_name",
      header: "Department",
      cell: (row) => row.department_name,
    },
    {
      key: "physician_name",
      header: "Physician",
      cell: (row) => row.physician_name ?? "\u2014",
    },
    {
      key: "appointment_type",
      header: "Type",
      cell: (row) => row.appointment_type ?? "\u2014",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <RecordTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      caption="Appointments"
      emptyTitle="No appointments on record"
      emptyDescription="This patient has no appointments on record."
      emptyIcon={<CalendarMarkIcon className="size-5" aria-hidden="true" />}
    />
  );
}

function AdmissionsPanel({ rows }: { rows: AdmissionListRow[] }) {
  const columns: Column<AdmissionListRow>[] = [
    {
      key: "admission_number",
      header: "Admission No.",
      cell: (row) => (
        <span className="font-mono text-[11px]">
          {formatIdentifier(row.admission_number)}
        </span>
      ),
    },
    {
      key: "admission_date",
      header: "Admitted",
      cell: (row) => formatDateTime(row.admission_date),
    },
    {
      key: "discharge_date",
      header: "Discharged",
      cell: (row) =>
        row.discharge_date ? formatDateTime(row.discharge_date) : "\u2014",
    },
    {
      key: "department_name",
      header: "Department",
      cell: (row) => row.department_name,
    },
    {
      key: "attending_physician_name",
      header: "Attending Physician",
      cell: (row) => row.attending_physician_name ?? "\u2014",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <RecordTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      caption="Admissions"
      emptyTitle="No admissions on record"
      emptyDescription="This patient has no admissions on record."
      emptyIcon={<LoginIcon className="size-5" aria-hidden="true" />}
    />
  );
}

function EncountersPanel({ rows }: { rows: Encounter[] }) {
  const columns: Column<Encounter>[] = [
    {
      key: "encounter_number",
      header: "Encounter No.",
      cell: (row) => (
        <span className="font-mono text-[11px]">
          {formatIdentifier(row.encounter_number)}
        </span>
      ),
    },
    {
      key: "encounter_type",
      header: "Type",
      cell: (row) => row.encounter_type,
    },
    {
      key: "chief_complaint",
      header: "Chief Complaint",
      cell: (row) => row.chief_complaint ?? "\u2014",
    },
    {
      key: "started_at",
      header: "Started",
      cell: (row) => formatDateTime(row.started_at),
    },
    {
      key: "clinical_status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.clinical_status} />,
    },
  ];

  return (
    <RecordTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      caption="Clinical encounters"
      emptyTitle="No clinical encounters on record"
      emptyDescription="This patient has no clinical encounters on record."
      emptyIcon={<StethoscopeIcon className="size-5" aria-hidden="true" />}
    />
  );
}

function LaboratoryPanel({ rows }: { rows: LaboratoryResult[] }) {
  const columns: Column<LaboratoryResult>[] = [
    {
      key: "result",
      header: "Result",
      cell: (row) =>
        row.result_value
          ? `${row.result_value}${row.result_unit ? ` ${row.result_unit}` : ""}`
          : "\u2014",
    },
    {
      key: "reference_range",
      header: "Reference Range",
      cell: (row) => row.reference_range ?? "\u2014",
    },
    {
      key: "interpretation",
      header: "Interpretation",
      cell: (row) => row.interpretation ?? "\u2014",
    },
    {
      key: "verification_status",
      header: "Verification",
      cell: (row) => <StatusBadge status={row.verification_status} />,
    },
    {
      key: "performed_at",
      header: "Performed",
      cell: (row) =>
        row.performed_at ? formatDateTime(row.performed_at) : "\u2014",
    },
  ];

  return (
    <RecordTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      caption="Laboratory results"
      emptyTitle="No laboratory results on record"
      emptyDescription="This patient has no laboratory results on record."
      emptyIcon={<TestTubeIcon className="size-5" aria-hidden="true" />}
    />
  );
}

function PrescriptionsPanel({ rows }: { rows: PrescriptionListRow[] }) {
  const columns: Column<PrescriptionListRow>[] = [
    {
      key: "prescription_number",
      header: "Prescription No.",
      cell: (row) => (
        <span className="font-mono text-[11px]">
          {formatIdentifier(row.prescription_number)}
        </span>
      ),
    },
    {
      key: "prescription_date",
      header: "Date",
      cell: (row) => formatDate(row.prescription_date),
    },
    {
      key: "prescribed_by_name",
      header: "Prescribed By",
      cell: (row) => row.prescribed_by_name,
    },
    {
      key: "medications",
      header: "Medications",
      cell: (row) => (row.medications.length ? row.medications.join(", ") : "\u2014"),
    },
    {
      key: "item_count",
      header: "Items",
      align: "right",
      cell: (row) => row.item_count,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <RecordTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      caption="Prescriptions"
      emptyTitle="No prescriptions on record"
      emptyDescription="This patient has no prescriptions on record."
      emptyIcon={<Pills2Icon className="size-5" aria-hidden="true" />}
    />
  );
}

function BillingPanel({ rows }: { rows: InvoiceListRow[] }) {
  const columns: Column<InvoiceListRow>[] = [
    {
      key: "invoice_number",
      header: "Invoice No.",
      cell: (row) => (
        <span className="font-mono text-[11px]">
          {formatIdentifier(row.invoice_number)}
        </span>
      ),
    },
    {
      key: "invoice_date",
      header: "Invoice Date",
      cell: (row) => formatDate(row.invoice_date),
    },
    {
      key: "total_amount",
      header: "Total Amount",
      align: "right",
      cell: (row) => formatCurrency(row.total_amount),
    },
    {
      key: "amount_paid",
      header: "Amount Paid",
      align: "right",
      cell: (row) => formatCurrency(row.amount_paid),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      cell: (row) => formatCurrency(row.balance),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <RecordTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      caption="Billing history"
      emptyTitle="No billing history on record"
      emptyDescription="This patient has no billing history on record."
      emptyIcon={<BillListIcon className="size-5" aria-hidden="true" />}
    />
  );
}

export function PatientProfileTabs({
  patient,
  summary,
}: PatientProfileTabsProps) {
  const [tab, setTab] = React.useState("overview");
  const [showAddAllergy, setShowAddAllergy] = React.useState(false);

  const tabItems: TabItem[] = [
    { value: "overview", label: "Overview" },
    {
      value: "medical-history",
      label: "Medical History",
      count: summary.history.length,
    },
    {
      value: "allergies",
      label: "Allergies",
      count: summary.allergies.length,
    },
    {
      value: "appointments",
      label: "Appointments",
      count: summary.appointments.length,
    },
    {
      value: "admissions",
      label: "Admissions",
      count: summary.admissions.length,
    },
    {
      value: "encounters",
      label: "Clinical Encounters",
      count: summary.encounters.length,
    },
    {
      value: "laboratory",
      label: "Laboratory Results",
      count: summary.labResults.length,
    },
    {
      value: "prescriptions",
      label: "Prescriptions",
      count: summary.prescriptions.length,
    },
    {
      value: "billing",
      label: "Billing History",
      count: summary.invoices.length,
    },
  ];

  return (
    <PageSection>
      <Tabs items={tabItems} value={tab} onValueChange={setTab} />

      <div role="tabpanel" className="pt-5">
        {tab === "overview" ? <OverviewPanel patient={patient} /> : null}

        {tab === "medical-history" ? (
          <MedicalHistoryPanel rows={summary.history} />
        ) : null}

        {tab === "allergies" ? (
          <AllergiesPanel
            rows={summary.allergies}
            onAddAllergy={() => setShowAddAllergy(true)}
          />
        ) : null}

        {tab === "appointments" ? (
          <AppointmentsPanel rows={summary.appointments} />
        ) : null}

        {tab === "admissions" ? (
          <AdmissionsPanel rows={summary.admissions} />
        ) : null}

        {tab === "encounters" ? (
          <EncountersPanel rows={summary.encounters} />
        ) : null}

        {tab === "laboratory" ? (
          <LaboratoryPanel rows={summary.labResults} />
        ) : null}

        {tab === "prescriptions" ? (
          <PrescriptionsPanel rows={summary.prescriptions} />
        ) : null}

        {tab === "billing" ? <BillingPanel rows={summary.invoices} /> : null}
      </div>

      <UnavailableActionDialog
        open={showAddAllergy}
        onClose={() => setShowAddAllergy(false)}
        title="Add allergy"
        description="Allergy records cannot be changed yet."
      />
    </PageSection>
  );
}

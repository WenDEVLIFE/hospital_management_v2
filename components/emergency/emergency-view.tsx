"use client";

import * as React from "react";
import {
  ClipboardListIcon,
  ClockCircleIcon,
  HeartPulseIcon,
  Scanner2Icon,
  TestTubeIcon,
} from "@solar-icons/react/linear";

import type {
  EmergencyTriageLevel,
  EmergencyVisitDetail,
  EmergencyVisitListRow,
} from "@/types/hospital";
import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { UNAVAILABLE_MESSAGE } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "waiting", label: "Waiting" },
  { value: "triage", label: "In triage" },
  { value: "in_treatment", label: "In treatment" },
  { value: "observation", label: "Observation" },
  { value: "admitted", label: "Admitted" },
  { value: "transferred", label: "Transferred" },
  { value: "discharged", label: "Discharged" },
];

const TRIAGE_OPTIONS: { value: EmergencyTriageLevel; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "emergent", label: "Emergent" },
  { value: "urgent", label: "Urgent" },
  { value: "less_urgent", label: "Less urgent" },
  { value: "non_urgent", label: "Non-urgent" },
];

const TRIAGE_LEVELS: {
  value: EmergencyTriageLevel;
  label: string;
  description: string;
  accent: string;
}[] = [
  {
    value: "critical",
    label: "Critical",
    description: "Immediate life-saving intervention",
    accent: "border-l-red-600",
  },
  {
    value: "emergent",
    label: "Emergent",
    description: "High risk; rapid assessment",
    accent: "border-l-amber-500",
  },
  {
    value: "urgent",
    label: "Urgent",
    description: "Stable but timely care required",
    accent: "border-l-sky-500",
  },
  {
    value: "less_urgent",
    label: "Less urgent",
    description: "Can wait with monitoring",
    accent: "border-l-slate-400",
  },
  {
    value: "non_urgent",
    label: "Non-urgent",
    description: "Routine care needs",
    accent: "border-l-emerald-500",
  },
];

const ACTIVE_STATUSES = new Set([
  "waiting",
  "triage",
  "in_treatment",
  "observation",
]);

export interface EmergencyViewProps {
  rows: EmergencyVisitListRow[];
  details: Record<string, EmergencyVisitDetail>;
}

function formatWait(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining === 0 ? `${hours} hr` : `${hours} hr ${remaining} min`;
}

function humanizeArrivalMode(mode: EmergencyVisitListRow["arrival_mode"]): string {
  switch (mode) {
    case "ambulance":
      return "Ambulance";
    case "referral":
      return "Referral";
    case "walk_in":
    default:
      return "Walk-in";
  }
}

function humanizeDisposition(
  disposition: EmergencyVisitListRow["disposition"]
): string {
  switch (disposition) {
    case "admit":
      return "Admit to inpatient";
    case "transfer":
      return "Transfer to another facility";
    case "discharge":
      return "Discharge from emergency department";
    default:
      return "Pending";
  }
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-hospital-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-hospital-text">{children}</dd>
    </div>
  );
}

function VitalBlock({
  label,
  value,
  unit,
}: {
  label: string;
  value: React.ReactNode;
  unit: string;
}) {
  return (
    <div className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2">
      <p className="text-[11px] font-medium text-hospital-text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-hospital-text">
        {value ?? "\u2014"}{" "}
        <span className="text-[11px] font-normal text-hospital-text-subtle">
          {unit}
        </span>
      </p>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-hospital-text-muted">
      <span aria-hidden="true">{icon}</span>
      {title}
    </h3>
  );
}

export function EmergencyView({ rows, details }: EmergencyViewProps) {
  const [tab, setTab] = React.useState("queue");
  const [selected, setSelected] = React.useState<EmergencyVisitListRow | null>(
    null
  );
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const activeRows = React.useMemo(
    () => rows.filter((row) => ACTIVE_STATUSES.has(row.status)),
    [rows]
  );

  const openVisit = React.useCallback((row: EmergencyVisitListRow) => {
    setPendingAction(null);
    setSelected(row);
  }, []);

  const closeVisit = React.useCallback(() => {
    setPendingAction(null);
    setSelected(null);
  }, []);

  const columns = React.useMemo<Column<EmergencyVisitListRow>[]>(
    () => [
      {
        key: "visit_number",
        header: "Visit No.",
        sortable: true,
        sortValue: (row) => row.visit_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.visit_number}
          </span>
        ),
      },
      {
        key: "patient",
        header: "Patient",
        sortable: true,
        sortValue: (row) => row.patient_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">{row.patient_name}</p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.patient_mrn}
            </p>
          </div>
        ),
      },
      {
        key: "arrival",
        header: "Arrival",
        sortable: true,
        sortValue: (row) => row.arrival_at,
        cell: (row) => (
          <div className="whitespace-nowrap">
            <p>{formatDateTime(row.arrival_at)}</p>
            <p className="flex items-center gap-1 text-[11px] text-hospital-text-muted">
              <ClockCircleIcon className="size-3" aria-hidden="true" />
              {formatWait(row.wait_minutes)}
            </p>
          </div>
        ),
      },
      {
        key: "triage",
        header: "Triage",
        sortable: true,
        sortValue: (row) => row.triage_level,
        cell: (row) => <StatusBadge status={row.triage_level} />,
      },
      {
        key: "complaint",
        header: "Presenting complaint",
        cell: (row) => (
          <span className="line-clamp-2 max-w-[16rem] text-hospital-text">
            {row.chief_complaint}
          </span>
        ),
      },
      {
        key: "team",
        header: "Assigned team",
        cell: (row) => (
          <div className="min-w-0 text-xs">
            <p className="text-hospital-text">
              {row.attending_physician_name ?? "Physician unassigned"}
            </p>
            <p className="text-hospital-text-muted">
              {row.triage_nurse_name ?? "Nurse unassigned"}
            </p>
          </div>
        ),
      },
      {
        key: "area",
        header: "Area",
        cell: (row) => row.treatment_area ?? "\u2014",
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View emergency visit ${row.visit_number}`}
            onClick={() => openVisit(row)}
          >
            View
          </Button>
        ),
      },
    ],
    [openVisit]
  );

  const filters = React.useMemo<FilterConfig<EmergencyVisitListRow>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "triage",
        label: "triage level",
        allLabel: "All triage levels",
        options: TRIAGE_OPTIONS,
        accessor: (row) => row.triage_level,
      },
    ],
    []
  );

  const detail = selected ? details[selected.id] ?? null : null;

  return (
    <>
      <div className="space-y-4">
        <Tabs
          items={[
            { value: "queue", label: "Queue", count: rows.length },
            {
              value: "triage",
              label: "Triage board",
              count: activeRows.length,
            },
          ]}
          value={tab}
          onValueChange={setTab}
        />

        {tab === "queue" ? (
          <RecordTable
            rows={rows}
            columns={columns}
            rowKey={(row) => row.id}
            caption="Emergency department queue"
            searchPlaceholder="Search visit no., patient, or complaint"
            searchAccessor={(row) =>
              `${row.visit_number} ${row.patient_name} ${row.patient_mrn} ${row.chief_complaint}`
            }
            filters={filters}
            emptyTitle="No emergency visits found"
            emptyDescription="There are no emergency visits matching your selected filters."
            emptyIcon={
              <ClipboardListIcon className="size-5" aria-hidden="true" />
            }
            pageSize={10}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-hospital-text-muted">
              Triage levels are entered by the triage nurse. The system does not
              calculate or auto-escalate clinical priority.
            </p>

            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-5">
              {TRIAGE_LEVELS.map((level) => {
                const cases = activeRows.filter(
                  (row) => row.triage_level === level.value
                );

                return (
                  <section
                    key={level.value}
                    aria-label={`${level.label} triage column`}
                    className="rounded-md border border-hospital-border bg-white shadow-xs"
                  >
                    <div className={cn("border-l-4 px-3 py-2", level.accent)}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-hospital-text">
                          {level.label}
                        </h3>
                        <span className="text-[11px] font-medium text-hospital-text-muted">
                          {cases.length}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                        {level.description}
                      </p>
                    </div>

                    <div className="space-y-2 p-2">
                      {cases.length === 0 ? (
                        <p className="px-1 py-4 text-center text-[11px] text-hospital-text-subtle">
                          No active cases
                        </p>
                      ) : (
                        cases.map((row) => (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => openVisit(row)}
                            className="w-full rounded-md border border-hospital-border-subtle bg-hospital-surface p-2.5 text-left transition-colors hover:bg-hospital-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-medium text-hospital-text">
                                {row.patient_name}
                              </span>
                              <span className="font-mono text-[10px] text-hospital-text-muted">
                                {row.visit_number}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-hospital-text-muted">
                              {row.chief_complaint}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <StatusBadge status={row.status} />
                              <span className="text-[10px] text-hospital-text-muted">
                                {formatWait(row.wait_minutes)}
                              </span>
                              <span className="text-[10px] text-hospital-text-subtle">
                                {row.treatment_area ?? "Area unassigned"}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={selected !== null}
        onClose={closeVisit}
        title={
          selected
            ? `Emergency visit ${selected.visit_number}`
            : "Emergency visit details"
        }
        description="Triage, treatment, orders, and disposition"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeVisit}>
            Close
          </Button>
        }
      >
        {selected ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Patient">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">{selected.patient_name}</span>
                  <span className="font-mono text-[11px] text-hospital-text-muted">
                    {selected.patient_mrn}
                  </span>
                </div>
              </DetailField>

              <DetailField label="Status">
                <StatusBadge status={selected.status} />
              </DetailField>

              <DetailField label="Triage level">
                <StatusBadge status={selected.triage_level} />
              </DetailField>

              <DetailField label="Arrival">
                {formatDateTime(selected.arrival_at)} ·{" "}
                {humanizeArrivalMode(selected.arrival_mode)}
              </DetailField>

              <DetailField label="Treatment area">
                {selected.treatment_area ?? "\u2014"}
              </DetailField>

              <DetailField label="Attending physician">
                {detail?.attending_physician_name ??
                  selected.attending_physician_name ??
                  "Unassigned"}
              </DetailField>

              <DetailField label="Triage nurse">
                {detail?.triage_nurse_name ??
                  selected.triage_nurse_name ??
                  "Unassigned"}
              </DetailField>

              <DetailField label="Presenting complaint">
                {selected.chief_complaint}
              </DetailField>
            </dl>

            {detail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<HeartPulseIcon className="size-3.5" />}
                    title="Vital signs"
                  />
                  {detail.vitals.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No vital signs recorded for this visit.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detail.vitals.map((vital) => (
                        <div
                          key={vital.id}
                          className="rounded-md border border-hospital-border p-3"
                        >
                          <p className="text-[11px] text-hospital-text-muted">
                            Recorded {formatDateTime(vital.recorded_at)}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                            <VitalBlock
                              label="BP"
                              value={
                                vital.systolic_bp && vital.diastolic_bp
                                  ? `${vital.systolic_bp}/${vital.diastolic_bp}`
                                  : null
                              }
                              unit="mmHg"
                            />
                            <VitalBlock
                              label="Heart rate"
                              value={vital.heart_rate}
                              unit="bpm"
                            />
                            <VitalBlock
                              label="Respiratory rate"
                              value={vital.respiratory_rate}
                              unit="/min"
                            />
                            <VitalBlock
                              label="Temperature"
                              value={vital.temperature}
                              unit="°C"
                            />
                            <VitalBlock
                              label="Oxygen saturation"
                              value={vital.oxygen_saturation}
                              unit="%"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<ClipboardListIcon className="size-3.5" />}
                    title="Clinical picture"
                  />
                  <div className="rounded-md border border-hospital-border p-3">
                    <p className="text-xs text-hospital-text-muted">
                      Working diagnosis
                    </p>
                    <p className="mt-1 text-sm font-medium text-hospital-text">
                      {detail.diagnoses[0]?.diagnosis_name ??
                        "Not documented yet"}
                    </p>
                    {detail.procedures.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {detail.procedures.map((procedure) => (
                          <span
                            key={procedure}
                            className="rounded-full border border-hospital-border bg-hospital-surface px-2 py-0.5 text-[11px] text-hospital-text-muted"
                          >
                            {procedure}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<TestTubeIcon className="size-3.5" />}
                    title="Orders"
                  />
                  {detail.orders.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No laboratory or imaging orders recorded.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {detail.orders.map((order) => (
                        <li
                          key={order.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border p-3"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="flex size-7 shrink-0 items-center justify-center rounded-md bg-hospital-surface-muted text-hospital-text-muted"
                            >
                              {order.kind === "laboratory" ? (
                                <TestTubeIcon className="size-3.5" />
                              ) : (
                                <Scanner2Icon className="size-3.5" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm text-hospital-text">
                                {order.label}
                              </p>
                              <p className="text-[11px] text-hospital-text-muted">
                                {order.kind === "laboratory"
                                  ? "Laboratory"
                                  : "Imaging"}{" "}
                                · {order.ordered_by_name} ·{" "}
                                {formatDateTime(order.ordered_at)}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={order.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<ClipboardListIcon className="size-3.5" />}
                    title="Emergency notes"
                  />
                  <ul className="space-y-2">
                    {detail.notes.map((note) => (
                      <li
                        key={note.id}
                        className="rounded-md border border-hospital-border p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-hospital-text">
                            {note.note_type}
                          </p>
                          <StatusBadge status={note.status} />
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-hospital-text-muted">
                          {note.content}
                        </p>
                        <p className="mt-1 text-[11px] text-hospital-text-subtle">
                          {note.author_name} · {note.author_role} ·{" "}
                          {formatDateTime(note.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<ClockCircleIcon className="size-3.5" />}
                    title="Monitoring"
                  />
                  <ul className="space-y-1.5">
                    {detail.monitoring.map((entry) => (
                      <li
                        key={`${entry.recorded_at}-${entry.note}`}
                        className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                      >
                        <p className="text-xs text-hospital-text">
                          {entry.note}
                        </p>
                        <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                          {entry.recorded_by_name} ·{" "}
                          {formatDateTime(entry.recorded_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<ClipboardListIcon className="size-3.5" />}
                    title="Disposition"
                  />
                  <div className="rounded-md border border-hospital-border p-3">
                    <p className="text-sm text-hospital-text">
                      {humanizeDisposition(detail.visit.disposition)}
                    </p>
                    {detail.visit.disposition_at ? (
                      <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                        Recorded {formatDateTime(detail.visit.disposition_at)}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                        The patient is still active in the emergency department.
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPendingAction("Admit patient")}
                      >
                        Admit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPendingAction("Transfer patient")}
                      >
                        Transfer
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPendingAction("Discharge patient")}
                      >
                        Discharge
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPendingAction("Print case report")}
                      >
                        Print case report
                      </Button>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <p className="text-sm text-hospital-text-muted">
                Detailed clinical data is not available for this visit.
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

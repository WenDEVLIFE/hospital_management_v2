"use client";

import * as React from "react";
import {
  BillListIcon,
  CheckCircleIcon,
  ClipboardCheckIcon,
  ClockCircleIcon,
  DangerCircleIcon,
  HeartPulseIcon,
  MedicalKitIcon,
  StethoscopeIcon,
} from "@solar-icons/react/linear";

import type {
  OperatingRoomBoardRow,
  SurgeryChecklistItem,
  SurgeryDetail,
  SurgeryListRow,
  SurgerySupplyUsage,
} from "@/types/hospital";
import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { UNAVAILABLE_MESSAGE } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { formatCurrency, formatDateTime } from "@/lib/format";

const STATUS_OPTIONS = [
  { value: "requested", label: "Requested" },
  { value: "scheduled", label: "Scheduled" },
  { value: "pre_op", label: "Pre-op" },
  { value: "in_progress", label: "In OR" },
  { value: "recovery", label: "Recovery" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "elective", label: "Elective" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
];

export interface SurgeryViewProps {
  rows: SurgeryListRow[];
  rooms: OperatingRoomBoardRow[];
  details: Record<string, SurgeryDetail>;
}

function humanizeAnesthesia(
  value: SurgeryDetail["surgery"]["anesthesia_type"]
): string {
  switch (value) {
    case "general":
      return "General anesthesia";
    case "regional":
      return "Regional anesthesia";
    case "local":
      return "Local anesthesia";
    case "sedation":
      return "Sedation / monitored anesthesia care";
    default:
      return "Not assigned";
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

function ReadinessBadge({ ready }: { ready: boolean }) {
  return (
    <Badge variant={ready ? "success" : "critical"}>
      {ready ? (
        <CheckCircleIcon className="size-3.5" aria-hidden="true" />
      ) : (
        <DangerCircleIcon className="size-3.5" aria-hidden="true" />
      )}
      <span>{ready ? "Ready" : "Incomplete"}</span>
    </Badge>
  );
}

function ChecklistRow({ item }: { item: SurgeryChecklistItem }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2">
      <div className="flex min-w-0 items-start gap-2">
        <span
          aria-hidden="true"
          className={item.completed ? "text-emerald-600" : "text-amber-600"}
        >
          {item.completed ? (
            <CheckCircleIcon className="size-4" />
          ) : (
            <DangerCircleIcon className="size-4" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-hospital-text">{item.label}</p>
          {item.note ? (
            <p className="mt-0.5 text-[11px] text-hospital-text-muted">
              {item.note}
            </p>
          ) : null}
        </div>
      </div>
      <span className="shrink-0 text-[11px] font-medium text-hospital-text-muted">
        {item.completed ? "Complete" : "Pending"}
      </span>
    </li>
  );
}

function SupplyRow({ supply }: { supply: SurgerySupplyUsage }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <MedicalKitIcon
          className="size-3.5 shrink-0 text-hospital-text-muted"
          aria-hidden="true"
        />
        <span className="truncate text-xs text-hospital-text">
          {supply.name}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="info">{supply.category}</Badge>
        <span className="text-[11px] font-medium text-hospital-text-muted">
          {supply.quantity}
        </span>
      </div>
    </li>
  );
}

export function SurgeryView({ rows, rooms, details }: SurgeryViewProps) {
  const [tab, setTab] = React.useState("schedule");
  const [selected, setSelected] = React.useState<SurgeryListRow | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const openCase = React.useCallback((row: SurgeryListRow) => {
    setPendingAction(null);
    setSelected(row);
  }, []);

  const closeCase = React.useCallback(() => {
    setPendingAction(null);
    setSelected(null);
  }, []);

  const roomNames = React.useMemo(
    () => Array.from(new Set(rows.map((row) => row.room_name))).sort(),
    [rows]
  );

  const columns = React.useMemo<Column<SurgeryListRow>[]>(
    () => [
      {
        key: "case_number",
        header: "Case No.",
        sortable: true,
        sortValue: (row) => row.case_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.case_number}
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
        key: "procedure",
        header: "Procedure",
        sortable: true,
        sortValue: (row) => row.procedure_name,
        cell: (row) => (
          <div className="min-w-0">
            <p className="text-hospital-text">{row.procedure_name}</p>
            <p className="font-mono text-[11px] text-hospital-text-muted">
              {row.procedure_code}
            </p>
          </div>
        ),
      },
      {
        key: "room",
        header: "OR",
        sortable: true,
        sortValue: (row) => row.room_name,
        cell: (row) => row.room_name,
      },
      {
        key: "schedule",
        header: "Schedule",
        sortable: true,
        sortValue: (row) => row.scheduled_start,
        cell: (row) => (
          <div className="whitespace-nowrap text-xs">
            <p>{formatDateTime(row.scheduled_start)}</p>
            <p className="text-[11px] text-hospital-text-muted">
              to {formatDateTime(row.scheduled_end)}
            </p>
          </div>
        ),
      },
      {
        key: "priority",
        header: "Priority",
        cell: (row) => <StatusBadge status={row.priority} />,
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "team",
        header: "Surgical team",
        cell: (row) => (
          <div className="min-w-0 text-xs">
            <p className="text-hospital-text">{row.surgeon_name}</p>
            <p className="text-hospital-text-muted">
              {row.anesthesiologist_name ?? "Anesthesiologist unassigned"}
            </p>
            <p className="truncate text-[11px] text-hospital-text-subtle">
              {row.team_summary}
            </p>
          </div>
        ),
      },
      {
        key: "readiness",
        header: "Pre-op",
        cell: (row) => <ReadinessBadge ready={row.pre_op_ready} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View surgical case ${row.case_number}`}
            onClick={() => openCase(row)}
          >
            View
          </Button>
        ),
      },
    ],
    [openCase]
  );

  const filters = React.useMemo<FilterConfig<SurgeryListRow>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "priority",
        label: "priority",
        allLabel: "All priorities",
        options: PRIORITY_OPTIONS,
        accessor: (row) => row.priority,
      },
      {
        key: "room",
        label: "OR",
        allLabel: "All operating rooms",
        options: roomNames.map((name) => ({ label: name, value: name })),
        accessor: (row) => row.room_name,
      },
    ],
    [roomNames]
  );

  const detail = selected ? details[selected.id] ?? null : null;

  return (
    <>
      <div className="space-y-4">
        <Tabs
          items={[
            { value: "schedule", label: "Surgery schedule", count: rows.length },
            { value: "board", label: "OR board", count: rooms.length },
          ]}
          value={tab}
          onValueChange={setTab}
        />

        {tab === "schedule" ? (
          <RecordTable
            rows={rows}
            columns={columns}
            rowKey={(row) => row.id}
            caption="Surgical case schedule"
            searchPlaceholder="Search case no., patient, procedure, or surgeon"
            searchAccessor={(row) =>
              `${row.case_number} ${row.patient_name} ${row.patient_mrn} ${row.procedure_name} ${row.procedure_code} ${row.surgeon_name} ${row.room_name}`
            }
            filters={filters}
            emptyTitle="No surgical cases found"
            emptyDescription="There are no surgical cases matching your selected filters."
            emptyIcon={
              <MedicalKitIcon className="size-5" aria-hidden="true" />
            }
            pageSize={10}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-hospital-text-muted">
              Operating room status reflects the current theatre state. Active
              and next cases are shown per room.
            </p>

            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => (
                <section
                  key={room.id}
                  aria-label={`${room.room_name} status`}
                  className="rounded-md border border-hospital-border bg-white p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-hospital-text">
                        {room.room_name}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                        {room.notes ?? "No room note"}
                      </p>
                    </div>
                    <StatusBadge status={room.status} />
                  </div>

                  <div className="mt-3">
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-hospital-surface-muted"
                      aria-hidden="true"
                    >
                      <div
                        className="h-1.5 rounded-full bg-hospital-green"
                        style={{ width: `${room.utilization_today}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-hospital-text-muted">
                      {room.utilization_today}% utilized today
                    </p>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div className="rounded-md border border-hospital-border-subtle bg-hospital-surface p-2.5">
                      <p className="text-[11px] font-medium text-hospital-text-muted">
                        Current case
                      </p>
                      {room.current_case ? (
                        <button
                          type="button"
                          onClick={() => openCase(room.current_case!)}
                          className="mt-1 w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
                        >
                          <p className="text-xs font-medium text-hospital-text">
                            {room.current_case.patient_name}
                          </p>
                          <p className="text-[11px] text-hospital-text-muted">
                            {room.current_case.procedure_name} ·{" "}
                            {formatDateTime(room.current_case.scheduled_start)}
                          </p>
                          <div className="mt-1">
                            <StatusBadge status={room.current_case.status} />
                          </div>
                        </button>
                      ) : (
                        <p className="mt-1 text-xs text-hospital-text-muted">
                          No active case.
                        </p>
                      )}
                    </div>

                    <div className="rounded-md border border-hospital-border-subtle bg-hospital-surface p-2.5">
                      <p className="text-[11px] font-medium text-hospital-text-muted">
                        Next case
                      </p>
                      {room.next_case ? (
                        <button
                          type="button"
                          onClick={() => openCase(room.next_case!)}
                          className="mt-1 w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
                        >
                          <p className="text-xs font-medium text-hospital-text">
                            {room.next_case.patient_name}
                          </p>
                          <p className="text-[11px] text-hospital-text-muted">
                            {room.next_case.procedure_name} ·{" "}
                            {formatDateTime(room.next_case.scheduled_start)}
                          </p>
                          <div className="mt-1">
                            <StatusBadge status={room.next_case.status} />
                          </div>
                        </button>
                      ) : (
                        <p className="mt-1 text-xs text-hospital-text-muted">
                          No next case scheduled.
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={selected !== null}
        onClose={closeCase}
        title={
          selected
            ? `Surgical case ${selected.case_number}`
            : "Surgical case details"
        }
        description="Pre-operative readiness, intra-operative record, recovery, and billing"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeCase}>
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

              <DetailField label="Procedure">
                {selected.procedure_name}
              </DetailField>

              <DetailField label="Procedure code">
                <span className="font-mono text-xs">
                  {selected.procedure_code}
                </span>
              </DetailField>

              <DetailField label="Priority">
                <StatusBadge status={selected.priority} />
              </DetailField>

              <DetailField label="Operating room">
                {selected.room_name}
              </DetailField>

              <DetailField label="Scheduled">
                {formatDateTime(selected.scheduled_start)}
              </DetailField>

              <DetailField label="Scheduled end">
                {formatDateTime(selected.scheduled_end)}
              </DetailField>

              <DetailField label="Actual start">
                {detail?.surgery.actual_start
                  ? formatDateTime(detail.surgery.actual_start)
                  : "Not started"}
              </DetailField>

              <DetailField label="Actual end">
                {detail?.surgery.actual_end
                  ? formatDateTime(detail.surgery.actual_end)
                  : "Not completed"}
              </DetailField>

              <DetailField label="Surgeon">
                {selected.surgeon_name}
              </DetailField>

              <DetailField label="Anesthesiologist">
                {selected.anesthesiologist_name ?? "Unassigned"}
              </DetailField>

              <DetailField label="Scrub / circulating">
                {selected.team_summary}
              </DetailField>

              <DetailField label="Pre-op readiness">
                <ReadinessBadge ready={selected.pre_op_ready} />
              </DetailField>
            </dl>

            {detail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<ClipboardCheckIcon className="size-3.5" />}
                    title="Pre-operative checklist"
                  />
                  <ul className="space-y-1.5">
                    {detail.checklist.map((item) => (
                      <ChecklistRow key={item.key} item={item} />
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<HeartPulseIcon className="size-3.5" />}
                    title="Anesthesia & intra-operative record"
                  />
                  <div className="rounded-md border border-hospital-border p-3">
                    <p className="text-[11px] font-medium text-hospital-text-muted">
                      Anesthesia type
                    </p>
                    <p className="mt-0.5 text-sm text-hospital-text">
                      {humanizeAnesthesia(detail.surgery.anesthesia_type)}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-hospital-text-muted">
                      Anesthesia record
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-hospital-text-muted">
                      {detail.anesthesia_record ?? "Not recorded yet."}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-hospital-text-muted">
                      Intra-operative notes
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-hospital-text-muted">
                      {detail.intra_op_notes ?? "Not recorded yet."}
                    </p>
                  </div>
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<MedicalKitIcon className="size-3.5" />}
                    title="Instruments & supplies"
                  />
                  <ul className="space-y-1.5">
                    {detail.supplies.map((supply) => (
                      <SupplyRow
                        key={`${supply.category}-${supply.name}`}
                        supply={supply}
                      />
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<StethoscopeIcon className="size-3.5" />}
                    title="Surgical notes"
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
                          <span className="text-[11px] text-hospital-text-muted">
                            {formatDateTime(note.recorded_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-hospital-text-muted">
                          {note.content}
                        </p>
                        <p className="mt-1 text-[11px] text-hospital-text-subtle">
                          {note.author_name}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<ClockCircleIcon className="size-3.5" />}
                    title="Post-operative monitoring"
                  />
                  {detail.post_op_monitoring.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No recovery entries recorded yet.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {detail.post_op_monitoring.map((entry) => (
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
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<BillListIcon className="size-3.5" />}
                    title="Surgery billing"
                  />
                  <div className="rounded-md border border-hospital-border p-3">
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <DetailField label="Operating room fee">
                        {formatCurrency(detail.billing.or_fee)}
                      </DetailField>
                      <DetailField label="Professional fee">
                        {formatCurrency(detail.billing.professional_fee)}
                      </DetailField>
                      <DetailField label="Supplies">
                        {formatCurrency(detail.billing.supplies_total)}
                      </DetailField>
                      <DetailField label="Estimated total">
                        <span className="font-semibold">
                          {formatCurrency(detail.billing.estimated_total)}
                        </span>
                      </DetailField>
                      <DetailField label="Invoice status">
                        <StatusBadge status={detail.billing.invoice_status} />
                      </DetailField>
                    </dl>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPendingAction("Schedule surgery")}
                      >
                        Schedule
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPendingAction("Start surgery")}
                      >
                        Start case
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPendingAction("Complete surgery")}
                      >
                        Complete case
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPendingAction("Print surgical report")}
                      >
                        Print report
                      </Button>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <p className="text-sm text-hospital-text-muted">
                Detailed surgical data is not available for this case.
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

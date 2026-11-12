"use client";

import * as React from "react";
import {
  BroomIcon,
  CheckCircleIcon,
  ClockCircleIcon,
  ShieldCheckIcon,
  UserRoundedIcon,
} from "@solar-icons/react/linear";

import type {
  CleaningRequestDetail,
  CleaningRequestListRow,
  DisinfectionRecord,
  HousekeepingStaff,
} from "@/types/hospital";
import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { UNAVAILABLE_MESSAGE, UnavailableAction } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";

const STATUS_OPTIONS = [
  { value: "requested", label: "Requested" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "verified", label: "Verified" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
];

const TYPE_OPTIONS = [
  { value: "routine", label: "Routine" },
  { value: "discharge", label: "Discharge" },
  { value: "terminal", label: "Terminal" },
  { value: "spill", label: "Spill" },
  { value: "isolation", label: "Isolation" },
];

const STAFF_STATUS_OPTIONS = [
  { value: "on_duty", label: "On duty" },
  { value: "on_break", label: "On break" },
  { value: "off_duty", label: "Off duty" },
];

const ACTIVE_STATUSES = new Set(["requested", "assigned", "in_progress"]);

export interface HousekeepingViewProps {
  requests: CleaningRequestListRow[];
  requestDetails: Record<string, CleaningRequestDetail>;
  todaySchedule: CleaningRequestListRow[];
  staff: HousekeepingStaff[];
  disinfection: DisinfectionRecord[];
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

export function HousekeepingView({
  requests,
  requestDetails,
  todaySchedule,
  staff,
  disinfection,
}: HousekeepingViewProps) {
  const [tab, setTab] = React.useState("board");
  const [selectedRequest, setSelectedRequest] =
    React.useState<CleaningRequestListRow | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const requestById = React.useMemo(
    () => new Map(requests.map((request) => [request.id, request])),
    [requests]
  );

  const openRequest = React.useCallback(
    (id: string) => {
      const row = requestById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedRequest(row);
      }
    },
    [requestById]
  );

  const closeRequest = React.useCallback(() => {
    setPendingAction(null);
    setSelectedRequest(null);
  }, []);

  const activeRequests = React.useMemo(
    () => requests.filter((request) => ACTIVE_STATUSES.has(request.status)),
    [requests]
  );

  const verifiedRequests = React.useMemo(
    () => requests.filter((request) => request.verified_at !== null),
    [requests]
  );

  const boardColumns = React.useMemo<Column<CleaningRequestListRow>[]>(
    () => [
      {
        key: "request_number",
        header: "Request No.",
        sortable: true,
        sortValue: (row) => row.request_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.request_number}
          </span>
        ),
      },
      {
        key: "location",
        header: "Location",
        sortable: true,
        sortValue: (row) => row.location_label,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">
              {row.location_label}
            </p>
            <p className="text-[11px] text-hospital-text-muted">
              {row.department_name}
            </p>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        cell: (row) => <StatusBadge status={row.request_type} />,
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
        key: "staff",
        header: "Assigned staff",
        cell: (row) => row.assigned_staff_name ?? "Unassigned",
      },
      {
        key: "due",
        header: "Due",
        sortable: true,
        sortValue: (row) => row.due_at,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.due_at)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View cleaning request ${row.request_number}`}
            onClick={() => openRequest(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openRequest]
  );

  const boardFilters = React.useMemo<
    FilterConfig<CleaningRequestListRow>[]
  >(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All active statuses",
        options: STATUS_OPTIONS.filter((option) =>
          ACTIVE_STATUSES.has(option.value)
        ),
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
        key: "type",
        label: "type",
        allLabel: "All types",
        options: TYPE_OPTIONS,
        accessor: (row) => row.request_type,
      },
    ],
    []
  );

  const scheduleColumns = React.useMemo<Column<CleaningRequestListRow>[]>(
    () => [
      {
        key: "scheduled",
        header: "Scheduled",
        sortable: true,
        sortValue: (row) => row.scheduled_for,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.scheduled_for)}
          </span>
        ),
      },
      {
        key: "location",
        header: "Location",
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-hospital-text">
              {row.location_label}
            </p>
            <p className="text-[11px] text-hospital-text-muted">
              {row.department_name}
            </p>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        cell: (row) => <StatusBadge status={row.request_type} />,
      },
      {
        key: "priority",
        header: "Priority",
        cell: (row) => <StatusBadge status={row.priority} />,
      },
      {
        key: "staff",
        header: "Assigned staff",
        cell: (row) => row.assigned_staff_name ?? "Unassigned",
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
            aria-label={`View cleaning request ${row.request_number}`}
            onClick={() => openRequest(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openRequest]
  );

  const scheduleFilters = React.useMemo<
    FilterConfig<CleaningRequestListRow>[]
  >(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "type",
        label: "type",
        allLabel: "All types",
        options: TYPE_OPTIONS,
        accessor: (row) => row.request_type,
      },
    ],
    []
  );

  const staffColumns = React.useMemo<Column<HousekeepingStaff>[]>(
    () => [
      {
        key: "name",
        header: "Staff",
        sortable: true,
        sortValue: (row) => row.name,
        cell: (row) => (
          <span className="font-medium text-hospital-text">{row.name}</span>
        ),
      },
      {
        key: "role",
        header: "Role",
        cell: (row) => row.role,
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "assignment",
        header: "Current assignment",
        cell: (row) => row.current_assignment ?? "\u2014",
      },
      {
        key: "completed",
        header: "Completed today",
        align: "right",
        sortable: true,
        sortValue: (row) => row.completed_today,
        cell: (row) => row.completed_today,
      },
      {
        key: "contact",
        header: "Contact",
        cell: (row) => row.contact_number ?? "\u2014",
      },
    ],
    []
  );

  const staffFilters = React.useMemo<FilterConfig<HousekeepingStaff>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: STAFF_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
    ],
    []
  );

  const detail = selectedRequest
    ? requestDetails[selectedRequest.id] ?? null
    : null;

  return (
    <>
      <div className="space-y-4">
        <Tabs
          items={[
            { value: "board", label: "Cleaning board", count: activeRequests.length },
            {
              value: "schedule",
              label: "Today's schedule",
              count: todaySchedule.length,
            },
            { value: "staff", label: "Staff", count: staff.length },
            {
              value: "disinfection",
              label: "Disinfection & verification",
              count: disinfection.length,
            },
          ]}
          value={tab}
          onValueChange={setTab}
        />

        {tab === "board" ? (
          <RecordTable
            rows={activeRequests}
            columns={boardColumns}
            rowKey={(row) => row.id}
            caption="Active cleaning requests"
            searchPlaceholder="Search request no., location, staff, or notes"
            searchAccessor={(row) =>
              `${row.request_number} ${row.location_label} ${row.department_name} ${row.request_type} ${row.assigned_staff_name ?? ""} ${row.notes ?? ""}`
            }
            filters={boardFilters}
            toolbarActions={
              <UnavailableAction
                label="New Cleaning Request"
                description="Create a cleaning request for a room, bed, isolation area, or common space."
                size="sm"
                variant="secondary"
                icon={<BroomIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No active cleaning requests"
            emptyDescription="There are no active cleaning requests matching your filters."
            emptyIcon={<BroomIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "schedule" ? (
          <RecordTable
            rows={todaySchedule}
            columns={scheduleColumns}
            rowKey={(row) => row.id}
            caption="Today's cleaning schedule"
            searchPlaceholder="Search location, staff, type, or notes"
            searchAccessor={(row) =>
              `${row.location_label} ${row.department_name} ${row.request_type} ${row.assigned_staff_name ?? ""} ${row.notes ?? ""}`
            }
            filters={scheduleFilters}
            emptyTitle="No cleaning scheduled today"
            emptyDescription="There are no cleaning requests scheduled for today."
            emptyIcon={<ClockCircleIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "staff" ? (
          <RecordTable
            rows={staff}
            columns={staffColumns}
            rowKey={(row) => row.id}
            caption="Housekeeping staff"
            searchPlaceholder="Search staff, role, or assignment"
            searchAccessor={(row) =>
              `${row.name} ${row.role} ${row.status} ${row.current_assignment ?? ""}`
            }
            filters={staffFilters}
            emptyTitle="No staff records"
            emptyDescription="There are no housekeeping staff matching your filters."
            emptyIcon={<UserRoundedIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "disinfection" ? (
          <div className="space-y-4">
            <section className="space-y-2">
              <SectionHeading
                icon={<ShieldCheckIcon className="size-3.5" />}
                title="Disinfection records"
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Chemical</TableHead>
                    <TableHead className="text-right">Contact</TableHead>
                    <TableHead>Performed by</TableHead>
                    <TableHead>Performed at</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disinfection.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <span className="font-mono text-[11px]">
                          {requestById.get(record.request_id)?.request_number ??
                            "\u2014"}
                        </span>
                      </TableCell>
                      <TableCell>{record.method}</TableCell>
                      <TableCell>{record.chemical}</TableCell>
                      <TableCell className="text-right">
                        {record.contact_time_minutes} min
                      </TableCell>
                      <TableCell>{record.performed_by_name}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(record.performed_at)}
                      </TableCell>
                      <TableCell className="text-xs text-hospital-text-muted">
                        {record.notes ?? "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            <section className="space-y-2">
              <SectionHeading
                icon={<CheckCircleIcon className="size-3.5" />}
                title="Completion verification"
              />
              {verifiedRequests.length === 0 ? (
                <p className="text-xs text-hospital-text-muted">
                  No completed cleanings have been verified.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {verifiedRequests.map((request) => (
                    <li
                      key={request.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                    >
                      <div>
                        <p className="font-mono text-[11px] text-hospital-text">
                          {request.request_number} · {request.location_label}
                        </p>
                        <p className="text-[11px] text-hospital-text-muted">
                          Verified by {request.verified_by_name ?? "\u2014"} ·{" "}
                          {request.verified_at
                            ? formatDateTime(request.verified_at)
                            : "Pending"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={request.status} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRequest(request.id)}
                        >
                          View
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>

      <Modal
        open={selectedRequest !== null}
        onClose={closeRequest}
        title={
          selectedRequest
            ? `Cleaning request ${selectedRequest.request_number}`
            : "Cleaning request details"
        }
        description="Location, assignment, disinfection, completion, and verification"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeRequest}>
            Close
          </Button>
        }
      >
        {selectedRequest ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Location">
                {selectedRequest.location_label}
              </DetailField>
              <DetailField label="Department">
                {selectedRequest.department_name}
              </DetailField>
              <DetailField label="Request type">
                <StatusBadge status={selectedRequest.request_type} />
              </DetailField>
              <DetailField label="Priority">
                <StatusBadge status={selectedRequest.priority} />
              </DetailField>
              <DetailField label="Status">
                <StatusBadge status={selectedRequest.status} />
              </DetailField>
              <DetailField label="Assigned staff">
                {selectedRequest.assigned_staff_name ?? "Unassigned"}
              </DetailField>
              <DetailField label="Requested">
                {formatDateTime(selectedRequest.requested_at)}
              </DetailField>
              <DetailField label="Due">
                {formatDateTime(selectedRequest.due_at)}
              </DetailField>
              <DetailField label="Scheduled">
                {formatDateTime(selectedRequest.scheduled_for)}
              </DetailField>
              <DetailField label="Started">
                {selectedRequest.started_at
                  ? formatDateTime(selectedRequest.started_at)
                  : "Not started"}
              </DetailField>
              <DetailField label="Completed">
                {selectedRequest.completed_at
                  ? formatDateTime(selectedRequest.completed_at)
                  : "Not completed"}
              </DetailField>
              <DetailField label="Verified">
                {selectedRequest.verified_at
                  ? formatDateTime(selectedRequest.verified_at)
                  : "Not verified"}
              </DetailField>
              <DetailField label="Disinfection">
                {selectedRequest.disinfection_used ?? "Not recorded"}
              </DetailField>
            </dl>

            {selectedRequest.notes ? (
              <p className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2 text-xs text-hospital-text-muted">
                {selectedRequest.notes}
              </p>
            ) : null}

            {detail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<UserRoundedIcon className="size-3.5" />}
                    title="Assigned staff"
                  />
                  {detail.staff ? (
                    <div className="rounded-md border border-hospital-border p-3">
                      <p className="text-sm font-medium text-hospital-text">
                        {detail.staff.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                        {detail.staff.role} · {detail.staff.contact_number ?? "No contact"}
                      </p>
                      <div className="mt-1">
                        <StatusBadge status={detail.staff.status} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-hospital-text-muted">
                      No staff assigned.
                    </p>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<ShieldCheckIcon className="size-3.5" />}
                    title="Disinfection record"
                  />
                  {detail.disinfection ? (
                    <div className="rounded-md border border-hospital-border p-3">
                      <p className="text-sm font-medium text-hospital-text">
                        {detail.disinfection.method}
                      </p>
                      <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                        {detail.disinfection.chemical} ·{" "}
                        {detail.disinfection.contact_time_minutes} min contact
                        time
                      </p>
                      <p className="mt-1 text-[11px] text-hospital-text-muted">
                        {detail.disinfection.performed_by_name} ·{" "}
                        {formatDateTime(detail.disinfection.performed_at)}
                      </p>
                      {detail.disinfection.notes ? (
                        <p className="mt-1 text-[11px] text-hospital-text-muted">
                          {detail.disinfection.notes}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-hospital-text-muted">
                      No disinfection record.
                    </p>
                  )}
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Assign staff")}
                  >
                    Assign staff
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Start cleaning")}
                  >
                    Start cleaning
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Complete cleaning")}
                  >
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Verify completion")}
                  >
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingAction("Record disinfection")}
                  >
                    Record disinfection
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

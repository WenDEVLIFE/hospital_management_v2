"use client";

import * as React from "react";
import { CalendarMarkIcon } from "@solar-icons/react/linear";

import type { AppointmentListRow } from "@/types/hospital";
import { RecordTable, type Column } from "@/components/module/record-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";

import { APPOINTMENT_STATUS_OPTIONS } from "./appointment-utils";
import { AppointmentsCalendar } from "./appointments-calendar";
import { AppointmentsDailySchedule } from "./appointments-daily-schedule";

type AppointmentTab = "list" | "schedule" | "calendar";

const TAB_ITEMS = [
  { value: "list", label: "List" },
  { value: "schedule", label: "Daily Schedule" },
  { value: "calendar", label: "Calendar" },
];

const SELECT_CLASSES =
  "h-9 rounded-md border border-hospital-border bg-white px-3 text-sm text-hospital-text transition-colors focus:border-hospital-green focus:outline-none focus:ring-1 focus:ring-hospital-green cursor-pointer";

export interface AppointmentsViewProps {
  rows: AppointmentListRow[];
  initialMonth: string;
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

export function AppointmentsView({
  rows,
  initialMonth,
}: AppointmentsViewProps) {
  const [tab, setTab] = React.useState<AppointmentTab>("list");
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [selected, setSelected] = React.useState<AppointmentListRow | null>(
    null
  );

  const departments = React.useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.department_name)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return rows.filter((row) => {
      if (status && row.status !== status) {
        return false;
      }

      if (department && row.department_name !== department) {
        return false;
      }

      if (!needle) {
        return true;
      }

      return [
        row.appointment_number,
        row.patient_name,
        row.physician_name ?? "",
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [rows, query, status, department]);

  const hasFilters = Boolean(query.trim() || status || department);

  const resetFilters = () => {
    setQuery("");
    setStatus("");
    setDepartment("");
  };

  const columns = React.useMemo<Column<AppointmentListRow>[]>(
    () => [
      {
        key: "appointment_number",
        header: "Appointment No.",
        sortable: true,
        sortValue: (row) => row.appointment_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.appointment_number}
          </span>
        ),
      },
      {
        key: "patient",
        header: "Patient",
        sortable: true,
        sortValue: (row) => row.patient_name,
        cell: (row) => (
          <span className="font-medium text-hospital-text">{row.patient_name}</span>
        ),
      },
      {
        key: "department",
        header: "Department",
        sortable: true,
        sortValue: (row) => row.department_name,
        cell: (row) => row.department_name,
      },
      {
        key: "physician",
        header: "Physician",
        sortable: true,
        sortValue: (row) => row.physician_name ?? "",
        cell: (row) => row.physician_name ?? "Unassigned",
      },
      {
        key: "scheduled",
        header: "Scheduled",
        sortable: true,
        sortValue: (row) => row.scheduled_at,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.scheduled_at)}
          </span>
        ),
      },
      {
        key: "duration",
        header: "Duration",
        align: "right",
        sortable: true,
        sortValue: (row) => row.duration_minutes,
        cell: (row) => (
          <span className="whitespace-nowrap">{row.duration_minutes} min</span>
        ),
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
            aria-label={`View appointment ${row.appointment_number}`}
            onClick={() => setSelected(row)}
          >
            View
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            onClear={() => setQuery("")}
            placeholder="Search appointment no., patient, or physician"
            aria-label="Search appointments by appointment number, patient, or physician"
            className="sm:max-w-sm"
          />

          <label className="flex items-center gap-2">
            <span className="sr-only">Filter by appointment status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={SELECT_CLASSES}
            >
              <option value="">All statuses</option>
              {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="sr-only">Filter by department</span>
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className={SELECT_CLASSES}
            >
              <option value="">All departments</option>
              {departments.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          ) : null}
        </div>

        <p className="text-[11px] text-hospital-text-muted">
          Showing {filteredRows.length} of {rows.length} appointments
        </p>
      </div>

      <Tabs
        items={TAB_ITEMS}
        value={tab}
        onValueChange={(value) => setTab(value as AppointmentTab)}
      />

      {tab === "list" ? (
        <div role="tabpanel" aria-label="Appointment list">
          <RecordTable
            rows={filteredRows}
            columns={columns}
            rowKey={(row) => row.id}
            caption="Appointment list"
            emptyTitle="No appointments found"
            emptyDescription="There are no appointments matching your selected filters."
            emptyIcon={
              <CalendarMarkIcon className="size-5" aria-hidden="true" />
            }
            pageSize={10}
          />
        </div>
      ) : null}

      {tab === "schedule" ? (
        <div role="tabpanel" aria-label="Daily schedule">
          <AppointmentsDailySchedule rows={filteredRows} />
        </div>
      ) : null}

      {tab === "calendar" ? (
        <div role="tabpanel" aria-label="Appointment calendar">
          <AppointmentsCalendar rows={filteredRows} initialMonth={initialMonth} />
        </div>
      ) : null}

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `Appointment ${selected.appointment_number}`
            : "Appointment details"
        }
        description="Scheduled consultation details"
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {selected ? (
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

            <DetailField label="Department">
              {selected.department_name}
            </DetailField>

            <DetailField label="Physician">
              {selected.physician_name ?? "Unassigned"}
            </DetailField>

            <DetailField label="Scheduled">
              {formatDateTime(selected.scheduled_at)}
            </DetailField>

            <DetailField label="Duration">
              {selected.duration_minutes} min
            </DetailField>

            <DetailField label="Appointment type">
              {selected.appointment_type ?? "\u2014"}
            </DetailField>

            <DetailField label="Reason for visit">
              {selected.reason_for_visit ?? "\u2014"}
            </DetailField>
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}

"use client";

import * as React from "react";
import {
  AltArrowRightIcon,
  BedIcon,
  BillListIcon,
  BoxIcon,
  CalendarMarkIcon,
  Chart2Icon,
  DocumentTextIcon,
  DownloadIcon,
  LoginIcon,
  Pills2Icon,
  StethoscopeIcon,
  TestTubeIcon,
  UserRoundedIcon,
} from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import type { ReportCard } from "@/types/hospital";

export interface ReportsCategoryGridProps {
  cards: ReportCard[];
}

const DEFAULT_COLUMNS = [
  "Report period",
  "Department",
  "Record count",
  "Prepared by",
];

const REPORT_COLUMNS: Record<string, string[]> = {
  "Patient Registration": [
    "Medical record number",
    "Patient name",
    "Sex",
    "Age",
    "Registration date",
    "Registration status",
  ],
  "Appointment Activity": [
    "Appointment number",
    "Patient name",
    "Department",
    "Physician",
    "Scheduled date",
    "Appointment status",
  ],
  "Admission and Discharge": [
    "Admission number",
    "Patient name",
    "Department",
    "Attending physician",
    "Admission date",
    "Discharge date",
    "Length of stay",
    "Admission status",
  ],
  "Bed Occupancy": [
    "Department",
    "Room number",
    "Bed number",
    "Bed status",
    "Occupied days",
    "Occupancy rate",
  ],
  "Laboratory Activity": [
    "Order number",
    "Patient name",
    "Test name",
    "Priority",
    "Ordered at",
    "Result status",
    "Verified at",
  ],
  "Pharmacy Dispensing": [
    "Prescription number",
    "Patient name",
    "Medication",
    "Quantity dispensed",
    "Dispensed by",
    "Dispensed at",
  ],
  "Billing and Collections": [
    "Invoice number",
    "Patient name",
    "Invoice date",
    "Total amount",
    "Amount paid",
    "Balance",
    "Invoice status",
  ],
  "Inventory and Stock": [
    "Item code",
    "Item name",
    "Unit",
    "Quantity on hand",
    "Reorder level",
    "Nearest expiration",
    "Stock status",
  ],
  "Staff Directory": [
    "Staff number",
    "Staff name",
    "Role",
    "Department",
    "Employment type",
    "Account status",
  ],
};

function iconForReport(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("bed")) return BedIcon;
  if (normalized.includes("admission")) return LoginIcon;
  if (normalized.includes("patient")) return UserRoundedIcon;
  if (normalized.includes("appointment")) return CalendarMarkIcon;
  if (normalized.includes("laboratory")) return TestTubeIcon;
  if (normalized.includes("pharmacy")) return Pills2Icon;
  if (normalized.includes("billing")) return BillListIcon;
  if (normalized.includes("inventory")) return BoxIcon;
  if (normalized.includes("staff")) return StethoscopeIcon;

  return DocumentTextIcon;
}

export function ReportsCategoryGrid({ cards }: ReportsCategoryGridProps) {
  const [selected, setSelected] = React.useState<ReportCard | null>(null);
  const [exportRequested, setExportRequested] = React.useState(false);

  const openReport = React.useCallback((card: ReportCard) => {
    setExportRequested(false);
    setSelected(card);
  }, []);

  const close = React.useCallback(() => {
    setSelected(null);
    setExportRequested(false);
  }, []);

  if (cards.length === 0) {
    return (
      <EmptyState
        icon={<Chart2Icon className="size-5" aria-hidden="true" />}
        title="No reports available"
        description="Report categories will appear here once configured."
      />
    );
  }

  const columns = selected
    ? REPORT_COLUMNS[selected.title] ?? DEFAULT_COLUMNS
    : [];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = iconForReport(card.title);

          return (
            <article
              key={card.id}
              className="flex flex-col justify-between gap-4 rounded-md border border-hospital-border bg-white p-5 shadow-xs"
            >
              <div>
                <span className="flex size-9 items-center justify-center rounded-md bg-hospital-green-light text-hospital-green">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-hospital-text">
                  {card.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-hospital-text-muted">
                  {card.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-hospital-text-subtle">
                  {card.formats.join(" · ")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openReport(card)}
                  className="cursor-pointer"
                >
                  Open report
                  <AltArrowRightIcon className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={close}
        title={selected?.title ?? "Report"}
        description={selected?.description}
        size="md"
        footer={
          exportRequested ? (
            <Button variant="secondary" onClick={close}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={close}>
                Close
              </Button>
              <Button
                onClick={() => setExportRequested(true)}
                className="cursor-pointer"
              >
                <DownloadIcon className="size-4" aria-hidden="true" />
                Export
              </Button>
            </>
          )
        }
      >
        {selected ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-medium text-hospital-text-muted">
                  Category
                </dt>
                <dd className="mt-0.5 text-sm text-hospital-text">
                  {selected.category}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium text-hospital-text-muted">
                  Formats
                </dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {selected.formats.map((format) => (
                    <Badge key={format} variant="info">
                      {format}
                    </Badge>
                  ))}
                </dd>
              </div>
            </dl>

            <div>
              <p className="text-[11px] font-medium text-hospital-text-muted">
                Columns this report would contain
              </p>
              <ul className="mt-2 space-y-1.5">
                {columns.map((column) => (
                  <li
                    key={column}
                    className="flex gap-2 text-sm text-hospital-text"
                  >
                    <span
                      className="mt-2 size-1 shrink-0 rounded-full bg-hospital-green"
                      aria-hidden="true"
                    />
                    {column}
                  </li>
                ))}
              </ul>
            </div>

            {exportRequested ? (
              <Alert variant="info" title="Export unavailable">
                This action is not available yet because the Supabase backend is
                not connected.
              </Alert>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

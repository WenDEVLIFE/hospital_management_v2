"use client";

import * as React from "react";
import {
  ClipboardListIcon,
  HeartPulseIcon,
  TestTubeIcon,
  UserRoundedIcon,
  WaterdropIcon,
} from "@solar-icons/react/linear";

import type {
  BloodComponent,
  BloodDonorDetail,
  BloodDonorListRow,
  BloodRequestDetail,
  BloodRequestListRow,
  BloodScreening,
  BloodUnitDetail,
  BloodUnitListRow,
  TransfusionRecord,
} from "@/types/hospital";
import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { UNAVAILABLE_MESSAGE, UnavailableAction } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { formatDate, formatDateTime } from "@/lib/format";

const COMPONENT_LABELS: Record<BloodComponent, string> = {
  whole_blood: "Whole blood",
  packed_rbc: "Packed RBC",
  plasma: "Plasma",
  platelets: "Platelets",
  cryoprecipitate: "Cryoprecipitate",
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const UNIT_STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "crossmatched", label: "Crossmatched" },
  { value: "issued", label: "Issued" },
  { value: "discarded", label: "Discarded" },
  { value: "expired", label: "Expired" },
];

const COMPONENT_OPTIONS = Object.entries(COMPONENT_LABELS).map(
  ([value, label]) => ({ value, label })
);

const REQUEST_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "reserved", label: "Reserved" },
  { value: "crossmatched", label: "Crossmatched" },
  { value: "issued", label: "Issued" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "routine", label: "Routine" },
  { value: "urgent", label: "Urgent" },
  { value: "emergency", label: "Emergency" },
];

const ELIGIBILITY_OPTIONS = [
  { value: "eligible", label: "Eligible" },
  { value: "deferred", label: "Deferred" },
  { value: "inactive", label: "Inactive" },
];

const SCREENING_RESULT_OPTIONS = [
  { value: "negative", label: "Negative" },
  { value: "positive", label: "Positive" },
  { value: "pending", label: "Pending" },
];

export interface BloodBankViewProps {
  units: BloodUnitListRow[];
  unitDetails: Record<string, BloodUnitDetail>;
  requests: BloodRequestListRow[];
  requestDetails: Record<string, BloodRequestDetail>;
  donors: BloodDonorListRow[];
  donorDetails: Record<string, BloodDonorDetail>;
  screenings: BloodScreening[];
  transfusions: TransfusionRecord[];
}

function formatExpiry(days: number): string {
  if (days < 0) {
    return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  }

  if (days === 0) {
    return "Expires today";
  }

  return `${days} day${days === 1 ? "" : "s"} left`;
}

function expiryTone(days: number): string {
  if (days < 0) {
    return "text-red-700";
  }

  if (days <= 7) {
    return "text-amber-700";
  }

  return "text-hospital-text-muted";
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

export function BloodBankView({
  units,
  unitDetails,
  requests,
  requestDetails,
  donors,
  donorDetails,
  screenings,
  transfusions,
}: BloodBankViewProps) {
  const [tab, setTab] = React.useState("inventory");
  const [selectedUnit, setSelectedUnit] = React.useState<BloodUnitListRow | null>(
    null
  );
  const [selectedRequest, setSelectedRequest] =
    React.useState<BloodRequestListRow | null>(null);
  const [selectedDonor, setSelectedDonor] =
    React.useState<BloodDonorListRow | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const unitRowById = React.useMemo(
    () => new Map(units.map((unit) => [unit.id, unit])),
    [units]
  );
  const requestRowById = React.useMemo(
    () => new Map(requests.map((request) => [request.id, request])),
    [requests]
  );
  const donorRowById = React.useMemo(
    () => new Map(donors.map((donor) => [donor.id, donor])),
    [donors]
  );

  const openUnit = React.useCallback(
    (id: string) => {
      const row = unitRowById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedUnit(row);
      }
    },
    [unitRowById]
  );

  const closeUnit = React.useCallback(() => {
    setPendingAction(null);
    setSelectedUnit(null);
  }, []);

  const openRequest = React.useCallback(
    (id: string) => {
      const row = requestRowById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedRequest(row);
      }
    },
    [requestRowById]
  );

  const closeRequest = React.useCallback(() => {
    setPendingAction(null);
    setSelectedRequest(null);
  }, []);

  const openDonor = React.useCallback(
    (id: string) => {
      const row = donorRowById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedDonor(row);
      }
    },
    [donorRowById]
  );

  const closeDonor = React.useCallback(() => {
    setPendingAction(null);
    setSelectedDonor(null);
  }, []);

  const unitColumns = React.useMemo<Column<BloodUnitListRow>[]>(
    () => [
      {
        key: "unit_number",
        header: "Unit No.",
        sortable: true,
        sortValue: (row) => row.unit_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.unit_number}
          </span>
        ),
      },
      {
        key: "blood_type",
        header: "Blood type",
        sortable: true,
        sortValue: (row) => row.blood_type,
        cell: (row) => (
          <div className="min-w-0">
            <Badge variant="info">{row.blood_type}</Badge>
            <p className="mt-1 text-[11px] text-hospital-text-muted">
              {COMPONENT_LABELS[row.component]}
            </p>
          </div>
        ),
      },
      {
        key: "donor",
        header: "Donor",
        sortable: true,
        sortValue: (row) => row.donor_name,
        cell: (row) => row.donor_name,
      },
      {
        key: "collection",
        header: "Collected",
        sortable: true,
        sortValue: (row) => row.collection_date,
        cell: (row) => formatDate(row.collection_date),
      },
      {
        key: "expiry",
        header: "Expiry",
        sortable: true,
        sortValue: (row) => row.expiry_date,
        cell: (row) => (
          <div className="whitespace-nowrap text-xs">
            <p>{formatDate(row.expiry_date)}</p>
            <p className={expiryTone(row.days_to_expiry)}>
              {formatExpiry(row.days_to_expiry)}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "storage",
        header: "Storage",
        cell: (row) => row.storage_location,
      },
      {
        key: "request",
        header: "Request",
        cell: (row) => row.request_number ?? "\u2014",
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View blood unit ${row.unit_number}`}
            onClick={() => openUnit(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openUnit]
  );

  const unitFilters = React.useMemo<FilterConfig<BloodUnitListRow>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: UNIT_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "blood_type",
        label: "blood type",
        allLabel: "All blood types",
        options: BLOOD_TYPES.map((type) => ({ label: type, value: type })),
        accessor: (row) => row.blood_type,
      },
      {
        key: "component",
        label: "component",
        allLabel: "All components",
        options: COMPONENT_OPTIONS,
        accessor: (row) => row.component,
      },
    ],
    []
  );

  const requestColumns = React.useMemo<Column<BloodRequestListRow>[]>(
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
        key: "product",
        header: "Product",
        cell: (row) => (
          <div className="min-w-0 text-xs">
            <Badge variant="info">{row.blood_type}</Badge>
            <p className="mt-1 text-[11px] text-hospital-text-muted">
              {COMPONENT_LABELS[row.component]}
            </p>
          </div>
        ),
      },
      {
        key: "units",
        header: "Units",
        align: "center",
        cell: (row) => `${row.units_fulfilled}/${row.units_requested}`,
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
        key: "crossmatch",
        header: "Crossmatch",
        cell: (row) =>
          row.crossmatch_status ? (
            <StatusBadge status={row.crossmatch_status} />
          ) : (
            <span className="text-[11px] text-hospital-text-muted">
              Not started
            </span>
          ),
      },
      {
        key: "required_by",
        header: "Required by",
        sortable: true,
        sortValue: (row) => row.required_by,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.required_by)}
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
            aria-label={`View blood request ${row.request_number}`}
            onClick={() => openRequest(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openRequest]
  );

  const requestFilters = React.useMemo<FilterConfig<BloodRequestListRow>[]>(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: REQUEST_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "priority",
        label: "priority",
        allLabel: "All priorities",
        options: PRIORITY_OPTIONS,
        accessor: (row) => row.priority,
      },
    ],
    []
  );

  const donorColumns = React.useMemo<Column<BloodDonorListRow>[]>(
    () => [
      {
        key: "donor_number",
        header: "Donor No.",
        sortable: true,
        sortValue: (row) => row.donor_number,
        cell: (row) => (
          <span className="font-mono text-[11px] text-hospital-text">
            {row.donor_number}
          </span>
        ),
      },
      {
        key: "donor",
        header: "Donor",
        sortable: true,
        sortValue: (row) => row.full_name,
        cell: (row) => (
          <span className="font-medium text-hospital-text">{row.full_name}</span>
        ),
      },
      {
        key: "blood_type",
        header: "Blood type",
        sortable: true,
        sortValue: (row) => row.blood_type,
        cell: (row) => <Badge variant="info">{row.blood_type}</Badge>,
      },
      {
        key: "eligibility",
        header: "Eligibility",
        cell: (row) => <StatusBadge status={row.eligibility_status} />,
      },
      {
        key: "last_donation",
        header: "Last donation",
        sortable: true,
        sortValue: (row) => row.last_donation_date ?? "",
        cell: (row) =>
          row.last_donation_date ? formatDate(row.last_donation_date) : "\u2014",
      },
      {
        key: "donations",
        header: "Donations",
        align: "center",
        sortable: true,
        sortValue: (row) => row.donations_this_year,
        cell: (row) => `${row.donations_this_year} this year`,
      },
      {
        key: "total",
        header: "Total",
        align: "right",
        sortable: true,
        sortValue: (row) => row.total_donations,
        cell: (row) => row.total_donations,
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View donor ${row.full_name}`}
            onClick={() => openDonor(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openDonor]
  );

  const donorFilters = React.useMemo<FilterConfig<BloodDonorListRow>[]>(
    () => [
      {
        key: "eligibility",
        label: "eligibility",
        allLabel: "All eligibility",
        options: ELIGIBILITY_OPTIONS,
        accessor: (row) => row.eligibility_status,
      },
      {
        key: "blood_type",
        label: "blood type",
        allLabel: "All blood types",
        options: BLOOD_TYPES.map((type) => ({ label: type, value: type })),
        accessor: (row) => row.blood_type,
      },
    ],
    []
  );

  const screeningColumns = React.useMemo<Column<BloodScreening>[]>(
    () => [
      {
        key: "unit",
        header: "Unit",
        cell: (row) => {
          const unit = unitRowById.get(row.unit_id);

          return (
            <div className="min-w-0">
              <p className="font-mono text-[11px] text-hospital-text">
                {unit?.unit_number ?? "Unknown unit"}
              </p>
              <p className="text-[11px] text-hospital-text-muted">
                {unit ? `${unit.blood_type} · ${COMPONENT_LABELS[unit.component]}` : ""}
              </p>
            </div>
          );
        },
      },
      {
        key: "test",
        header: "Test",
        sortable: true,
        sortValue: (row) => row.test_name,
        cell: (row) => row.test_name,
      },
      {
        key: "result",
        header: "Result",
        cell: (row) => <StatusBadge status={row.result} />,
      },
      {
        key: "tested_by",
        header: "Tested by",
        cell: (row) => row.tested_by_name ?? "\u2014",
      },
      {
        key: "tested_at",
        header: "Tested at",
        sortable: true,
        sortValue: (row) => row.tested_at ?? "",
        cell: (row) =>
          row.tested_at ? formatDateTime(row.tested_at) : "\u2014",
      },
      {
        key: "notes",
        header: "Notes",
        cell: (row) => row.notes ?? "\u2014",
      },
    ],
    [unitRowById]
  );

  const screeningFilters = React.useMemo<FilterConfig<BloodScreening>[]>(
    () => [
      {
        key: "result",
        label: "result",
        allLabel: "All results",
        options: SCREENING_RESULT_OPTIONS,
        accessor: (row) => row.result,
      },
    ],
    []
  );

  const testedUnitIds = React.useMemo(
    () => new Set(screenings.map((screening) => screening.unit_id)),
    [screenings]
  );
  const passedUnits = units.filter(
    (unit) => unit.screening_status === "passed"
  ).length;
  const failedUnits = units.filter(
    (unit) => unit.screening_status === "failed"
  ).length;
  const reactionCount = transfusions.filter(
    (record) => record.reaction_severity !== "none"
  ).length;

  const unitDetail = selectedUnit
    ? unitDetails[selectedUnit.id] ?? null
    : null;
  const requestDetail = selectedRequest
    ? requestDetails[selectedRequest.id] ?? null
    : null;
  const donorDetail = selectedDonor
    ? donorDetails[selectedDonor.id] ?? null
    : null;

  return (
    <>
      <div className="space-y-4">
        <Tabs
          items={[
            { value: "inventory", label: "Inventory", count: units.length },
            { value: "requests", label: "Requests", count: requests.length },
            { value: "donors", label: "Donors", count: donors.length },
            {
              value: "testing",
              label: "Testing & safety",
              count: screenings.length,
            },
          ]}
          value={tab}
          onValueChange={setTab}
        />

        {tab === "inventory" ? (
          <RecordTable
            rows={units}
            columns={unitColumns}
            rowKey={(row) => row.id}
            caption="Blood component inventory"
            searchPlaceholder="Search unit number, donor, blood type, or storage"
            searchAccessor={(row) =>
              `${row.unit_number} ${row.blood_type} ${row.component} ${row.donor_name} ${row.storage_location} ${row.request_number ?? ""}`
            }
            filters={unitFilters}
            emptyTitle="No blood units found"
            emptyDescription="There are no blood units matching your selected filters."
            emptyIcon={<WaterdropIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "requests" ? (
          <RecordTable
            rows={requests}
            columns={requestColumns}
            rowKey={(row) => row.id}
            caption="Blood requests"
            searchPlaceholder="Search request no., patient, product, or requester"
            searchAccessor={(row) =>
              `${row.request_number} ${row.patient_name} ${row.patient_mrn} ${row.blood_type} ${row.component} ${row.requested_by_name} ${row.department_name}`
            }
            filters={requestFilters}
            toolbarActions={
              <UnavailableAction
                label="Create Request"
                description="Create a blood request and route it to the blood bank."
                size="sm"
                variant="secondary"
                icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No blood requests found"
            emptyDescription="There are no blood requests matching your selected filters."
            emptyIcon={
              <ClipboardListIcon className="size-5" aria-hidden="true" />
            }
            pageSize={10}
          />
        ) : null}

        {tab === "donors" ? (
          <RecordTable
            rows={donors}
            columns={donorColumns}
            rowKey={(row) => row.id}
            caption="Blood donors"
            searchPlaceholder="Search donor no., name, blood type, or contact"
            searchAccessor={(row) =>
              `${row.donor_number} ${row.full_name} ${row.blood_type} ${row.contact_number ?? ""}`
            }
            filters={donorFilters}
            toolbarActions={
              <UnavailableAction
                label="Register Donor"
                description="Register a blood donor and record eligibility screening."
                size="sm"
                variant="secondary"
                icon={<UserRoundedIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No donors found"
            emptyDescription="There are no donors matching your selected filters."
            emptyIcon={<UserRoundedIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "testing" ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-hospital-border bg-white p-4 shadow-xs">
                <p className="text-[11px] font-medium text-hospital-text-muted">
                  Units screened
                </p>
                <p className="mt-1 text-xl font-semibold text-hospital-text">
                  {testedUnitIds.size}
                </p>
              </div>
              <div className="rounded-md border border-hospital-border bg-white p-4 shadow-xs">
                <p className="text-[11px] font-medium text-hospital-text-muted">
                  Screening passed
                </p>
                <p className="mt-1 text-xl font-semibold text-emerald-700">
                  {passedUnits}
                </p>
              </div>
              <div className="rounded-md border border-hospital-border bg-white p-4 shadow-xs">
                <p className="text-[11px] font-medium text-hospital-text-muted">
                  Screening failed
                </p>
                <p className="mt-1 text-xl font-semibold text-red-700">
                  {failedUnits}
                </p>
              </div>
              <div className="rounded-md border border-hospital-border bg-white p-4 shadow-xs">
                <p className="text-[11px] font-medium text-hospital-text-muted">
                  Transfusion reactions
                </p>
                <p className="mt-1 text-xl font-semibold text-amber-700">
                  {reactionCount}
                </p>
              </div>
            </div>

            <section className="space-y-2">
              <SectionHeading
                icon={<TestTubeIcon className="size-3.5" />}
                title="Screening records"
              />
              <RecordTable
                rows={screenings}
                columns={screeningColumns}
                rowKey={(row) => row.id}
                caption="Blood unit screening records"
                searchPlaceholder="Search unit, test, or result"
                searchAccessor={(row) => {
                  const unit = unitRowById.get(row.unit_id);

                  return `${unit?.unit_number ?? ""} ${unit?.blood_type ?? ""} ${row.test_name} ${row.result} ${row.tested_by_name ?? ""}`;
                }}
                filters={screeningFilters}
                emptyTitle="No screening records"
                emptyDescription="There are no screening records matching your selected filters."
                emptyIcon={<TestTubeIcon className="size-5" aria-hidden="true" />}
                pageSize={10}
              />
            </section>

            <section className="space-y-2">
              <SectionHeading
                icon={<HeartPulseIcon className="size-3.5" />}
                title="Transfusion reactions"
              />
              {transfusions.length === 0 ? (
                <p className="text-xs text-hospital-text-muted">
                  No transfusion records.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Request</TableHead>
                      <TableHead>Transfused at</TableHead>
                      <TableHead>Transfused by</TableHead>
                      <TableHead>Reaction</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfusions.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <span className="font-mono text-[11px]">
                            {unitRowById.get(record.unit_id)?.unit_number ??
                              "Unknown unit"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {requestRowById.get(record.request_id)?.request_number ??
                            "\u2014"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDateTime(record.transfused_at)}
                        </TableCell>
                        <TableCell>{record.transfused_by_name}</TableCell>
                        <TableCell>
                          <StatusBadge status={record.reaction_severity} />
                        </TableCell>
                        <TableCell className="text-xs text-hospital-text-muted">
                          {record.reaction_notes ?? "\u2014"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          </div>
        ) : null}
      </div>

      <Modal
        open={selectedUnit !== null}
        onClose={closeUnit}
        title={
          selectedUnit
            ? `Blood unit ${selectedUnit.unit_number}`
            : "Blood unit details"
        }
        description="Component, donor, screening, request, and transfusion"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeUnit}>
            Close
          </Button>
        }
      >
        {selectedUnit ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Unit number">
                <span className="font-mono text-xs">
                  {selectedUnit.unit_number}
                </span>
              </DetailField>
              <DetailField label="Blood type">
                <Badge variant="info">{selectedUnit.blood_type}</Badge>
              </DetailField>
              <DetailField label="Component">
                {COMPONENT_LABELS[selectedUnit.component]}
              </DetailField>
              <DetailField label="Status">
                <StatusBadge status={selectedUnit.status} />
              </DetailField>
              <DetailField label="Donor">{selectedUnit.donor_name}</DetailField>
              <DetailField label="Storage">
                {selectedUnit.storage_location}
              </DetailField>
              <DetailField label="Collected">
                {formatDate(selectedUnit.collection_date)}
              </DetailField>
              <DetailField label="Expiry">
                {formatDate(selectedUnit.expiry_date)} ·{" "}
                {formatExpiry(selectedUnit.days_to_expiry)}
              </DetailField>
              <DetailField label="Screening status">
                <StatusBadge status={selectedUnit.screening_status} />
              </DetailField>
              <DetailField label="Linked request">
                {selectedUnit.request_number ?? "No linked request"}
              </DetailField>
            </dl>

            {unitDetail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<TestTubeIcon className="size-3.5" />}
                    title="Screening results"
                  />
                  <ul className="space-y-1.5">
                    {unitDetail.screenings.map((screening) => (
                      <li
                        key={screening.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-medium text-hospital-text">
                            {screening.test_name}
                          </p>
                          <p className="text-[11px] text-hospital-text-muted">
                            {screening.tested_by_name ?? "Not tested"} ·{" "}
                            {screening.tested_at
                              ? formatDateTime(screening.tested_at)
                              : "Pending"}
                          </p>
                          {screening.notes ? (
                            <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                              {screening.notes}
                            </p>
                          ) : null}
                        </div>
                        <StatusBadge status={screening.result} />
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<HeartPulseIcon className="size-3.5" />}
                    title="Issue & transfusion"
                  />
                  {unitDetail.issue || unitDetail.transfusion ? (
                    <div className="rounded-md border border-hospital-border p-3">
                      {unitDetail.issue ? (
                        <>
                          <p className="text-xs text-hospital-text">
                            Issued{" "}
                            {formatDateTime(unitDetail.issue.issued_at)} by{" "}
                            {unitDetail.issue.issued_by_name} to{" "}
                            {unitDetail.issue.received_by_name}.
                          </p>
                        </>
                      ) : null}
                      {unitDetail.transfusion ? (
                        <div className="mt-2">
                          <p className="text-xs text-hospital-text">
                            Transfused{" "}
                            {formatDateTime(unitDetail.transfusion.transfused_at)}{" "}
                            by {unitDetail.transfusion.transfused_by_name}.
                          </p>
                          <div className="mt-1">
                            <StatusBadge
                              status={unitDetail.transfusion.reaction_severity}
                            />
                          </div>
                          {unitDetail.transfusion.reaction_notes ? (
                            <p className="mt-1 text-[11px] text-hospital-text-muted">
                              {unitDetail.transfusion.reaction_notes}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-hospital-text-muted">
                      This unit has not been issued or transfused.
                    </p>
                  )}
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Reserve unit")}
                  >
                    Reserve unit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Crossmatch unit")}
                  >
                    Crossmatch
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Issue unit")}
                  >
                    Issue unit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingAction("Discard unit")}
                  >
                    Discard unit
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={selectedRequest !== null}
        onClose={closeRequest}
        title={
          selectedRequest
            ? `Blood request ${selectedRequest.request_number}`
            : "Blood request details"
        }
        description="Crossmatch, issue, and transfusion records"
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
              <DetailField label="Patient">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">
                    {selectedRequest.patient_name}
                  </span>
                  <span className="font-mono text-[11px] text-hospital-text-muted">
                    {selectedRequest.patient_mrn}
                  </span>
                </div>
              </DetailField>
              <DetailField label="Product">
                <Badge variant="info">{selectedRequest.blood_type}</Badge>{" "}
                {COMPONENT_LABELS[selectedRequest.component]}
              </DetailField>
              <DetailField label="Units">
                {selectedRequest.units_fulfilled} /{" "}
                {selectedRequest.units_requested} fulfilled
              </DetailField>
              <DetailField label="Priority">
                <StatusBadge status={selectedRequest.priority} />
              </DetailField>
              <DetailField label="Status">
                <StatusBadge status={selectedRequest.status} />
              </DetailField>
              <DetailField label="Requested by">
                {selectedRequest.requested_by_name}
              </DetailField>
              <DetailField label="Department">
                {selectedRequest.department_name}
              </DetailField>
              <DetailField label="Requested at">
                {formatDateTime(selectedRequest.requested_at)}
              </DetailField>
              <DetailField label="Required by">
                {formatDateTime(selectedRequest.required_by)}
              </DetailField>
            </dl>

            {requestDetail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<TestTubeIcon className="size-3.5" />}
                    title="Crossmatch records"
                  />
                  {requestDetail.crossmatches.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No crossmatch records.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Unit</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Crossmatched at</TableHead>
                          <TableHead>By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requestDetail.crossmatches.map((crossmatch) => (
                          <TableRow key={crossmatch.id}>
                            <TableCell>
                              <span className="font-mono text-[11px]">
                                {crossmatch.unit_number}
                              </span>
                            </TableCell>
                            <TableCell>
                              {crossmatch.blood_type} ·{" "}
                              {COMPONENT_LABELS[crossmatch.component]}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={crossmatch.result} />
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {crossmatch.crossmatched_at
                                ? formatDateTime(crossmatch.crossmatched_at)
                                : "\u2014"}
                            </TableCell>
                            <TableCell>
                              {crossmatch.crossmatched_by_name ?? "\u2014"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<ClipboardListIcon className="size-3.5" />}
                    title="Issue records"
                  />
                  {requestDetail.issues.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No units issued.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {requestDetail.issues.map((issue) => (
                        <li
                          key={issue.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                        >
                          <div>
                            <p className="font-mono text-[11px] text-hospital-text">
                              {issue.unit_number} · {issue.blood_type} ·{" "}
                              {COMPONENT_LABELS[issue.component]}
                            </p>
                            <p className="text-[11px] text-hospital-text-muted">
                              {formatDateTime(issue.issued_at)} ·{" "}
                              {issue.issued_by_name} → {issue.received_by_name}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openUnit(issue.unit_id)}
                          >
                            View unit
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<HeartPulseIcon className="size-3.5" />}
                    title="Transfusion records"
                  />
                  {requestDetail.transfusions.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No transfusion records.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {requestDetail.transfusions.map((record) => (
                        <li
                          key={record.id}
                          className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-mono text-[11px] text-hospital-text">
                              {record.unit_number}
                            </p>
                            <StatusBadge status={record.reaction_severity} />
                          </div>
                          <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                            {formatDateTime(record.transfused_at)} ·{" "}
                            {record.transfused_by_name}
                          </p>
                          {record.reaction_notes ? (
                            <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                              {record.reaction_notes}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Reserve unit")}
                  >
                    Reserve unit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Crossmatch request")}
                  >
                    Crossmatch
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Issue unit")}
                  >
                    Issue unit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingAction("Record transfusion")}
                  >
                    Record transfusion
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={selectedDonor !== null}
        onClose={closeDonor}
        title={
          selectedDonor
            ? `Donor ${selectedDonor.donor_number}`
            : "Blood donor details"
        }
        description="Eligibility, donation history, and linked units"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeDonor}>
            Close
          </Button>
        }
      >
        {selectedDonor ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Donor number">
                <span className="font-mono text-xs">
                  {selectedDonor.donor_number}
                </span>
              </DetailField>
              <DetailField label="Full name">
                {selectedDonor.full_name}
              </DetailField>
              <DetailField label="Blood type">
                <Badge variant="info">{selectedDonor.blood_type}</Badge>
              </DetailField>
              <DetailField label="Eligibility">
                <StatusBadge status={selectedDonor.eligibility_status} />
              </DetailField>
              <DetailField label="Date of birth">
                {formatDate(selectedDonor.date_of_birth)}
              </DetailField>
              <DetailField label="Sex">{selectedDonor.sex}</DetailField>
              <DetailField label="Contact">
                {selectedDonor.contact_number ?? "\u2014"}
              </DetailField>
              <DetailField label="Address">
                {selectedDonor.address ?? "\u2014"}
              </DetailField>
              <DetailField label="Last donation">
                {selectedDonor.last_donation_date
                  ? formatDate(selectedDonor.last_donation_date)
                  : "\u2014"}
              </DetailField>
              <DetailField label="Total donations">
                {selectedDonor.total_donations}
              </DetailField>
            </dl>

            {selectedDonor.notes ? (
              <p className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2 text-xs text-hospital-text-muted">
                {selectedDonor.notes}
              </p>
            ) : null}

            {donorDetail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<WaterdropIcon className="size-3.5" />}
                    title="Donation history"
                  />
                  <ul className="space-y-1.5">
                    {donorDetail.donations.map((donation) => (
                      <li
                        key={donation.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                      >
                        <div>
                          <p className="font-mono text-[11px] text-hospital-text">
                            {donation.donation_number} · {donation.blood_type}
                          </p>
                          <p className="text-[11px] text-hospital-text-muted">
                            {formatDate(donation.donation_date)} ·{" "}
                            {donation.units_collected} unit
                            {donation.units_collected === 1 ? "" : "s"} ·{" "}
                            {donation.collection_site}
                          </p>
                        </div>
                        <StatusBadge status={donation.status} />
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<TestTubeIcon className="size-3.5" />}
                    title="Units from this donor"
                  />
                  {donorDetail.units.length === 0 ? (
                    <p className="text-xs text-hospital-text-muted">
                      No units linked to this donor.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {donorDetail.units.map((unit) => (
                        <li
                          key={unit.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                        >
                          <div>
                            <p className="font-mono text-[11px] text-hospital-text">
                              {unit.unit_number} · {unit.blood_type} ·{" "}
                              {COMPONENT_LABELS[unit.component]}
                            </p>
                            <p className="text-[11px] text-hospital-text-muted">
                              Expires {formatDate(unit.expiry_date)} ·{" "}
                              {unit.storage_location}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={unit.status} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openUnit(unit.id)}
                            >
                              View
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Record donation")}
                  >
                    Record donation
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Update eligibility")}
                  >
                    Update eligibility
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

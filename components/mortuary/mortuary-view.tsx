"use client";

import * as React from "react";
import {
  ArchiveIcon,
  ClipboardListIcon,
  UserRoundedIcon,
} from "@solar-icons/react/linear";

import type {
  MortuaryRecordDetail,
  MortuaryRecordListRow,
  MortuaryReleaseListRow,
  MortuaryStorageUnitListRow,
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
import { Tabs } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";

const RECORD_STATUS_OPTIONS = [
  { value: "admitted", label: "Admitted" },
  { value: "identified", label: "Identified" },
  { value: "release_pending", label: "Release pending" },
  { value: "released", label: "Released" },
  { value: "unclaimed", label: "Unclaimed" },
];

const RELEASE_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "authorized", label: "Authorized" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ACTIVE_RECORD_STATUSES = new Set([
  "admitted",
  "identified",
  "release_pending",
  "unclaimed",
]);

export interface MortuaryViewProps {
  records: MortuaryRecordListRow[];
  recordDetails: Record<string, MortuaryRecordDetail>;
  releases: MortuaryReleaseListRow[];
  storageUnits: MortuaryStorageUnitListRow[];
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

export function MortuaryView({
  records,
  recordDetails,
  releases,
  storageUnits,
}: MortuaryViewProps) {
  const [tab, setTab] = React.useState("custody");
  const [selectedRecord, setSelectedRecord] =
    React.useState<MortuaryRecordListRow | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const recordById = React.useMemo(
    () => new Map(records.map((record) => [record.id, record])),
    [records]
  );

  const openRecord = React.useCallback(
    (id: string) => {
      const row = recordById.get(id);

      if (row) {
        setPendingAction(null);
        setSelectedRecord(row);
      }
    },
    [recordById]
  );

  const closeRecord = React.useCallback(() => {
    setPendingAction(null);
    setSelectedRecord(null);
  }, []);

  const activeRecords = records.filter((record) =>
    ACTIVE_RECORD_STATUSES.has(record.status)
  );

  const recordColumns = React.useMemo<Column<MortuaryRecordListRow>[]>(
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
        key: "declared",
        header: "Declared",
        sortable: true,
        sortValue: (row) => row.declared_at,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.declared_at)}
          </span>
        ),
      },
      {
        key: "body_tag",
        header: "Body tag",
        cell: (row) => (
          <span className="font-mono text-[11px]">{row.body_tag_number}</span>
        ),
      },
      {
        key: "identification",
        header: "Identification",
        cell: (row) => <StatusBadge status={row.identification_status} />,
      },
      {
        key: "storage",
        header: "Storage",
        cell: (row) => row.storage_unit_label ?? "Unassigned",
      },
      {
        key: "nok",
        header: "Next of kin",
        cell: (row) =>
          row.next_of_kin_name ? (
            <div className="min-w-0 text-xs">
              <p>{row.next_of_kin_name}</p>
              <p className="text-[11px] text-hospital-text-muted">
                {row.next_of_kin_relationship ?? "Relationship not recorded"} ·{" "}
                {row.next_of_kin_verified ? "Verified" : "Pending"}
              </p>
            </div>
          ) : (
            "Not recorded"
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
            aria-label={`View mortuary case ${row.case_number}`}
            onClick={() => openRecord(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openRecord]
  );

  const recordFilters = React.useMemo<
    FilterConfig<MortuaryRecordListRow>[]
  >(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: RECORD_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
    ],
    []
  );

  const releaseColumns = React.useMemo<Column<MortuaryReleaseListRow>[]>(
    () => [
      {
        key: "case",
        header: "Case / patient",
        sortable: true,
        sortValue: (row) => row.case_number,
        cell: (row) => (
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-hospital-text">
              {row.case_number}
            </p>
            <p className="text-[11px] text-hospital-text-muted">
              {row.patient_name} · {row.patient_mrn}
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
        key: "requested",
        header: "Requested",
        sortable: true,
        sortValue: (row) => row.requested_at,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.requested_at)}
          </span>
        ),
      },
      {
        key: "authorized_by",
        header: "Authorized by",
        cell: (row) => row.authorized_by_name ?? "Not authorized",
      },
      {
        key: "released_to",
        header: "Released to",
        cell: (row) => row.released_to_name ?? "\u2014",
      },
      {
        key: "document",
        header: "Document",
        cell: (row) => row.document_reference ?? "\u2014",
      },
      {
        key: "released_at",
        header: "Released at",
        sortable: true,
        sortValue: (row) => row.released_at ?? "",
        cell: (row) =>
          row.released_at ? (
            <span className="whitespace-nowrap">
              {formatDateTime(row.released_at)}
            </span>
          ) : (
            "\u2014"
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
            aria-label={`View mortuary case ${row.case_number}`}
            onClick={() => openRecord(row.record_id)}
          >
            View case
          </Button>
        ),
      },
    ],
    [openRecord]
  );

  const releaseFilters = React.useMemo<
    FilterConfig<MortuaryReleaseListRow>[]
  >(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: RELEASE_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
    ],
    []
  );

  const detail = selectedRecord
    ? recordDetails[selectedRecord.id] ?? null
    : null;

  return (
    <>
      <div className="space-y-4">
        <Tabs
          items={[
            {
              value: "custody",
              label: "Custody board",
              count: activeRecords.length,
            },
            { value: "records", label: "Records", count: records.length },
            { value: "releases", label: "Releases", count: releases.length },
            {
              value: "storage",
              label: "Storage",
              count: storageUnits.length,
            },
          ]}
          value={tab}
          onValueChange={setTab}
        />

        {tab === "custody" ? (
          <RecordTable
            rows={activeRecords}
            columns={recordColumns}
            rowKey={(row) => row.id}
            caption="Bodies in mortuary custody"
            searchPlaceholder="Search case no., patient, body tag, or next of kin"
            searchAccessor={(row) =>
              `${row.case_number} ${row.patient_name} ${row.patient_mrn} ${row.body_tag_number} ${row.next_of_kin_name ?? ""}`
            }
            filters={recordFilters}
            toolbarActions={
              <UnavailableAction
                label="Mortuary Admission"
                description="Admit a deceased patient to the mortuary and assign a body tag."
                size="sm"
                variant="secondary"
                icon={<ArchiveIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No bodies in custody"
            emptyDescription="There are no active mortuary records."
            emptyIcon={<ArchiveIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "records" ? (
          <RecordTable
            rows={records}
            columns={recordColumns}
            rowKey={(row) => row.id}
            caption="Mortuary records"
            searchPlaceholder="Search case no., patient, body tag, storage, or next of kin"
            searchAccessor={(row) =>
              `${row.case_number} ${row.patient_name} ${row.patient_mrn} ${row.body_tag_number} ${row.storage_unit_label ?? ""} ${row.next_of_kin_name ?? ""}`
            }
            filters={recordFilters}
            emptyTitle="No mortuary records"
            emptyDescription="There are no mortuary records matching your filters."
            emptyIcon={<ArchiveIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "releases" ? (
          <RecordTable
            rows={releases}
            columns={releaseColumns}
            rowKey={(row) => row.id}
            caption="Mortuary releases"
            searchPlaceholder="Search case, patient, document, or release recipient"
            searchAccessor={(row) =>
              `${row.case_number} ${row.patient_name} ${row.patient_mrn} ${row.released_to_name ?? ""} ${row.document_reference ?? ""} ${row.authorized_by_name ?? ""}`
            }
            filters={releaseFilters}
            toolbarActions={
              <UnavailableAction
                label="Authorize Release"
                description="Verify release documents and authorize release of a body to the next of kin or authorized representative."
                size="sm"
                variant="secondary"
                icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
              />
            }
            emptyTitle="No release records"
            emptyDescription="There are no mortuary releases matching your filters."
            emptyIcon={
              <ClipboardListIcon className="size-5" aria-hidden="true" />
            }
            pageSize={10}
          />
        ) : null}

        {tab === "storage" ? (
          <div className="space-y-3">
            <p className="text-[11px] text-hospital-text-muted">
              Storage units are shown with current occupancy. Assignment changes
              require authorized mortuary staff.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {storageUnits.map((unit) => (
                <section
                  key={unit.id}
                  aria-label={`Storage unit ${unit.unit_number}`}
                  className="rounded-md border border-hospital-border bg-white p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-hospital-text">
                        {unit.unit_number}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                        {unit.location}
                      </p>
                    </div>
                    <StatusBadge status={unit.status} />
                  </div>

                  <div className="mt-3 rounded-md border border-hospital-border-subtle bg-hospital-surface p-2.5">
                    <p className="text-[11px] font-medium text-hospital-text-muted">
                      Current occupant
                    </p>
                    {unit.current_case_number ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (unit.current_record_id) {
                            openRecord(unit.current_record_id);
                          }
                        }}
                        className="mt-1 w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
                      >
                        <p className="font-mono text-[11px] text-hospital-text">
                          {unit.current_case_number}
                        </p>
                        <p className="text-xs text-hospital-text-muted">
                          {unit.current_patient_name}
                        </p>
                      </button>
                    ) : (
                      <p className="mt-1 text-xs text-hospital-text-muted">
                        No current occupant.
                      </p>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        open={selectedRecord !== null}
        onClose={closeRecord}
        title={
          selectedRecord
            ? `Mortuary case ${selectedRecord.case_number}`
            : "Mortuary case details"
        }
        description="Identification, storage, next of kin, release, and access history"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeRecord}>
            Close
          </Button>
        }
      >
        {selectedRecord ? (
          <div className="space-y-5">
            {pendingAction ? (
              <Alert variant="info" title="Action unavailable">
                {UNAVAILABLE_MESSAGE} Requested action: {pendingAction}.
              </Alert>
            ) : null}

            <Alert variant="warning" title="Restricted record">
              Mortuary records are restricted and access is audited. Verify
              authorization before performing release actions.
            </Alert>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Patient">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium">{selectedRecord.patient_name}</span>
                  <span className="font-mono text-[11px] text-hospital-text-muted">
                    {selectedRecord.patient_mrn}
                  </span>
                </div>
              </DetailField>
              <DetailField label="Status">
                <StatusBadge status={selectedRecord.status} />
              </DetailField>
              <DetailField label="Declared">
                {formatDateTime(selectedRecord.declared_at)}
              </DetailField>
              <DetailField label="Place of death">
                {selectedRecord.place_of_death}
              </DetailField>
              <DetailField label="Body tag">
                <span className="font-mono text-xs">
                  {selectedRecord.body_tag_number}
                </span>
              </DetailField>
              <DetailField label="Identification">
                <StatusBadge status={selectedRecord.identification_status} />
              </DetailField>
              <DetailField label="Storage">
                {selectedRecord.storage_unit_label ?? "Unassigned"}
              </DetailField>
              <DetailField label="Admitted">
                {formatDateTime(selectedRecord.admitted_at)}
              </DetailField>
              <DetailField label="Released">
                {selectedRecord.released_at
                  ? formatDateTime(selectedRecord.released_at)
                  : "Not released"}
              </DetailField>
              <DetailField label="Release document">
                {selectedRecord.release_document_reference ?? "\u2014"}
              </DetailField>
            </dl>

            <section className="space-y-2">
              <SectionHeading
                icon={<UserRoundedIcon className="size-3.5" />}
                title="Next of kin"
              />
              <div className="rounded-md border border-hospital-border p-3">
                {selectedRecord.next_of_kin_name ? (
                  <>
                    <p className="text-sm font-medium text-hospital-text">
                      {selectedRecord.next_of_kin_name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                      {selectedRecord.next_of_kin_relationship ?? "Relationship not recorded"} ·{" "}
                      {selectedRecord.next_of_kin_contact ?? "No contact number"}
                    </p>
                    <div className="mt-1">
                      <StatusBadge
                        status={
                          selectedRecord.next_of_kin_verified
                            ? "verified"
                            : "pending"
                        }
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-hospital-text-muted">
                    No next-of-kin information recorded.
                  </p>
                )}
              </div>
            </section>

            {detail ? (
              <>
                <section className="space-y-2">
                  <SectionHeading
                    icon={<ClipboardListIcon className="size-3.5" />}
                    title="Release processing"
                  />
                  {detail.release ? (
                    <div className="rounded-md border border-hospital-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-hospital-text">
                          {detail.release.status === "completed"
                            ? "Release completed"
                            : "Release authorization"}
                        </p>
                        <StatusBadge status={detail.release.status} />
                      </div>
                      <p className="mt-1 text-[11px] text-hospital-text-muted">
                        Requested {formatDateTime(detail.release.requested_at)}
                        {detail.release.authorized_at
                          ? ` · Authorized ${formatDateTime(detail.release.authorized_at)} by ${detail.release.authorized_by_name ?? "—"}`
                          : ""}
                      </p>
                      {detail.release.released_to_name ? (
                        <p className="mt-1 text-[11px] text-hospital-text-muted">
                          Released to {detail.release.released_to_name} ·{" "}
                          {detail.release.document_reference ?? "No document"}
                        </p>
                      ) : null}
                      {detail.release.notes ? (
                        <p className="mt-1 text-[11px] text-hospital-text-muted">
                          {detail.release.notes}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-hospital-text-muted">
                      No release request recorded.
                    </p>
                  )}
                </section>

                <section className="space-y-2">
                  <SectionHeading
                    icon={<ArchiveIcon className="size-3.5" />}
                    title="Access history"
                  />
                  <ul className="space-y-1.5">
                    {detail.accessLog.map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2"
                      >
                        <p className="text-xs text-hospital-text">
                          {entry.action}
                        </p>
                        <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                          {entry.actor_name} · {formatDateTime(entry.created_at)}
                        </p>
                        {entry.notes ? (
                          <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                            {entry.notes}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Update mortuary record")}
                  >
                    Update record
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Verify body identification")}
                  >
                    Verify identification
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Assign storage")}
                  >
                    Assign storage
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingAction("Authorize release")}
                  >
                    Authorize release
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingAction("Print release documents")}
                  >
                    Print documents
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

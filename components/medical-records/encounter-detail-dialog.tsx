"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardListIcon,
  DocumentTextIcon,
  HeartPulseIcon,
  Pills2Icon,
} from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  formatDate,
  formatDateTime,
  formatIdentifier,
  formatName,
} from "@/lib/format";
import { finalizeClinicalNoteAction } from "@/app/(workspace)/medical-records/actions";
import type {
  EncounterDetail,
  EncounterListRow,
  VitalSigns,
} from "@/types/hospital";

export interface EncounterDetailDialogProps {
  row: EncounterListRow | null;
  detail: EncounterDetail | undefined;
  staffNamesByUserId: Record<string, string>;
  onClose: () => void;
}

function HeaderFact({
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
      <dd className="mt-0.5 break-words text-sm text-hospital-text">
        {children}
      </dd>
    </div>
  );
}

function RecordSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-hospital-border-subtle pt-5">
      <div className="flex items-center gap-2">
        <span className="text-hospital-text-muted">{icon}</span>
        <h3 className="text-sm font-semibold text-hospital-text">{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function VitalMetric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-hospital-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-hospital-text">
        <span className="text-sm font-semibold">{value}</span>{" "}
        <span className="text-[11px] text-hospital-text-muted">{unit}</span>
      </dd>
    </div>
  );
}

function buildVitalMetrics(vital: VitalSigns) {
  return [
    {
      label: "Blood Pressure",
      value:
        vital.systolic_bp !== null && vital.diastolic_bp !== null
          ? `${vital.systolic_bp}/${vital.diastolic_bp}`
          : "Not recorded",
      unit: "mmHg",
    },
    {
      label: "Heart Rate",
      value: vital.heart_rate !== null ? String(vital.heart_rate) : "Not recorded",
      unit: "bpm",
    },
    {
      label: "Respiratory Rate",
      value:
        vital.respiratory_rate !== null
          ? String(vital.respiratory_rate)
          : "Not recorded",
      unit: "breaths/min",
    },
    {
      label: "Temperature",
      value:
        vital.temperature !== null ? String(vital.temperature) : "Not recorded",
      unit: "\u00b0C",
    },
    {
      label: "Oxygen Saturation",
      value:
        vital.oxygen_saturation !== null
          ? String(vital.oxygen_saturation)
          : "Not recorded",
      unit: "%",
    },
    {
      label: "Weight",
      value: vital.weight_kg !== null ? String(vital.weight_kg) : "Not recorded",
      unit: "kg",
    },
    {
      label: "Height",
      value: vital.height_cm !== null ? String(vital.height_cm) : "Not recorded",
      unit: "cm",
    },
  ];
}

function RecordedBy({ id, names }: { id: string; names: Record<string, string> }) {
  const name = names[id];

  if (name) {
    return <>{name}</>;
  }

  return (
    <span className="break-all font-mono text-[11px] text-hospital-text-muted">
      {id}
    </span>
  );
}

export function EncounterDetailDialog({
  row,
  detail,
  staffNamesByUserId,
  onClose,
}: EncounterDetailDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [finalizeTarget, setFinalizeTarget] = React.useState<{
    id: string;
    noteType: string;
  } | null>(null);
  const [finalizing, setFinalizing] = React.useState(false);

  const title = row ? `Encounter ${row.encounter_number}` : "Encounter detail";
  const description = detail
    ? `${formatName(detail.patient)} \u00b7 ${formatIdentifier(
        detail.patient.medical_record_number
      )}`
    : row?.patient_name;

  function closeAll() {
    setFinalizeTarget(null);
    setFinalizing(false);
    onClose();
  }

  async function handleFinalize() {
    if (!finalizeTarget || finalizing) {
      return;
    }

    setFinalizing(true);

    try {
      const result = await finalizeClinicalNoteAction({
        noteId: finalizeTarget.id,
      });

      if (!result.ok) {
        toast({
          title: "Unable to finalize note",
          description: result.formError,
          variant: "danger",
        });
        return;
      }

      toast({
        title: "Clinical note finalized",
        description: "The note is now locked.",
        variant: "success",
      });
      setFinalizeTarget(null);
      router.refresh();
    } catch {
      toast({
        title: "Unable to finalize note",
        description: "Check your connection and try again.",
        variant: "danger",
      });
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <>
      <Modal
        open={row !== null}
        onClose={closeAll}
        title={title}
        description={description}
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeAll}>
            Close
          </Button>
        }
      >
      {!detail ? (
        <Alert variant="danger" title="Encounter detail unavailable">
          The encounter record could not be loaded. Close this dialog and try
          again.
        </Alert>
      ) : (
        <div className="space-y-5">
          <div className="rounded-md border border-hospital-border bg-hospital-surface p-4">
            <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
              <HeaderFact label="Patient">
                <span title={formatName(detail.patient)}>
                  {formatName(detail.patient)}
                </span>
                <span className="mt-0.5 block font-mono text-[11px] text-hospital-text-muted">
                  {formatIdentifier(detail.patient.medical_record_number)}
                </span>
              </HeaderFact>
              <HeaderFact label="Encounter Number">
                <span className="font-mono text-[11px]">
                  {detail.encounter.encounter_number}
                </span>
              </HeaderFact>
              <HeaderFact label="Department">
                {row?.department_name ?? "Not recorded"}
              </HeaderFact>
              <HeaderFact label="Physician">
                {row?.physician_name ?? "Unassigned"}
              </HeaderFact>
              <HeaderFact label="Started">
                {formatDateTime(detail.encounter.started_at)}
              </HeaderFact>
              <HeaderFact label="Completed">
                {detail.encounter.completed_at
                  ? formatDateTime(detail.encounter.completed_at)
                  : "Not completed"}
              </HeaderFact>
            </dl>
          </div>

          <Alert variant="info" title="Clinical safety">
            Clinical values are shown as recorded by authorized staff. The
            interface does not generate diagnoses or treatment decisions.
          </Alert>

          <RecordSection
            title="Vital Signs"
            icon={<HeartPulseIcon className="size-4" aria-hidden="true" />}
          >
            {detail.vitals.length === 0 ? (
              <EmptyState
                icon={
                  <HeartPulseIcon className="size-5" aria-hidden="true" />
                }
                title="No vital signs recorded"
                description="No vital signs are attached to this encounter."
                className="py-6"
              />
            ) : (
              <div className="space-y-3">
                {detail.vitals.map((vital, index) => (
                  <div
                    key={vital.id}
                    className="rounded-md border border-hospital-border p-4"
                  >
                    <p className="text-[11px] font-medium text-hospital-text-muted">
                      Observation {index + 1}
                    </p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                      {buildVitalMetrics(vital).map((metric) => (
                        <VitalMetric
                          key={metric.label}
                          label={metric.label}
                          value={metric.value}
                          unit={metric.unit}
                        />
                      ))}
                    </dl>

                    <dl className="mt-3 grid gap-x-4 gap-y-2 border-t border-hospital-border-subtle pt-3 sm:grid-cols-2">
                      <HeaderFact label="Recorded at">
                        {formatDateTime(vital.recorded_at)}
                      </HeaderFact>
                      <HeaderFact label="Recorded by">
                        <RecordedBy
                          id={vital.recorded_by}
                          names={staffNamesByUserId}
                        />
                      </HeaderFact>
                      <HeaderFact label="Verification">
                        <StatusBadge status={vital.verification_status ?? "unverified"} />
                      </HeaderFact>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </RecordSection>

          <RecordSection
            title="Diagnoses"
            icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
          >
            {detail.diagnoses.length === 0 ? (
              <EmptyState
                icon={
                  <ClipboardListIcon className="size-5" aria-hidden="true" />
                }
                title="No diagnoses recorded"
                description="No diagnoses are documented for this encounter."
                className="py-6"
              />
            ) : (
              <div className="space-y-3">
                {detail.diagnoses.map((diagnosis) => (
                  <div
                    key={diagnosis.id}
                    className="rounded-md border border-hospital-border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-hospital-text">
                          {diagnosis.diagnosis_name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                          {[
                            diagnosis.diagnosis_code ?? "No code",
                            diagnosis.diagnosis_type ?? "Type not recorded",
                          ].join(" \u00b7 ")}
                        </p>
                      </div>
                      <Badge variant={diagnosis.is_primary ? "info" : "inactive"}>
                        {diagnosis.is_primary ? "Primary" : "Additional"}
                      </Badge>
                    </div>

                    {diagnosis.clinical_notes ? (
                      <p className="mt-2 break-words text-sm leading-relaxed text-hospital-text">
                        {diagnosis.clinical_notes}
                      </p>
                    ) : null}

                    <dl className="mt-3 grid gap-x-4 gap-y-2 border-t border-hospital-border-subtle pt-3 sm:grid-cols-2">
                      <HeaderFact label="Recorded at">
                        {formatDateTime(diagnosis.recorded_at)}
                      </HeaderFact>
                      <HeaderFact label="Recorded by">
                        <RecordedBy
                          id={diagnosis.recorded_by}
                          names={staffNamesByUserId}
                        />
                      </HeaderFact>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </RecordSection>

          <RecordSection
            title="Clinical Notes"
            icon={<DocumentTextIcon className="size-4" aria-hidden="true" />}
          >
            {detail.clinical_notes.length === 0 ? (
              <EmptyState
                icon={
                  <DocumentTextIcon className="size-5" aria-hidden="true" />
                }
                title="No clinical notes recorded"
                description="No clinical notes are documented for this encounter."
                className="py-6"
              />
            ) : (
              <div className="space-y-3">
                {detail.clinical_notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-md border border-hospital-border p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-hospital-text">
                        {note.note_type}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={note.status} />
                        {note.status === "draft" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setFinalizeTarget({
                                id: note.id,
                                noteType: note.note_type,
                              })
                            }
                          >
                            Finalize note
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-2 break-words text-sm leading-relaxed text-hospital-text">
                      {note.content}
                    </p>

                    <dl className="mt-3 grid gap-x-4 gap-y-2 border-t border-hospital-border-subtle pt-3 sm:grid-cols-2">
                      <HeaderFact label="Authored by">
                        <RecordedBy
                          id={note.authored_by}
                          names={staffNamesByUserId}
                        />
                      </HeaderFact>
                      <HeaderFact
                        label={
                          note.finalized_at ? "Finalized at" : "Created at"
                        }
                      >
                        {formatDateTime(note.finalized_at ?? note.created_at)}
                      </HeaderFact>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </RecordSection>

          <RecordSection
            title="Prescriptions"
            icon={<Pills2Icon className="size-4" aria-hidden="true" />}
          >
            {detail.prescriptions.length > 0 ? (
              <ul className="divide-y divide-hospital-border-subtle">
                {detail.prescriptions.map((prescription) => (
                  <li key={prescription.id} className="flex flex-wrap items-center gap-3 py-2">
                    <span className="font-mono text-xs">
                      {formatIdentifier(prescription.prescription_number)}
                    </span>
                    <span className="text-xs text-hospital-text-muted">
                      {formatDate(prescription.prescription_date)}
                    </span>
                    <StatusBadge status={prescription.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Pills2Icon className="size-5" aria-hidden="true" />}
                title="No prescriptions to display"
                description="No prescription records are visible for this encounter."
                className="py-6"
              />
            )}
          </RecordSection>
        </div>
      )}
      </Modal>

      <ConfirmationDialog
        open={finalizeTarget !== null}
        onClose={() => setFinalizeTarget(null)}
        onConfirm={handleFinalize}
        title="Finalize clinical note"
        description={
          finalizeTarget
            ? `Finalize the ${finalizeTarget.noteType} note? Finalized notes cannot be edited.`
            : ""
        }
        confirmLabel="Finalize note"
        loading={finalizing}
      />
    </>
  );
}

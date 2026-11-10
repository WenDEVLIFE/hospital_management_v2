"use client";

import * as React from "react";
import {
  CheckCircleIcon,
  ClipboardListIcon,
  DangerTriangleIcon,
  HeartPulseIcon,
} from "@solar-icons/react/linear";

import { EmptyState } from "@/components/ui/empty-state";
import { UnavailableAction } from "@/components/module/unavailable-action";
import { formatDateTime, formatIdentifier } from "@/lib/format";
import type { NursingAssignmentRow, VitalSigns } from "@/types/hospital";

export interface NursingWorkspaceProps {
  rows: NursingAssignmentRow[];
  staffNamesByUserId: Record<string, string>;
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

function recorderName(id: string, names: Record<string, string>) {
  return names[id] ?? null;
}

export function NursingWorkspace({
  rows,
  staffNamesByUserId,
}: NursingWorkspaceProps) {
  const [selectedPatientId, setSelectedPatientId] = React.useState<
    string | null
  >(rows[0]?.patient_id ?? null);

  const selected =
    rows.find((row) => row.patient_id === selectedPatientId) ?? rows[0] ?? null;

  if (!selected) {
    return null;
  }

  const latestVitals = selected.latest_vitals;
  const latestRecorder = latestVitals
    ? recorderName(latestVitals.recorded_by, staffNamesByUserId)
    : null;

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="min-w-0 rounded-md border border-hospital-border bg-white">
          <div className="border-b border-hospital-border-subtle p-4">
            <h2 className="text-sm font-semibold text-hospital-text">
              Assigned patients
            </h2>
            <p className="mt-1 text-xs text-hospital-text-muted">
              {rows.length} {rows.length === 1 ? "patient" : "patients"} under
              your assignment.
            </p>
          </div>

          <ul className="max-h-[560px] divide-y divide-hospital-border-subtle overflow-y-auto xl:max-h-[640px]">
            {rows.map((row) => {
              const isSelected = row.patient_id === selected.patient_id;

              return (
                <li key={`${row.admission_id}-${row.patient_id}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedPatientId(row.patient_id)}
                    aria-pressed={isSelected}
                    className={
                      isSelected
                        ? "w-full cursor-pointer border-l-2 border-hospital-green bg-hospital-green-light p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hospital-green"
                        : "w-full cursor-pointer border-l-2 border-transparent p-3 text-left transition-colors hover:bg-hospital-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hospital-green"
                    }
                  >
                    <span className="block break-words text-sm font-medium text-hospital-text">
                      {row.patient_name}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-hospital-text-muted">
                      {formatIdentifier(row.patient_mrn)}
                    </span>

                    <span className="mt-1 block text-[11px] text-hospital-text-muted">
                      {[
                        row.department_name,
                        row.room_number ? `Room ${row.room_number}` : null,
                        row.bed_number ? `Bed ${row.bed_number}` : null,
                      ]
                        .filter(Boolean)
                        .join(" \u00b7 ")}
                    </span>

                    <span className="mt-1.5 flex flex-wrap items-center gap-2">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-hospital-green">
                          <CheckCircleIcon
                            className="size-3.5"
                            aria-hidden="true"
                          />
                          Selected
                        </span>
                      ) : null}
                      <span className="text-[11px] text-amber-800">
                        {row.pending_assessments === 0
                          ? "No pending assessments"
                          : `${row.pending_assessments} pending ${
                              row.pending_assessments === 1
                                ? "assessment"
                                : "assessments"
                            }`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="min-w-0 rounded-md border border-hospital-border bg-white">
          <div className="border-b border-hospital-border-subtle p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-hospital-text-muted">
                  Selected patient
                </p>
                <h2 className="mt-0.5 break-words text-base font-semibold text-hospital-text">
                  {selected.patient_name}
                </h2>
                <p className="mt-0.5 break-all font-mono text-[11px] font-medium text-hospital-green-dark">
                  {formatIdentifier(selected.patient_mrn)}
                </p>
                <p className="mt-2 text-xs text-hospital-text-muted">
                  {[
                    selected.department_name,
                    selected.room_number
                      ? `Room ${selected.room_number}`
                      : null,
                    selected.bed_number ? `Bed ${selected.bed_number}` : null,
                  ]
                    .filter(Boolean)
                    .join(" \u00b7 ")}
                </p>
                <p className="mt-1 text-xs text-hospital-text-muted">
                  Admission {selected.admission_number}
                  {selected.assigned_staff_name
                    ? ` \u00b7 Assigned nurse ${selected.assigned_staff_name}`
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <UnavailableAction
                  label="Record vitals"
                  icon={<HeartPulseIcon className="size-4" aria-hidden="true" />}
                  description={`Record a new set of observations for ${selected.patient_name}.`}
                  note="This form would record vital signs for the patient, with the current timestamp and your staff reference. Nothing is saved in this preview."
                />
                <UnavailableAction
                  label="Add nursing note"
                  variant="secondary"
                  icon={
                    <ClipboardListIcon
                      className="size-4"
                      aria-hidden="true"
                    />
                  }
                  description={`Add a nursing note to the record for ${selected.patient_name}.`}
                  note="This form would record a nursing note for the patient, with the current timestamp and your staff reference. Nothing is saved in this preview."
                />
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,200px)]">
            <section className="min-w-0">
              <div className="flex items-center gap-2">
                <HeartPulseIcon
                  className="size-4 text-hospital-text-muted"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold text-hospital-text">
                  Latest vital signs
                </h3>
              </div>

              {latestVitals ? (
                <>
                  <p className="mt-1 text-[11px] text-hospital-text-muted">
                    Recorded {formatDateTime(latestVitals.recorded_at)}
                    {latestRecorder
                      ? ` by ${latestRecorder}`
                      : ` by staff reference ${latestVitals.recorded_by}`}
                  </p>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                    {buildVitalMetrics(latestVitals).map((metric) => (
                      <div key={metric.label} className="min-w-0">
                        <dt className="text-[11px] font-medium text-hospital-text-muted">
                          {metric.label}
                        </dt>
                        <dd className="mt-0.5 text-hospital-text">
                          <span className="text-sm font-semibold">
                            {metric.value}
                          </span>{" "}
                          <span className="text-[11px] text-hospital-text-muted">
                            {metric.unit}
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-800">
                    <DangerTriangleIcon
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      Verification status is not recorded in this assignment
                      view. Treat these observations as unverified until
                      reviewed by authorized staff.
                    </span>
                  </p>
                </>
              ) : (
                <EmptyState
                  icon={
                    <HeartPulseIcon className="size-5" aria-hidden="true" />
                  }
                  title="No vital signs recorded"
                  description="Record a set of observations for this patient."
                  className="py-6"
                />
              )}
            </section>

            <section className="min-w-0 rounded-md border border-hospital-border p-4">
              <p className="text-[11px] font-medium text-hospital-text-muted">
                Pending assessments
              </p>
              <p className="mt-1 text-xl font-semibold leading-tight text-hospital-text">
                {selected.pending_assessments}
              </p>
              <p className="mt-1 text-[11px] text-hospital-text-muted">
                {selected.pending_assessments === 0
                  ? "No assessments are awaiting completion."
                  : "Awaiting completion by the assigned nurse."}
              </p>

              <div className="mt-4 border-t border-hospital-border-subtle pt-3">
                <p className="text-[11px] font-medium text-hospital-text-muted">
                  Active nursing tasks
                </p>
                <p className="mt-1 text-sm font-semibold text-hospital-text">
                  {selected.active_tasks}
                </p>
                <p className="mt-1 text-[11px] text-hospital-text-muted">
                  Tasks currently assigned for this patient.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

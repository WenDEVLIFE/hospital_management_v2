import Link from "next/link";
import { AltArrowLeftIcon, UserRoundedIcon } from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { PatientProfileTabs } from "@/components/patients/patient-profile-tabs";
import { PatientRecordActions } from "@/components/patients/patient-record-actions";
import {
  formatPatientAddress,
  getPatientAge,
} from "@/components/patients/patient-utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPatient, getPatientSummary } from "@/lib/data/patients";
import { formatDate, formatIdentifier, formatName } from "@/lib/format";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-hospital-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-sm text-hospital-text">{value}</dd>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/patients"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-hospital-text-muted transition-colors hover:text-hospital-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
    >
      <AltArrowLeftIcon className="size-4" aria-hidden="true" />
      Back to patients
    </Link>
  );
}

export default async function PatientRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patientResult, summaryResult] = await Promise.all([
    getPatient(id),
    getPatientSummary(id),
  ]);

  if (patientResult.error) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Patient record"
          description="Patient demographics, medical history, and hospital activity."
          breadcrumbs={<BackLink />}
        />
        <ErrorState error={patientResult.error} />
      </div>
    );
  }

  if (!patientResult.data) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Patient record"
          description="Patient demographics, medical history, and hospital activity."
          breadcrumbs={<BackLink />}
        />
        <PageSection>
          <EmptyState
            icon={<UserRoundedIcon className="size-5" aria-hidden="true" />}
            title="Patient not found"
            description="The patient record you requested does not exist or is no longer available."
            action={
              <Link href="/patients">
                <Button>Back to patients</Button>
              </Link>
            }
          />
        </PageSection>
      </div>
    );
  }

  const patient = patientResult.data;
  const age = getPatientAge(patient.date_of_birth);
  const address = formatPatientAddress(patient);

  return (
    <div className="space-y-4">
      <PageHeader
        title={formatName(patient)}
        description="Patient demographics, medical history, and hospital activity."
        breadcrumbs={<BackLink />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={patient.registration_status} />
            <PatientRecordActions />
          </div>
        }
      />

      <PageSection>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-hospital-text-muted">
              Medical Record Number
            </p>
            <p className="mt-0.5 break-all font-mono text-lg font-semibold text-hospital-green-dark">
              {formatIdentifier(patient.medical_record_number)}
            </p>
          </div>
          <p className="text-xs text-hospital-text-muted">
            Registered {formatDate(patient.registration_date)}
          </p>
        </div>

        <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-hospital-border-subtle pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Sex" value={patient.sex ?? "\u2014"} />
          <Fact
            label="Date of Birth"
            value={
              patient.date_of_birth
                ? `${formatDate(patient.date_of_birth)}${
                    age !== null ? ` (${age} years old)` : ""
                  }`
                : "\u2014"
            }
          />
          <Fact
            label="Contact Number"
            value={patient.contact_number ?? "\u2014"}
          />
          <Fact label="Address" value={address || "\u2014"} />
        </dl>
      </PageSection>

      {summaryResult.error ? (
        <ErrorState
          error={summaryResult.error}
          title="We could not load this patient history"
        />
      ) : summaryResult.data ? (
        <PatientProfileTabs patient={patient} summary={summaryResult.data} />
      ) : (
        <PageSection>
          <EmptyState
            icon={<UserRoundedIcon className="size-5" aria-hidden="true" />}
            title="No patient history available"
            description="This patient has no history records available in this view."
            action={
              <Link href="/patients">
                <Button>Back to patients</Button>
              </Link>
            }
          />
        </PageSection>
      )}
    </div>
  );
}

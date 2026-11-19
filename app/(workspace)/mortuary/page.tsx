import { connection } from "next/server";
import {
  ArchiveIcon,
  Buildings2Icon,
  CheckCircleIcon,
  ClipboardListIcon,
  DangerCircleIcon,
  UserRoundedIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { MortuaryView } from "@/components/mortuary/mortuary-view";
import { MortuaryWorkflowStrip } from "@/components/mortuary/mortuary-workflow-strip";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import {
  MortuaryAdmissionAction,
  ReleaseMortuaryAction,
} from "@/components/mortuary/mortuary-actions";
import { Alert } from "@/components/ui/alert";
import {
  getMortuaryRecordDetails,
  getMortuaryStats,
  listMortuaryRecords,
  listMortuaryReleases,
  listMortuaryStorageUnits,
} from "@/lib/data/mortuary";
import { listPatients } from "@/lib/data/patients";

export const metadata = {
  title: "Mortuary",
};

export default async function MortuaryPage() {
  await connection();

  const [
    statsResult,
    recordsResult,
    detailsResult,
    releasesResult,
    storageResult,
    patientResult,
  ] = await Promise.all([
    getMortuaryStats(),
    listMortuaryRecords({ pageSize: 200 }),
    getMortuaryRecordDetails(),
    listMortuaryReleases({ pageSize: 200 }),
    listMortuaryStorageUnits(),
    listPatients({ pageSize: 300 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mortuary"
        description="Deceased patient records, identification, storage, and authorized release."
        actions={
          <>
            <MortuaryAdmissionAction
              patients={(patientResult.data?.rows ?? []).map((patient) => ({
                id: patient.id,
                full_name: patient.full_name,
                medical_record_number: patient.medical_record_number,
              }))}
            />
            <ReleaseMortuaryAction
              cases={(recordsResult.data?.rows ?? [])
                .filter((row) => row.status !== "released")
                .map((row) => ({
                  id: row.id,
                  case_number: row.case_number,
                  patient_name: row.patient_name,
                  identification_status: row.identification_status,
                }))}
            />
          </>
        }
      />

      <Alert variant="warning" title="Restricted records">
        Mortuary records are restricted and all access is audited. Release
        actions require authorization and valid documentation. This interface
        does not replace legal or hospital release procedures.
      </Alert>

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Bodies in custody"
              value={statsResult.data.bodiesInCustody}
              hint="Active mortuary records"
              icon={<ArchiveIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Admitted today"
              value={statsResult.data.admittedToday}
              hint="New mortuary admissions"
              icon={<UserRoundedIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Released today"
              value={statsResult.data.releasedToday}
              hint="Completed releases"
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Pending release"
              value={statsResult.data.pendingRelease}
              hint="Authorization in progress"
              tone="warning"
              icon={<ClipboardListIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Storage occupied"
              value={`${statsResult.data.storageOccupied}/${statsResult.data.storageTotal}`}
              hint="Units in use"
              icon={<Buildings2Icon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Unidentified"
              value={statsResult.data.unidentified}
              hint="Identification pending or discrepancy"
              tone="danger"
              icon={<DangerCircleIcon className="size-4" aria-hidden="true" />}
            />
          </div>

          <MortuaryWorkflowStrip stats={statsResult.data} />
        </>
      )}

      {recordsResult.error ? (
        <ErrorState error={recordsResult.error} />
      ) : (
        <MortuaryView
          records={recordsResult.data.rows}
          recordDetails={detailsResult.error ? {} : detailsResult.data}
          releases={releasesResult.error ? [] : releasesResult.data.rows}
          storageUnits={storageResult.error ? [] : storageResult.data}
        />
      )}
    </div>
  );
}

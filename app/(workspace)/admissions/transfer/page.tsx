import { connection } from "next/server";
import Link from "next/link";
import { AltArrowLeftIcon } from "@solar-icons/react/linear";

import { TransferForm } from "@/components/admissions/transfer-form";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { getBedBoard, listAdmissions } from "@/lib/data/admissions";

export const metadata = {
  title: "Transfer Patient",
};

export default async function TransferPatientPage() {
  await connection();

  const [admissionsResult, boardResult] = await Promise.all([
    listAdmissions({ status: "admitted", pageSize: 200 }),
    getBedBoard(),
  ]);

  const error = admissionsResult.error ?? boardResult.error;

  const admissions = (admissionsResult.data?.rows ?? []).map(
    (admission) => ({
      id: admission.id,
      admission_number: admission.admission_number,
      patient_name: admission.patient_name,
      patient_mrn: admission.patient_mrn,
      room_number: admission.room_number,
      bed_number: admission.bed_number,
      department_id: admission.department_id,
      department_name: admission.department_name,
    })
  );

  const beds = (boardResult.data ?? [])
    .filter((bed) => bed.status === "available")
    .map((bed) => ({
      id: bed.bed_id,
      department_id: bed.department_id,
      label: `${bed.department_name} · Room ${bed.room_number} · Bed ${bed.bed_number}`,
      room_number: bed.room_number,
      bed_number: bed.bed_number,
    }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transfer Patient"
        description="Move an admitted patient to another available bed."
        breadcrumbs={
          <Link
            href="/admissions"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-hospital-text-muted transition-colors hover:text-hospital-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
          >
            <AltArrowLeftIcon className="size-4" aria-hidden="true" />
            Back to admissions
          </Link>
        }
      />

      {error ? (
        <ErrorState error={error} />
      ) : (
        <TransferForm admissions={admissions} beds={beds} />
      )}
    </div>
  );
}

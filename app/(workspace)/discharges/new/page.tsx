import { connection } from "next/server";
import Link from "next/link";
import { AltArrowLeftIcon } from "@solar-icons/react/linear";

import { DischargeForm } from "@/components/admissions/discharge-form";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { listAdmissions } from "@/lib/data/admissions";

export const metadata = {
  title: "Discharge Patient",
};

export default async function NewDischargePage() {
  await connection();

  const admissionsResult = await listAdmissions({
    status: "admitted",
    pageSize: 200,
  });

  const admissions = (admissionsResult.data?.rows ?? []).map(
    (admission) => ({
      id: admission.id,
      admission_number: admission.admission_number,
      patient_name: admission.patient_name,
      patient_mrn: admission.patient_mrn,
      room_number: admission.room_number,
      bed_number: admission.bed_number,
      department_name: admission.department_name,
    })
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Discharge Patient"
        description="Complete an inpatient admission and release the assigned bed."
        breadcrumbs={
          <Link
            href="/discharges"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-hospital-text-muted transition-colors hover:text-hospital-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
          >
            <AltArrowLeftIcon className="size-4" aria-hidden="true" />
            Back to discharges
          </Link>
        }
      />

      {admissionsResult.error ? (
        <ErrorState error={admissionsResult.error} />
      ) : (
        <DischargeForm admissions={admissions} />
      )}
    </div>
  );
}

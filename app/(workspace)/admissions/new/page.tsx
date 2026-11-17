import { connection } from "next/server";
import Link from "next/link";
import { AltArrowLeftIcon } from "@solar-icons/react/linear";

import { AdmissionForm } from "@/components/admissions/admission-form";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { getBedBoard } from "@/lib/data/admissions";
import { listDepartments } from "@/lib/data/departments";
import { listPatients } from "@/lib/data/patients";
import { listPhysicians } from "@/lib/data/staff";

export const metadata = {
  title: "Admit Patient",
};

export default async function NewAdmissionPage() {
  await connection();

  const [patientsResult, departmentsResult, physiciansResult, boardResult] =
    await Promise.all([
      listPatients({ pageSize: 500, status: "active" }),
      listDepartments({ pageSize: 100, isActive: true }),
      listPhysicians(),
      getBedBoard(),
    ]);

  const error =
    patientsResult.error ??
    departmentsResult.error ??
    physiciansResult.error ??
    boardResult.error;

  const patients = (patientsResult.data?.rows ?? [])
    .map((patient) => ({
      id: patient.id,
      full_name: patient.full_name,
      medical_record_number: patient.medical_record_number,
    }))
    .sort((left, right) => left.full_name.localeCompare(right.full_name));

  const departments = (departmentsResult.data?.rows ?? [])
    .filter((department) => department.is_active)
    .map((department) => ({ id: department.id, name: department.name }));

  const beds = (boardResult.data ?? [])
    .filter((bed) => bed.status === "available")
    .map((bed) => ({
      id: bed.bed_id,
      department_id: bed.department_id,
      label: `${bed.department_name} · Room ${bed.room_number} · Bed ${bed.bed_number}`,
    }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admit Patient"
        description="Create an inpatient admission and assign an available bed."
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
        <AdmissionForm
          patients={patients}
          departments={departments}
          physicians={physiciansResult.data ?? []}
          beds={beds}
        />
      )}
    </div>
  );
}

import { connection } from "next/server";
import Link from "next/link";
import { AltArrowLeftIcon } from "@solar-icons/react/linear";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { listDepartments } from "@/lib/data/departments";
import { listPatients } from "@/lib/data/patients";
import { listPhysicians } from "@/lib/data/staff";

export const metadata = {
  title: "Schedule Appointment",
};

export default async function NewAppointmentPage() {
  await connection();

  const [patientsResult, departmentsResult, physiciansResult] =
    await Promise.all([
      listPatients({ pageSize: 500, status: "active" }),
      listDepartments({ pageSize: 100, isActive: true }),
      listPhysicians(),
    ]);

  const error =
    patientsResult.error ?? departmentsResult.error ?? physiciansResult.error;

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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Schedule Appointment"
        description="Create an outpatient consultation appointment for a patient."
        breadcrumbs={
          <Link
            href="/appointments"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-hospital-text-muted transition-colors hover:text-hospital-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
          >
            <AltArrowLeftIcon className="size-4" aria-hidden="true" />
            Back to appointments
          </Link>
        }
      />

      {error ? (
        <ErrorState error={error} />
      ) : (
        <AppointmentForm
          patients={patients}
          departments={departments}
          physicians={physiciansResult.data ?? []}
        />
      )}
    </div>
  );
}

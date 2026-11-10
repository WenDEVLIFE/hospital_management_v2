import Link from "next/link";
import { AltArrowLeftIcon } from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PatientRegistrationForm } from "@/components/patients/patient-registration-form";

export default function NewPatientPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Register Patient"
        description="Capture demographic, contact, and emergency information for a new patient."
        breadcrumbs={
          <Link
            href="/patients"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-hospital-text-muted transition-colors hover:text-hospital-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
          >
            <AltArrowLeftIcon className="size-4" aria-hidden="true" />
            Back to patients
          </Link>
        }
      />

      <PatientRegistrationForm />
    </div>
  );
}

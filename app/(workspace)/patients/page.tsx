import Link from "next/link";
import {
  ArchiveIcon,
  CheckCircleIcon,
  MinusCircleIcon,
  UserRoundedIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { PatientTable } from "@/components/patients/patient-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { listPatients } from "@/lib/data/patients";

export default async function PatientsPage() {
  const [listResult, totalResult, activeResult, inactiveResult, archivedResult] =
    await Promise.all([
      listPatients({ pageSize: 100 }),
      listPatients({ pageSize: 1 }),
      listPatients({ status: "active", pageSize: 1 }),
      listPatients({ status: "inactive", pageSize: 1 }),
      listPatients({ status: "archived", pageSize: 1 }),
    ]);

  const counts =
    totalResult.data &&
    activeResult.data &&
    inactiveResult.data &&
    archivedResult.data
      ? {
          total: totalResult.data.total,
          active: activeResult.data.total,
          inactive: inactiveResult.data.total,
          archived: archivedResult.data.total,
        }
      : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Patients"
        description="Manage patient registrations and hospital records."
        actions={
          <Link href="/patients/new">
            <Button>Register Patient</Button>
          </Link>
        }
      />

      {listResult.error ? <ErrorState error={listResult.error} /> : null}

      {counts ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Patients"
            value={counts.total}
            icon={<UserRoundedIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Active"
            value={counts.active}
            tone="success"
            icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Inactive"
            value={counts.inactive}
            tone="warning"
            icon={<MinusCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Archived"
            value={counts.archived}
            icon={<ArchiveIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      ) : null}

      {!listResult.error && !listResult.data ? (
        <PageSection>
          <EmptyState
            icon={<UserRoundedIcon className="size-5" aria-hidden="true" />}
            title="No patients found"
            description="There are currently no patient records matching your search."
            action={
              <Link href="/patients/new">
                <Button>Register Patient</Button>
              </Link>
            }
            className="border-0 bg-transparent"
          />
        </PageSection>
      ) : null}

      {listResult.data ? <PatientTable rows={listResult.data.rows} /> : null}
    </div>
  );
}

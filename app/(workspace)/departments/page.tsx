import {
  Buildings2Icon,
  CheckCircleIcon,
  MinusCircleIcon,
} from "@solar-icons/react/linear";

import { DepartmentAddAction } from "@/components/departments/department-add-action";
import { DepartmentsTable } from "@/components/departments/departments-table";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { getDepartmentStats, listDepartments } from "@/lib/data/departments";

export default async function DepartmentsPage() {
  const [listResult, statsResult] = await Promise.all([
    listDepartments({ pageSize: 100 }),
    getDepartmentStats(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Hospital departments and service units."
        actions={<DepartmentAddAction />}
      />

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total departments"
            value={statsResult.data.total}
            icon={<Buildings2Icon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Active"
            value={statsResult.data.active}
            tone="success"
            icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Inactive"
            value={statsResult.data.inactive}
            icon={<MinusCircleIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      )}

      <PageSection
        title="Department directory"
        description="Departments across hospital services, including their codes and status."
      >
        {listResult.error ? (
          <ErrorState error={listResult.error} />
        ) : (
          <DepartmentsTable rows={listResult.data.rows} />
        )}
      </PageSection>
    </div>
  );
}

import {
  StethoscopeIcon,
  UserCheckIcon,
  UserCrossIcon,
  UsersGroupRoundedIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { StaffAddAction } from "@/components/staff/staff-add-action";
import { StaffTable } from "@/components/staff/staff-table";
import { getStaffStats, listStaff } from "@/lib/data/staff";

export default async function StaffPage() {
  const [listResult, statsResult] = await Promise.all([
    listStaff({ pageSize: 100 }),
    getStaffStats(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Doctors & Staff"
        description="Staff accounts, roles and department assignments."
        actions={<StaffAddAction />}
      />

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total staff"
            value={statsResult.data.total}
            icon={<UsersGroupRoundedIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Active"
            value={statsResult.data.active}
            tone="success"
            icon={<UserCheckIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Inactive"
            value={statsResult.data.inactive}
            tone="warning"
            icon={<UserCrossIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Physicians"
            value={statsResult.data.physicians}
            tone="info"
            icon={<StethoscopeIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      )}

      <PageSection
        title="Staff directory"
        description="Staff accounts and department assignments. Open a record to review personal, professional and account details."
      >
        {listResult.error ? (
          <ErrorState error={listResult.error} />
        ) : listResult.data ? (
          <StaffTable rows={listResult.data.rows} />
        ) : null}
      </PageSection>
    </div>
  );
}

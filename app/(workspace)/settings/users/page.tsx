import {
  CheckCircleIcon,
  MinusCircleIcon,
  ShieldCheckIcon,
  UsersGroupTwoRoundedIcon,
  UserPlusRoundedIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { UnavailableAction } from "@/components/module/unavailable-action";
import { RolesPanel } from "@/components/settings/roles-panel";
import { UsersTable } from "@/components/settings/users-table";
import { getUserStats, listRoles, listUsers } from "@/lib/data/users";

export const metadata = {
  title: "User Management",
};

export default async function UserManagementPage() {
  const [listResult, rolesResult, statsResult] = await Promise.all([
    listUsers({ pageSize: 200 }),
    listRoles(),
    getUserStats(),
  ]);

  const rows = listResult.data?.rows ?? [];
  const roles = rolesResult.data ?? [];

  const departments = Array.from(
    new Set(
      rows
        .map((row) => row.department_name)
        .filter((name): name is string => Boolean(name))
    )
  ).sort((a, b) => a.localeCompare(b));

  const administrators =
    statsResult.data?.byRole
      .filter((entry) => entry.role.toLowerCase().includes("administrator"))
      .reduce((total, entry) => total + entry.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Staff accounts, roles and access."
        actions={
          <UnavailableAction
            label="Invite User"
            description="Create a staff account and assign its initial role and department."
            note="This workflow writes to hospital administration records. It will be enabled once the hospital database connection is available. Nothing is saved in this preview."
            icon={<UserPlusRoundedIcon className="size-4" aria-hidden="true" />}
          />
        }
      />

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total users"
            value={statsResult.data.total}
            icon={
              <UsersGroupTwoRoundedIcon
                className="size-4"
                aria-hidden="true"
              />
            }
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
            tone="warning"
            icon={<MinusCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Administrators"
            value={administrators}
            hint="Accounts with administrator roles."
            icon={<ShieldCheckIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      )}

      <PageSection
        title="Staff accounts"
        description="Accounts provisioned for hospital personnel."
      >
        {listResult.error ? (
          <ErrorState error={listResult.error} />
        ) : (
          <UsersTable rows={rows} roles={roles} departments={departments} />
        )}
      </PageSection>

      <PageSection
        title="Roles"
        description="Roles available for staff account assignment."
      >
        {rolesResult.error ? (
          <ErrorState error={rolesResult.error} />
        ) : (
          <RolesPanel roles={roles} />
        )}
      </PageSection>
    </div>
  );
}

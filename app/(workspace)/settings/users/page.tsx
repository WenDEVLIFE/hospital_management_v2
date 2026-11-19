import {
  CheckCircleIcon,
  MinusCircleIcon,
  ShieldCheckIcon,
  UsersGroupTwoRoundedIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { RolesPanel } from "@/components/settings/roles-panel";
import { UsersTable } from "@/components/settings/users-table";
import { StaffAddAction } from "@/components/staff/staff-add-action";
import { listDepartments } from "@/lib/data/departments";
import { getUserStats, listRoles, listUsers } from "@/lib/data/users";

export const metadata = {
  title: "User Management",
};

export default async function UserManagementPage() {
  const [listResult, rolesResult, statsResult, departmentResult] =
    await Promise.all([
      listUsers({ pageSize: 200 }),
      listRoles(),
      getUserStats(),
      listDepartments({ pageSize: 200, isActive: true }),
    ]);

  const rows = listResult.data?.rows ?? [];
  const roles = rolesResult.data ?? [];
  const departmentOptions = (departmentResult.data?.rows ?? []).map(
    (department) => ({ id: department.id, name: department.name })
  );

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
          <StaffAddAction
            label="Invite User"
            title="Invite user"
            description="Create a staff account and assign its initial role and department."
            variant="primary"
            departments={departmentOptions}
            roles={roles.map((role) => ({ id: role.id, name: role.name }))}
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
          <UsersTable
            rows={rows}
            roles={roles}
            departments={departmentOptions}
          />
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

"use client";

import * as React from "react";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/linear";

import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { UNAVAILABLE_MESSAGE } from "@/components/module/unavailable-action";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/format";
import type { Role, UserListRow } from "@/types/hospital";

export interface UsersTableProps {
  rows: UserListRow[];
  roles: Role[];
  departments: string[];
}

export function UsersTable({ rows, roles, departments }: UsersTableProps) {
  const [selected, setSelected] = React.useState<UserListRow | null>(null);

  const columns: Column<UserListRow>[] = [
    {
      key: "user",
      header: "User",
      cell: (row) => (
        <div className="min-w-0 max-w-[240px]">
          <p className="break-words font-medium text-hospital-text">
            {row.full_name}
          </p>
          <p className="mt-0.5 break-words text-[11px] text-hospital-text-muted">
            {row.email}
          </p>
        </div>
      ),
      sortable: true,
      sortValue: (row) => row.full_name,
    },
    {
      key: "email",
      header: "Email",
      cell: (row) => (
        <span className="break-words text-hospital-text-muted">
          {row.email}
        </span>
      ),
      sortable: true,
      sortValue: (row) => row.email,
    },
    {
      key: "roles",
      header: "Assigned Role(s)",
      cell: (row) =>
        row.role_names.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.role_names.map((name) => (
              <Badge key={name} variant="info">
                {name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-hospital-text-muted">—</span>
        ),
    },
    {
      key: "department",
      header: "Department",
      cell: (row) => (
        <span className="text-hospital-text-muted">
          {row.department_name ?? "—"}
        </span>
      ),
      sortable: true,
      sortValue: (row) => row.department_name ?? "",
    },
    {
      key: "status",
      header: "Account Status",
      cell: (row) => (
        <StatusBadge status={row.is_active ? "active" : "inactive"} />
      ),
      sortable: true,
      sortValue: (row) => (row.is_active ? "Active" : "Inactive"),
    },
    {
      key: "last_activity",
      header: "Last Activity",
      cell: (row) => (
        <span className="whitespace-nowrap text-hospital-text-muted">
          {row.last_activity ? formatDateTime(row.last_activity) : "—"}
        </span>
      ),
      sortable: true,
      sortValue: (row) => row.last_activity ?? "",
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelected(row)}
          aria-label={`Manage ${row.full_name}`}
          className="cursor-pointer"
        >
          Manage
        </Button>
      ),
    },
  ];

  const filters: FilterConfig<UserListRow>[] = [
    {
      key: "role",
      label: "Role",
      allLabel: "All roles",
      options: roles.map((role) => ({ label: role.name, value: role.slug })),
      accessor: (row) => row.role_slugs[0] ?? "",
    },
    {
      key: "status",
      label: "Account status",
      allLabel: "All statuses",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
      accessor: (row) => (row.is_active ? "active" : "inactive"),
    },
  ];

  return (
    <>
      <RecordTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        caption="Staff user accounts"
        searchPlaceholder="Search by name or email"
        searchAccessor={(row) => `${row.full_name} ${row.email}`}
        filters={filters}
        emptyTitle="No user accounts found"
        emptyDescription="Accounts provisioned by hospital administration will appear here."
        emptyIcon={
          <UsersGroupTwoRoundedIcon className="size-5" aria-hidden="true" />
        }
      />

      {selected ? (
        <ManageUserDialog
          key={selected.id}
          user={selected}
          roles={roles}
          departments={departments}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

interface ManageUserDialogProps {
  user: UserListRow;
  roles: Role[];
  departments: string[];
  onClose: () => void;
}

function ManageUserDialog({
  user,
  roles,
  departments,
  onClose,
}: ManageUserDialogProps) {
  const [roleSlug, setRoleSlug] = React.useState(user.role_slugs[0] ?? "");
  const [department, setDepartment] = React.useState(
    user.department_name ?? ""
  );
  const [status, setStatus] = React.useState(
    user.is_active ? "active" : "inactive"
  );
  const [confirmed, setConfirmed] = React.useState(false);

  const departmentOptions = [
    { label: "Unassigned", value: "" },
    ...departments.map((name) => ({ label: name, value: name })),
  ];

  const roleOptions =
    roles.length > 0
      ? roles.map((role) => ({ label: role.name, value: role.slug }))
      : user.role_slugs.map((slug, index) => ({
          label: user.role_names[index] ?? slug,
          value: slug,
        }));

  return (
    <Modal
      open
      onClose={onClose}
      title="Manage user"
      description={`${user.full_name} · ${user.email}`}
      size="md"
      footer={
        confirmed ? (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => setConfirmed(true)}>Confirm changes</Button>
          </>
        )
      }
    >
      {confirmed ? (
        <Alert variant="info">
          {UNAVAILABLE_MESSAGE}
        </Alert>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              id="manage-user-role"
              label="Assigned role"
              value={roleSlug}
              onChange={(event) => setRoleSlug(event.target.value)}
              options={roleOptions}
            />

            <Select
              id="manage-user-department"
              label="Department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              options={departmentOptions}
            />

            <Select
              id="manage-user-status"
              label="Account status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          </div>

          <Alert variant="warning">
            Role changes and account deactivation require confirmation and are
            audited.
          </Alert>
        </div>
      )}
    </Modal>
  );
}

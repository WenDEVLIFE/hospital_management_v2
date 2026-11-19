"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UsersGroupTwoRoundedIcon } from "@solar-icons/react/linear";

import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { usePermissions } from "@/components/providers/permission-provider";
import {
  deleteUserAccountAction,
  updateManagedUserAction,
} from "@/app/(workspace)/settings/users/actions";
import { formatDateTime } from "@/lib/format";
import type { Role, UserListRow } from "@/types/hospital";

export interface UsersTableProps {
  rows: UserListRow[];
  roles: Role[];
  departments: Array<{ id: string; name: string }>;
}

export function UsersTable({ rows, roles, departments }: UsersTableProps) {
  const [selected, setSelected] = React.useState<UserListRow | null>(null);
  const { isAdmin } = usePermissions();

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
      cell: (row) =>
        isAdmin ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(row)}
            aria-label={`Manage ${row.full_name}`}
            className="cursor-pointer"
          >
            Manage
          </Button>
        ) : (
          <span className="text-[11px] text-hospital-text-muted">—</span>
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
  departments: Array<{ id: string; name: string }>;
  onClose: () => void;
}

function ManageUserDialog({
  user,
  roles,
  departments,
  onClose,
}: ManageUserDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [roleIds, setRoleIds] = React.useState<string[]>(user.role_ids);
  const [departmentId, setDepartmentId] = React.useState(
    user.department_id ?? ""
  );
  const [status, setStatus] = React.useState<"active" | "inactive">(
    user.is_active ? "active" : "inactive"
  );
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [deleteAcknowledged, setDeleteAcknowledged] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  function toggleRole(roleId: string, checked: boolean) {
    setRoleIds((current) =>
      checked
        ? [...current, roleId]
        : current.filter((id) => id !== roleId)
    );
  }

  async function handleSave() {
    if (saving) {
      return;
    }

    setFormError(null);
    setSaving(true);

    try {
      const result = await updateManagedUserAction({
        userId: user.id,
        roleIds,
        departmentId,
        active: status === "active",
      });

      if (!result.ok) {
        setFormError(result.formError);
        router.refresh();
        return;
      }

      toast({
        title: "Account updated",
        description: `${user.full_name} saved.`,
        variant: "success",
      });
      onClose();
      router.refresh();
    } catch {
      setFormError("We could not save the account. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting || !deleteAcknowledged) {
      return;
    }

    setFormError(null);
    setDeleting(true);

    try {
      const result = await deleteUserAccountAction(user.id);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Account deleted",
        description: `${user.full_name} and the auth identity were removed.`,
        variant: "success",
      });
      onClose();
      router.refresh();
    } catch {
      setFormError("We could not delete the account. Try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      open
      onClose={deleting ? () => undefined : onClose}
      title="Manage user"
      description={`${user.full_name} · ${user.email}`}
      size="md"
      footer={
        confirmingDelete ? (
          <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
            Back
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save changes
            </Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        {formError ? (
          <Alert variant="danger" title="Change not saved">
            {formError}
          </Alert>
        ) : null}

        {confirmingDelete ? (
          <div className="space-y-4">
            <Alert variant="danger" title="Delete this account permanently?">
              This removes the Auth identity, profile, staff record, role
              assignments and in-app notifications. It cannot be undone. Accounts
              that created or approved hospital records are protected and must be
              deactivated instead.
            </Alert>

            <label className="flex items-start gap-2 text-sm text-hospital-text">
              <Checkbox
                checked={deleteAcknowledged}
                onChange={(event) =>
                  setDeleteAcknowledged(event.target.checked)
                }
              />
              I understand this permanently deletes {user.email}.
            </label>

            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={deleting}
              disabled={!deleteAcknowledged}
            >
              Delete account permanently
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-xs font-medium text-hospital-text-muted">
                Roles
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 rounded-md border border-hospital-border-subtle bg-hospital-surface px-3 py-2 text-sm text-hospital-text"
                  >
                    <Checkbox
                      checked={roleIds.includes(role.id)}
                      onChange={(event) =>
                        toggleRole(role.id, event.target.checked)
                      }
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            </div>

            <Select
              id="manage-user-department"
              label="Department"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              options={[
                { label: "Unassigned", value: "" },
                ...departments.map((department) => ({
                  label: department.name,
                  value: department.id,
                })),
              ]}
              disabled={!user.staff_id}
            />

            {!user.staff_id ? (
              <p className="text-[11px] text-hospital-text-muted">
                This account has no staff record, so a department cannot be
                assigned here. Create the staff record from Doctors &amp; Staff.
              </p>
            ) : null}

            <Select
              id="manage-user-status"
              label="Account status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "active" | "inactive")
              }
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />

            <Alert variant="warning">
              Deactivating blocks sign-in immediately. Role and status changes
              are audited.
            </Alert>

            <div className="rounded-md border border-hospital-border-subtle p-3">
              <p className="text-xs font-medium text-hospital-text">
                Delete this account
              </p>
              <p className="mt-1 text-[11px] text-hospital-text-muted">
                Permanently removes the account and its auth identity. Prefer
                deactivation when the account has hospital records.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-2"
                onClick={() => setConfirmingDelete(true)}
              >
                Delete account
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

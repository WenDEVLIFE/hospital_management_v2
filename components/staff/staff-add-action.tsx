"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AddCircleIcon } from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { usePermissions } from "@/components/providers/permission-provider";
import { createStaffAction } from "@/app/(workspace)/staff/actions";
import { EMPLOYMENT_TYPES } from "@/lib/employment";

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  staffNumber: "",
  firstName: "",
  middleName: "",
  lastName: "",
  departmentId: "",
  employmentType: "",
  licenseNumber: "",
  roleId: "",
};

export function StaffAddAction({
  departments,
  roles,
  label = "Add Staff",
  title = "Add staff",
  description = "Create the sign-in account, employment record and first role.",
  variant = "secondary",
}: {
  departments: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; name: string }>;
  label?: string;
  title?: string;
  description?: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin } = usePermissions();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState(emptyForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!isAdmin) {
    return null;
  }

  function set<K extends keyof typeof emptyForm>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function close() {
    if (submitting) {
      return;
    }

    setFormError(null);
    setOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const result = await createStaffAction(values);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Staff account created",
        description: `${values.fullName.trim()} can sign in and appears in the staff directory.`,
        variant: "success",
      });
      setValues(emptyForm);
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not create the staff account. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <AddCircleIcon className="size-4" aria-hidden="true" />
        {label}
      </Button>

      <Modal
        open={open}
        onClose={close}
        title={title}
        description={description}
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="staff-create-form" loading={submitting}>
              Create account
            </Button>
          </>
        }
      >
        <form
          id="staff-create-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to create the account">
              {formError}
            </Alert>
          ) : null}

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-hospital-text-muted">
              Sign-in account
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" htmlFor="staff_full_name" required>
                <Input
                  id="staff_full_name"
                  value={values.fullName}
                  onChange={(event) => set("fullName", event.target.value)}
                />
              </FormField>

              <FormField label="Email" htmlFor="staff_email" required>
                <Input
                  id="staff_email"
                  type="email"
                  autoComplete="off"
                  value={values.email}
                  onChange={(event) => set("email", event.target.value)}
                />
              </FormField>

              <FormField
                label="Temporary password"
                htmlFor="staff_password"
                hint="At least 12 characters."
                required
              >
                <Input
                  id="staff_password"
                  type="password"
                  autoComplete="new-password"
                  value={values.password}
                  onChange={(event) => set("password", event.target.value)}
                />
              </FormField>

              <FormField
                label="Confirm password"
                htmlFor="staff_confirm"
                required
              >
                <Input
                  id="staff_confirm"
                  type="password"
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={(event) => set("confirmPassword", event.target.value)}
                />
              </FormField>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-hospital-text-muted">
              Employment record
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Staff number" htmlFor="staff_number" required>
                <Input
                  id="staff_number"
                  value={values.staffNumber}
                  onChange={(event) => set("staffNumber", event.target.value)}
                />
              </FormField>

              <FormField label="First name" htmlFor="staff_first" required>
                <Input
                  id="staff_first"
                  value={values.firstName}
                  onChange={(event) => set("firstName", event.target.value)}
                />
              </FormField>

              <FormField label="Middle name" htmlFor="staff_middle">
                <Input
                  id="staff_middle"
                  value={values.middleName}
                  onChange={(event) => set("middleName", event.target.value)}
                />
              </FormField>

              <FormField label="Last name" htmlFor="staff_last" required>
                <Input
                  id="staff_last"
                  value={values.lastName}
                  onChange={(event) => set("lastName", event.target.value)}
                />
              </FormField>

              <FormField label="Department" htmlFor="staff_department">
                <Select
                  id="staff_department"
                  value={values.departmentId}
                  onChange={(event) => set("departmentId", event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Employment type" htmlFor="staff_employment">
                <Select
                  id="staff_employment"
                  value={values.employmentType}
                  onChange={(event) => set("employmentType", event.target.value)}
                >
                  <option value="">Select employment type</option>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Professional license"
                htmlFor="staff_license"
                hint="Optional."
              >
                <Input
                  id="staff_license"
                  value={values.licenseNumber}
                  onChange={(event) => set("licenseNumber", event.target.value)}
                />
              </FormField>

              <FormField label="First role" htmlFor="staff_role">
                <Select
                  id="staff_role"
                  value={values.roleId}
                  onChange={(event) => set("roleId", event.target.value)}
                >
                  <option value="">No role yet</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          </fieldset>

          <Alert variant="info" title="What happens on save">
            The sign-in account is created with a confirmed email. If the staff
            record or role cannot be saved, the account is created and then
            deactivated so it cannot be used.
          </Alert>
        </form>
      </Modal>
    </>
  );
}

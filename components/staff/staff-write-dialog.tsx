"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  setStaffActiveAction,
  updateStaffAction,
} from "@/app/(workspace)/staff/actions";
import { formatName } from "@/lib/format";
import { staffUpdateSchema } from "@/lib/validations/organisation";
import type { StaffListRow } from "@/types/hospital";

export type StaffWriteAction = "edit" | "deactivate";

export interface StaffWriteRequest {
  action: StaffWriteAction;
  staff: StaffListRow;
}

export interface StaffWriteDialogProps {
  request: StaffWriteRequest | null;
  departments: Array<{ id: string; name: string }>;
  onClose: () => void;
}

type FormValues = {
  firstName: string;
  middleName: string;
  lastName: string;
  departmentId: string;
  employmentType: string;
  licenseNumber: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

export function StaffWriteDialog({
  request,
  departments,
  onClose,
}: StaffWriteDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState<FormValues>(() =>
    request
      ? {
          firstName: request.staff.first_name,
          middleName: request.staff.middle_name ?? "",
          lastName: request.staff.last_name,
          departmentId: request.staff.department_id ?? "",
          employmentType: request.staff.employment_type ?? "",
          licenseNumber: request.staff.professional_license_number ?? "",
        }
      : {
          firstName: "",
          middleName: "",
          lastName: "",
          departmentId: "",
          employmentType: "",
          licenseNumber: "",
        }
  );
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!request) {
    return <></>;
  }

  const staff = request.staff;
  const isDeactivate = request.action === "deactivate";
  const staffName = formatName(staff);

  function setField<K extends keyof FormValues>(
    field: K,
    value: FormValues[K]
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setFormError(null);
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];

      return next;
    });
  }

  async function handleDeactivate() {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const result = await setStaffActiveAction({
        staffId: staff.id,
        isActive: false,
      });

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Staff account deactivated",
        description: `${staffName} can no longer sign in. The employment record is preserved.`,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not deactivate the account. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = staffUpdateSchema.safeParse({
      staffId: staff.id,
      ...values,
    });

    if (!parsed.success) {
      const nextErrors: FormErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !nextErrors[field as keyof FormValues]) {
          nextErrors[field as keyof FormValues] = issue.message;
        }
      }

      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await updateStaffAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Staff record updated",
        description: `${values.firstName} ${values.lastName} saved.`,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not update the staff record. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isDeactivate) {
    return (
      <ConfirmationDialog
        open
        onClose={onClose}
        onConfirm={handleDeactivate}
        title="Deactivate staff account"
        description={
          formError ??
          `Deactivate the account for ${staffName}. They will no longer be able to sign in, but their employment record and history are preserved.`
        }
        confirmLabel="Deactivate account"
        variant="danger"
        loading={submitting}
      />
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit staff record"
      description={`${staff.staff_number} · ${staff.email}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="staff-edit-form" loading={submitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="staff-edit-form"
        noValidate
        onSubmit={handleSave}
        className="space-y-4"
      >
        {formError ? (
          <Alert variant="danger" title="Unable to update staff record">
            {formError}
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="First name"
            htmlFor="staff_first_name"
            required
            error={errors.firstName}
          >
            <Input
              id="staff_first_name"
              value={values.firstName}
              invalid={Boolean(errors.firstName)}
              onChange={(event) => setField("firstName", event.target.value)}
            />
          </FormField>

          <FormField
            label="Middle name"
            htmlFor="staff_middle_name"
            error={errors.middleName}
          >
            <Input
              id="staff_middle_name"
              value={values.middleName}
              onChange={(event) => setField("middleName", event.target.value)}
            />
          </FormField>

          <FormField
            label="Last name"
            htmlFor="staff_last_name"
            required
            error={errors.lastName}
          >
            <Input
              id="staff_last_name"
              value={values.lastName}
              invalid={Boolean(errors.lastName)}
              onChange={(event) => setField("lastName", event.target.value)}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Department"
            htmlFor="staff_department"
            hint="Optional."
            error={errors.departmentId}
          >
            <Select
              id="staff_department"
              value={values.departmentId}
              invalid={Boolean(errors.departmentId)}
              onChange={(event) =>
                setField("departmentId", event.target.value)
              }
            >
              <option value="">Unassigned</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            label="Employment type"
            htmlFor="staff_employment_type"
            hint="Optional."
            error={errors.employmentType}
          >
            <Input
              id="staff_employment_type"
              value={values.employmentType}
              onChange={(event) =>
                setField("employmentType", event.target.value)
              }
            />
          </FormField>
        </div>

        <FormField
          label="Professional license number"
          htmlFor="staff_license"
          hint="Optional."
          error={errors.licenseNumber}
        >
          <Input
            id="staff_license"
            value={values.licenseNumber}
            onChange={(event) => setField("licenseNumber", event.target.value)}
          />
        </FormField>

        <Alert variant="info" title="Login credentials are separate">
          Email, password, and roles are managed from User Management. This form
          updates the employment record only.
        </Alert>
      </form>
    </Modal>
  );
}

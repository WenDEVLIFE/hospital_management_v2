"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  UserPlusRoundedIcon,
  WalletMoneyIcon,
} from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useCan } from "@/components/providers/permission-provider";
import {
  createEmployeeAction,
  runPayrollAction,
} from "@/app/(workspace)/hr/actions";

type Option = { id: string; name: string };

const emptyEmployee = {
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
  position: "",
  hireDate: "",
  monthlyRate: "",
  licenseExpiry: "",
  leaveBalance: "0",
};

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const pay = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  const iso = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  return { periodStart: iso(start), periodEnd: iso(end), payDate: iso(pay) };
}

export function AddEmployeeAction({
  departments,
  roles,
}: {
  departments: Option[];
  roles: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState(emptyEmployee);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("hr.manage")) {
    return null;
  }

  function set<K extends keyof typeof emptyEmployee>(key: K, value: string) {
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
      const result = await createEmployeeAction(values);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Employee added",
        description: `${values.fullName.trim()} can sign in and appears in payroll.`,
        variant: "success",
      });
      setValues(emptyEmployee);
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not create the employee. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlusRoundedIcon className="size-4" aria-hidden="true" />
        Add Employee
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Add employee"
        description="Create the sign-in account, staff record, HR details and salary."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="hr-employee-form" loading={submitting}>
              Create employee
            </Button>
          </>
        }
      >
        <form
          id="hr-employee-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to create the employee">
              {formError}
            </Alert>
          ) : null}

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-hospital-text-muted">
              Sign-in account
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Full name" htmlFor="hr_full_name" required>
                <Input
                  id="hr_full_name"
                  value={values.fullName}
                  onChange={(event) => set("fullName", event.target.value)}
                />
              </FormField>
              <FormField label="Email" htmlFor="hr_email" required>
                <Input
                  id="hr_email"
                  type="email"
                  autoComplete="off"
                  value={values.email}
                  onChange={(event) => set("email", event.target.value)}
                />
              </FormField>
              <FormField
                label="Temporary password"
                htmlFor="hr_password"
                hint="At least 12 characters."
                required
              >
                <Input
                  id="hr_password"
                  type="password"
                  autoComplete="new-password"
                  value={values.password}
                  onChange={(event) => set("password", event.target.value)}
                />
              </FormField>
              <FormField label="Confirm password" htmlFor="hr_confirm" required>
                <Input
                  id="hr_confirm"
                  type="password"
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={(event) => set("confirmPassword", event.target.value)}
                />
              </FormField>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-hospital-text-muted">
              Employment
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Employee number" htmlFor="hr_number" required>
                <Input
                  id="hr_number"
                  value={values.staffNumber}
                  onChange={(event) => set("staffNumber", event.target.value)}
                />
              </FormField>
              <FormField label="Position" htmlFor="hr_position" required>
                <Input
                  id="hr_position"
                  value={values.position}
                  onChange={(event) => set("position", event.target.value)}
                />
              </FormField>
              <FormField label="First name" htmlFor="hr_first" required>
                <Input
                  id="hr_first"
                  value={values.firstName}
                  onChange={(event) => set("firstName", event.target.value)}
                />
              </FormField>
              <FormField label="Middle name" htmlFor="hr_middle">
                <Input
                  id="hr_middle"
                  value={values.middleName}
                  onChange={(event) => set("middleName", event.target.value)}
                />
              </FormField>
              <FormField label="Last name" htmlFor="hr_last" required>
                <Input
                  id="hr_last"
                  value={values.lastName}
                  onChange={(event) => set("lastName", event.target.value)}
                />
              </FormField>
              <FormField label="Department" htmlFor="hr_department">
                <Select
                  id="hr_department"
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
              <FormField label="Employment type" htmlFor="hr_employment">
                <Input
                  id="hr_employment"
                  value={values.employmentType}
                  onChange={(event) => set("employmentType", event.target.value)}
                />
              </FormField>
              <FormField label="Role" htmlFor="hr_role">
                <Select
                  id="hr_role"
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

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wide text-hospital-text-muted">
              HR details
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Hire date" htmlFor="hr_hire" required>
                <Input
                  id="hr_hire"
                  type="date"
                  value={values.hireDate}
                  onChange={(event) => set("hireDate", event.target.value)}
                />
              </FormField>
              <FormField
                label="Monthly rate"
                htmlFor="hr_rate"
                hint="Used by Run Payroll."
                required
              >
                <Input
                  id="hr_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.monthlyRate}
                  onChange={(event) => set("monthlyRate", event.target.value)}
                />
              </FormField>
              <FormField label="License number" htmlFor="hr_license">
                <Input
                  id="hr_license"
                  value={values.licenseNumber}
                  onChange={(event) => set("licenseNumber", event.target.value)}
                />
              </FormField>
              <FormField label="License expiry" htmlFor="hr_expiry">
                <Input
                  id="hr_expiry"
                  type="date"
                  value={values.licenseExpiry}
                  onChange={(event) => set("licenseExpiry", event.target.value)}
                />
              </FormField>
              <FormField label="Leave balance" htmlFor="hr_leave">
                <Input
                  id="hr_leave"
                  type="number"
                  min="0"
                  step="0.5"
                  value={values.leaveBalance}
                  onChange={(event) => set("leaveBalance", event.target.value)}
                />
              </FormField>
            </div>
          </fieldset>

          <Alert variant="info" title="Atomic creation">
            The account, staff record and HR details are saved together. If the
            employee record fails, the new account is deactivated.
          </Alert>
        </form>
      </Modal>
    </>
  );
}

export function RunPayrollAction() {
  const router = useRouter();
  const { toast } = useToast();
  const can = useCan();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({
    ...monthBounds(),
    deductionRate: "0",
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  if (!can("hr.payroll")) {
    return null;
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
      const result = await runPayrollAction(values);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Payroll processed",
        description:
          "Payslips were generated from monthly rates, attendance overtime and the deduction rate you entered.",
        variant: "success",
      });
      setOpen(false);
      router.refresh();
    } catch {
      setFormError("We could not run payroll. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <WalletMoneyIcon className="size-4" aria-hidden="true" />
        Run Payroll
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Run payroll"
        description="Create a payroll period and one payslip per active employee with a salary."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" form="hr-payroll-form" loading={submitting}>
              Run payroll
            </Button>
          </>
        }
      >
        <form
          id="hr-payroll-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to run payroll">
              {formError}
            </Alert>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Period start" htmlFor="pay_start" required>
              <Input
                id="pay_start"
                type="date"
                value={values.periodStart}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    periodStart: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label="Period end" htmlFor="pay_end" required>
              <Input
                id="pay_end"
                type="date"
                value={values.periodEnd}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    periodEnd: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label="Pay date" htmlFor="pay_date" required>
              <Input
                id="pay_date"
                type="date"
                value={values.payDate}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    payDate: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField
              label="Deduction rate (%)"
              htmlFor="pay_rate"
              hint="Statutory contributions and tax."
              required
            >
              <Input
                id="pay_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={values.deductionRate}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    deductionRate: event.target.value,
                  }))
                }
              />
            </FormField>
          </div>

          <Alert variant="warning" title="How the numbers are calculated">
            Basic pay is the monthly rate prorated over the period (30-day
            basis). Overtime comes from attendance at 1.25× the hourly rate.
            Deductions are the percentage you enter, stored on the period so the
            payslip can be explained later.
          </Alert>

          <p className="text-[11px] text-hospital-text-muted">
            Employees without a monthly rate and inactive employees are skipped.
            A period that overlaps an existing unpaid run is rejected.
          </p>
        </form>
      </Modal>
    </>
  );
}

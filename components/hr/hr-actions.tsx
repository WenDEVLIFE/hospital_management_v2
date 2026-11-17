"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CaseIcon, ClockCircleIcon } from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { useCan } from "@/components/providers/permission-provider";
import {
  fileLeaveAction,
  scheduleShiftAction,
} from "@/app/(workspace)/hr/actions";
import { fileLeaveSchema, scheduleShiftSchema } from "@/lib/validations/hr";
import type { EmployeeListRow } from "@/types/hospital";

type EmployeeOption = Pick<
  EmployeeListRow,
  "id" | "full_name" | "employee_number"
>;

type ShiftValues = {
  employeeId: string;
  shiftDate: string;
  shiftType: string;
  startTime: string;
  endTime: string;
};

type ShiftErrors = Partial<Record<keyof ShiftValues, string>>;

type LeaveValues = {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
};

type LeaveErrors = Partial<Record<keyof LeaveValues, string>>;

const SHIFT_INITIAL: ShiftValues = {
  employeeId: "",
  shiftDate: "",
  shiftType: "morning",
  startTime: "07:00",
  endTime: "15:00",
};

const LEAVE_INITIAL: LeaveValues = {
  employeeId: "",
  leaveType: "vacation",
  startDate: "",
  endDate: "",
  reason: "",
};

const SHIFT_OPTIONS = [
  { label: "Morning", value: "morning" },
  { label: "Afternoon", value: "afternoon" },
  { label: "Night", value: "night" },
  { label: "Off", value: "off" },
];

const LEAVE_OPTIONS = [
  { label: "Vacation", value: "vacation" },
  { label: "Sick", value: "sick" },
  { label: "Maternity", value: "maternity" },
  { label: "Paternity", value: "paternity" },
  { label: "Emergency", value: "emergency" },
  { label: "Study", value: "study" },
];

export function ScheduleShiftAction({
  employees,
}: {
  employees: EmployeeOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<ShiftValues>(SHIFT_INITIAL);
  const [errors, setErrors] = React.useState<ShiftErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const can = useCan();

  if (!can("hr.manage")) {
    return null;
  }

  function setField<K extends keyof ShiftValues>(
    field: K,
    value: ShiftValues[K]
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = scheduleShiftSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: ShiftErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !nextErrors[field as keyof ShiftValues]) {
          nextErrors[field as keyof ShiftValues] = issue.message;
        }
      }

      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await scheduleShiftAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Shift scheduled",
        description: `${parsed.data.shiftType} shift added to the roster.`,
        variant: "success",
      });

      setValues(SHIFT_INITIAL);
      setOpen(false);
      router.refresh();
    } catch {
      setFormError(
        "We could not schedule the shift. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
        disabled={employees.length === 0}
      >
        <ClockCircleIcon className="size-4" aria-hidden="true" />
        Schedule Shift
      </Button>

      <Modal
        open={open}
        onClose={() => {
          if (!submitting) {
            setOpen(false);
          }
        }}
        title="Schedule shift"
        description="Assign an employee to a shift and publish it to the roster."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="shift-form" loading={submitting}>
              Schedule shift
            </Button>
          </>
        }
      >
        <form
          id="shift-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to schedule shift">
              {formError}
            </Alert>
          ) : null}

          <FormField
            label="Employee"
            htmlFor="shift_employee"
            required
            error={errors.employeeId}
          >
            <Select
              id="shift_employee"
              value={values.employeeId}
              invalid={Boolean(errors.employeeId)}
              onChange={(event) => setField("employeeId", event.target.value)}
            >
              <option value="">Select employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name} · {employee.employee_number}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Date"
              htmlFor="shift_date"
              required
              error={errors.shiftDate}
            >
              <Input
                id="shift_date"
                type="date"
                value={values.shiftDate}
                invalid={Boolean(errors.shiftDate)}
                onChange={(event) => setField("shiftDate", event.target.value)}
              />
            </FormField>

            <FormField
              label="Shift type"
              htmlFor="shift_type"
              required
              error={errors.shiftType}
            >
              <Select
                id="shift_type"
                value={values.shiftType}
                options={SHIFT_OPTIONS}
                onChange={(event) => setField("shiftType", event.target.value)}
              />
            </FormField>

            <FormField
              label="Starts"
              htmlFor="shift_start"
              required
              error={errors.startTime}
            >
              <Input
                id="shift_start"
                type="time"
                value={values.startTime}
                invalid={Boolean(errors.startTime)}
                onChange={(event) => setField("startTime", event.target.value)}
              />
            </FormField>

            <FormField
              label="Ends"
              htmlFor="shift_end"
              required
              error={errors.endTime}
            >
              <Input
                id="shift_end"
                type="time"
                value={values.endTime}
                invalid={Boolean(errors.endTime)}
                onChange={(event) => setField("endTime", event.target.value)}
              />
            </FormField>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function FileLeaveAction({
  employees,
}: {
  employees: EmployeeOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<LeaveValues>(LEAVE_INITIAL);
  const [errors, setErrors] = React.useState<LeaveErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const can = useCan();

  if (!can("hr.manage")) {
    return null;
  }

  function setField<K extends keyof LeaveValues>(
    field: K,
    value: LeaveValues[K]
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = fileLeaveSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: LeaveErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !nextErrors[field as keyof LeaveValues]) {
          nextErrors[field as keyof LeaveValues] = issue.message;
        }
      }

      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await fileLeaveAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Leave filed",
        description: "The request is pending review.",
        variant: "success",
      });

      setValues(LEAVE_INITIAL);
      setOpen(false);
      router.refresh();
    } catch {
      setFormError(
        "We could not file the leave request. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
        disabled={employees.length === 0}
      >
        <CaseIcon className="size-4" aria-hidden="true" />
        File Leave
      </Button>

      <Modal
        open={open}
        onClose={() => {
          if (!submitting) {
            setOpen(false);
          }
        }}
        title="File leave"
        description="Create a leave request for review."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="leave-form" loading={submitting}>
              File leave
            </Button>
          </>
        }
      >
        <form
          id="leave-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to file leave">
              {formError}
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Employee"
              htmlFor="leave_employee"
              required
              error={errors.employeeId}
            >
              <Select
                id="leave_employee"
                value={values.employeeId}
                invalid={Boolean(errors.employeeId)}
                onChange={(event) => setField("employeeId", event.target.value)}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name} · {employee.employee_number}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Leave type"
              htmlFor="leave_type"
              required
              error={errors.leaveType}
            >
              <Select
                id="leave_type"
                value={values.leaveType}
                options={LEAVE_OPTIONS}
                onChange={(event) => setField("leaveType", event.target.value)}
              />
            </FormField>

            <FormField
              label="Start date"
              htmlFor="leave_start"
              required
              error={errors.startDate}
            >
              <Input
                id="leave_start"
                type="date"
                value={values.startDate}
                invalid={Boolean(errors.startDate)}
                onChange={(event) => setField("startDate", event.target.value)}
              />
            </FormField>

            <FormField
              label="End date"
              htmlFor="leave_end"
              required
              error={errors.endDate}
            >
              <Input
                id="leave_end"
                type="date"
                value={values.endDate}
                invalid={Boolean(errors.endDate)}
                onChange={(event) => setField("endDate", event.target.value)}
              />
            </FormField>
          </div>

          <FormField
            label="Reason"
            htmlFor="leave_reason"
            required
            error={errors.reason}
          >
            <Textarea
              id="leave_reason"
              rows={3}
              value={values.reason}
              invalid={Boolean(errors.reason)}
              onChange={(event) => setField("reason", event.target.value)}
            />
          </FormField>
        </form>
      </Modal>
    </>
  );
}

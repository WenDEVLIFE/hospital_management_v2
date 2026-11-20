"use client";

import * as React from "react";

import { createEmployeeDetailsAction } from "@/app/(workspace)/hr/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { EmployeeListRow } from "@/types/hospital";

export function CreateEmployeeDetailsDialog({
  employee,
  onClose,
}: {
  employee: EmployeeListRow;
  onClose: () => void;
}) {
  const formId = React.useId();
  const { toast } = useToast();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = new FormData(event.currentTarget);
    setFormError(null);
    setSubmitting(true);

    try {
      const result = await createEmployeeDetailsAction({
        staffProfileId: employee.id,
        position: String(form.get("position") ?? ""),
        hireDate: String(form.get("hireDate") ?? ""),
      });

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({ title: "Employee record created", variant: "success" });
      onClose();
    } catch {
      setFormError("The employee record could not be saved. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      preventDismiss={submitting}
      title={`Create employee record · ${employee.full_name}`}
      description={`Add HR details to staff profile ${employee.employee_number}.`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form={formId} loading={submitting}>Create record</Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        {formError && <Alert variant="danger" title="Unable to save">{formError}</Alert>}
        <FormField label="Position" htmlFor={`${formId}-position`} required>
          <Input id={`${formId}-position`} name="position" minLength={2} maxLength={120} required />
        </FormField>
        <FormField label="Hire date" htmlFor={`${formId}-hire-date`} required>
          <Input id={`${formId}-hire-date`} name="hireDate" type="date" required />
        </FormField>
      </form>
    </Modal>
  );
}

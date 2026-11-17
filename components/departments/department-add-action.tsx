"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AddCircleIcon } from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { createDepartmentAction } from "@/app/(workspace)/staff/actions";
import { departmentSchema } from "@/lib/validations/organisation";

type FormValues = {
  code: string;
  name: string;
  description: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = { code: "", name: "", description: "" };

export function DepartmentAddAction() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const parsed = departmentSchema.safeParse(values);

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
      const result = await createDepartmentAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Department created",
        description: `${parsed.data.name} is available for assignments.`,
        variant: "success",
      });

      setValues(INITIAL_VALUES);
      setOpen(false);
      router.refresh();
    } catch {
      setFormError(
        "We could not create the department. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <AddCircleIcon className="size-4" aria-hidden="true" />
        Add Department
      </Button>

      <Modal
        open={open}
        onClose={() => {
          if (!submitting) {
            setOpen(false);
          }
        }}
        title="Add department"
        description="Create a hospital department or service unit."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="department-form"
              loading={submitting}
            >
              Create department
            </Button>
          </>
        }
      >
        <form
          id="department-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to create department">
              {formError}
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
            <FormField
              label="Code"
              htmlFor="department_code"
              required
              hint="Shown in lists, e.g. ER."
              error={errors.code}
            >
              <Input
                id="department_code"
                autoComplete="off"
                value={values.code}
                invalid={Boolean(errors.code)}
                onChange={(event) => setField("code", event.target.value)}
              />
            </FormField>

            <FormField
              label="Name"
              htmlFor="department_name"
              required
              error={errors.name}
            >
              <Input
                id="department_name"
                autoComplete="off"
                value={values.name}
                invalid={Boolean(errors.name)}
                onChange={(event) => setField("name", event.target.value)}
              />
            </FormField>
          </div>

          <FormField
            label="Description"
            htmlFor="department_description"
            hint="Optional."
            error={errors.description}
          >
            <Textarea
              id="department_description"
              rows={3}
              value={values.description}
              invalid={Boolean(errors.description)}
              onChange={(event) =>
                setField("description", event.target.value)
              }
            />
          </FormField>

          <Alert variant="info" title="Administrative record">
            Departments can be assigned to staff, rooms, and encounters. Codes
            and names must be unique.
          </Alert>
        </form>
      </Modal>
    </>
  );
}

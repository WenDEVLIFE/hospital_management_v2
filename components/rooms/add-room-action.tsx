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
import { useCan } from "@/components/providers/permission-provider";
import { createRoomAction } from "@/app/(workspace)/staff/actions";
import { roomSchema } from "@/lib/validations/organisation";

type FormValues = {
  departmentId: string;
  roomNumber: string;
  roomType: string;
  floorNumber: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  departmentId: "",
  roomNumber: "",
  roomType: "",
  floorNumber: "",
};

export interface AddRoomActionProps {
  departments: Array<{ id: string; name: string }>;
}

export function AddRoomAction({ departments }: AddRoomActionProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const can = useCan();

  if (!can("bed.manage")) {
    return null;
  }

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

    const parsed = roomSchema.safeParse(values);

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
      const result = await createRoomAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Room created",
        description: `Room ${parsed.data.roomNumber} is available for beds.`,
        variant: "success",
      });

      setValues(INITIAL_VALUES);
      setOpen(false);
      router.refresh();
    } catch {
      setFormError(
        "We could not create the room. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        disabled={departments.length === 0}
      >
        <AddCircleIcon className="size-4" aria-hidden="true" />
        Add Room
      </Button>

      <Modal
        open={open}
        onClose={() => {
          if (!submitting) {
            setOpen(false);
          }
        }}
        title="Add room"
        description="Register a room under a department."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="room-form" loading={submitting}>
              Create room
            </Button>
          </>
        }
      >
        <form
          id="room-form"
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {formError ? (
            <Alert variant="danger" title="Unable to create room">
              {formError}
            </Alert>
          ) : null}

          <FormField
            label="Department"
            htmlFor="room_department"
            required
            error={errors.departmentId}
          >
            <Select
              id="room_department"
              value={values.departmentId}
              invalid={Boolean(errors.departmentId)}
              onChange={(event) =>
                setField("departmentId", event.target.value)
              }
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              label="Room number"
              htmlFor="room_number"
              required
              error={errors.roomNumber}
            >
              <Input
                id="room_number"
                autoComplete="off"
                value={values.roomNumber}
                invalid={Boolean(errors.roomNumber)}
                onChange={(event) => setField("roomNumber", event.target.value)}
              />
            </FormField>

            <FormField
              label="Room type"
              htmlFor="room_type"
              hint="Optional."
              error={errors.roomType}
            >
              <Input
                id="room_type"
                autoComplete="off"
                value={values.roomType}
                onChange={(event) => setField("roomType", event.target.value)}
              />
            </FormField>

            <FormField
              label="Floor"
              htmlFor="room_floor"
              hint="Optional."
              error={errors.floorNumber}
            >
              <Input
                id="room_floor"
                autoComplete="off"
                value={values.floorNumber}
                onChange={(event) =>
                  setField("floorNumber", event.target.value)
                }
              />
            </FormField>
          </div>

          <Alert variant="info" title="Beds are added separately">
            A room holds beds; bed numbers must be unique within the room. Room
            numbers are unique per department.
          </Alert>
        </form>
      </Modal>
    </>
  );
}

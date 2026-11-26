"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { updateRoomAction } from "@/app/(workspace)/rooms-beds/actions";
import { roomUpdateSchema } from "@/lib/validations/organisation";
import type { RoomTableRow } from "./rooms-table";

type FormValues = {
  departmentId: string;
  roomNumber: string;
  roomType: string;
  floorNumber: string;
  isActive: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const STATUS_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
];

export interface EditRoomDialogProps {
  room: RoomTableRow;
  departments: Array<{ id: string; name: string }>;
  onClose: () => void;
}

export function EditRoomDialog({
  room,
  departments,
  onClose,
}: EditRoomDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [values, setValues] = React.useState<FormValues>({
    departmentId: room.department_id,
    roomNumber: room.room_number,
    roomType: room.room_type ?? "",
    floorNumber: room.floor_number ?? "",
    isActive: room.is_active,
  });
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

    const parsed = roomUpdateSchema.safeParse({
      roomId: room.id,
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
      const result = await updateRoomAction(parsed.data);

      if (!result.ok) {
        setFormError(result.formError);
        return;
      }

      toast({
        title: "Room updated",
        description: `Room ${parsed.data.roomNumber} saved.`,
        variant: "success",
      });

      onClose();
      router.refresh();
    } catch {
      setFormError(
        "We could not update the room. Check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={() => {
        if (!submitting) {
          onClose();
        }
      }}
      title="Edit room"
      description={room.room_number}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="room-edit-form" loading={submitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form
        id="room-edit-form"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {formError ? (
          <Alert variant="danger" title="Unable to update room">
            {formError}
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Department"
            htmlFor="room_edit_department"
            required
            error={errors.departmentId}
          >
            <Select
              id="room_edit_department"
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

          <FormField
            label="Status"
            htmlFor="room_edit_status"
            required
            error={errors.isActive}
          >
            <Select
              id="room_edit_status"
              value={values.isActive ? "true" : "false"}
              options={STATUS_OPTIONS}
              onChange={(event) =>
                setField("isActive", event.target.value === "true")
              }
            />
          </FormField>

          <FormField
            label="Room number"
            htmlFor="room_edit_number"
            required
            error={errors.roomNumber}
          >
            <Input
              id="room_edit_number"
              autoComplete="off"
              value={values.roomNumber}
              invalid={Boolean(errors.roomNumber)}
              onChange={(event) => setField("roomNumber", event.target.value)}
            />
          </FormField>

          <FormField
            label="Room type"
            htmlFor="room_edit_type"
            hint="Optional."
            error={errors.roomType}
          >
            <Input
              id="room_edit_type"
              autoComplete="off"
              value={values.roomType}
              onChange={(event) => setField("roomType", event.target.value)}
            />
          </FormField>

          <FormField
            label="Floor"
            htmlFor="room_edit_floor"
            hint="Optional."
            error={errors.floorNumber}
          >
            <Input
              id="room_edit_floor"
              autoComplete="off"
              value={values.floorNumber}
              onChange={(event) => setField("floorNumber", event.target.value)}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}

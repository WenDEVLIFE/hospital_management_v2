"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  addBedAction,
  removeBedAction,
} from "@/app/(workspace)/rooms-beds/actions";
import {
  bedCreateSchema,
  bedRemoveSchema,
} from "@/lib/validations/organisation";
import type { BedBoardRow } from "@/types/hospital";
import type { RoomTableRow } from "./rooms-table";

const BED_STATUS_OPTIONS = [
  { label: "Available", value: "available" },
  { label: "Reserved", value: "reserved" },
  { label: "Maintenance", value: "maintenance" },
];

function sortNumeric(left: string, right: string): number {
  return left.localeCompare(right, "en", { numeric: true, sensitivity: "base" });
}

export interface ManageBedsDialogProps {
  room: RoomTableRow;
  beds: BedBoardRow[];
  onClose: () => void;
}

export function ManageBedsDialog({
  room,
  beds,
  onClose,
}: ManageBedsDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [bedNumber, setBedNumber] = React.useState("");
  const [status, setStatus] = React.useState("available");
  const [error, setError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const roomBeds = React.useMemo(
    () =>
      beds
        .filter((bed) => bed.room_id === room.id)
        .sort((left, right) => sortNumeric(left.bed_number, right.bed_number)),
    [beds, room.id]
  );

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (adding) {
      return;
    }

    const parsed = bedCreateSchema.safeParse({
      roomId: room.id,
      bedNumber,
      status,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the bed details.");
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const result = await addBedAction(parsed.data);

      if (!result.ok) {
        setError(result.formError);
        return;
      }

      toast({
        title: "Bed added",
        description: `Bed ${parsed.data.bedNumber} added to room ${room.room_number}.`,
        variant: "success",
      });

      setBedNumber("");
      router.refresh();
    } catch {
      setError("We could not add the bed. Check your connection and try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(bed: BedBoardRow) {
    if (removingId) {
      return;
    }

    const parsed = bedRemoveSchema.safeParse({ bedId: bed.bed_id });

    if (!parsed.success) {
      setError("Select a valid bed.");
      return;
    }

    setRemovingId(bed.bed_id);
    setError(null);

    try {
      const result = await removeBedAction(parsed.data);

      if (!result.ok) {
        setError(result.formError);
        return;
      }

      toast({
        title: "Bed removed",
        description: `Bed ${bed.bed_number} retired from room ${room.room_number}.`,
        variant: "success",
      });

      router.refresh();
    } catch {
      setError(
        "We could not remove the bed. Check your connection and try again."
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Modal
      open
      onClose={() => {
        if (!adding && !removingId) {
          onClose();
        }
      }}
      title="Manage beds"
      description={`Room ${room.room_number} · ${room.department_name}`}
      size="md"
      footer={
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={adding || Boolean(removingId)}
        >
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <p className="text-xs text-hospital-text-muted">
          {roomBeds.length} {roomBeds.length === 1 ? "bed" : "beds"} in this room
        </p>

        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-3 rounded-md border border-hospital-border bg-hospital-surface p-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <FormField label="Bed number" htmlFor="new_bed_number" required>
              <Input
                id="new_bed_number"
                autoComplete="off"
                value={bedNumber}
                onChange={(event) => {
                  setBedNumber(event.target.value);
                  setError(null);
                }}
              />
            </FormField>
          </div>

          <div className="sm:w-40">
            <FormField label="Status" htmlFor="new_bed_status">
              <Select
                id="new_bed_status"
                value={status}
                options={BED_STATUS_OPTIONS}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setError(null);
                }}
              />
            </FormField>
          </div>

          <Button type="submit" loading={adding}>
            Add bed
          </Button>
        </form>

        <div className="rounded-md border border-hospital-border">
          {roomBeds.length === 0 ? (
            <p className="px-3 py-4 text-xs text-hospital-text-muted">
              No beds yet. Add the first bed above.
            </p>
          ) : (
            <ul className="divide-y divide-hospital-border-subtle">
              {roomBeds.map((bed) => {
                const locked = bed.status === "occupied" || Boolean(bed.patient_name);

                return (
                  <li
                    key={bed.bed_id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-mono text-[11px] font-medium text-hospital-text">
                        Bed {bed.bed_number}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={bed.status} />
                        {bed.patient_name ? (
                          <span className="truncate text-[11px] text-hospital-text-muted">
                            {bed.patient_name}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      onClick={() => handleRemove(bed)}
                      loading={removingId === bed.bed_id}
                      disabled={locked || Boolean(removingId)}
                      title={
                        locked
                          ? "Discharge or transfer the patient before removing this bed."
                          : undefined
                      }
                    >
                      Remove
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

"use client";

import * as React from "react";
import { BedIcon } from "@solar-icons/react/linear";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { UNAVAILABLE_MESSAGE } from "@/components/module/unavailable-action";
import { cn } from "@/lib/utils";
import type { BedBoardRow } from "@/types/hospital";

const STATUS_OPTIONS = [
  { label: "Available", value: "available" },
  { label: "Occupied", value: "occupied" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Reserved", value: "reserved" },
];

const LEGEND = [
  { label: "Available", swatch: "bg-emerald-500" },
  { label: "Occupied", swatch: "bg-slate-500" },
  { label: "Reserved", swatch: "bg-amber-500" },
  { label: "Maintenance", swatch: "bg-slate-300" },
];

type RoomGroup = {
  roomId: string;
  roomNumber: string;
  departmentName: string;
  roomType: string | null;
  floorNumber: string | null;
  beds: BedBoardRow[];
};

function bedStatusHint(bed: BedBoardRow): string {
  switch (bed.status) {
    case "occupied":
      return bed.patient_name ?? "Patient assigned";
    case "available":
      return "Ready for assignment";
    case "reserved":
      return "Reserved for admission";
    case "maintenance":
      return "Not in service";
    default:
      return "";
  }
}

function sortNumeric(left: string, right: string): number {
  return left.localeCompare(right, "en", { numeric: true, sensitivity: "base" });
}

export interface BedAvailabilityBoardProps {
  beds: BedBoardRow[];
}

export function BedAvailabilityBoard({ beds }: BedAvailabilityBoardProps) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [selectedBed, setSelectedBed] = React.useState<BedBoardRow | null>(
    null
  );
  const [nextStatus, setNextStatus] = React.useState("available");
  const [confirmed, setConfirmed] = React.useState(false);

  const departments = React.useMemo(() => {
    const map = new Map<string, string>();

    for (const bed of beds) {
      map.set(bed.department_id, bed.department_name);
    }

    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }, [beds]);

  const visibleBeds = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return beds.filter((bed) => {
      if (status && bed.status !== status) {
        return false;
      }

      if (department && bed.department_id !== department) {
        return false;
      }

      if (!needle) {
        return true;
      }

      return `${bed.room_number} ${bed.bed_number}`
        .toLowerCase()
        .includes(needle);
    });
  }, [beds, query, status, department]);

  const roomGroups = React.useMemo<RoomGroup[]>(() => {
    const groups = new Map<string, RoomGroup>();

    for (const bed of visibleBeds) {
      const existing = groups.get(bed.room_id);

      if (existing) {
        existing.beds.push(bed);
        continue;
      }

      groups.set(bed.room_id, {
        roomId: bed.room_id,
        roomNumber: bed.room_number,
        departmentName: bed.department_name,
        roomType: bed.room_type,
        floorNumber: bed.floor_number,
        beds: [bed],
      });
    }

    return [...groups.values()]
      .map((group) => ({
        ...group,
        beds: [...group.beds].sort((left, right) =>
          sortNumeric(left.bed_number, right.bed_number)
        ),
      }))
      .sort((left, right) => sortNumeric(left.roomNumber, right.roomNumber));
  }, [visibleBeds]);

  const openBedDialog = (bed: BedBoardRow) => {
    setSelectedBed(bed);
    setNextStatus(bed.status);
    setConfirmed(false);
  };

  const closeBedDialog = () => {
    setSelectedBed(null);
    setConfirmed(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={query}
              onChange={setQuery}
              onClear={() => setQuery("")}
              placeholder="Search room or bed number"
              aria-label="Search room or bed number"
            />
          </div>

          <div className="sm:w-44">
            <Select
              label="Bed status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={[
                { label: "All statuses", value: "" },
                ...STATUS_OPTIONS,
              ]}
            />
          </div>

          <div className="sm:w-52">
            <Select
              label="Department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              options={[
                { label: "All departments", value: "" },
                ...departments,
              ]}
            />
          </div>
        </div>

        <p className="text-[11px] text-hospital-text-muted">
          {visibleBeds.length} of {beds.length} beds
        </p>
      </div>

      {beds.length === 0 ? (
        <EmptyState
          icon={<BedIcon className="size-5" aria-hidden="true" />}
          title="No beds configured"
          description="Rooms and beds will appear here once they are set up."
        />
      ) : (
        <>
          <ul
            aria-label="Bed status legend"
            className="flex flex-wrap items-center gap-x-4 gap-y-2"
          >
            {LEGEND.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-1.5 text-[11px] text-hospital-text-muted"
              >
                <span
                  aria-hidden="true"
                  className={cn("size-2 rounded-full", item.swatch)}
                />
                {item.label}
              </li>
            ))}
          </ul>

          {roomGroups.length === 0 ? (
            <EmptyState
              icon={<BedIcon className="size-5" aria-hidden="true" />}
              title="No matching beds"
              description="Adjust the bed status, department, or search to see more beds."
            />
          ) : (
            <div className="space-y-4">
              {roomGroups.map((room) => {
                const meta = [
                  room.roomType ?? "Unassigned type",
                  room.floorNumber ? `Floor ${room.floorNumber}` : null,
                  `${room.beds.length} ${
                    room.beds.length === 1 ? "bed" : "beds"
                  }`,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <section
                    key={room.roomId}
                    aria-label={`Room ${room.roomNumber}`}
                    className="rounded-md border border-hospital-border bg-white"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hospital-border-subtle px-4 py-3">
                      <h3 className="text-sm font-semibold text-hospital-text">
                        Room {room.roomNumber} · {room.departmentName}
                      </h3>
                      <p className="text-[11px] text-hospital-text-muted">
                        {meta}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4 min-[1440px]:grid-cols-6">
                      {room.beds.map((bed) => (
                        <button
                          key={bed.bed_id}
                          type="button"
                          onClick={() => openBedDialog(bed)}
                          aria-label={`Update status for bed ${bed.bed_number} in room ${room.roomNumber}, currently ${bed.status}`}
                          className="flex cursor-pointer flex-col gap-2 rounded-md border border-hospital-border bg-white p-3 text-left transition-colors hover:border-hospital-green-border hover:bg-hospital-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
                        >
                          <span className="font-mono text-[11px] font-medium text-hospital-text">
                            Bed {bed.bed_number}
                          </span>
                          <StatusBadge status={bed.status} />
                          <span className="text-[11px] leading-snug text-hospital-text-muted">
                            {bedStatusHint(bed)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(selectedBed)}
        onClose={closeBedDialog}
        title="Update bed status"
        description={
          selectedBed
            ? `Room ${selectedBed.room_number} · Bed ${selectedBed.bed_number}`
            : undefined
        }
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeBedDialog}>
              {confirmed ? "Close" : "Cancel"}
            </Button>
            <Button onClick={() => setConfirmed(true)}>Update status</Button>
          </>
        }
      >
        {selectedBed ? (
          confirmed ? (
            <Alert variant="info">{UNAVAILABLE_MESSAGE}</Alert>
          ) : (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-hospital-text-muted">
                Bed occupancy is controlled by admission transactions. Status
                changes will be available once the hospital database is
                connected.
              </p>
              <FormField label="New status" htmlFor="bed-status">
                <Select
                  id="bed-status"
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                  options={STATUS_OPTIONS}
                />
              </FormField>
            </div>
          )
        ) : null}
      </Modal>
    </div>
  );
}

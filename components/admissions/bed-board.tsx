"use client";

import * as React from "react";
import { BedIcon } from "@solar-icons/react/linear";

import type { BedBoardRow } from "@/types/hospital";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

const LEGEND_STATUSES = [
  { value: "available", label: "Available" },
  { value: "occupied", label: "Occupied" },
  { value: "reserved", label: "Reserved" },
  { value: "maintenance", label: "Maintenance" },
] as const;

type RoomGroup = {
  roomId: string;
  roomNumber: string;
  roomType: string | null;
  floorNumber: string | null;
  beds: BedBoardRow[];
};

type DepartmentGroup = {
  department: string;
  rooms: RoomGroup[];
  bedCount: number;
};

function groupBeds(rows: BedBoardRow[]): DepartmentGroup[] {
  const departments = new Map<string, Map<string, BedBoardRow[]>>();

  for (const bed of rows) {
    const rooms = departments.get(bed.department_name) ?? new Map();
    const roomBeds = rooms.get(bed.room_id) ?? [];

    roomBeds.push(bed);
    rooms.set(bed.room_id, roomBeds);
    departments.set(bed.department_name, rooms);
  }

  return Array.from(departments.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([department, rooms]) => {
      const roomGroups: RoomGroup[] = Array.from(rooms.entries())
        .map(([roomId, beds]) => {
          const sortedBeds = [...beds].sort((a, b) =>
            a.bed_number.localeCompare(b.bed_number, "en", { numeric: true })
          );
          const first = sortedBeds[0];

          return {
            roomId,
            roomNumber: first.room_number,
            roomType: first.room_type,
            floorNumber: first.floor_number,
            beds: sortedBeds,
          };
        })
        .sort((a, b) =>
          a.roomNumber.localeCompare(b.roomNumber, "en", { numeric: true })
        );

      return {
        department,
        rooms: roomGroups,
        bedCount: roomGroups.reduce((total, room) => total + room.beds.length, 0),
      };
    });
}

export interface BedBoardProps {
  rows: BedBoardRow[];
}

export function BedBoard({ rows }: BedBoardProps) {
  const groups = React.useMemo(() => groupBeds(rows), [rows]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<BedIcon className="size-5" aria-hidden="true" />}
        title="No beds configured"
        description="Room and bed records will appear here once they are registered."
      />
    );
  }

  const counts = LEGEND_STATUSES.map((status) => ({
    ...status,
    count: rows.filter((bed) => bed.status === status.value).length,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-[11px] font-medium text-hospital-text-muted">
          Bed status legend
        </p>
        {counts.map((status) => (
          <span key={status.value} className="inline-flex items-center gap-1.5">
            <StatusBadge status={status.value} />
            <span className="text-[11px] text-hospital-text-muted">
              {status.count}
            </span>
          </span>
        ))}
      </div>

      {groups.map((group) => (
        <section
          key={group.department}
          aria-label={`${group.department} beds`}
          className="space-y-2"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold text-hospital-text">
              {group.department}
            </h3>
            <p className="text-[11px] text-hospital-text-subtle">
              {group.bedCount} {group.bedCount === 1 ? "bed" : "beds"} ·{" "}
              {group.rooms.length}{" "}
              {group.rooms.length === 1 ? "room" : "rooms"}
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {group.rooms.map((room) => (
              <div
                key={room.roomId}
                className="rounded-md border border-hospital-border bg-white"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-hospital-border-subtle p-3">
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-hospital-text">
                      Room {room.roomNumber}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-hospital-text-subtle">
                      {room.roomType ?? "Room"}
                      {room.floorNumber ? ` · Floor ${room.floorNumber}` : ""}
                    </p>
                  </div>
                  <p className="text-[11px] text-hospital-text-muted">
                    {room.beds.length}{" "}
                    {room.beds.length === 1 ? "bed" : "beds"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
                  {room.beds.map((bed) => (
                    <div
                      key={bed.bed_id}
                      className={cn(
                        "min-w-0 rounded-md border border-hospital-border p-2.5",
                        bed.status === "available"
                          ? "bg-white"
                          : "bg-hospital-surface"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-mono text-[11px] font-medium text-hospital-text">
                          Bed {bed.bed_number}
                        </p>
                        <StatusBadge status={bed.status} />
                      </div>

                      {bed.status === "occupied" ? (
                        <p
                          className="mt-1.5 truncate text-[11px] font-medium text-hospital-text"
                          title={bed.patient_name ?? undefined}
                        >
                          {bed.patient_name ?? "Patient not recorded"}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

"use client";

import * as React from "react";
import { Buildings2Icon } from "@solar-icons/react/linear";

import { RecordTable, type Column } from "@/components/module/record-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCan } from "@/components/providers/permission-provider";
import { EditRoomDialog } from "./edit-room-dialog";
import type { Room } from "@/types/hospital";

export type RoomTableRow = Room & {
  department_name: string;
  bed_count: number;
};

export interface RoomsTableProps {
  rows: RoomTableRow[];
  departments: Array<{ id: string; name: string }>;
}

export function RoomsTable({ rows, departments }: RoomsTableProps) {
  const canManage = useCan()("bed.manage");
  const [editing, setEditing] = React.useState<RoomTableRow | null>(null);

  const columns: Column<RoomTableRow>[] = [
    {
      key: "room_number",
      header: "Room Number",
      cell: (row) => (
        <span className="font-mono text-[11px] font-medium text-hospital-text">
          {row.room_number}
        </span>
      ),
      sortable: true,
      sortValue: (row) => row.room_number,
    },
    {
      key: "department",
      header: "Department",
      cell: (row) => (
        <span className="text-hospital-text">{row.department_name}</span>
      ),
      sortable: true,
      sortValue: (row) => row.department_name,
    },
    {
      key: "room_type",
      header: "Room Type",
      cell: (row) => (
        <span className="text-hospital-text-muted">{row.room_type ?? "—"}</span>
      ),
    },
    {
      key: "floor",
      header: "Floor",
      cell: (row) => (
        <span className="text-hospital-text-muted">
          {row.floor_number ? `Floor ${row.floor_number}` : "—"}
        </span>
      ),
    },
    {
      key: "beds",
      header: "Beds",
      cell: (row) => (
        <span className="tabular-nums text-hospital-text">{row.bed_count}</span>
      ),
      sortable: true,
      sortValue: (row) => row.bed_count,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <StatusBadge status={row.is_active ? "active" : "inactive"} />
      ),
      sortable: true,
      sortValue: (row) => (row.is_active ? "Active" : "Inactive"),
    },
  ];

  if (canManage) {
    columns.push({
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => setEditing(row)}>
            Edit
          </Button>
        </div>
      ),
    });
  }

  return (
    <>
      <RecordTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        caption="Hospital rooms"
        searchPlaceholder="Search by room, type, floor, or department"
        searchAccessor={(row) =>
          `${row.room_number} ${row.room_type ?? ""} ${row.floor_number ?? ""} ${
            row.department_name
          }`
        }
        emptyTitle="No rooms found"
        emptyDescription="Rooms will appear here once they are registered."
        emptyIcon={<Buildings2Icon className="size-5" aria-hidden="true" />}
      />

      {editing ? (
        <EditRoomDialog
          key={editing.id}
          room={editing}
          departments={departments}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

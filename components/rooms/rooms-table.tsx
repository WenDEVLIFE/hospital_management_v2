"use client";

import { Buildings2Icon } from "@solar-icons/react/linear";

import { RecordTable, type Column } from "@/components/module/record-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Room } from "@/types/hospital";

export type RoomTableRow = Room & {
  department_name: string;
  bed_count: number;
};

export interface RoomsTableProps {
  rows: RoomTableRow[];
}

export function RoomsTable({ rows }: RoomsTableProps) {
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

  return (
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
  );
}

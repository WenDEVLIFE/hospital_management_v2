import {
  BedIcon,
  Buildings2Icon,
  CheckCircleIcon,
  MinusCircleIcon,
  UsersGroupRoundedIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { AddRoomAction } from "@/components/rooms/add-room-action";
import { BedAvailabilityBoard } from "@/components/rooms/bed-availability-board";
import { RoomsTable } from "@/components/rooms/rooms-table";
import { listDepartments } from "@/lib/data/departments";
import { listBeds, listRooms } from "@/lib/data/rooms";

const BED_BOARD_ANCHOR = "bed-board";

export default async function RoomsBedsPage() {
  const [roomsResult, bedsResult, departmentsResult] = await Promise.all([
    listRooms({ pageSize: 100 }),
    listBeds(),
    listDepartments({ pageSize: 100 }),
  ]);

  const rooms = roomsResult.data?.rows ?? [];
  const beds = bedsResult.data ?? [];

  const bedCountByRoom = new Map<string, number>();

  for (const bed of beds) {
    bedCountByRoom.set(bed.room_id, (bedCountByRoom.get(bed.room_id) ?? 0) + 1);
  }

  const departmentNames = new Map<string, string>(
    (departmentsResult.data?.rows ?? []).map((department) => [
      department.id,
      department.name,
    ])
  );

  for (const bed of beds) {
    if (!departmentNames.has(bed.department_id)) {
      departmentNames.set(bed.department_id, bed.department_name);
    }
  }

  const roomRows = rooms.map((room) => ({
    ...room,
    department_name: departmentNames.get(room.department_id) ?? "—",
    bed_count: bedCountByRoom.get(room.id) ?? 0,
  }));

  const availableBeds = beds.filter((bed) => bed.status === "available").length;
  const occupiedBeds = beds.filter((bed) => bed.status === "occupied").length;
  const maintenanceBeds = beds.filter(
    (bed) => bed.status === "maintenance"
  ).length;
  const reservedBeds = beds.filter((bed) => bed.status === "reserved").length;

  const summaryError = roomsResult.error ?? bedsResult.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms & Beds"
        description="Room inventory and bed availability."
        actions={
          <>
            <a
              href={`#${BED_BOARD_ANCHOR}`}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-hospital-green-border bg-white px-3.5 text-sm text-hospital-green transition-colors hover:bg-hospital-green-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
            >
              <BedIcon className="size-4" aria-hidden="true" />
              Bed board
            </a>
            <AddRoomAction />
          </>
        }
      />

      {summaryError ? (
        <ErrorState error={summaryError} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Total rooms"
            value={roomsResult.data?.total ?? rooms.length}
            icon={<Buildings2Icon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Total beds"
            value={beds.length}
            icon={<BedIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Available"
            value={availableBeds}
            tone="success"
            icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Occupied"
            value={occupiedBeds}
            tone="info"
            icon={<UsersGroupRoundedIcon className="size-4" aria-hidden="true" />}
          />
          <StatCard
            label="Maintenance / Reserved"
            value={maintenanceBeds + reservedBeds}
            hint={`${maintenanceBeds} maintenance · ${reservedBeds} reserved`}
            icon={<MinusCircleIcon className="size-4" aria-hidden="true" />}
          />
        </div>
      )}

      <PageSection
        title="Room inventory"
        description="Registered rooms with their department, type, floor, and bed count."
      >
        {roomsResult.error ? (
          <ErrorState error={roomsResult.error} />
        ) : (
          <RoomsTable rows={roomRows} />
        )}
      </PageSection>

      <div id={BED_BOARD_ANCHOR} className="scroll-mt-6">
        <PageSection
          title="Bed availability"
          description="Bed status grouped by room. Bed occupancy is controlled by admission transactions."
        >
          {bedsResult.error ? (
            <ErrorState error={bedsResult.error} />
          ) : (
            <BedAvailabilityBoard beds={beds} />
          )}
        </PageSection>
      </div>
    </div>
  );
}

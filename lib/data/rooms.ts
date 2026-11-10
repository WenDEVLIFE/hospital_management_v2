import type { BedBoardRow, Room } from "@/types/hospital";
import { rooms } from "@/lib/fixtures";
import { getBedBoard } from "./admissions";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice } from "./query";
import type { DataResult, PagedResult } from "./result";

export async function listRooms(
  params: {
    q?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<Room>> {
  // TODO(supabase): replace with supabase.from("rooms").select("*")
  if (!isPreviewMode) {
    return emptyPage<Room>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = rooms
    .filter((room) =>
      matchesQuery(params.q, [
        room.room_number,
        room.room_type,
        room.floor_number,
      ])
    )
    .sort((a, b) => a.room_number.localeCompare(b.room_number));

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listBeds(
  params: {
    roomId?: string;
    status?: string;
  } = {}
): Promise<DataResult<BedBoardRow[]>> {
  // TODO(supabase): replace with supabase.from("v_bed_availability").select("*")
  const board = await getBedBoard();

  if (board.error) {
    return board;
  }

  const filtered = board.data.filter((bed) => {
    if (params.roomId && bed.room_id !== params.roomId) {
      return false;
    }

    if (params.status && bed.status !== params.status) {
      return false;
    }

    return true;
  });

  return { data: filtered, error: null };
}

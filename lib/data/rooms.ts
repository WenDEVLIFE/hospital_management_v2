import type { BedBoardRow, Room } from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getBedBoard } from "./admissions";
import { normalizePagination, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

export async function listRooms(
  params: {
    q?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<Room>> {
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase.from("rooms").select("*", { count: "exact" });

  const search = sanitizeSearchTerm(params.q);

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      [
        `room_number.ilike.${term}`,
        `room_type.ilike.${term}`,
        `floor_number.ilike.${term}`,
      ].join(",")
    );
  }

  const { data, error, count } = await query
    .order("room_number", { ascending: true })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return {
    data: {
      rows: (data ?? []) as Room[],
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function listBeds(
  params: {
    roomId?: string;
    status?: string;
  } = {}
): Promise<DataResult<BedBoardRow[]>> {
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

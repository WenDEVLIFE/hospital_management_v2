import type { PagedResult } from "./result";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;

export type PageMeta = {
  page: number;
  pageSize: number;
  offset: number;
};

export function normalizePagination(
  page?: number,
  pageSize?: number
): PageMeta {
  const safePage =
    typeof page === "number" && Number.isFinite(page) && page > 0
      ? Math.floor(page)
      : DEFAULT_PAGE;
  const safePageSize =
    typeof pageSize === "number" && Number.isFinite(pageSize) && pageSize > 0
      ? Math.floor(pageSize)
      : DEFAULT_PAGE_SIZE;

  return {
    page: safePage,
    pageSize: safePageSize,
    offset: (safePage - 1) * safePageSize,
  };
}

export function pageSlice<T>(
  rows: T[],
  page?: number,
  pageSize?: number
): { rows: T[]; total: number; page: number; pageSize: number } {
  const meta = normalizePagination(page, pageSize);

  return {
    rows: rows.slice(meta.offset, meta.offset + meta.pageSize),
    total: rows.length,
    page: meta.page,
    pageSize: meta.pageSize,
  };
}

export function emptyPage<T>(page?: number, pageSize?: number): PagedResult<T> {
  const meta = normalizePagination(page, pageSize);

  return {
    data: {
      rows: [],
      total: 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export function matchesQuery(
  q: string | undefined,
  fields: Array<string | null | undefined>
): boolean {
  const needle = q?.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  return fields.some((field) =>
    (field ?? "").toLowerCase().includes(needle)
  );
}

export function manilaDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function sortByDateDesc<T>(
  rows: readonly T[],
  getValue: (row: T) => string | null
): T[] {
  return [...rows].sort((a, b) => {
    const left = getValue(a) ?? "";
    const right = getValue(b) ?? "";

    if (left === right) {
      return 0;
    }

    return left < right ? 1 : -1;
  });
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

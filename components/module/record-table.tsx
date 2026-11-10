"use client";

import * as React from "react";
import { AltArrowDownIcon, AltArrowUpIcon } from "@solar-icons/react/linear";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
}

export interface FilterConfig<T> {
  key: string;
  label: string;
  allLabel?: string;
  options: { label: string; value: string }[];
  accessor: (row: T) => string;
}

export interface RecordTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  caption?: string;
  searchPlaceholder?: string;
  searchAccessor?: (row: T) => string;
  filters?: FilterConfig<T>[];
  toolbarActions?: React.ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  emptyIcon?: React.ReactNode;
  pageSize?: number;
}

type SortState = { key: string; direction: "asc" | "desc" } | null;

const ALIGN_CLASSES = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

/**
 * Reusable record table with search, filters, sorting, pagination and an
 * explicit empty state (THEME.MD §6.3). Filtering runs on the rows the caller
 * supplies; when Supabase is wired the same props keep working with
 * server-paged rows.
 */
export function RecordTable<T>({
  rows,
  columns,
  rowKey,
  caption,
  searchPlaceholder = "Search records",
  searchAccessor,
  filters = [],
  toolbarActions,
  emptyTitle,
  emptyDescription,
  emptyAction,
  emptyIcon,
  pageSize = 10,
}: RecordTableProps<T>) {
  const [query, setQuery] = React.useState("");
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>(
    {}
  );
  const [sort, setSort] = React.useState<SortState>(null);
  const [page, setPage] = React.useState(1);

  const resetPage = React.useCallback(() => setPage(1), []);

  const handleQueryChange = React.useCallback(
    (value: string) => {
      setQuery(value);
      resetPage();
    },
    [resetPage]
  );

  const handleFilterChange = React.useCallback(
    (key: string, value: string) => {
      setFilterValues((current) => ({ ...current, [key]: value }));
      resetPage();
    },
    [resetPage]
  );

  const handleSort = React.useCallback((column: Column<T>) => {
    if (!column.sortable) return;

    setSort((current) => {
      if (current?.key !== column.key) {
        return { key: column.key, direction: "asc" };
      }

      return {
        key: column.key,
        direction: current.direction === "asc" ? "desc" : "asc",
      };
    });
  }, []);

  const visibleRows = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let next = rows;

    if (normalizedQuery && searchAccessor) {
      next = next.filter((row) =>
        searchAccessor(row).toLowerCase().includes(normalizedQuery)
      );
    }

    for (const filter of filters) {
      const selected = filterValues[filter.key];

      if (selected) {
        next = next.filter((row) => filter.accessor(row) === selected);
      }
    }

    if (sort) {
      const column = columns.find((item) => item.key === sort.key);

      if (column?.sortValue) {
        const readValue = column.sortValue;
        next = [...next].sort((a, b) => {
          const left = readValue(a);
          const right = readValue(b);
          const comparison =
            typeof left === "number" && typeof right === "number"
              ? left - right
              : String(left).localeCompare(String(right), "en", {
                  numeric: true,
                  sensitivity: "base",
                });

          return sort.direction === "asc" ? comparison : -comparison;
        });
      }
    }

    return next;
  }, [rows, query, searchAccessor, filters, filterValues, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = visibleRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const hasRows = rows.length > 0;
  const isFiltered = Boolean(query.trim()) || Object.values(filterValues).some(Boolean);
  const showToolbar = Boolean(searchAccessor) || filters.length > 0 || Boolean(toolbarActions);

  return (
    <div className="space-y-3">
      {showToolbar ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {searchAccessor ? (
              <SearchInput
                value={query}
                onChange={handleQueryChange}
                onClear={() => handleQueryChange("")}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="sm:max-w-xs"
              />
            ) : null}

            {filters.map((filter) => (
              <label key={filter.key} className="flex items-center gap-2">
                <span className="sr-only">{filter.label}</span>
                <select
                  value={filterValues[filter.key] ?? ""}
                  onChange={(event) =>
                    handleFilterChange(filter.key, event.target.value)
                  }
                  className="h-9 rounded-md border border-hospital-border bg-white px-3 text-sm text-hospital-text transition-colors focus:border-hospital-green focus:outline-none focus:ring-1 focus:ring-hospital-green"
                >
                  <option value="">{filter.allLabel ?? `All ${filter.label}`}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {toolbarActions ? (
            <div className="flex shrink-0 items-center gap-2">{toolbarActions}</div>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border border-hospital-border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            {caption ? <caption className="sr-only">{caption}</caption> : null}

            <thead>
              <tr className="border-b border-hospital-border bg-hospital-surface-muted">
                {columns.map((column) => {
                  const isSorted = sort?.key === column.key;
                  const alignClass = ALIGN_CLASSES[column.align ?? "left"];

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={
                        column.sortable
                          ? isSorted
                            ? sort.direction === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                          : undefined
                      }
                      className={cn(
                        "h-10 px-4 text-xs font-semibold text-hospital-text-muted",
                        alignClass,
                        column.headerClassName
                      )}
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(column)}
                          className={cn(
                            "inline-flex cursor-pointer items-center gap-1 rounded-sm text-xs font-semibold transition-colors hover:text-hospital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1",
                            isSorted ? "text-hospital-text" : "text-hospital-text-muted",
                            column.align === "right" && "flex-row-reverse"
                          )}
                        >
                          {column.header}
                          {isSorted ? (
                            sort.direction === "asc" ? (
                              <AltArrowUpIcon className="size-3.5" aria-hidden="true" />
                            ) : (
                              <AltArrowDownIcon className="size-3.5" aria-hidden="true" />
                            )
                          ) : (
                            <AltArrowDownIcon
                              className="size-3.5 opacity-40"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="border-b border-hospital-border transition-colors last:border-b-0 hover:bg-hospital-surface"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3 align-middle text-sm text-hospital-text",
                        ALIGN_CLASSES[column.align ?? "left"],
                        column.className
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageRows.length === 0 ? (
          <div className="border-t border-hospital-border">
            <EmptyState
              icon={emptyIcon}
              title={hasRows && isFiltered ? "No matching records" : emptyTitle}
              description={
                hasRows && isFiltered
                  ? "No records match the current search or filters. Adjust them and try again."
                  : emptyDescription
              }
              action={hasRows && isFiltered ? undefined : emptyAction}
              className="border-0 bg-transparent"
            />
          </div>
        ) : null}
      </div>

      {visibleRows.length > 0 ? (
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={visibleRows.length}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}

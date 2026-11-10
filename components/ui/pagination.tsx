"use client";

import {
  AltArrowLeftIcon,
  AltArrowRightIcon,
} from "@solar-icons/react/linear";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

type PageEntry = number | "ellipsis";

function getPageEntries(current: number, totalPages: number): PageEntry[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (current >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    current - 1,
    current,
    current + 1,
    "ellipsis",
    totalPages,
  ];
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  const pageEntries = getPageEntries(currentPage, totalPages);

  const controlClassName =
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-hospital-border bg-white text-hospital-text-muted transition-colors hover:bg-hospital-surface hover:text-hospital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none cursor-pointer";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-xs text-hospital-text-muted">
        Showing{" "}
        <span className="font-medium text-hospital-text">
          {start}&ndash;{end}
        </span>{" "}
        of <span className="font-medium text-hospital-text">{total}</span>{" "}
        records
      </p>

      <nav
        aria-label="Pagination"
        className="flex items-center gap-1"
      >
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className={controlClassName}
        >
          <AltArrowLeftIcon className="size-4" aria-hidden="true" />
        </button>

        {pageEntries.map((entry, index) =>
          entry === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-xs text-hospital-text-subtle"
              aria-hidden="true"
            >
              &hellip;
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-label={`Page ${entry}`}
              aria-current={entry === currentPage ? "page" : undefined}
              className={cn(
                "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1",
                entry === currentPage
                  ? "bg-hospital-green text-white"
                  : "text-hospital-text-muted hover:bg-hospital-surface-muted hover:text-hospital-text"
              )}
            >
              {entry}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className={controlClassName}
        >
          <AltArrowRightIcon className="size-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}

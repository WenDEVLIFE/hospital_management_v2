"use client";

import { CloseIcon, MagnifierIcon } from "@solar-icons/react/linear";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
  "aria-label"?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  onClear,
  className,
  "aria-label": ariaLabel = "Search",
}: SearchInputProps) {
  const clear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }
  };

  return (
    <div
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-md border border-hospital-border bg-white px-3 text-sm transition-colors",
        "focus-within:border-hospital-green focus-within:ring-1 focus-within:ring-hospital-green",
        className
      )}
    >
      <MagnifierIcon
        className="size-4 shrink-0 text-hospital-text-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault();
            clear();
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-full w-full min-w-0 border-0 bg-transparent p-0 text-sm text-hospital-text placeholder:text-slate-400 outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="-mr-1 shrink-0 rounded-md p-0.5 text-hospital-text-muted transition-colors hover:bg-hospital-surface-muted hover:text-hospital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1 cursor-pointer"
        >
          <CloseIcon className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

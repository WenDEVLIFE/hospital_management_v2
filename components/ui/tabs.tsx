"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onValueChange, className }: TabsProps) {
  const baseId = React.useId();
  const buttonRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const activeIndex = items.findIndex((item) => item.value === value);

  const moveFocus = (index: number) => {
    if (items.length === 0) return;
    const nextIndex = (index + items.length) % items.length;
    const nextItem = items[nextIndex];
    onValueChange(nextItem.value);
    buttonRefs.current[nextItem.value]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus(activeIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFocus(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveFocus(items.length - 1);
    }
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "flex items-center gap-1 border-b border-hospital-border overflow-x-auto",
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.value === value;

        return (
          <button
            key={item.value}
            ref={(node) => {
              buttonRefs.current[item.value] = node;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.value}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "-mb-px inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1",
              isActive
                ? "text-hospital-green border-b-2 border-hospital-green"
                : "text-hospital-text-muted border-transparent hover:text-hospital-text"
            )}
          >
            <span>{item.label}</span>
            {typeof item.count === "number" && (
              <span className="text-[11px] font-medium text-hospital-text-subtle">
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

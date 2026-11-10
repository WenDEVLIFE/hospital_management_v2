import * as React from "react";
import { cn } from "@/lib/utils";

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  borderless?: boolean;
}

export function Table({
  className,
  borderless = false,
  ...props
}: TableProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-auto bg-hospital-white",
        !borderless && "rounded-md border border-hospital-border",
        className
      )}
    >
      <table
        className="w-full caption-bottom text-sm text-hospital-text"
        {...props}
      />
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("bg-hospital-surface-muted border-b border-hospital-border", className)}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0 divide-y divide-hospital-border", className)}
      {...props}
    />
  );
}

export function TableFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn(
        "border-t border-hospital-border bg-hospital-surface-muted/50 font-medium text-hospital-text",
        className
      )}
      {...props}
    />
  );
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-hospital-surface/80 data-[state=selected]:bg-hospital-green-light",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-10 px-5 text-left align-middle font-semibold text-xs uppercase tracking-wider text-hospital-text-muted",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-5 py-3.5 align-middle text-sm text-hospital-text", className)}
      {...props}
    />
  );
}

export function TableCaption({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={cn("mt-4 text-xs text-hospital-text-muted", className)}
      {...props}
    />
  );
}

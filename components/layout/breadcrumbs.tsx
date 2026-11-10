"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AltArrowRightIcon, HomeIcon } from "@solar-icons/react/linear";
import { navigation } from "@/lib/navigation";

const labelByHref: Record<string, string> = {};
const moduleHrefs: string[] = [];

for (const section of navigation) {
  for (const item of section.items) {
    labelByHref[item.href] = item.label;
    moduleHrefs.push(item.href);
  }
}

const segmentLabels: Record<string, string> = {
  new: "New",
  "[id]": "Details",
};

function humanize(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isDetailSegment(href: string): boolean {
  return moduleHrefs.some((moduleHref) => href.startsWith(`${moduleHref}/`));
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (pathname === "/dashboard" || segments.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="overflow-x-auto text-[11px] select-none"
    >
      <ol className="flex items-center gap-2">
        <li className="flex items-center gap-2">
          <Link
            href="/dashboard"
            aria-label="Home"
            className="flex cursor-pointer items-center text-hospital-text-muted transition-colors hover:text-hospital-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
          >
            <HomeIcon aria-hidden="true" className="size-3.5" />
          </Link>
        </li>

        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          const title =
            labelByHref[href] ??
            segmentLabels[segment] ??
            (isDetailSegment(href) ? "Details" : humanize(segment));

          return (
            <li key={href} className="flex items-center gap-2">
              <AltArrowRightIcon
                aria-hidden="true"
                className="size-3 shrink-0 text-hospital-text-subtle"
              />

              {isLast ? (
                <span
                  aria-current="page"
                  className="truncate font-medium text-hospital-text"
                >
                  {title}
                </span>
              ) : (
                <Link
                  href={href}
                  className="cursor-pointer truncate text-hospital-text-muted transition-colors hover:text-hospital-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
                >
                  {title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

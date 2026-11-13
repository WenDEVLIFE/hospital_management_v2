"use client";

import { usePathname } from "next/navigation";
import { InfoCircleIcon } from "@solar-icons/react/linear";

// Routes that already read live Supabase data should not show the preview
// warning. Add each module as it is migrated in Phase 6.3.
const MIGRATED_PREFIXES = [
  "/patients",
  "/appointments",
  "/settings/account",
];

export function PreviewNotice() {
  const pathname = usePathname();

  const isMigrated = MIGRATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isMigrated) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2 text-[11px] text-amber-900">
      <InfoCircleIcon className="size-4 shrink-0" aria-hidden="true" />
      <p>
        Preview data — modules not yet migrated to Supabase still show synthetic
        records for interface review.
      </p>
    </div>
  );
}

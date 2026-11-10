import { InfoCircleIcon } from "@solar-icons/react/linear";

export function PreviewNotice() {
  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2 text-[11px] text-amber-900">
      <InfoCircleIcon className="size-4 shrink-0" aria-hidden="true" />
      <p>
        Preview data — synthetic records for interface review. Supabase is not
        connected.
      </p>
    </div>
  );
}

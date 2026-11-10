import { HospitalIcon } from "@solar-icons/react/linear";

const capabilityLines = [
  "Patient records",
  "Clinical workflows",
  "Billing and inventory",
] as const;

export function BrandPanel() {
  return (
    <div className="bg-hospital-green px-5 py-4 text-white lg:flex lg:flex-col lg:justify-between lg:p-10">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white/10">
            <HospitalIcon className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">
              Southern Philippines Medical Center
            </p>
            <p className="mt-0.5 text-[11px] text-white/75">
              Hospital Management System
            </p>
          </div>
        </div>

        <div className="mt-8 hidden lg:block">
          <p className="text-[11px] font-medium text-white/70">
            System scope
          </p>
          <ul className="mt-3">
            {capabilityLines.map((line) => (
              <li
                key={line}
                className="border-t border-white/15 py-3 text-[13px] text-white/90"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="hidden text-[11px] text-white/60 lg:block">
        Authorized hospital personnel only.
      </p>
    </div>
  );
}

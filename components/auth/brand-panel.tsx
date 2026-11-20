import Image from "next/image";

export function BrandPanel() {
  return (
    <div className="bg-hospital-green px-5 py-4 text-white lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-10">
      {/* Mobile: horizontal row · Large: vertical column */}
      <div className="flex items-center gap-3 lg:flex-col lg:items-center lg:gap-4">
        {/* Logo */}
       <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white lg:size-20 lg:rounded-lg">
          <Image
            src="/assets/spmc_logo.png"
            alt="Southern Philippines Medical Center"
            width={80}
            height={80}
            className="size-10 object-contain lg:size-20"
            priority
          />
        </div>

        {/* Name + subtitle */}
        <div className="min-w-0 lg:text-center">
          <p className="text-sm font-semibold leading-tight">
            Southern Philippines Medical Center
          </p>
          <p className="mt-0.5 text-[11px] text-white">
            Hospital Management System
          </p>
        </div>
      </div>
    </div>
  );
}
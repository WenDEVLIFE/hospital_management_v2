"use client";

import { BillListIcon } from "@solar-icons/react/linear";

import { UnavailableAction } from "@/components/module/unavailable-action";

export function CreateInvoiceAction() {
  return (
    <UnavailableAction
      label="Create Invoice"
      icon={<BillListIcon className="size-4" aria-hidden="true" />}
      description="Start a new invoice for recorded hospital charges."
      note="Invoice creation will be enabled once the hospital database connection is available. No invoice will be created in this preview."
    />
  );
}

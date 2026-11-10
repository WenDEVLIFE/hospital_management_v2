"use client";

import { WalletMoneyIcon } from "@solar-icons/react/linear";

import { UnavailableAction } from "@/components/module/unavailable-action";

export function RecordPaymentAction() {
  return (
    <UnavailableAction
      label="Record Payment"
      icon={<WalletMoneyIcon className="size-4" aria-hidden="true" />}
      description="Apply a payment to an outstanding patient invoice."
      note="Payment recording will be enabled once the hospital database connection is available. No payment will be posted in this preview. Payment recording must be transactional and must not create duplicate transactions."
    />
  );
}

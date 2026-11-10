"use client";

import {
  BoxIcon,
  CartLargeIcon,
  TuningIcon,
} from "@solar-icons/react/linear";

import { UnavailableAction } from "@/components/module/unavailable-action";

const NOTE =
  "Stock movements will be enabled once the hospital database connection is available. No stock quantity will change in this preview. Stock movements must be recorded as transactions; negative stock is not allowed.";

export function StockActions() {
  return (
    <>
      <UnavailableAction
        label="Stock In"
        variant="secondary"
        icon={<BoxIcon className="size-4" aria-hidden="true" />}
        description="Receive units into an inventory item batch."
        note={NOTE}
      />
      <UnavailableAction
        label="Stock Out"
        variant="secondary"
        icon={<CartLargeIcon className="size-4" aria-hidden="true" />}
        description="Issue units from an inventory item."
        note={NOTE}
      />
      <UnavailableAction
        label="Adjust Stock"
        variant="secondary"
        icon={<TuningIcon className="size-4" aria-hidden="true" />}
        description="Correct a recorded stock quantity after review."
        note={NOTE}
      />
    </>
  );
}

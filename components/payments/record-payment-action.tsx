"use client";

import * as React from "react";
import { WalletMoneyIcon } from "@solar-icons/react/linear";

import { Button } from "@/components/ui/button";
import { useCan } from "@/components/providers/permission-provider";
import { RecordPaymentDialog } from "@/components/billing/record-payment-dialog";
import type { InvoiceListRow } from "@/types/hospital";

export interface RecordPaymentActionProps {
  invoices: InvoiceListRow[];
}

export function RecordPaymentAction({ invoices }: RecordPaymentActionProps) {
  const [open, setOpen] = React.useState(false);
  const can = useCan();

  if (!can("billing.payment.create")) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={invoices.length === 0}>
        <WalletMoneyIcon className="size-4" aria-hidden="true" />
        Record Payment
      </Button>

      <RecordPaymentDialog
        key={open ? "open" : "closed"}
        open={open}
        invoices={invoices}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

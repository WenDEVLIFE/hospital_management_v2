"use client";

import * as React from "react";
import { BillListIcon } from "@solar-icons/react/linear";

import { Button } from "@/components/ui/button";
import { useCan } from "@/components/providers/permission-provider";

import { CreateInvoiceDialog } from "./create-invoice-dialog";

export interface CreateInvoiceActionProps {
  patients: Array<{
    id: string;
    full_name: string;
    medical_record_number: string;
  }>;
}

export function CreateInvoiceAction({ patients }: CreateInvoiceActionProps) {
  const [open, setOpen] = React.useState(false);
  const can = useCan();

  if (!can("billing.invoice.create")) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={patients.length === 0}>
        <BillListIcon className="size-4" aria-hidden="true" />
        Create Invoice
      </Button>

      <CreateInvoiceDialog
        key={open ? "open" : "closed"}
        open={open}
        onClose={() => setOpen(false)}
        patients={patients}
      />
    </>
  );
}

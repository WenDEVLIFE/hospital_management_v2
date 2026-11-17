"use client";

import * as React from "react";
import {
  BoxIcon,
  CartLargeIcon,
  TuningIcon,
} from "@solar-icons/react/linear";

import { Button } from "@/components/ui/button";
import { useCan } from "@/components/providers/permission-provider";
import type { StockMovementType } from "@/lib/validations/inventory";
import type { InventoryBatchOption, InventoryListRow } from "@/types/hospital";

import { StockMovementDialog } from "./stock-movement-dialog";

export interface StockActionsProps {
  items: InventoryListRow[];
  batches: InventoryBatchOption[];
}

const ACTIONS: Array<{
  mode: StockMovementType;
  label: string;
  permission: string;
  icon: React.ReactNode;
}> = [
  {
    mode: "stock_in",
    label: "Stock In",
    permission: "inventory.stock.in",
    icon: <BoxIcon className="size-4" aria-hidden="true" />,
  },
  {
    mode: "stock_out",
    label: "Stock Out",
    permission: "inventory.stock.out",
    icon: <CartLargeIcon className="size-4" aria-hidden="true" />,
  },
  {
    mode: "adjustment",
    label: "Adjust Stock",
    permission: "inventory.stock.adjust",
    icon: <TuningIcon className="size-4" aria-hidden="true" />,
  },
];

export function StockActions({ items, batches }: StockActionsProps) {
  const [mode, setMode] = React.useState<StockMovementType | null>(null);
  const can = useCan();

  const visibleActions = ACTIONS.filter((action) => can(action.permission));

  return (
    <>
      {visibleActions.map((action) => (
        <Button
          key={action.mode}
          variant="secondary"
          onClick={() => setMode(action.mode)}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}

      <StockMovementDialog
        key={`${mode ?? "closed"}`}
        open={mode !== null}
        mode={mode ?? "stock_in"}
        items={items}
        batches={batches}
        onClose={() => setMode(null)}
      />
    </>
  );
}

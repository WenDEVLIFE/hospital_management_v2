"use client";

import * as React from "react";
import { BoxIcon } from "@solar-icons/react/linear";

import { RecordTable, type Column } from "@/components/module/record-table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format";
import type { MedicationStockRow } from "@/types/hospital";

const STOCK_STATUS_OPTIONS = [
  { label: "Available", value: "available" },
  { label: "Low Stock", value: "low_stock" },
  { label: "Out of Stock", value: "out_of_stock" },
];

export interface MedicationInventoryProps {
  rows: MedicationStockRow[];
}

export function MedicationInventory({ rows }: MedicationInventoryProps) {
  const dosageForms = React.useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((row) => row.dosage_form)
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filters = React.useMemo(
    () => [
      {
        key: "stock_status",
        label: "stock status",
        allLabel: "All stock statuses",
        options: STOCK_STATUS_OPTIONS,
        accessor: (row: MedicationStockRow) => row.stock_status,
      },
      {
        key: "dosage_form",
        label: "dosage form",
        allLabel: "All dosage forms",
        options: dosageForms.map((form) => ({ label: form, value: form })),
        accessor: (row: MedicationStockRow) => row.dosage_form ?? "",
      },
    ],
    [dosageForms]
  );

  const columns = React.useMemo<Column<MedicationStockRow>[]>(
    () => [
      {
        key: "medicine",
        header: "Medicine",
        sortable: true,
        sortValue: (row) => row.brand_name ?? row.generic_name,
        cell: (row) => (
          <span className="font-medium text-hospital-text">
            {row.brand_name ?? row.generic_name}
          </span>
        ),
      },
      {
        key: "generic_name",
        header: "Generic Name",
        sortable: true,
        sortValue: (row) => row.generic_name,
        cell: (row) => row.generic_name,
      },
      {
        key: "strength",
        header: "Strength",
        cell: (row) => row.strength ?? "\u2014",
      },
      {
        key: "dosage_form",
        header: "Dosage Form",
        cell: (row) => row.dosage_form ?? "\u2014",
      },
      {
        key: "quantity",
        header: "Available Quantity",
        align: "right",
        sortable: true,
        sortValue: (row) => row.quantity_on_hand,
        cell: (row) => (
          <span className="tabular-nums">{row.quantity_on_hand}</span>
        ),
      },
      {
        key: "unit",
        header: "Unit",
        cell: (row) => row.unit ?? "\u2014",
      },
      {
        key: "expiration",
        header: "Expiration",
        sortable: true,
        sortValue: (row) => row.nearest_expiration ?? "",
        cell: (row) => (
          <span className="whitespace-nowrap">
            {row.nearest_expiration
              ? formatDate(row.nearest_expiration)
              : "\u2014"}
          </span>
        ),
      },
      {
        key: "stock_status",
        header: "Stock Status",
        cell: (row) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={row.stock_status} />
            {row.expiring_soon ? (
              <Badge variant="pending">Expiring soon</Badge>
            ) : null}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <RecordTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      caption="Medication inventory"
      searchPlaceholder="Search medicine, generic name, or strength"
      searchAccessor={(row) =>
        [
          row.medication_code,
          row.brand_name ?? "",
          row.generic_name,
          row.strength ?? "",
          row.dosage_form ?? "",
        ].join(" ")
      }
      filters={filters}
      emptyTitle="No medications found"
      emptyDescription="Medication stock records will appear here."
      emptyIcon={<BoxIcon className="size-5" aria-hidden="true" />}
    />
  );
}

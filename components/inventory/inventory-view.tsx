"use client";

import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIcon,
  ClockCircleIcon,
  ClipboardListIcon,
  DangerTriangleIcon,
  PillIcon,
  TransferHorizontalIcon,
  TuningIcon,
} from "@solar-icons/react/linear";

import { RecordTable, type Column } from "@/components/module/record-table";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import type {
  InventoryCategory,
  InventoryListRow,
  StockTransactionRow,
} from "@/types/hospital";
import { formatDate, formatDateTime } from "@/lib/format";

export interface InventoryViewProps {
  items: InventoryListRow[];
  categories: InventoryCategory[];
  transactions: StockTransactionRow[];
}

const TAB_ITEMS = [
  { value: "items", label: "Items" },
  { value: "history", label: "Stock History" },
];

const STOCK_STATUS_FILTERS = [
  { label: "Available", value: "available" },
  { label: "Low stock", value: "low_stock" },
  { label: "Out of stock", value: "out_of_stock" },
];

const TRANSACTION_TYPES: Record<
  StockTransactionRow["transaction_type"],
  { label: string; icon: React.ReactNode; className: string }
> = {
  stock_in: {
    label: "Stock in",
    icon: <ArrowDownIcon className="size-3.5" aria-hidden="true" />,
    className: "text-emerald-700",
  },
  stock_out: {
    label: "Stock out",
    icon: <ArrowUpIcon className="size-3.5" aria-hidden="true" />,
    className: "text-red-700",
  },
  adjustment: {
    label: "Adjustment",
    icon: <TuningIcon className="size-3.5" aria-hidden="true" />,
    className: "text-hospital-text",
  },
  transfer: {
    label: "Transfer",
    icon: <TransferHorizontalIcon className="size-3.5" aria-hidden="true" />,
    className: "text-hospital-text",
  },
  dispensing: {
    label: "Dispensing",
    icon: <PillIcon className="size-3.5" aria-hidden="true" />,
    className: "text-hospital-text",
  },
};

function StockStatusCell({ item }: { item: InventoryListRow }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <StatusBadge status={item.stock_status} />

      {item.stock_status === "out_of_stock" ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700">
          <DangerTriangleIcon className="size-3.5" aria-hidden="true" />
          No stock available
        </span>
      ) : item.stock_status === "low_stock" ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
          <DangerTriangleIcon className="size-3.5" aria-hidden="true" />
          Below reorder level
        </span>
      ) : null}

      {item.expiring_soon ? (
        <span className="inline-flex items-center gap-1 text-[11px] text-hospital-text-muted">
          <ClockCircleIcon className="size-3.5" aria-hidden="true" />
          Expiring soon
        </span>
      ) : null}
    </div>
  );
}

function TransactionTypeCell({
  type,
}: {
  type: StockTransactionRow["transaction_type"];
}) {
  const config = TRANSACTION_TYPES[type];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-hospital-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-hospital-text">{children}</dd>
    </div>
  );
}

export function InventoryView({
  items,
  categories,
  transactions,
}: InventoryViewProps) {
  const [tab, setTab] = React.useState<"items" | "history">("items");
  const [selected, setSelected] = React.useState<InventoryListRow | null>(null);

  const relatedMovements = React.useMemo(
    () =>
      selected
        ? transactions.filter((transaction) => transaction.item_id === selected.id)
        : [],
    [selected, transactions]
  );

  const itemColumns: Column<InventoryListRow>[] = [
    {
      key: "item_code",
      header: "Item Code",
      sortable: true,
      sortValue: (row) => row.item_code,
      cell: (row) => (
        <span className="font-mono text-[11px] text-hospital-text">
          {row.item_code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Item Name",
      sortable: true,
      sortValue: (row) => row.name,
      cell: (row) => (
        <span className="font-medium text-hospital-text">{row.name}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      sortValue: (row) => row.category_name ?? "",
      cell: (row) => row.category_name ?? "\u2014",
    },
    {
      key: "quantity",
      header: "Quantity",
      align: "right",
      sortable: true,
      sortValue: (row) => row.quantity_on_hand,
      cell: (row) => (
        <span className="whitespace-nowrap tabular-nums">
          {row.quantity_on_hand}{" "}
          <span className="text-[11px] text-hospital-text-muted">{row.unit}</span>
        </span>
      ),
    },
    {
      key: "reorder_level",
      header: "Reorder Level",
      align: "right",
      sortable: true,
      sortValue: (row) => row.reorder_level,
      cell: (row) => (
        <span className="tabular-nums text-hospital-text-muted">
          {row.reorder_level}
        </span>
      ),
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
      cell: (row) => <StockStatusCell item={row} />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`View ${row.name}`}
          onClick={() => setSelected(row)}
        >
          View
        </Button>
      ),
    },
  ];

  const historyColumns: Column<StockTransactionRow>[] = [
    {
      key: "reference",
      header: "Reference",
      sortable: true,
      sortValue: (row) => row.batch_number ?? row.reference_id ?? "",
      cell: (row) => {
        const reference = row.batch_number ?? row.reference_id;

        return reference ? (
          <span
            className="font-mono text-[11px] text-hospital-text"
            title={row.reference_type ?? undefined}
          >
            {reference}
          </span>
        ) : (
          <span className="text-hospital-text-muted">{"\u2014"}</span>
        );
      },
    },
    {
      key: "item",
      header: "Item",
      sortable: true,
      sortValue: (row) => row.item_name,
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-hospital-text">{row.item_name}</p>
          <p className="font-mono text-[11px] text-hospital-text-muted">
            {row.item_code}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      sortValue: (row) => row.transaction_type,
      cell: (row) => <TransactionTypeCell type={row.transaction_type} />,
    },
    {
      key: "quantity",
      header: "Quantity",
      align: "right",
      sortable: true,
      sortValue: (row) => row.quantity,
      cell: (row) => (
        <span className="whitespace-nowrap tabular-nums">
          {row.quantity}{" "}
          <span className="text-[11px] text-hospital-text-muted">{row.unit}</span>
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (row) => (
        <span className="text-hospital-text-muted">{row.reason ?? "\u2014"}</span>
      ),
    },
    {
      key: "performed_by",
      header: "Performed By",
      sortable: true,
      sortValue: (row) => row.performed_by_name,
      cell: (row) => row.performed_by_name,
    },
    {
      key: "performed_at",
      header: "Performed",
      sortable: true,
      sortValue: (row) => row.performed_at,
      cell: (row) => (
        <span className="whitespace-nowrap">
          {formatDateTime(row.performed_at)}
        </span>
      ),
    },
  ];

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.id,
  }));

  return (
    <div className="space-y-4">
      <Tabs
        items={TAB_ITEMS}
        value={tab}
        onValueChange={(value) => setTab(value as "items" | "history")}
      />

      {tab === "items" ? (
        <div role="tabpanel" aria-label="Inventory items">
          <RecordTable
            rows={items}
            columns={itemColumns}
            rowKey={(row) => row.id}
            caption="Inventory items"
            searchPlaceholder="Search item code or name"
            searchAccessor={(row) => `${row.item_code} ${row.name}`}
            filters={[
              {
                key: "stock_status",
                label: "stock status",
                allLabel: "All stock statuses",
                options: STOCK_STATUS_FILTERS,
                accessor: (row) => row.stock_status,
              },
              {
                key: "category_id",
                label: "category",
                allLabel: "All categories",
                options: categoryOptions,
                accessor: (row) => row.category_id ?? "",
              },
            ]}
            emptyTitle="No inventory items found"
            emptyDescription="Items will appear here once stock is received."
            emptyIcon={<BoxIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        </div>
      ) : (
        <div role="tabpanel" aria-label="Stock history">
          <RecordTable
            rows={transactions}
            columns={historyColumns}
            rowKey={(row) => row.id}
            caption="Stock transaction history"
            searchPlaceholder="Search reference or item"
            searchAccessor={(row) =>
              [
                row.item_code,
                row.item_name,
                row.batch_number ?? "",
                row.performed_by_name,
              ].join(" ")
            }
            emptyTitle="No stock movements recorded"
            emptyDescription="Stock movements will appear here once they are recorded."
            emptyIcon={
              <ClipboardListIcon className="size-5" aria-hidden="true" />
            }
            pageSize={10}
          />
        </div>
      )}

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? selected.name : "Inventory item"}
        description="Item details and recorded stock movements."
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <span className="font-mono text-[11px] text-hospital-text-muted">
                {selected.item_code}
              </span>
              <StockStatusCell item={selected} />
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Category">
                {selected.category_name ?? "\u2014"}
              </Detail>
              <Detail label="Quantity on hand">
                <span className="tabular-nums">
                  {selected.quantity_on_hand} {selected.unit}
                </span>
              </Detail>
              <Detail label="Reorder level">
                <span className="tabular-nums">{selected.reorder_level}</span>
              </Detail>
              <Detail label="Nearest expiration">
                {selected.nearest_expiration
                  ? formatDate(selected.nearest_expiration)
                  : "\u2014"}
              </Detail>
            </dl>

            <section>
              <h3 className="text-[11px] font-semibold text-hospital-text-muted">
                Stock movements
              </h3>
              {relatedMovements.length > 0 ? (
                <ul className="mt-2 divide-y divide-hospital-border rounded-md border border-hospital-border">
                  {relatedMovements.map((movement) => (
                    <li
                      key={movement.id}
                      className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] text-hospital-text">
                          {movement.batch_number ??
                            movement.reference_id ??
                            "No reference"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-hospital-text-muted">
                          {formatDateTime(movement.performed_at)} ·{" "}
                          {movement.performed_by_name}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <TransactionTypeCell type={movement.transaction_type} />
                        <span className="text-sm font-medium tabular-nums text-hospital-text">
                          {movement.quantity} {movement.unit}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-hospital-text-muted">
                  No stock movements recorded for this item.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

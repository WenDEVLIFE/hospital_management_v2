import type {
  InventoryBatch,
  InventoryCategory,
  InventoryItem,
  InventoryListRow,
  StockStatus,
  StockTransaction,
  StockTransactionRow,
} from "@/types/hospital";
import {
  isoAt,
  isoDate,
  previewUuid,
  profileIds,
  profileNameById,
} from "./base";

const CATEGORY_SEEDS = [
  { name: "Medical Supplies", description: "General medical consumables." },
  { name: "Surgical Supplies", description: "Operating and procedure supplies." },
  { name: "Laboratory Supplies", description: "Laboratory collection and testing supplies." },
  { name: "PPE", description: "Personal protective equipment." },
  { name: "Housekeeping", description: "Cleaning and housekeeping supplies." },
];

export const inventoryCategories: InventoryCategory[] = CATEGORY_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(36, index + 1),
    name: seed.name,
    description: seed.description,
    created_at: isoAt(-300, 8),
  })
);

const categoryNameById = new Map(
  inventoryCategories.map((category) => [category.id, category.name])
);

type ItemSeed = {
  code: string;
  name: string;
  categoryIndex: number;
  unit: string;
  reorder: number;
  quantity: number;
  expirationOffset: number;
};

const ITEM_SEEDS: ItemSeed[] = [
  { code: "SUP-0001", name: "Surgical Gloves (Medium)", categoryIndex: 0, unit: "box", reorder: 50, quantity: 120, expirationOffset: 200 },
  { code: "SUP-0002", name: "Face Mask (3-ply)", categoryIndex: 3, unit: "box", reorder: 100, quantity: 60, expirationOffset: 45 },
  { code: "SUP-0003", name: "IV Cannula 20G", categoryIndex: 0, unit: "piece", reorder: 200, quantity: 0, expirationOffset: 300 },
  { code: "SUP-0004", name: "Syringe 5 mL", categoryIndex: 0, unit: "piece", reorder: 300, quantity: 500, expirationOffset: 400 },
  { code: "SUP-0005", name: "Sterile Gauze Pad", categoryIndex: 1, unit: "pack", reorder: 80, quantity: 40, expirationOffset: 120 },
  { code: "SUP-0006", name: "Alcohol 70%", categoryIndex: 0, unit: "bottle", reorder: 40, quantity: 90, expirationOffset: 180 },
  { code: "SUP-0007", name: "Nebulizer Kit", categoryIndex: 1, unit: "set", reorder: 15, quantity: 8, expirationOffset: 60 },
  { code: "SUP-0008", name: "Blood Collection Tube", categoryIndex: 2, unit: "box", reorder: 30, quantity: 75, expirationOffset: 250 },
  { code: "SUP-0009", name: "Cotton Balls", categoryIndex: 0, unit: "pack", reorder: 60, quantity: 150, expirationOffset: 500 },
  { code: "SUP-0010", name: "Adhesive Bandage", categoryIndex: 0, unit: "box", reorder: 40, quantity: 0, expirationOffset: 90 },
  { code: "SUP-0011", name: "Examination Gloves", categoryIndex: 3, unit: "box", reorder: 100, quantity: 220, expirationOffset: 150 },
  { code: "SUP-0012", name: "Surgical Cap", categoryIndex: 1, unit: "pack", reorder: 50, quantity: 130, expirationOffset: 210 },
  { code: "SUP-0013", name: "Isopropyl Wipes", categoryIndex: 0, unit: "pack", reorder: 30, quantity: 25, expirationOffset: 20 },
  { code: "SUP-0014", name: "Specimen Bag", categoryIndex: 2, unit: "pack", reorder: 25, quantity: 60, expirationOffset: 330 },
];

export const inventoryItems: InventoryItem[] = ITEM_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(37, index + 1),
    item_code: seed.code,
    name: seed.name,
    description: "Synthetic preview inventory item.",
    category_id: inventoryCategories[seed.categoryIndex].id,
    unit: seed.unit,
    reorder_level: seed.reorder,
    is_active: true,
    created_at: isoAt(-250, 8),
    updated_at: isoAt(-20, 8),
  })
);

export const inventoryBatches: InventoryBatch[] = ITEM_SEEDS.map(
  (seed, index) => ({
    id: previewUuid(38, index + 1),
    item_id: inventoryItems[index].id,
    batch_number: `BATCH-2026-${String(index + 1).padStart(4, "0")}`,
    quantity_received: seed.quantity,
    quantity_remaining: seed.quantity,
    expiration_date: isoDate(seed.expirationOffset),
    unit_cost: roundValue(15 + index * 7.5),
    received_at: isoAt(-60 + index, 8),
    created_at: isoAt(-60 + index, 8),
  })
);

const batchById = new Map(
  inventoryBatches.map((batch) => [batch.id, batch])
);

function roundValue(value: number): number {
  return Math.round(value * 100) / 100;
}

function resolveStockStatus(quantity: number, reorder: number): StockStatus {
  if (quantity <= 0) {
    return "out_of_stock";
  }

  if (quantity <= reorder) {
    return "low_stock";
  }

  return "available";
}

const quantityByItemId = new Map<string, number>();

for (const batch of inventoryBatches) {
  quantityByItemId.set(
    batch.item_id,
    (quantityByItemId.get(batch.item_id) ?? 0) + batch.quantity_remaining
  );
}

export const inventoryListRows: InventoryListRow[] = inventoryItems
  .map((item, index) => {
    const seed = ITEM_SEEDS[index];
    const quantity = quantityByItemId.get(item.id) ?? 0;

    return {
      id: item.id,
      item_code: item.item_code,
      name: item.name,
      category_id: item.category_id,
      category_name: item.category_id
        ? categoryNameById.get(item.category_id) ?? null
        : null,
      unit: item.unit,
      quantity_on_hand: quantity,
      reorder_level: item.reorder_level,
      nearest_expiration: isoDate(seed.expirationOffset),
      stock_status: resolveStockStatus(quantity, item.reorder_level),
      expiring_soon: seed.expirationOffset <= 90,
    };
  })
  .sort((a, b) =>
    a.item_code === b.item_code ? 0 : a.item_code < b.item_code ? -1 : 1
  );

const TRANSACTION_TYPES: StockTransaction["transaction_type"][] = [
  "stock_in",
  "stock_out",
  "adjustment",
  "transfer",
  "dispensing",
];

export const stockTransactions: StockTransaction[] = inventoryItems.map(
  (item, index) => {
    const batch = inventoryBatches[index];

    return {
      id: previewUuid(39, index + 1),
      item_id: item.id,
      batch_id: batch.id,
      transaction_type: TRANSACTION_TYPES[index % TRANSACTION_TYPES.length],
      quantity: 10 + index * 5,
      reference_type:
        index % 3 === 0
          ? "purchase_order"
          : index % 3 === 1
            ? "requisition"
            : null,
      reference_id: index % 3 === 2 ? null : previewUuid(40, index + 1),
      reason: "Synthetic preview stock movement.",
      performed_by: profileIds.inventory,
      performed_at: isoAt(-14 + index, 9),
      created_at: isoAt(-14 + index, 9),
    };
  }
);

export const stockTransactionRows: StockTransactionRow[] = stockTransactions
  .map((transaction) => {
    const item = inventoryItems.find(
      (entry) => entry.id === transaction.item_id
    );
    const batch = transaction.batch_id
      ? batchById.get(transaction.batch_id)
      : undefined;

    return {
      id: transaction.id,
      item_id: transaction.item_id,
      item_code: item?.item_code ?? "SUP-0000",
      item_name: item?.name ?? "Test Item",
      unit: item?.unit ?? "unit",
      batch_id: transaction.batch_id,
      batch_number: batch?.batch_number ?? null,
      transaction_type: transaction.transaction_type,
      quantity: transaction.quantity,
      reference_type: transaction.reference_type,
      reference_id: transaction.reference_id,
      reason: transaction.reason,
      performed_by_name:
        profileNameById.get(transaction.performed_by) ?? "Test User",
      performed_at: transaction.performed_at,
    };
  })
  .sort((a, b) =>
    a.performed_at === b.performed_at
      ? 0
      : a.performed_at < b.performed_at
        ? 1
        : -1
  );

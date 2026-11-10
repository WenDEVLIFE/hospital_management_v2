import type {
  InventoryCategory,
  InventoryListRow,
  InventoryStats,
  StockTransactionRow,
} from "@/types/hospital";
import {
  inventoryBatches,
  inventoryCategories,
  inventoryItems,
  inventoryListRows,
  stockTransactionRows,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import { emptyPage, matchesQuery, pageSlice, roundMoney } from "./query";
import type { DataResult, PagedResult } from "./result";

function emptyStats(): InventoryStats {
  return {
    totalItems: 0,
    available: 0,
    lowStock: 0,
    outOfStock: 0,
    expiringSoon: 0,
    stockValue: 0,
    transactions: 0,
  };
}

export async function listInventoryItems(
  params: {
    q?: string;
    stockStatus?: string;
    categoryId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<InventoryListRow>> {
  // TODO(supabase): replace with supabase.from("inventory_items").select("*")
  if (!isPreviewMode) {
    return emptyPage<InventoryListRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = inventoryListRows.filter((item) => {
    if (params.stockStatus && item.stock_status !== params.stockStatus) {
      return false;
    }

    if (params.categoryId && item.category_id !== params.categoryId) {
      return false;
    }

    return matchesQuery(params.q, [
      item.item_code,
      item.name,
      item.category_name,
      item.unit,
    ]);
  });

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listStockTransactions(
  params: {
    itemId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<StockTransactionRow>> {
  // TODO(supabase): replace with supabase.from("stock_transactions").select("*")
  if (!isPreviewMode) {
    return emptyPage<StockTransactionRow>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = stockTransactionRows.filter(
    (transaction) => !params.itemId || transaction.item_id === params.itemId
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listInventoryCategories(): Promise<
  DataResult<InventoryCategory[]>
> {
  // TODO(supabase): replace with supabase.from("inventory_categories").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: inventoryCategories, error: null };
}

export async function getInventoryStats(): Promise<DataResult<InventoryStats>> {
  // TODO(supabase): replace with supabase.from("v_inventory_summary").select("*")
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  const stats = emptyStats();
  stats.totalItems = inventoryItems.length;
  stats.transactions = stockTransactionRows.length;

  for (const item of inventoryListRows) {
    if (item.stock_status === "available") {
      stats.available += 1;
    }

    if (item.stock_status === "low_stock") {
      stats.lowStock += 1;
    }

    if (item.stock_status === "out_of_stock") {
      stats.outOfStock += 1;
    }

    if (item.expiring_soon) {
      stats.expiringSoon += 1;
    }
  }

  stats.stockValue = roundMoney(
    inventoryBatches.reduce(
      (total, batch) =>
        total + batch.quantity_remaining * (batch.unit_cost ?? 0),
      0
    )
  );

  return { data: stats, error: null };
}

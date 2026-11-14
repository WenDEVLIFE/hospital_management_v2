import { cache } from "react";

import type {
  InventoryCategory,
  InventoryListRow,
  InventoryStats,
  StockStatus,
  StockTransaction,
  StockTransactionRow,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizePagination,
  pageSlice,
  roundMoney,
  sanitizeSearchTerm,
} from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const INVENTORY_COLUMNS =
  "id, item_code, name, category_id, unit, reorder_level, inventory_categories(name), inventory_batches(quantity_remaining, expiration_date, unit_cost)";

const TRANSACTION_COLUMNS =
  "*, inventory_items(item_code, name, unit), inventory_batches(batch_number), profiles!stock_transactions_performed_by_fkey(full_name)";

type Relation<T> = T | T[] | null;

type InventoryJoinRow = {
  id: string;
  item_code: string;
  name: string;
  category_id: string | null;
  unit: string;
  reorder_level: number;
  inventory_categories: Relation<{ name: string }>;
  inventory_batches: Array<{
    quantity_remaining: number;
    expiration_date: string | null;
    unit_cost: number | null;
  }> | null;
};

type TransactionJoinRow = StockTransaction & {
  inventory_items: Relation<{
    item_code: string;
    name: string;
    unit: string;
  }>;
  inventory_batches: Relation<{ batch_number: string | null }>;
  profiles: Relation<{ full_name: string }>;
};

type InventorySnapshot = {
  rows: InventoryListRow[];
  stockValue: number;
};

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

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

function isExpiringSoon(date: string | null): boolean {
  if (!date) {
    return false;
  }

  const expiration = new Date(`${date}T23:59:59+08:00`);

  if (Number.isNaN(expiration.getTime())) {
    return false;
  }

  const threshold = Date.now() + 90 * 24 * 60 * 60 * 1000;

  return expiration.getTime() <= threshold;
}

const loadInventorySnapshot = cache(
  async (): Promise<DataResult<InventorySnapshot>> => {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("inventory_items")
      .select(INVENTORY_COLUMNS)
      .order("name", { ascending: true });

    if (error) {
      return { data: null, error: toDataError(error) };
    }

    const rows: InventoryListRow[] = [];
    let stockValue = 0;

    for (const item of (data ?? []) as InventoryJoinRow[]) {
      const category = firstRelation(item.inventory_categories);
      const batches = item.inventory_batches ?? [];
      const quantityOnHand = batches.reduce(
        (total, batch) => total + Number(batch.quantity_remaining ?? 0),
        0
      );
      const expirations = batches
        .map((batch) => batch.expiration_date)
        .filter((date): date is string => Boolean(date))
        .sort();
      const nearestExpiration = expirations[0] ?? null;
      const reorderLevel = Number(item.reorder_level ?? 0);

      let stockStatus: StockStatus = "available";

      if (quantityOnHand <= 0) {
        stockStatus = "out_of_stock";
      } else if (quantityOnHand <= reorderLevel) {
        stockStatus = "low_stock";
      }

      for (const batch of batches) {
        stockValue +=
          Number(batch.quantity_remaining ?? 0) *
          Number(batch.unit_cost ?? 0);
      }

      rows.push({
        id: item.id,
        item_code: item.item_code,
        name: item.name,
        category_id: item.category_id,
        category_name: category?.name ?? null,
        unit: item.unit,
        quantity_on_hand: quantityOnHand,
        reorder_level: reorderLevel,
        nearest_expiration: nearestExpiration,
        stock_status: stockStatus,
        expiring_soon: isExpiringSoon(nearestExpiration),
      });
    }

    return {
      data: { rows, stockValue: roundMoney(stockValue) },
      error: null,
    };
  }
);

export async function listInventoryItems(
  params: {
    q?: string;
    stockStatus?: string;
    categoryId?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<InventoryListRow>> {
  const snapshot = await loadInventorySnapshot();

  if (snapshot.error) {
    return { data: null, error: snapshot.error };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";
  const filtered = (snapshot.data?.rows ?? []).filter((item) => {
    if (params.stockStatus && item.stock_status !== params.stockStatus) {
      return false;
    }

    if (params.categoryId && item.category_id !== params.categoryId) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [item.item_code, item.name, item.category_name, item.unit].some(
      (value) => (value ?? "").toLowerCase().includes(search)
    );
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
  const meta = normalizePagination(params.page, params.pageSize);
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("stock_transactions")
    .select(TRANSACTION_COLUMNS, { count: "exact" });

  if (params.itemId) {
    query = query.eq("item_id", params.itemId);
  }

  const { data, error, count } = await query
    .order("performed_at", { ascending: false })
    .range(meta.offset, meta.offset + meta.pageSize - 1);

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const rows: StockTransactionRow[] = (
    (data ?? []) as TransactionJoinRow[]
  ).map((row) => {
    const item = firstRelation(row.inventory_items);
    const batch = firstRelation(row.inventory_batches);
    const performedBy = firstRelation(row.profiles);

    return {
      id: row.id,
      item_id: row.item_id,
      item_code: item?.item_code ?? "Unknown item",
      item_name: item?.name ?? "Unknown item",
      unit: item?.unit ?? "\u2014",
      batch_id: row.batch_id,
      batch_number: batch?.batch_number ?? null,
      transaction_type: row.transaction_type,
      quantity: Number(row.quantity),
      reference_type: row.reference_type,
      reference_id: row.reference_id,
      reason: row.reason,
      performed_by_name: performedBy?.full_name ?? "Unknown staff",
      performed_at: row.performed_at,
    };
  });

  return {
    data: {
      rows,
      total: count ?? 0,
      page: meta.page,
      pageSize: meta.pageSize,
    },
    error: null,
  };
}

export async function listInventoryCategories(): Promise<
  DataResult<InventoryCategory[]>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("inventory_categories")
    .select("id, name, description, created_at")
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as InventoryCategory[], error: null };
}

export async function getInventoryStats(): Promise<
  DataResult<InventoryStats>
> {
  const supabase = await getSupabaseServerClient();

  const [snapshot, transactionCount] = await Promise.all([
    loadInventorySnapshot(),
    supabase
      .from("stock_transactions")
      .select("id", { count: "exact", head: true }),
  ]);

  if (snapshot.error) {
    return { data: null, error: snapshot.error };
  }

  const stats = emptyStats();
  const rows = snapshot.data?.rows ?? [];

  stats.totalItems = rows.length;
  stats.stockValue = snapshot.data?.stockValue ?? 0;
  stats.transactions = transactionCount.error
    ? 0
    : transactionCount.count ?? 0;

  for (const item of rows) {
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

  return { data: stats, error: null };
}

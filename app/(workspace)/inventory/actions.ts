"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  stockMovementSchema,
  type StockMovementInput,
} from "@/lib/validations/inventory";

export type StockMovementResult =
  | { ok: true; referenceId: string }
  | { ok: false; formError: string };

function stockMovementErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("insufficient stock")) {
    return "There is not enough stock on hand for this movement.";
  }

  if (message.includes("inactive")) {
    return "This inventory item is inactive and cannot be moved.";
  }

  if (message.includes("item not found")) {
    return "The inventory item could not be found.";
  }

  if (message.includes("batch not found")) {
    return "The inventory batch could not be found.";
  }

  if (message.includes("does not belong")) {
    return "The selected batch does not belong to this item.";
  }

  if (message.includes("exceeds the received")) {
    return "The counted quantity cannot exceed the quantity originally received for this batch.";
  }

  if (message.includes("reason is required")) {
    return "A reason is required for this stock movement.";
  }

  if (message.includes("cannot be negative")) {
    return "Enter a quantity of zero or more.";
  }

  if (message.includes("greater than zero")) {
    return "Enter a quantity greater than zero.";
  }

  if (message.includes("unsupported stock movement")) {
    return "Select a supported stock movement.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateInventory() {
  revalidatePath("/inventory");
  revalidatePath("/pharmacy");
  revalidatePath("/dashboard");
}

export async function adjustInventoryAction(
  input: StockMovementInput
): Promise<StockMovementResult> {
  const parsed = stockMovementSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the stock movement details.",
    };
  }

  const value = parsed.data;
  const unitCost =
    value.unitCost === "" || value.unitCost === undefined
      ? null
      : Number(value.unitCost);

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("adjust_inventory", {
    p_item_id: value.itemId,
    p_transaction_type: value.transactionType,
    p_quantity: value.quantity,
    p_reason: value.reason?.trim() ? value.reason.trim() : null,
    p_batch_id: value.batchId ? value.batchId : null,
    p_batch_number: value.batchNumber?.trim() ? value.batchNumber.trim() : null,
    p_expiration_date: value.expirationDate?.trim()
      ? value.expirationDate.trim()
      : null,
    p_unit_cost: unitCost,
  });

  if (error) {
    return { ok: false, formError: stockMovementErrorMessage(error) };
  }

  if (!data) {
    return {
      ok: false,
      formError: "The stock movement was recorded but no reference was returned.",
    };
  }

  revalidateInventory();

  return { ok: true, referenceId: String(data) };
}

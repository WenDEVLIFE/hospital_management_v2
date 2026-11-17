import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const STOCK_MOVEMENT_TYPES = [
  "stock_in",
  "stock_out",
  "adjustment",
] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

const optionalUuid = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || UUID_PATTERN.test(value),
    "Select a valid record."
  );

export const stockMovementSchema = z
  .object({
    itemId: z
      .string()
      .trim()
      .regex(UUID_PATTERN, "Select an inventory item."),
    transactionType: z
      .string()
      .trim()
      .refine(
        (value) =>
          (STOCK_MOVEMENT_TYPES as readonly string[]).includes(value),
        "Select a stock movement."
      ),
    quantity: z.coerce.number().refine(
      (value) => Number.isFinite(value) && value >= 0,
      "Enter a quantity of zero or more."
    ),
    reason: z
      .string()
      .trim()
      .max(500, "Keep the reason under 500 characters.")
      .optional(),
    batchId: optionalUuid.optional(),
    batchNumber: z
      .string()
      .trim()
      .max(60, "Keep the batch number under 60 characters.")
      .optional(),
    expirationDate: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || DATE_PATTERN.test(value),
        "Enter a valid expiration date."
      )
      .optional(),
    unitCost: z
      .union([z.literal(""), z.coerce.number()])
      .optional()
      .refine(
        (value) => value === "" || value === undefined || value >= 0,
        "Unit cost cannot be negative."
      ),
  })
  .superRefine((value, ctx) => {
    if (value.transactionType === "adjustment") {
      if (!value.batchId) {
        ctx.addIssue({
          code: "custom",
          path: ["batchId"],
          message: "Select the batch to adjust.",
        });
      }
    } else if (value.quantity <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "Enter a quantity greater than zero.",
      });
    }

    if (
      (value.transactionType === "stock_out" ||
        value.transactionType === "adjustment") &&
      !value.reason?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message:
          value.transactionType === "stock_out"
            ? "Record why the stock is being issued."
            : "Record why the count is being adjusted.",
      });
    }
  });

export type StockMovementInput = z.infer<typeof stockMovementSchema>;

import { z } from "zod";

export const verifyLaboratoryOrderSchema = z.object({
  orderId: z.string().uuid("Select a valid laboratory request."),
});

export type VerifyLaboratoryOrderInput = z.infer<
  typeof verifyLaboratoryOrderSchema
>;

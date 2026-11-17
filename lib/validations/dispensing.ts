import { z } from "zod";

export const dispensePrescriptionSchema = z.object({
  prescriptionId: z.string().uuid("Select a valid prescription."),
});

export type DispensePrescriptionInput = z.infer<
  typeof dispensePrescriptionSchema
>;

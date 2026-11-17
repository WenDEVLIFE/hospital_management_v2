import { z } from "zod";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const optionalUuid = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || UUID_PATTERN.test(value),
    "Select a valid physician."
  );

export const admissionSchema = z.object({
  patient_id: z.string().trim().regex(UUID_PATTERN, "Select a patient."),
  department_id: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select a department."),
  attending_physician_id: optionalUuid,
  bed_id: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select an available bed."),
  admission_type: z.string().trim(),
  admission_notes: z.string().trim(),
});

export const transferSchema = z.object({
  admission_id: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select an admission."),
  to_bed_id: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select an available bed."),
  transfer_reason: z.string().trim(),
});

export const dischargeSchema = z.object({
  admission_id: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Select an admission."),
  discharge_notes: z.string().trim(),
});

export type AdmissionInput = z.infer<typeof admissionSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type DischargeInput = z.infer<typeof dischargeSchema>;

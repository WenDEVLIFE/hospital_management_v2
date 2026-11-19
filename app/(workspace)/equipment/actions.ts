"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  completeWorkOrderSchema,
  createWorkOrderSchema,
  recordCalibrationSchema,
  registerEquipmentSchema,
  type CompleteWorkOrderInput,
  type CreateWorkOrderInput,
  type RecordCalibrationInput,
  type RegisterEquipmentInput,
} from "@/lib/validations/equipment";

export type EquipmentWriteResult =
  | { ok: true; id?: string }
  | { ok: false; formError: string };

function equipmentErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("medical_equipment_serial_number_key")) {
    return "That serial number is already registered.";
  }

  if (message.includes("medical_equipment_asset_number_key")) {
    return "That asset number is already registered.";
  }

  if (message.includes("retired equipment")) {
    return "Retired equipment cannot receive work orders.";
  }

  if (message.includes("record the resolution")) {
    return "Record the resolution before completing.";
  }

  if (message.includes("already completed")) {
    return "This work order is already completed.";
  }

  if (message.includes("work order is cancelled")) {
    return "This work order is cancelled.";
  }

  if (message.includes("describe the issue")) {
    return "Describe the issue.";
  }

  if (message.includes("asset number, name and serial number")) {
    return "Asset number, name and serial number are required.";
  }

  if (message.includes("certificate number is required")) {
    return "A certificate number is required.";
  }

  if (message.includes("unsupported calibration result")) {
    return "Select a supported calibration result.";
  }

  if (message.includes("unsupported priority")) {
    return "Select a supported priority.";
  }

  if (message.includes("equipment not found")) {
    return "The equipment could not be found.";
  }

  if (message.includes("work order not found")) {
    return "The work order could not be found.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateEquipment() {
  revalidatePath("/equipment");
  revalidatePath("/dashboard");
}

export async function registerEquipmentAction(
  input: RegisterEquipmentInput
): Promise<EquipmentWriteResult> {
  const parsed = registerEquipmentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the equipment details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("register_equipment", {
    p_asset_number: value.assetNumber,
    p_name: value.name,
    p_serial_number: value.serialNumber,
    p_category_id: value.categoryId || null,
    p_department_id: value.departmentId || null,
    p_manufacturer: value.manufacturer || null,
    p_model: value.model || null,
    p_location: value.location || null,
    p_next_maintenance_due: value.nextMaintenanceDue || null,
    p_next_calibration_due: value.nextCalibrationDue || null,
  });

  if (error) {
    return { ok: false, formError: equipmentErrorMessage(error) };
  }

  revalidateEquipment();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function createWorkOrderAction(
  input: CreateWorkOrderInput
): Promise<EquipmentWriteResult> {
  const parsed = createWorkOrderSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the work order details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_equipment_work_order", {
    p_equipment_id: value.equipmentId,
    p_issue_description: value.issueDescription,
    p_priority: value.priority,
    p_notes: value.notes || null,
  });

  if (error) {
    return { ok: false, formError: equipmentErrorMessage(error) };
  }

  revalidateEquipment();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function completeWorkOrderAction(
  input: CompleteWorkOrderInput
): Promise<EquipmentWriteResult> {
  const parsed = completeWorkOrderSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the resolution details.",
    };
  }

  const value = parsed.data;
  const cost = value.cost === "" ? 0 : Number(value.cost);
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("complete_equipment_work_order", {
    p_work_order_id: value.workOrderId,
    p_resolution_notes: value.resolutionNotes,
    p_parts_used: value.partsUsed || null,
    p_cost: cost,
  });

  if (error) {
    return { ok: false, formError: equipmentErrorMessage(error) };
  }

  revalidateEquipment();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function recordCalibrationAction(
  input: RecordCalibrationInput
): Promise<EquipmentWriteResult> {
  const parsed = recordCalibrationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the calibration details.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("record_equipment_calibration", {
    p_equipment_id: value.equipmentId,
    p_calibration_type: value.calibrationType,
    p_result: value.result,
    p_certificate_number: value.certificateNumber,
    p_next_due_date: value.nextDueDate || null,
    p_notes: value.notes || null,
  });

  if (error) {
    return { ok: false, formError: equipmentErrorMessage(error) };
  }

  revalidateEquipment();

  return { ok: true, id: data ? String(data) : undefined };
}

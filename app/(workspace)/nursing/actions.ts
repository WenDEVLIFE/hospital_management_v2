"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  nurseAssignmentSchema,
  nurseUnassignSchema,
  nursingAssessmentSchema,
  nursingNoteSchema,
  vitalSignsSchema,
  type NurseAssignmentInput,
  type NurseUnassignInput,
  type NursingAssessmentInput,
  type NursingNoteInput,
  type VitalSignsInput,
} from "@/lib/validations/nursing";

export type NursingWriteResult =
  | { ok: true }
  | { ok: false; formError: string };

function nursingErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("encounter not found")) {
    return "This admission does not have an active encounter for charting.";
  }

  if (message.includes("measurement")) {
    return "Record at least one valid measurement.";
  }

  if (message.includes("greater than zero")) {
    return "Measurements must be greater than zero.";
  }

  if (message.includes("nursing note is required")) {
    return "Write the nursing note.";
  }

  if (message.includes("not an active nurse")) {
    return "Select an active nurse.";
  }

  if (message.includes("patient not found")) {
    return "The patient could not be found.";
  }

  if (message.includes("assessment type is required")) {
    return "Select an assessment type.";
  }

  if (message.includes("insufficient permission")) {
    return "You do not have permission to do that.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateNursing() {
  revalidatePath("/nursing");
  revalidatePath("/medical-records");
  revalidatePath("/dashboard");
}

function measurement(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : Number(trimmed);
}

export async function recordVitalSignsAction(
  input: VitalSignsInput
): Promise<NursingWriteResult> {
  const parsed = vitalSignsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the vital signs.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("record_vital_signs", {
    p_patient_id: value.patientId,
    p_encounter_id: value.encounterId,
    p_systolic_bp: measurement(value.systolicBp),
    p_diastolic_bp: measurement(value.diastolicBp),
    p_heart_rate: measurement(value.heartRate),
    p_respiratory_rate: measurement(value.respiratoryRate),
    p_temperature: measurement(value.temperature),
    p_oxygen_saturation: measurement(value.oxygenSaturation),
    p_weight_kg: measurement(value.weightKg),
    p_height_cm: measurement(value.heightCm),
  });

  if (error) {
    return { ok: false, formError: nursingErrorMessage(error) };
  }

  revalidateNursing();

  return { ok: true };
}

export async function addNursingNoteAction(
  input: NursingNoteInput
): Promise<NursingWriteResult> {
  const parsed = nursingNoteSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Write the nursing note.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("add_nursing_note", {
    p_patient_id: value.patientId,
    p_encounter_id: value.encounterId,
    p_note: value.note,
  });

  if (error) {
    return { ok: false, formError: nursingErrorMessage(error) };
  }

  revalidateNursing();

  return { ok: true };
}

export async function assignNurseAction(
  input: NurseAssignmentInput
): Promise<NursingWriteResult> {
  const parsed = nurseAssignmentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Select a nurse.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("assign_nurse", {
    p_patient_id: value.patientId,
    p_staff_id: value.staffId,
  });

  if (error) {
    return { ok: false, formError: nursingErrorMessage(error) };
  }

  revalidateNursing();
  revalidatePath("/admissions");
  revalidatePath("/medical-records");

  return { ok: true };
}

export async function unassignNurseAction(
  input: NurseUnassignInput
): Promise<NursingWriteResult> {
  const parsed = nurseUnassignSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Select a valid patient.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("unassign_nurse", {
    p_patient_id: parsed.data.patientId,
  });

  if (error) {
    return { ok: false, formError: nursingErrorMessage(error) };
  }

  revalidateNursing();
  revalidatePath("/admissions");
  revalidatePath("/medical-records");

  return { ok: true };
}

export async function recordNursingAssessmentAction(
  input: NursingAssessmentInput
): Promise<NursingWriteResult> {
  const parsed = nursingAssessmentSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Check the nursing assessment.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("record_nursing_assessment", {
    p_patient_id: value.patientId,
    p_encounter_id: value.encounterId,
    p_assessment_type: value.assessmentType,
    p_notes: value.notes?.trim() ? value.notes.trim() : null,
  });

  if (error) {
    return { ok: false, formError: nursingErrorMessage(error) };
  }

  revalidateNursing();

  return { ok: true };
}

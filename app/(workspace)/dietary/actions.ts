"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  advanceMealSchema,
  createDietaryOrderSchema,
  splitList,
  type AdvanceMealInput,
  type CreateDietaryOrderInput,
} from "@/lib/validations/dietary";

export type DietaryWriteResult =
  | { ok: true; id?: string }
  | { ok: false; formError: string };

function dietaryErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("patient not found")) {
    return "The patient could not be found.";
  }

  if (message.includes("therapeutic diet not found")) {
    return "The selected therapeutic diet could not be found.";
  }

  if (message.includes("inactive")) {
    return "That therapeutic diet is inactive.";
  }

  if (message.includes("unsupported meal")) {
    return "Select a supported meal.";
  }

  if (message.includes("already been delivered")) {
    return "This meal has already been delivered.";
  }

  if (message.includes("meal order not found")) {
    return "The meal order could not be found.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateDietary() {
  revalidatePath("/dietary");
  revalidatePath("/dashboard");
}

export async function createDietaryOrderAction(
  input: CreateDietaryOrderInput
): Promise<DietaryWriteResult> {
  const parsed = createDietaryOrderSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the assessment.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_dietary_order", {
    p_patient_id: value.patientId,
    p_therapeutic_diet_id: value.therapeuticDietId,
    p_allergies: splitList(value.allergies),
    p_restrictions: splitList(value.restrictions),
    p_meal_schedule: value.mealSchedule,
    p_notes: value.notes?.trim() || null,
  });

  if (error) {
    return { ok: false, formError: dietaryErrorMessage(error) };
  }

  revalidateDietary();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function advanceMealAction(
  input: AdvanceMealInput
): Promise<DietaryWriteResult> {
  const parsed = advanceMealSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the meal status.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("advance_meal_order", {
    p_meal_id: value.mealId,
    p_status: value.status,
  });

  if (error) {
    return { ok: false, formError: dietaryErrorMessage(error) };
  }

  revalidateDietary();

  return { ok: true, id: data ? String(data) : undefined };
}

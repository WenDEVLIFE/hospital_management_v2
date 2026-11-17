"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  finalizeClinicalNoteSchema,
  type FinalizeClinicalNoteInput,
} from "@/lib/validations/clinical-note";

export type FinalizeClinicalNoteResult =
  | { ok: true; noteId: string }
  | { ok: false; formError: string };

export async function finalizeClinicalNoteAction(
  input: FinalizeClinicalNoteInput
): Promise<FinalizeClinicalNoteResult> {
  const parsed = finalizeClinicalNoteSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError:
        parsed.error.issues[0]?.message ?? "Select a valid clinical note.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("finalize_clinical_note", {
    p_note_id: parsed.data.noteId,
  });

  if (error) {
    return { ok: false, formError: pgErrorMessage(error.code) };
  }

  if (!data) {
    return {
      ok: false,
      formError: "The note was updated but no identifier was returned.",
    };
  }

  revalidatePath("/medical-records");
  revalidatePath("/dashboard");

  return { ok: true, noteId: String(data) };
}

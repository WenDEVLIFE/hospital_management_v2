"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { bedStatusSchema, type BedStatusInput } from "@/lib/validations/organisation";

export async function updateBedStatusAction(input: BedStatusInput) {
  const parsed = bedStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, formError: "Select a valid bed and status." } as const;
  }

  const { bedId, expectedStatus, status } = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc("update_bed_status", {
    p_bed_id: bedId,
    p_expected_status: expectedStatus,
    p_status: status,
  });

  if (error) {
    if (error.code === "40001") {
      revalidatePath("/rooms-beds");
      return {
        ok: false,
        formError: "This bed’s status changed. Close this dialog and reopen it to see the current status.",
      } as const;
    }

    const formError =
      error.code === "P0002" ? "This bed could not be found."
      : error.code === "23514" ? "This bed has an active patient assignment. Use transfer or discharge to release it."
      : pgErrorMessage(error.code);

    return { ok: false, formError } as const;
  }

  revalidatePath("/rooms-beds");
  revalidatePath("/admissions");
  revalidatePath("/admissions/new");
  revalidatePath("/admissions/transfer");
  revalidatePath("/dashboard");

  return { ok: true } as const;
}

import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-side session gate for the workspace. RLS still enforces data access;
 * this only prevents rendering the shell without an active, enabled account.
 */
export async function AuthGuard({ children }: { children: ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login?error=profile");
  }

  if (profile.is_active === false) {
    redirect("/login?error=disabled");
  }

  return <>{children}</>;
}

import { createServerClient } from "@supabase/ssr";
import { connection } from "next/server";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "./env";

/**
 * Cookie-based Supabase client for Server Components, Server Actions, and
 * Route Handlers. It keeps the signed-in user's identity so RLS applies.
 *
 * `connection()` marks this as request-time work. The client reads cookies and
 * Supabase Auth validates token expiry with `Date.now()`, so the render must
 * wait for a real request instead of being prerendered.
 */
export async function getSupabaseServerClient() {
  await connection();

  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The root proxy refreshes
          // the session on navigation.
        }
      },
    },
  });
}

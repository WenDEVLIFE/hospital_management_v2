import { supabaseEnv } from "./env";

export type SupabaseConnectionState =
  | "not_configured"
  | "connected"
  | "unreachable";

export type SupabaseConnection = {
  state: SupabaseConnectionState;
  message: string;
};

/**
 * Lightweight server-side reachability probe against the Supabase Auth health
 * endpoint. Reaching the endpoint means the project URL and publishable key
 * are valid; it does not imply the current user is signed in.
 */
export async function checkSupabaseConnection(): Promise<SupabaseConnection> {
  if (!supabaseEnv.isConfigured) {
    return {
      state: "not_configured",
      message:
        "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.",
    };
  }

  try {
    const response = await fetch(`${supabaseEnv.url}/auth/v1/health`, {
      headers: { apikey: supabaseEnv.publishableKey },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        state: "unreachable",
        message: `The project responded with HTTP ${response.status}.`,
      };
    }

    return {
      state: "connected",
      message: "Project URL and publishable key are valid.",
    };
  } catch {
    return {
      state: "unreachable",
      message: "The project could not be reached. Check the URL and network.",
    };
  }
}

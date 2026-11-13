/**
 * Supabase environment configuration.
 *
 * Only the public URL and publishable key belong in the client bundle.
 * Never expose a service-role key through NEXT_PUBLIC_* variables.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabaseEnv = {
  url,
  publishableKey,
  isConfigured: Boolean(url && publishableKey),
} as const;

export function getSupabaseEnv() {
  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local."
    );
  }

  return { url, publishableKey };
}

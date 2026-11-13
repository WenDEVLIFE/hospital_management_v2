import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./env";

// TODO(types): parameterize with the generated `Database` type once
// `supabase gen types` can run against the linked project.
let client: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowserClient() {
  if (!client) {
    const { url, publishableKey } = getSupabaseEnv();
    client = createBrowserClient(url, publishableKey);
  }

  return client;
}

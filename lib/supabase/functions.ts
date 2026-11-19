import { getSupabaseEnv } from "./env";

export type EdgeFunctionResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; code: string };

/**
 * Calls a privileged Edge Function with the signed-in user's access token.
 * Server-only: the token comes from the cookie-backed Supabase session.
 */
export async function invokeEdgeFunction(
  functionName: string,
  body: Record<string, unknown>,
  accessToken: string
): Promise<EdgeFunctionResult> {
  const { url, publishableKey } = getSupabaseEnv();
  const response = await fetch(`${url}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const rawError = payload.error;
    const code =
      typeof rawError === "string"
        ? rawError
        : rawError && typeof rawError === "object" && "code" in rawError
          ? String((rawError as { code?: unknown }).code ?? "request_failed")
          : "request_failed";

    return { ok: false, status: response.status, code };
  }

  return { ok: true, data: payload };
}

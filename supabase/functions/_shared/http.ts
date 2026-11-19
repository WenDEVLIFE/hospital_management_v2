import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { z } from "npm:zod@4.6.7";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-hms-job-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

export class HttpError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

export function requireEnv(key: string) {
  const value = Deno.env.get(key);
  if (!value) throw new HttpError(503, "missing_configuration");
  return value;
}

function client(key: string, token?: string) {
  return createClient(requireEnv("SUPABASE_URL"), key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined,
  });
}

export function serviceClient() {
  return client(requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export async function requireUser(request: Request) {
  const token = request.headers.get("Authorization")?.match(/^Bearer (\S+)$/i)
    ?.[1];
  if (!token) throw new HttpError(401, "unauthenticated");
  const supabase = client(requireEnv("SUPABASE_ANON_KEY"), token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) {
    throw new HttpError(401, "unauthenticated");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("is_active").eq("id", data.user.id).maybeSingle();
  if (profileError) throw new HttpError(500, "profile_lookup_failed");
  if (!profile?.is_active) throw new HttpError(403, "forbidden");
  return { supabase, userId: data.user.id };
}

export async function requireAdmin(request: Request) {
  const { supabase, userId } = await requireUser(request);
  const { data, error } = await supabase.rpc("is_admin");
  if (error) throw new HttpError(500, "authorization_failed");
  if (!data) throw new HttpError(403, "forbidden");
  return userId;
}

export async function requireJobToken(request: Request, envKey: string) {
  const expected = requireEnv(envKey);
  const received = request.headers.get("x-hms-job-token");
  if (!received) throw new HttpError(401, "unauthenticated");
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all(
    [expected, received].map(async (value) =>
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", encoder.encode(value)),
      )
    ),
  );
  let mismatch = 0;
  for (let index = 0; index < a.length; index++) {
    mismatch |= a[index] ^ b[index];
  }
  if (mismatch !== 0) throw new HttpError(401, "unauthenticated");
}

export async function body<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  if (
    !request.headers.get("content-type")?.toLowerCase().startsWith(
      "application/json",
    )
  ) {
    throw new HttpError(415, "expected_json");
  }
  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  let length = 0;
  let raw = "";
  if (reader) {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 8192) {
        await reader.cancel();
        throw new HttpError(413, "request_too_large");
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  }

  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "invalid_json");
  }
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "invalid_input");
  return result.data;
}

export function serve(handler: (request: Request) => Promise<Response>) {
  Deno.serve(async (request) => {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    try {
      if (request.method !== "POST") {
        throw new HttpError(405, "method_not_allowed");
      }
      const response = await handler(request);
      for (const [key, value] of Object.entries(headers)) {
        response.headers.set(key, value);
      }
      return response;
    } catch (error) {
      const problem = error instanceof HttpError
        ? error
        : new HttpError(500, "internal_error");
      return Response.json({ error: { code: problem.code } }, {
        status: problem.status,
        headers,
      });
    }
  });
}

export { z };

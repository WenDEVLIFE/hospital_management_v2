import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Public routes. /reset-password must stay public so the browser client can
// read the recovery session from the URL hash or the PKCE callback cookies.
const PUBLIC_PATHS = new Set([
  "/login",
  "/forgot-password",
  "/reset-password",
]);

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, searchParams } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.has(pathname) || pathname.startsWith("/auth/");

  if (!user && !isPublic) {
    const loginUrl = new URL("/login", request.url);

    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  // Error states must be able to render on /login even when a stale session
  // still exists (for example, a disabled account awaiting sign-out).
  if (user && pathname === "/login" && !searchParams.has("error")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

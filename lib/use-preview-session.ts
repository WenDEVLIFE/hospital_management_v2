"use client";

import * as React from "react";

const SESSION_KEY = "spmc_auth_session";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);

  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

/**
 * Reads the local preview session without causing a server/client hydration
 * mismatch. The server snapshot is null; the browser snapshot is applied after
 * hydration through useSyncExternalStore.
 */
export function usePreviewSessionEmail(): string | null {
  const raw = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return React.useMemo(() => {
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as { email?: unknown };

      return typeof parsed.email === "string" && parsed.email.trim()
        ? parsed.email.trim()
        : null;
    } catch {
      return null;
    }
  }, [raw]);
}

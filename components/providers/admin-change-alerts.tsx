"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  CloseIcon,
  DangerTriangleIcon,
  DocumentTextIcon,
} from "@solar-icons/react/linear";

import { usePermissions } from "@/components/providers/permission-provider";
import { Button } from "@/components/ui/button";
import { useToast, type ToastVariant } from "@/components/ui/toast";
import {
  playSecurityAlertSound,
  unlockAlertAudio,
} from "@/lib/audio/security-alert";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  useRealtimeTable,
  type RealtimePayload,
} from "@/lib/supabase/realtime";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "spmc.dismissedAuditAlerts";
const MAX_BANNERS = 3;
const LOOKBACK_MS = 24 * 60 * 60 * 1000;
const POLL_INTERVAL_MS = 20_000;
const MAX_SEEN_IDS = 200;

const ALERT_COLUMNS =
  "id, title, message, severity, related_entity_type, created_at";

type AlertRow = {
  id: string;
  title: string;
  message: string;
  severity: string;
  related_entity_type: string | null;
  created_at: string;
};

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toAlert(row: Record<string, unknown>): AlertRow | null {
  const id = stringValue(row.id);

  if (!id) {
    return null;
  }

  const title = stringValue(row.title, "Database change alert");
  const severity = stringValue(row.severity, "info");

  return {
    id,
    title,
    message: stringValue(row.message),
    // Rows written before migration 00800 carry severity "info" even for
    // direct database edits; keep them visible as critical.
    severity:
      severity === "info" && title.startsWith("Direct database change")
        ? "critical"
        : severity,
    related_entity_type:
      typeof row.related_entity_type === "string"
        ? row.related_entity_type
        : null,
    created_at: stringValue(row.created_at, new Date().toISOString()),
  };
}

function toAlerts(rows: Record<string, unknown>[]): AlertRow[] {
  return rows
    .map(toAlert)
    .filter((alert): alert is AlertRow => alert !== null);
}

function deservesBanner(severity: string): boolean {
  return severity === "critical" || severity === "warning";
}

function readDismissed(): Set<string> {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string")
        : []
    );
  } catch {
    return new Set();
  }
}

function toToastVariant(severity: string): ToastVariant {
  switch (severity) {
    case "critical":
      return "danger";
    case "warning":
      return "warning";
    case "success":
      return "success";
    default:
      return "info";
  }
}

/**
 * Administrator alerts for database changes, modelled on DABAWGOV:
 *
 * - every new system notification plays the emergency siren on any screen;
 * - critical/warning changes show a persistent banner until dismissed;
 * - unread alerts from the last 24 hours are loaded on mount and every 20s, so
 *   a dropped Realtime connection or a closed tab cannot hide them;
 * - an explicit "Enable alert siren" control unlocks audio on the first click,
 *   because browsers block sound until the page receives a user gesture.
 */
export function AdminChangeAlerts() {
  const { isAdmin } = usePermissions();
  const { toast } = useToast();
  const router = useRouter();
  const [alerts, setAlerts] = React.useState<AlertRow[]>([]);
  const [audioReady, setAudioReady] = React.useState(false);
  const dismissedRef = React.useRef<Set<string>>(new Set());
  const seen = React.useRef(new Set<string>());
  const lastCheckedRef = React.useRef(new Date().toISOString());
  const refreshTimer = React.useRef<number | null>(null);

  const scheduleRefresh = React.useCallback(() => {
    if (refreshTimer.current !== null) {
      return;
    }

    refreshTimer.current = window.setTimeout(() => {
      refreshTimer.current = null;
      router.refresh();
    }, 600);
  }, [router]);

  React.useEffect(() => {
    return () => {
      if (refreshTimer.current !== null) {
        window.clearTimeout(refreshTimer.current);
      }
    };
  }, []);

  const tryUnlock = React.useCallback(async () => {
    const ready = await unlockAlertAudio();
    setAudioReady(ready);
    return ready;
  }, []);

  // Audio can only start after a user gesture in this tab. The floating
  // "Enable alert siren" control makes that explicit when the browser has not
  // granted activation yet.
  React.useEffect(() => {
    const unlock = () => {
      void tryUnlock();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [tryUnlock]);

  const presentAlert = React.useCallback(
    (alert: AlertRow, playSound: boolean) => {
      if (seen.current.has(alert.id)) {
        return;
      }

      if (seen.current.size >= MAX_SEEN_IDS) {
        seen.current.clear();
      }

      seen.current.add(alert.id);

      toast({
        title: alert.title,
        description: alert.message || undefined,
        variant: toToastVariant(alert.severity),
        duration: 8000,
      });

      if (playSound && !playSecurityAlertSound()) {
        // The tab lost audio activation (backgrounded, device change). Bring
        // back the explicit unlock control.
        setAudioReady(false);
      }

      if (
        deservesBanner(alert.severity) &&
        !dismissedRef.current.has(alert.id)
      ) {
        setAlerts((current) =>
          [alert, ...current.filter((item) => item.id !== alert.id)].slice(
            0,
            MAX_BANNERS
          )
        );
      }

      scheduleRefresh();
    },
    [scheduleRefresh, toast]
  );

  // Catch-up on mount: show unread critical/warning alerts without sound.
  React.useEffect(() => {
    if (!isAdmin) {
      return;
    }

    dismissedRef.current = readDismissed();
    let cancelled = false;

    void (async () => {
      const supabase = getSupabaseBrowserClient();
      const since = new Date(Date.now() - LOOKBACK_MS).toISOString();
      const { data } = await supabase
        .from("notifications")
        .select(ALERT_COLUMNS)
        .eq("notification_type", "system")
        .eq("is_read", false)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20);

      if (cancelled || !data) {
        return;
      }

      const rows = toAlerts(data as Record<string, unknown>[]);

      for (const row of rows) {
        seen.current.add(row.id);
      }

      const bannerRows = rows.filter((row) => deservesBanner(row.severity));

      setAlerts((current) => {
        const merged = [...bannerRows, ...current].filter(
          (alert) => !dismissedRef.current.has(alert.id)
        );
        const unique: AlertRow[] = [];

        for (const alert of merged) {
          if (!unique.some((item) => item.id === alert.id)) {
            unique.push(alert);
          }
        }

        return unique.slice(0, MAX_BANNERS);
      });

      lastCheckedRef.current = new Date().toISOString();
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  // Polling fallback: Realtime can miss events when the socket drops or the tab
  // sleeps. This also catches anything inserted while the app was closed.
  React.useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (document.hidden) {
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("notifications")
        .select(ALERT_COLUMNS)
        .eq("notification_type", "system")
        .eq("is_read", false)
        .gt("created_at", lastCheckedRef.current)
        .order("created_at", { ascending: true })
        .limit(10);

      if (cancelled || !data) {
        return;
      }

      const rows = toAlerts(data as Record<string, unknown>[]);

      for (const row of rows) {
        presentAlert(row, true);
      }

      if (rows.length > 0) {
        lastCheckedRef.current = rows[rows.length - 1].created_at;
      }
    };

    const interval = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    const onVisible = () => {
      if (!document.hidden) {
        void tryUnlock();
        void poll();
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isAdmin, presentAlert, tryUnlock]);

  const handleChange = React.useCallback(
    (payload: RealtimePayload) => {
      if (!isAdmin || payload.eventType !== "INSERT" || !payload.newRecord) {
        return;
      }

      const row = payload.newRecord;

      if (row.notification_type !== "system") {
        return;
      }

      const alert = toAlert(row);

      if (alert) {
        presentAlert(alert, true);
      }
    },
    [isAdmin, presentAlert]
  );

  useRealtimeTable({
    table: "notifications",
    event: "INSERT",
    onChange: handleChange,
  });

  const dismissAlert = React.useCallback((id: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
    dismissedRef.current.add(id);

    try {
      window.localStorage.setItem(
        DISMISSED_KEY,
        JSON.stringify(Array.from(dismissedRef.current).slice(-100))
      );
    } catch {
      // Storage may be unavailable in private mode; dismissal still works for
      // the current page.
    }
  }, []);

  return (
    <>
      {isAdmin && alerts.length > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex justify-center px-4">
          <div className="w-full max-w-2xl space-y-2" aria-live="assertive">
            {alerts.map((alert) => {
              const critical = alert.severity === "critical";

              return (
                <div
                  key={alert.id}
                  role="alert"
                  className={cn(
                    "pointer-events-auto flex items-start gap-3 rounded-md border p-3 shadow-lg",
                    critical
                      ? "border-red-300 bg-red-50"
                      : "border-amber-300 bg-amber-50"
                  )}
                >
                  <DangerTriangleIcon
                    className={cn(
                      "mt-0.5 size-5 shrink-0",
                      critical ? "text-red-600" : "text-amber-600"
                    )}
                    aria-hidden="true"
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        critical ? "text-red-700" : "text-amber-700"
                      )}
                    >
                      {critical
                        ? "Critical database alert"
                        : "Database change alert"}
                    </p>
                    <p
                      className={cn(
                        "truncate text-sm font-semibold",
                        critical ? "text-red-900" : "text-amber-900"
                      )}
                    >
                      {alert.title}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-xs leading-relaxed",
                        critical ? "text-red-800" : "text-amber-800"
                      )}
                    >
                      {alert.message}
                    </p>
                    <Link
                      href="/audit-logs"
                      className={cn(
                        "mt-1 inline-flex items-center gap-1 text-xs font-medium underline",
                        critical ? "text-red-800" : "text-amber-800"
                      )}
                    >
                      <DocumentTextIcon
                        className="size-3.5"
                        aria-hidden="true"
                      />
                      View audit log
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissAlert(alert.id)}
                    aria-label="Dismiss alert"
                    className={cn(
                      "shrink-0 rounded-md p-1 transition-colors",
                      critical
                        ? "text-red-700 hover:bg-red-100"
                        : "text-amber-700 hover:bg-amber-100"
                    )}
                  >
                    <CloseIcon className="size-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {isAdmin && !audioReady ? (
        <Button
          type="button"
          size="sm"
          className="fixed right-4 top-20 z-[70] shadow-lg"
          onClick={() => {
            void (async () => {
              const ready = await tryUnlock();

              if (ready) {
                playSecurityAlertSound();
                return;
              }

              toast({
                title: "Audio is blocked",
                description:
                  "Click again, or check this tab and your device volume. Browsers require one interaction before playing sound.",
                variant: "warning",
                duration: 8000,
              });
            })();
          }}
        >
          <BellIcon className="size-4" aria-hidden="true" />
          Enable alert siren
        </Button>
      ) : null}
    </>
  );
}

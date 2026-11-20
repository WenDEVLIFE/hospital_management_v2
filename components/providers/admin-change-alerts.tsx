"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CloseIcon,
  DangerTriangleIcon,
  DocumentTextIcon,
} from "@solar-icons/react/linear";

import { usePermissions } from "@/components/providers/permission-provider";
import { useToast, type ToastVariant } from "@/components/ui/toast";
import {
  playAlertChime,
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
const MAX_SEEN_IDS = 200;

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
    // Notifications written before migration 00800 carry severity "info"
    // even for direct database edits; keep them visible as critical.
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
 * Live administrator alerts for database changes, modelled on the DABAWGOV
 * security banner: direct database edits raise a persistent critical banner and
 * siren until dismissed, while ordinary changes use a softer chime and toast.
 * The notification rows are written by public.audit_change_alert().
 */
export function AdminChangeAlerts() {
  const { isAdmin } = usePermissions();
  const { toast } = useToast();
  const router = useRouter();
  const [alerts, setAlerts] = React.useState<AlertRow[]>([]);
  const dismissedRef = React.useRef<Set<string>>(new Set());
  const seen = React.useRef(new Set<string>());
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

  // Audio can only start after a user gesture in the tab.
  React.useEffect(() => {
    const unlock = () => {
      void unlockAlertAudio();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Load unread critical/warning alerts so a change made while this tab was
  // closed still surfaces when the admin returns.
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
        .select(
          "id, title, message, severity, related_entity_type, created_at"
        )
        .eq("notification_type", "system")
        .eq("is_read", false)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10);

      if (cancelled || !data) {
        return;
      }

      const rows = (data as Record<string, unknown>[])
        .map(toAlert)
        .filter(
          (alert): alert is AlertRow =>
            alert !== null && deservesBanner(alert.severity)
        );

      setAlerts((current) => {
        const merged = [...rows, ...current].filter(
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
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const dismissAlert = React.useCallback((id: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
    dismissedRef.current.add(id);

    try {
      window.localStorage.setItem(
        DISMISSED_KEY,
        JSON.stringify(Array.from(dismissedRef.current).slice(-100))
      );
    } catch {
      // Storage may be unavailable in private mode; dismissal still works
      // for the current page.
    }
  }, []);

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

      if (!alert || seen.current.has(alert.id)) {
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

      if (deservesBanner(alert.severity)) {
        if (alert.severity === "critical") {
          playSecurityAlertSound();
        } else {
          playAlertChime();
        }

        if (!dismissedRef.current.has(alert.id)) {
          setAlerts((current) =>
            [alert, ...current.filter((item) => item.id !== alert.id)].slice(
              0,
              MAX_BANNERS
            )
          );
        }
      } else {
        playAlertChime();
      }

      scheduleRefresh();
    },
    [isAdmin, scheduleRefresh, toast]
  );

  useRealtimeTable({
    table: "notifications",
    event: "INSERT",
    onChange: handleChange,
  });

  if (!isAdmin || alerts.length === 0) {
    return null;
  }

  return (
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
  );
}

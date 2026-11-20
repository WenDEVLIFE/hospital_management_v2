"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { usePermissions } from "@/components/providers/permission-provider";
import { useToast, type ToastVariant } from "@/components/ui/toast";
import {
  useRealtimeTable,
  type RealtimePayload,
} from "@/lib/supabase/realtime";

const MAX_SEEN_IDS = 200;

function toToastVariant(severity: unknown): ToastVariant {
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
 * Live administrator alerts for database changes. The database trigger writes a
 * `system` notification for every tracked table change; RLS already limits the
 * realtime stream to the signed-in user's own rows, and `isAdmin` prevents any
 * rendering for non-administrators.
 */
export function AdminChangeAlerts() {
  const { isAdmin } = usePermissions();
  const { toast } = useToast();
  const router = useRouter();
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

  const handleChange = React.useCallback(
    (payload: RealtimePayload) => {
      if (!isAdmin || payload.eventType !== "INSERT" || !payload.newRecord) {
        return;
      }

      const row = payload.newRecord;

      if (row.notification_type !== "system") {
        return;
      }

      const id = typeof row.id === "string" ? row.id : "";

      if (!id || seen.current.has(id)) {
        return;
      }

      if (seen.current.size >= MAX_SEEN_IDS) {
        seen.current.clear();
      }

      seen.current.add(id);

      toast({
        title:
          typeof row.title === "string" ? row.title : "System alert",
        description:
          typeof row.message === "string" ? row.message : undefined,
        variant: toToastVariant(row.severity),
        duration: 8000,
      });

      scheduleRefresh();
    },
    [isAdmin, scheduleRefresh, toast]
  );

  useRealtimeTable({
    table: "notifications",
    event: "INSERT",
    onChange: handleChange,
  });

  return null;
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useRealtimeTable, type RealtimeTable } from "@/lib/supabase/realtime";

export interface RealtimeRefreshProps {
  table: RealtimeTable;
  filter?: string;
}

/**
 * Refreshes the current server-rendered route when a row changes. RLS still
 * decides whether the browser ever receives the event.
 */
export function RealtimeRefresh({ table, filter }: RealtimeRefreshProps) {
  const router = useRouter();
  const handleChange = React.useCallback(() => {
    router.refresh();
  }, [router]);

  useRealtimeTable({ table, filter, onChange: handleChange });

  return null;
}

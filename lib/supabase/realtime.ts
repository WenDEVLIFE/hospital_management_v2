"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "./client";

/**
 * Tables published to `supabase_realtime` (migration 039). Row visibility still
 * comes from RLS, so a subscriber only receives rows it could already read.
 */
export const REALTIME_TABLES = [
  "appointments",
  "admissions",
  "beds",
  "emergency_visits",
  "surgery_cases",
  "laboratory_orders",
  "laboratory_results",
  "prescriptions",
  "notifications",
] as const;

export type RealtimeTable = (typeof REALTIME_TABLES)[number];

export type RealtimeEvent =
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "*";

export type RealtimePayload = {
  table: RealtimeTable;
  eventType: RealtimeEvent;
  newRecord: Record<string, unknown> | null;
  oldRecord: Record<string, unknown> | null;
};

export type RealtimeChangePayload = {
  eventType: string;
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
};

export type RealtimeSubscriptionOptions = {
  table: RealtimeTable;
  event?: RealtimeEvent;
  /** Optional PostgREST filter, e.g. `patient_id=eq.<uuid>`. */
  filter?: string;
  onChange: (payload: RealtimePayload) => void;
};

/**
 * Subscribes to one table for the lifetime of the calling component.
 * Returns nothing; cleanup is handled on unmount.
 */
export function useRealtimeTable({
  table,
  event = "*",
  filter,
  onChange,
}: RealtimeSubscriptionOptions) {
  const handlerRef = React.useRef(onChange);

  React.useEffect(() => {
    handlerRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channelName = filter ? `${table}:${filter}` : table;
    const channel = supabase
      .channel(`realtime-${channelName}`)
      .on(
        "postgres_changes",
        filter
          ? { event, schema: "public", table, filter }
          : { event, schema: "public", table },
        (payload: RealtimeChangePayload) => {
          handlerRef.current({
            table,
            eventType: payload.eventType as RealtimeEvent,
            newRecord: (payload.new ?? null) as Record<string, unknown> | null,
            oldRecord: (payload.old ?? null) as Record<string, unknown> | null,
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, event, filter]);
}

/**
 * Imperative variant for code paths that cannot use a hook (for example a
 * one-off listener inside an event handler). Always call the returned cleanup.
 */
export function subscribeToTable(
  options: RealtimeSubscriptionOptions
): () => void {
  const supabase = getSupabaseBrowserClient();
  const { table, event = "*", filter, onChange } = options;
  const channelName = filter ? `${table}:${filter}` : table;
  const channel = supabase
    .channel(`realtime-${channelName}-${Math.random().toString(36).slice(2, 8)}`)
    .on(
      "postgres_changes",
      filter
        ? { event, schema: "public", table, filter }
        : { event, schema: "public", table },
      (payload: RealtimeChangePayload) => {
        onChange({
          table,
          eventType: payload.eventType as RealtimeEvent,
          newRecord: (payload.new ?? null) as Record<string, unknown> | null,
          oldRecord: (payload.old ?? null) as Record<string, unknown> | null,
        });
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

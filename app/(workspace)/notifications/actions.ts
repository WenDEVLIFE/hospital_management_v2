"use server";

import { revalidatePath } from "next/cache";

import { pgErrorMessage } from "@/lib/data/result";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createAnnouncementSchema,
  notificationIdSchema,
  notificationPreferencesSchema,
  type CreateAnnouncementInput,
  type NotificationPreferencesInput,
} from "@/lib/validations/notifications";

export type NotificationWriteResult =
  | { ok: true; id?: string; count?: number }
  | { ok: false, formError: string };

function notificationErrorMessage(error: {
  code?: string | null;
  message?: string | null;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (message.includes("notification not found")) {
    return "The notification could not be found.";
  }

  if (message.includes("announcement not found")) {
    return "The announcement could not be found.";
  }

  if (message.includes("already published")) {
    return "This announcement is already published.";
  }

  if (message.includes("already archived")) {
    return "This announcement is already archived.";
  }

  if (message.includes("archived announcements cannot")) {
    return "Archived announcements cannot be published.";
  }

  if (message.includes("select the department")) {
    return "Select the department for this audience.";
  }

  if (message.includes("title and body")) {
    return "A title and body are required.";
  }

  if (message.includes("unsupported announcement audience")) {
    return "Select a supported audience.";
  }

  if (message.includes("unsupported notification category")) {
    return "Select a supported notification category.";
  }

  return pgErrorMessage(error.code ?? "UNKNOWN");
}

function revalidateNotifications() {
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function markNotificationReadAction(
  notificationId: string
): Promise<NotificationWriteResult> {
  const parsed = notificationIdSchema.safeParse(notificationId);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Select a notification.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: parsed.data,
  });

  if (error) {
    return { ok: false, formError: notificationErrorMessage(error) };
  }

  revalidateNotifications();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function markAllNotificationsReadAction(): Promise<NotificationWriteResult> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("mark_all_notifications_read");

  if (error) {
    return { ok: false, formError: notificationErrorMessage(error) };
  }

  revalidateNotifications();

  return { ok: true, count: typeof data === "number" ? data : 0 };
}

export async function createAnnouncementAction(
  input: CreateAnnouncementInput
): Promise<NotificationWriteResult> {
  const parsed = createAnnouncementSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the announcement.",
    };
  }

  const value = parsed.data;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_staff_announcement", {
    p_title: value.title,
    p_body: value.body,
    p_audience: value.audience,
    p_department_id: value.departmentId || null,
    p_pinned: value.pinned,
    p_expires_at: value.expiresAt ? `${value.expiresAt}T23:59:59+08:00` : null,
    p_publish: value.publish,
  });

  if (error) {
    return { ok: false, formError: notificationErrorMessage(error) };
  }

  revalidateNotifications();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function publishAnnouncementAction(
  announcementId: string
): Promise<NotificationWriteResult> {
  const parsed = notificationIdSchema.safeParse(announcementId);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Select an announcement.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("publish_staff_announcement", {
    p_announcement_id: parsed.data,
  });

  if (error) {
    return { ok: false, formError: notificationErrorMessage(error) };
  }

  revalidateNotifications();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function archiveAnnouncementAction(
  announcementId: string
): Promise<NotificationWriteResult> {
  const parsed = notificationIdSchema.safeParse(announcementId);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Select an announcement.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("archive_staff_announcement", {
    p_announcement_id: parsed.data,
  });

  if (error) {
    return { ok: false, formError: notificationErrorMessage(error) };
  }

  revalidateNotifications();

  return { ok: true, id: data ? String(data) : undefined };
}

export async function saveNotificationPreferencesAction(
  input: NotificationPreferencesInput
): Promise<NotificationWriteResult> {
  const parsed = notificationPreferencesSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      formError: parsed.error.issues[0]?.message ?? "Check the preferences.",
    };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("save_notification_preferences", {
    p_preferences: parsed.data.preferences,
  });

  if (error) {
    return { ok: false, formError: notificationErrorMessage(error) };
  }

  revalidateNotifications();

  return { ok: true, count: typeof data === "number" ? data : 0 };
}

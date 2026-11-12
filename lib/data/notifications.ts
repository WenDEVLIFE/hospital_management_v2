import type {
  AppNotification,
  NotificationPreference,
  NotificationStats,
  StaffAnnouncement,
} from "@/types/hospital";
import {
  inboxNotifications,
  notifications,
  notificationPreferences,
  notificationStats,
  staffAnnouncements,
} from "@/lib/fixtures";
import { isPreviewMode } from "./config";
import {
  emptyPage,
  matchesQuery,
  pageSlice,
  sortByDateDesc,
} from "./query";
import type { DataResult, PagedResult } from "./result";

function emptyStats(): NotificationStats {
  return {
    unread: 0,
    total: 0,
    critical: 0,
    queued: 0,
    failed: 0,
    announcements: 0,
  };
}

export async function listInboxNotifications(
  params: {
    q?: string;
    severity?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AppNotification>> {
  // TODO(supabase): replace with supabase.from("notifications").select("*")
  if (!isPreviewMode) {
    return emptyPage<AppNotification>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = sortByDateDesc(
    inboxNotifications.filter((notification) => {
      if (params.severity && notification.severity !== params.severity) {
        return false;
      }

      return matchesQuery(params.q, [
        notification.title,
        notification.message,
        notification.category,
        notification.recipient_name,
        notification.related_entity_type,
      ]);
    }),
    (notification) => notification.created_at
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listNotifications(
  params: {
    q?: string;
    category?: string;
    status?: string;
    channel?: string;
    severity?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AppNotification>> {
  // TODO(supabase): replace with supabase.from("notifications").select("*")
  if (!isPreviewMode) {
    return emptyPage<AppNotification>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = sortByDateDesc(
    notifications.filter((notification) => {
      if (params.category && notification.category !== params.category) {
        return false;
      }

      if (params.status && notification.status !== params.status) {
        return false;
      }

      if (params.channel && notification.channel !== params.channel) {
        return false;
      }

      if (params.severity && notification.severity !== params.severity) {
        return false;
      }

      return matchesQuery(params.q, [
        notification.title,
        notification.message,
        notification.category,
        notification.recipient_name,
        notification.recipient_email,
        notification.related_entity_type,
      ]);
    }),
    (notification) => notification.created_at
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listAnnouncements(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<StaffAnnouncement>> {
  // TODO(supabase): replace with supabase.from("staff_announcements").select("*")
  if (!isPreviewMode) {
    return emptyPage<StaffAnnouncement>(params.page, params.pageSize);
  }

  await Promise.resolve();

  const filtered = sortByDateDesc(
    staffAnnouncements.filter((announcement) => {
      if (params.status && announcement.status !== params.status) {
        return false;
      }

      return matchesQuery(params.q, [
        announcement.title,
        announcement.body,
        announcement.audience,
        announcement.published_by_name,
      ]);
    }),
    (announcement) => announcement.published_at ?? ""
  );

  return {
    data: pageSlice(filtered, params.page, params.pageSize),
    error: null,
  };
}

export async function listNotificationPreferences(): Promise<
  DataResult<NotificationPreference[]>
> {
  // TODO(supabase): replace with supabase.from("notification_preferences").select("*")
  if (!isPreviewMode) {
    return { data: [], error: null };
  }

  await Promise.resolve();

  return { data: notificationPreferences, error: null };
}

export async function getNotificationStats(): Promise<
  DataResult<NotificationStats>
> {
  // TODO(supabase): replace with aggregate queries over notifications
  if (!isPreviewMode) {
    return { data: emptyStats(), error: null };
  }

  await Promise.resolve();

  return { data: notificationStats, error: null };
}

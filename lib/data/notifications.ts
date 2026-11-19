import type {
  AppNotification,
  NotificationCategory,
  NotificationPreference,
  NotificationStats,
  StaffAnnouncement,
} from "@/types/hospital";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { pageSlice, sanitizeSearchTerm } from "./query";
import { toDataError, type DataResult, type PagedResult } from "./result";

const CATEGORY_BY_TYPE: Record<string, NotificationCategory> = {
  laboratory_result: "laboratory",
  radiology_report: "radiology",
  low_stock: "inventory",
  admission: "admission",
  discharge: "discharge",
  billing: "billing",
  maintenance: "maintenance",
  appointment: "appointment",
  announcement: "announcement",
  prescription: "prescription",
  queue: "queue",
  system: "system",
};

const CATEGORY_LABELS: Array<{
  category: NotificationCategory;
  label: string;
}> = [
  { category: "appointment", label: "Appointments" },
  { category: "queue", label: "Queue" },
  { category: "admission", label: "Admissions" },
  { category: "discharge", label: "Discharges" },
  { category: "laboratory", label: "Laboratory" },
  { category: "radiology", label: "Radiology" },
  { category: "prescription", label: "Prescriptions" },
  { category: "billing", label: "Billing" },
  { category: "inventory", label: "Inventory" },
  { category: "maintenance", label: "Maintenance" },
  { category: "announcement", label: "Announcements" },
  { category: "system", label: "System" },
];

const NOTIFICATION_COLUMNS =
  "id, user_id, title, message, notification_type, severity, related_entity_type, related_entity_id, is_read, created_at, read_at, profiles!notifications_user_id_fkey(full_name, email)";

type Relation<T> = T | T[] | null;

function firstRelation<T>(value: Relation<T>): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

type NotificationJoinRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  severity: AppNotification["severity"];
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  profiles: Relation<{ full_name: string; email: string }>;
};

function toCategory(notificationType: string): NotificationCategory {
  return CATEGORY_BY_TYPE[notificationType] ?? "system";
}

function toAppNotification(row: NotificationJoinRow): AppNotification {
  const profile = firstRelation(row.profiles);

  return {
    id: row.id,
    title: row.title,
    message: row.message,
    category: toCategory(row.notification_type),
    severity: row.severity,
    status: row.is_read ? "read" : "unread",
    recipient_name: profile?.full_name ?? "System",
    recipient_email: profile?.email ?? "",
    related_entity_type: row.related_entity_type,
    related_entity_id: row.related_entity_id,
    created_at: row.created_at,
    read_at: row.read_at,
    is_read: row.is_read,
  };
}

async function currentUserId(): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return data.user?.id ?? null;
}

async function loadNotifications(): Promise<
  DataResult<NotificationJoinRow[]>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  return { data: (data ?? []) as unknown as NotificationJoinRow[], error: null };
}

export async function listInboxNotifications(
  params: {
    q?: string;
    severity?: string;
    read?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AppNotification>> {
  const [userId, notificationResult] = await Promise.all([
    currentUserId(),
    loadNotifications(),
  ]);

  if (notificationResult.error) {
    return { data: null, error: notificationResult.error };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = notificationResult.data
    .filter((row) => row.user_id === userId)
    .map(toAppNotification)
    .filter((row) => {
      if (params.severity && row.severity !== params.severity) {
        return false;
      }

      if (params.read === "unread" && row.is_read) {
        return false;
      }

      if (params.read === "read" && !row.is_read) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        row.title,
        row.message,
        row.category,
        row.related_entity_type,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

export async function listNotifications(
  params: {
    q?: string;
    category?: string;
    severity?: string;
    read?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<AppNotification>> {
  const notificationResult = await loadNotifications();

  if (notificationResult.error) {
    return { data: null, error: notificationResult.error };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = notificationResult.data
    .map(toAppNotification)
    .filter((row) => {
      if (params.category && row.category !== params.category) {
        return false;
      }

      if (params.severity && row.severity !== params.severity) {
        return false;
      }

      if (params.read === "unread" && row.is_read) {
        return false;
      }

      if (params.read === "read" && !row.is_read) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        row.title,
        row.message,
        row.category,
        row.recipient_name,
        row.recipient_email,
        row.related_entity_type,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { data: pageSlice(rows, params.page, params.pageSize), error: null };
}

type AnnouncementJoinRow = StaffAnnouncement & {
  profiles: Relation<{ full_name: string }>;
  departments: Relation<{ name: string }>;
};

export async function listAnnouncements(
  params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<PagedResult<StaffAnnouncement>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("staff_announcements")
    .select(
      "*, profiles!staff_announcements_published_by_fkey(full_name), departments(name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const search = sanitizeSearchTerm(params.q)?.toLowerCase() ?? "";

  const rows = (data as unknown as AnnouncementJoinRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    department_id: row.department_id,
    department_name: firstRelation(row.departments)?.name ?? null,
    status: row.status,
    published_by_name: firstRelation(row.profiles)?.full_name ?? null,
    published_at: row.published_at,
    pinned: row.pinned,
    expires_at: row.expires_at,
  }));

  const filtered = rows.filter((row) => {
    if (params.status && row.status !== params.status) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [row.title, row.body, row.audience, row.published_by_name]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  return { data: pageSlice(filtered, params.page, params.pageSize), error: null };
}

export async function listNotificationPreferences(): Promise<
  DataResult<NotificationPreference[]>
> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("category, in_app");

  if (error) {
    return { data: null, error: toDataError(error) };
  }

  const saved = new Map(
    ((data ?? []) as Array<{ category: NotificationCategory; in_app: boolean }>).map(
      (row) => [row.category, row.in_app]
    )
  );

  return {
    data: CATEGORY_LABELS.map((entry) => ({
      category: entry.category,
      label: entry.label,
      in_app: saved.get(entry.category) ?? true,
    })),
    error: null,
  };
}

export async function getNotificationStats(): Promise<
  DataResult<NotificationStats>
> {
  const [userId, notificationResult, announcementResult] = await Promise.all([
    currentUserId(),
    loadNotifications(),
    getSupabaseServerClient().then((supabase) =>
      supabase
        .from("staff_announcements")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
    ),
  ]);

  if (notificationResult.error) {
    return { data: null, error: notificationResult.error };
  }

  const stats: NotificationStats = {
    unread: 0,
    total: 0,
    critical: 0,
    read: 0,
    announcements: announcementResult.error
      ? 0
      : announcementResult.count ?? 0,
  };

  for (const row of notificationResult.data) {
    if (row.user_id !== userId) {
      continue;
    }

    stats.total += 1;

    if (row.is_read) {
      stats.read += 1;
    } else {
      stats.unread += 1;

      if (row.severity === "critical") {
        stats.critical += 1;
      }
    }
  }

  return { data: stats, error: null };
}

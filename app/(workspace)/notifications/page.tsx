import { connection } from "next/server";
import {
  BellIcon,
  CheckCircleIcon,
  DangerCircleIcon,
  DocumentTextIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { NewAnnouncementAction } from "@/components/notifications/notification-actions";
import { NotificationsView } from "@/components/notifications/notifications-view";
import { NotificationsWorkflowStrip } from "@/components/notifications/notifications-workflow-strip";
import { RealtimeRefresh } from "@/components/providers/realtime-refresh";
import { Alert } from "@/components/ui/alert";
import { listDepartments } from "@/lib/data/departments";
import {
  getNotificationStats,
  listAnnouncements,
  listInboxNotifications,
  listNotificationPreferences,
  listNotifications,
} from "@/lib/data/notifications";

export const metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  await connection();

  const [
    statsResult,
    inboxResult,
    logResult,
    announcementsResult,
    preferencesResult,
    departmentsResult,
  ] = await Promise.all([
    getNotificationStats(),
    listInboxNotifications({ pageSize: 200 }),
    listNotifications({ pageSize: 200 }),
    listAnnouncements({ pageSize: 200 }),
    listNotificationPreferences(),
    listDepartments({ pageSize: 200, isActive: true }),
  ]);

  const departments = (departmentsResult.data?.rows ?? []).map((department) => ({
    id: department.id,
    name: department.name,
  }));

  return (
    <div className="space-y-6">
      <RealtimeRefresh table="notifications" />

      <PageHeader
        title="Notifications"
        description="Internal notifications, delivery log, staff announcements, and notification preferences."
        actions={<NewAnnouncementAction departments={departments} />}
      />

      <Alert variant="info" title="In-app notifications">
        This module stores in-app notifications and publishes staff
        announcements. Email delivery is handled by the send-notification
        function and is not enabled in this environment. Notification content
        references related records without exposing patient identifiers.
      </Alert>

      {statsResult.error ? (
        <ErrorState error={statsResult.error} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              label="Unread"
              value={statsResult.data.unread}
              hint="In-app notifications"
              tone="warning"
              icon={<BellIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Total notifications"
              value={statsResult.data.total}
              hint="All channels"
              icon={<DocumentTextIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Critical"
              value={statsResult.data.critical}
              hint="Requires attention"
              tone="danger"
              icon={<DangerCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Read"
              value={statsResult.data.read}
              hint="Acknowledged"
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Announcements"
              value={statsResult.data.announcements}
              hint="Published to staff"
              tone="success"
              icon={<CheckCircleIcon className="size-4" aria-hidden="true" />}
            />
          </div>

          <NotificationsWorkflowStrip stats={statsResult.data} />
        </>
      )}

      {inboxResult.error ? (
        <ErrorState error={inboxResult.error} />
      ) : (
        <NotificationsView
          inbox={inboxResult.data.rows}
          notifications={logResult.error ? [] : logResult.data.rows}
          announcements={
            announcementsResult.error ? [] : announcementsResult.data.rows
          }
          preferences={preferencesResult.error ? [] : preferencesResult.data}
          departments={departments}
        />
      )}
    </div>
  );
}

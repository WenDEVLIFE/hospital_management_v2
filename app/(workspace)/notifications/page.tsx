import { connection } from "next/server";
import {
  BellIcon,
  CheckCircleIcon,
  ClockCircleIcon,
  DangerCircleIcon,
  DocumentTextIcon,
  SpeakerIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/module/error-state";
import { StatCard } from "@/components/module/stat-card";
import { UnavailableAction } from "@/components/module/unavailable-action";
import { NotificationsView } from "@/components/notifications/notifications-view";
import { NotificationsWorkflowStrip } from "@/components/notifications/notifications-workflow-strip";
import { Alert } from "@/components/ui/alert";
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

  const [statsResult, inboxResult, logResult, announcementsResult, preferencesResult] =
    await Promise.all([
      getNotificationStats(),
      listInboxNotifications({ pageSize: 200 }),
      listNotifications({ pageSize: 200 }),
      listAnnouncements({ pageSize: 200 }),
      listNotificationPreferences(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Internal notifications, delivery log, staff announcements, and notification preferences."
        actions={
          <>
            <UnavailableAction
              label="Notification Preferences"
              description="Configure which events are delivered through in-app, email, and SMS channels."
              variant="secondary"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
            <UnavailableAction
              label="New Announcement"
              description="Draft a staff announcement and choose its audience and delivery channels."
              icon={<SpeakerIcon className="size-4" aria-hidden="true" />}
            />
          </>
        }
      />

      <Alert variant="warning" title="Delivery integrations not connected">
        Email and SMS delivery is not connected in this preview. In-app updates
        will use Supabase Realtime when the backend is connected, and realtime
        delivery is currently pending. Notification content references related
        records only and does not expose sensitive patient details.
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
              label="Queued"
              value={statsResult.data.queued}
              hint="Awaiting delivery"
              icon={<ClockCircleIcon className="size-4" aria-hidden="true" />}
            />
            <StatCard
              label="Failed"
              value={statsResult.data.failed}
              hint="Delivery failures"
              tone="danger"
              icon={<DangerCircleIcon className="size-4" aria-hidden="true" />}
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
        />
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import {
  BellIcon,
  DocumentTextIcon,
  SpeakerIcon,
} from "@solar-icons/react/linear";

import type {
  AppNotification,
  NotificationPreference,
  StaffAnnouncement,
} from "@/types/hospital";
import {
  RecordTable,
  type Column,
  type FilterConfig,
} from "@/components/module/record-table";
import {
  AnnouncementStatusActions,
  MarkAllReadAction,
  MarkReadAction,
  NewAnnouncementAction,
  SavePreferencesAction,
} from "@/components/notifications/notification-actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";

const SEVERITY_OPTIONS = [
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
];

const READ_OPTIONS = [
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const ANNOUNCEMENT_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const AUDIENCE_LABELS: Record<string, string> = {
  all_staff: "All staff",
  physicians: "Physicians",
  nurses: "Nurses",
  department: "Department",
};

export interface NotificationsViewProps {
  inbox: AppNotification[];
  notifications: AppNotification[];
  announcements: StaffAnnouncement[];
  preferences: NotificationPreference[];
  departments: Array<{ id: string; name: string }>;
}

function humanize(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-hospital-text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-hospital-text">{children}</dd>
    </div>
  );
}

export function NotificationsView({
  inbox,
  notifications,
  announcements,
  preferences,
  departments,
}: NotificationsViewProps) {
  const [tab, setTab] = React.useState("inbox");
  const [selectedNotification, setSelectedNotification] =
    React.useState<AppNotification | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    React.useState<StaffAnnouncement | null>(null);
  const [preferenceState, setPreferenceState] = React.useState(() =>
    preferences.map((preference) => ({ ...preference }))
  );

  const notificationById = React.useMemo(
    () =>
      new Map(
        notifications.map((notification) => [notification.id, notification])
      ),
    [notifications]
  );
  const announcementById = React.useMemo(
    () =>
      new Map(
        announcements.map((announcement) => [announcement.id, announcement])
      ),
    [announcements]
  );

  const openNotification = React.useCallback(
    (id: string) => {
      const row = notificationById.get(id);

      if (row) {
        setSelectedNotification(row);
      }
    },
    [notificationById]
  );

  const closeNotification = React.useCallback(() => {
    setSelectedNotification(null);
  }, []);

  const openAnnouncement = React.useCallback(
    (id: string) => {
      const row = announcementById.get(id);

      if (row) {
        setSelectedAnnouncement(row);
      }
    },
    [announcementById]
  );

  const closeAnnouncement = React.useCallback(() => {
    setSelectedAnnouncement(null);
  }, []);

  const updatePreference = (
    category: string,
    value: boolean
  ) => {
    setPreferenceState((current) =>
      current.map((preference) =>
        preference.category === category
          ? { ...preference, in_app: value }
          : preference
      )
    );
  };

  const inboxColumns = React.useMemo<Column<AppNotification>[]>(
    () => [
      {
        key: "title",
        header: "Notification",
        sortable: true,
        sortValue: (row) => row.title,
        cell: (row) => (
          <div className="min-w-0 max-w-[24rem]">
            <p className="font-medium text-hospital-text">{row.title}</p>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-hospital-text-muted">
              {row.message}
            </p>
          </div>
        ),
      },
      {
        key: "category",
        header: "Category",
        cell: (row) => <Badge variant="info">{humanize(row.category)}</Badge>,
      },
      {
        key: "severity",
        header: "Severity",
        cell: (row) => <StatusBadge status={row.severity} />,
      },
      {
        key: "created",
        header: "Received",
        sortable: true,
        sortValue: (row) => row.created_at,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.created_at)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View notification ${row.title}`}
            onClick={() => openNotification(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openNotification]
  );

  const inboxFilters = React.useMemo<FilterConfig<AppNotification>[]>(
    () => [
      {
        key: "severity",
        label: "severity",
        allLabel: "All severities",
        options: SEVERITY_OPTIONS,
        accessor: (row) => row.severity,
      },
      {
        key: "read",
        label: "read state",
        allLabel: "All states",
        options: READ_OPTIONS,
        accessor: (row) => row.status,
      },
    ],
    []
  );

  const logColumns = React.useMemo<Column<AppNotification>[]>(
    () => [
      {
        key: "title",
        header: "Notification",
        sortable: true,
        sortValue: (row) => row.title,
        cell: (row) => (
          <div className="min-w-0 max-w-[20rem]">
            <p className="font-medium text-hospital-text">{row.title}</p>
            <p className="text-[11px] text-hospital-text-muted">
              {humanize(row.category)}
            </p>
          </div>
        ),
      },
      {
        key: "recipient",
        header: "Recipient",
        cell: (row) => (
          <div className="min-w-0 text-xs">
            <p>{row.recipient_name}</p>
            <p className="break-words text-[11px] text-hospital-text-muted">
              {row.recipient_email}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "created",
        header: "Created",
        sortable: true,
        sortValue: (row) => row.created_at,
        cell: (row) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.created_at)}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View notification ${row.title}`}
            onClick={() => openNotification(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openNotification]
  );

  const logFilters = React.useMemo<FilterConfig<AppNotification>[]>(
    () => [
      {
        key: "read",
        label: "read state",
        allLabel: "All states",
        options: READ_OPTIONS,
        accessor: (row) => row.status,
      },
      {
        key: "severity",
        label: "severity",
        allLabel: "All severities",
        options: SEVERITY_OPTIONS,
        accessor: (row) => row.severity,
      },
    ],
    []
  );

  const announcementColumns = React.useMemo<Column<StaffAnnouncement>[]>(
    () => [
      {
        key: "title",
        header: "Announcement",
        sortable: true,
        sortValue: (row) => row.title,
        cell: (row) => (
          <div className="min-w-0 max-w-[24rem]">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-medium text-hospital-text">{row.title}</p>
              {row.pinned ? <Badge variant="info">Pinned</Badge> : null}
            </div>
            <p className="mt-0.5 line-clamp-2 text-[11px] text-hospital-text-muted">
              {row.body}
            </p>
          </div>
        ),
      },
      {
        key: "audience",
        header: "Audience",
        cell: (row) => (
          <div className="min-w-0 text-xs">
            <p>{AUDIENCE_LABELS[row.audience] ?? humanize(row.audience)}</p>
            {row.department_name ? (
              <p className="text-[11px] text-hospital-text-muted">
                {row.department_name}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "published_by",
        header: "Published by",
        cell: (row) => row.published_by_name ?? "\u2014",
      },
      {
        key: "published_at",
        header: "Published at",
        sortable: true,
        sortValue: (row) => row.published_at ?? "",
        cell: (row) =>
          row.published_at ? (
            <span className="whitespace-nowrap">
              {formatDateTime(row.published_at)}
            </span>
          ) : (
            "\u2014"
          ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`View announcement ${row.title}`}
            onClick={() => openAnnouncement(row.id)}
          >
            View
          </Button>
        ),
      },
    ],
    [openAnnouncement]
  );

  const announcementFilters = React.useMemo<
    FilterConfig<StaffAnnouncement>[]
  >(
    () => [
      {
        key: "status",
        label: "status",
        allLabel: "All statuses",
        options: ANNOUNCEMENT_STATUS_OPTIONS,
        accessor: (row) => row.status,
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-4">
        <Tabs
          items={[
            { value: "inbox", label: "Inbox", count: inbox.length },
            {
              value: "log",
              label: "All notifications",
              count: notifications.length,
            },
            {
              value: "announcements",
              label: "Announcements",
              count: announcements.length,
            },
            {
              value: "preferences",
              label: "Preferences",
              count: preferenceState.length,
            },
          ]}
          value={tab}
          onValueChange={setTab}
        />

        {tab === "inbox" ? (
          <RecordTable
            rows={inbox}
            columns={inboxColumns}
            rowKey={(row) => row.id}
            caption="In-app notification inbox"
            searchPlaceholder="Search notification title, message, or category"
            searchAccessor={(row) =>
              `${row.title} ${row.message} ${row.category} ${row.related_entity_type ?? ""}`
            }
            filters={inboxFilters}
            toolbarActions={<MarkAllReadAction />}
            emptyTitle="No notifications"
            emptyDescription="There are no in-app notifications matching your filters."
            emptyIcon={<BellIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "log" ? (
          <RecordTable
            rows={notifications}
            columns={logColumns}
            rowKey={(row) => row.id}
            caption="All notifications across staff"
            searchPlaceholder="Search title, recipient, category, or related record"
            searchAccessor={(row) =>
              `${row.title} ${row.message} ${row.recipient_name} ${row.recipient_email} ${row.category} ${row.related_entity_type ?? ""}`
            }
            filters={logFilters}
            emptyTitle="No delivery records"
            emptyDescription="There are no notification delivery records matching your filters."
            emptyIcon={
              <DocumentTextIcon className="size-5" aria-hidden="true" />
            }
            pageSize={10}
          />
        ) : null}

        {tab === "announcements" ? (
          <RecordTable
            rows={announcements}
            columns={announcementColumns}
            rowKey={(row) => row.id}
            caption="Staff announcements"
            searchPlaceholder="Search announcement title, body, or audience"
            searchAccessor={(row) =>
              `${row.title} ${row.body} ${row.audience} ${row.published_by_name ?? ""}`
            }
            filters={announcementFilters}
            toolbarActions={<NewAnnouncementAction departments={departments} />}
            emptyTitle="No announcements"
            emptyDescription="There are no staff announcements matching your filters."
            emptyIcon={<SpeakerIcon className="size-5" aria-hidden="true" />}
            pageSize={10}
          />
        ) : null}

        {tab === "preferences" ? (
          <div className="space-y-4">
            <Alert variant="info">
              These preferences control in-app notifications only. Email
              delivery runs through the notification function and is not
              enabled in this environment.
            </Alert>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">In-app</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preferenceState.map((preference) => (
                  <TableRow key={preference.category}>
                    <TableCell>{preference.label}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={preference.in_app}
                        aria-label={`In-app notifications for ${preference.label}`}
                        onChange={(event) =>
                          updatePreference(
                            preference.category,
                            event.target.checked
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <SavePreferencesAction preferences={preferenceState} />
          </div>
        ) : null}
      </div>

      <Modal
        open={selectedNotification !== null}
        onClose={closeNotification}
        title={selectedNotification?.title ?? "Notification details"}
        description="Delivery status and related record"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeNotification}>
            Close
          </Button>
        }
      >
        {selectedNotification ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedNotification.severity} />
              <StatusBadge status={selectedNotification.status} />
              <Badge variant="info">
                {humanize(selectedNotification.category)}
              </Badge>
            </div>

            <p className="text-sm leading-relaxed text-hospital-text">
              {selectedNotification.message}
            </p>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Recipient">
                <div className="min-w-0">
                  <p>{selectedNotification.recipient_name}</p>
                  <p className="break-words text-[11px] text-hospital-text-muted">
                    {selectedNotification.recipient_email}
                  </p>
                </div>
              </DetailField>
              <DetailField label="Created">
                {formatDateTime(selectedNotification.created_at)}
              </DetailField>
              <DetailField label="Read">
                {selectedNotification.read_at
                  ? formatDateTime(selectedNotification.read_at)
                  : "Unread"}
              </DetailField>
              <DetailField label="Related record">
                {selectedNotification.related_entity_type
                  ? humanize(selectedNotification.related_entity_type)
                  : "\u2014"}
              </DetailField>
            </dl>

            <MarkReadAction
              notificationId={selectedNotification.id}
              isRead={selectedNotification.is_read}
              onDone={closeNotification}
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={selectedAnnouncement !== null}
        onClose={closeAnnouncement}
        title={selectedAnnouncement?.title ?? "Announcement details"}
        description="Audience, publication status, and recipients"
        size="lg"
        footer={
          <Button variant="secondary" onClick={closeAnnouncement}>
            Close
          </Button>
        }
      >
        {selectedAnnouncement ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedAnnouncement.status} />
              {selectedAnnouncement.pinned ? (
                <Badge variant="info">Pinned</Badge>
              ) : null}
            </div>

            <p className="text-sm leading-relaxed text-hospital-text">
              {selectedAnnouncement.body}
            </p>

            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Audience">
                <div className="min-w-0">
                  <p>
                    {AUDIENCE_LABELS[selectedAnnouncement.audience] ??
                      humanize(selectedAnnouncement.audience)}
                  </p>
                  {selectedAnnouncement.department_name ? (
                    <p className="text-[11px] text-hospital-text-muted">
                      {selectedAnnouncement.department_name}
                    </p>
                  ) : null}
                </div>
              </DetailField>
              <DetailField label="Published by">
                {selectedAnnouncement.published_by_name ?? "\u2014"}
              </DetailField>
              <DetailField label="Published at">
                {selectedAnnouncement.published_at
                  ? formatDateTime(selectedAnnouncement.published_at)
                  : "Not published"}
              </DetailField>
              <DetailField label="Expires">
                {selectedAnnouncement.expires_at
                  ? formatDateTime(selectedAnnouncement.expires_at)
                  : "\u2014"}
              </DetailField>
            </dl>

            <AnnouncementStatusActions
              announcement={{
                id: selectedAnnouncement.id,
                status: selectedAnnouncement.status,
              }}
              onDone={closeAnnouncement}
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}

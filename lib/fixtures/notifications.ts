import type {
  AppNotification,
  NotificationCategory,
  NotificationChannel,
  NotificationPreference,
  NotificationSeverity,
  NotificationStats,
  NotificationStatus,
  StaffAnnouncement,
} from "@/types/hospital";
import { isoAt, previewUuid } from "./base";

type NotificationSeed = {
  title: string;
  message: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipientName: string;
  recipientEmail: string;
  entityType: string;
  offset: number;
  hour: number;
  read: boolean;
  error: string | null;
};

const NOTIFICATION_SEEDS: NotificationSeed[] = [
  {
    title: "Appointment reminder",
    message:
      "A patient has an appointment tomorrow at 09:00. Open the appointment record for details.",
    category: "appointment",
    severity: "info",
    channel: "in_app",
    status: "delivered",
    recipientName: "Test Admin B",
    recipientEmail: "test.admin.b@example.test",
    entityType: "appointment",
    offset: -2,
    hour: 8,
    read: true,
    error: null,
  },
  {
    title: "Appointment confirmed",
    message:
      "The appointment request was confirmed and the patient was notified.",
    category: "appointment",
    severity: "success",
    channel: "email",
    status: "delivered",
    recipientName: "Test Receptionist A",
    recipientEmail: "test.receptionist.a@example.test",
    entityType: "appointment",
    offset: -2,
    hour: 9,
    read: true,
    error: null,
  },
  {
    title: "Queue update",
    message:
      "A patient moved to the consultation queue. Open the queue record for details.",
    category: "queue",
    severity: "info",
    channel: "in_app",
    status: "delivered",
    recipientName: "Test Nurse A",
    recipientEmail: "test.nurse.a@example.test",
    entityType: "appointment",
    offset: -1,
    hour: 10,
    read: false,
    error: null,
  },
  {
    title: "Inpatient admission recorded",
    message:
      "An inpatient admission was recorded. Open the admission record for details.",
    category: "admission",
    severity: "info",
    channel: "email",
    status: "sent",
    recipientName: "Test Admin B",
    recipientEmail: "test.admin.b@example.test",
    entityType: "admission",
    offset: -1,
    hour: 11,
    read: false,
    error: null,
  },
  {
    title: "Discharge completed",
    message:
      "A discharge was completed and the bed release was recorded.",
    category: "discharge",
    severity: "success",
    channel: "in_app",
    status: "read",
    recipientName: "Test Admin B",
    recipientEmail: "test.admin.b@example.test",
    entityType: "admission",
    offset: -1,
    hour: 14,
    read: true,
    error: null,
  },
  {
    title: "Laboratory result ready",
    message:
      "A verified laboratory result is ready for release. Open the laboratory record for details.",
    category: "laboratory",
    severity: "warning",
    channel: "email",
    status: "queued",
    recipientName: "Test Physician B",
    recipientEmail: "test.physician.b@example.test",
    entityType: "laboratory_result",
    offset: 0,
    hour: 7,
    read: false,
    error: null,
  },
  {
    title: "Radiology report verified",
    message:
      "A radiology report was verified. Open the report for details.",
    category: "radiology",
    severity: "warning",
    channel: "in_app",
    status: "delivered",
    recipientName: "Test Physician A",
    recipientEmail: "test.physician.a@example.test",
    entityType: "radiology_report",
    offset: 0,
    hour: 7,
    read: true,
    error: null,
  },
  {
    title: "Prescription ready for pickup",
    message:
      "A prescription is ready for pickup. Open the prescription record for details.",
    category: "prescription",
    severity: "info",
    channel: "sms",
    status: "failed",
    recipientName: "Test Pharmacist A",
    recipientEmail: "test.pharmacist.a@example.test",
    entityType: "prescription",
    offset: 0,
    hour: 8,
    read: false,
    error: "SMS gateway is not configured.",
  },
  {
    title: "Billing reminder",
    message:
      "A billing reminder is due. Open the invoice record for details.",
    category: "billing",
    severity: "warning",
    channel: "email",
    status: "sent",
    recipientName: "Test Billing Staff A",
    recipientEmail: "test.billing.a@example.test",
    entityType: "invoice",
    offset: -1,
    hour: 15,
    read: true,
    error: null,
  },
  {
    title: "Low stock alert",
    message:
      "Low stock: Surgical Gloves (Medium). Open inventory for details.",
    category: "inventory",
    severity: "critical",
    channel: "in_app",
    status: "delivered",
    recipientName: "Test Inventory Staff A",
    recipientEmail: "test.inventory.a@example.test",
    entityType: "inventory_item",
    offset: 0,
    hour: 6,
    read: false,
    error: null,
  },
  {
    title: "Medication batch nearing expiry",
    message:
      "A medication batch is nearing expiry. Open inventory for details.",
    category: "inventory",
    severity: "critical",
    channel: "email",
    status: "delivered",
    recipientName: "Test Pharmacist A",
    recipientEmail: "test.pharmacist.a@example.test",
    entityType: "medication_batch",
    offset: -2,
    hour: 16,
    read: false,
    error: null,
  },
  {
    title: "Preventive maintenance due",
    message:
      "Preventive maintenance is due for a medical asset. Open the equipment record for details.",
    category: "maintenance",
    severity: "warning",
    channel: "in_app",
    status: "read",
    recipientName: "Test Biomedical Tech A",
    recipientEmail: "test.biomed.a@example.test",
    entityType: "equipment",
    offset: -3,
    hour: 9,
    read: true,
    error: null,
  },
  {
    title: "Staff town hall",
    message:
      "The quarterly staff town hall is scheduled. Open the announcement for details.",
    category: "announcement",
    severity: "info",
    channel: "in_app",
    status: "read",
    recipientName: "Test Admin B",
    recipientEmail: "test.admin.b@example.test",
    entityType: "announcement",
    offset: -2,
    hour: 12,
    read: true,
    error: null,
  },
];

export const notifications: AppNotification[] = NOTIFICATION_SEEDS.map(
  (seed, index) => {
    const createdAt = isoAt(seed.offset, seed.hour);
    const sentAt =
      seed.status === "queued" || seed.status === "failed"
        ? null
        : new Date(Date.parse(createdAt) + 60_000).toISOString();
    const deliveredAt =
      seed.status === "delivered" || seed.status === "read"
        ? new Date(Date.parse(createdAt) + 120_000).toISOString()
        : null;
    const readAt = seed.read
      ? new Date(Date.parse(createdAt) + 300_000).toISOString()
      : null;

    return {
      id: previewUuid(160, index + 1),
      title: seed.title,
      message: seed.message,
      category: seed.category,
      severity: seed.severity,
      channel: seed.channel,
      status: seed.status,
      recipient_name: seed.recipientName,
      recipient_email: seed.recipientEmail,
      related_entity_type: seed.entityType,
      related_entity_id: previewUuid(161, index + 1),
      created_at: createdAt,
      sent_at: sentAt,
      delivered_at: deliveredAt,
      read_at: readAt,
      error_message: seed.error,
      is_read: seed.read,
    };
  }
);

export const notificationById = new Map(
  notifications.map((notification) => [notification.id, notification])
);

export const inboxNotifications = notifications.filter(
  (notification) => notification.channel === "in_app"
);

export const notificationPreferences: NotificationPreference[] = [
  {
    id: previewUuid(162, 1),
    category: "appointment",
    label: "Appointment reminders",
    in_app: true,
    email: true,
    sms: true,
  },
  {
    id: previewUuid(162, 2),
    category: "queue",
    label: "Queue updates",
    in_app: true,
    email: false,
    sms: false,
  },
  {
    id: previewUuid(162, 3),
    category: "admission",
    label: "Admission notifications",
    in_app: true,
    email: true,
    sms: false,
  },
  {
    id: previewUuid(162, 4),
    category: "discharge",
    label: "Discharge notifications",
    in_app: true,
    email: false,
    sms: false,
  },
  {
    id: previewUuid(162, 5),
    category: "laboratory",
    label: "Laboratory result notifications",
    in_app: true,
    email: true,
    sms: false,
  },
  {
    id: previewUuid(162, 6),
    category: "radiology",
    label: "Radiology result notifications",
    in_app: true,
    email: true,
    sms: false,
  },
  {
    id: previewUuid(162, 7),
    category: "prescription",
    label: "Prescription notifications",
    in_app: true,
    email: false,
    sms: false,
  },
  {
    id: previewUuid(162, 8),
    category: "billing",
    label: "Billing reminders",
    in_app: true,
    email: true,
    sms: true,
  },
  {
    id: previewUuid(162, 9),
    category: "inventory",
    label: "Inventory alerts",
    in_app: true,
    email: false,
    sms: false,
  },
  {
    id: previewUuid(162, 10),
    category: "maintenance",
    label: "Maintenance notifications",
    in_app: true,
    email: false,
    sms: false,
  },
  {
    id: previewUuid(162, 11),
    category: "announcement",
    label: "Staff announcements",
    in_app: true,
    email: true,
    sms: false,
  },
  {
    id: previewUuid(162, 12),
    category: "system",
    label: "System notifications",
    in_app: true,
    email: true,
    sms: false,
  },
];

export const staffAnnouncements: StaffAnnouncement[] = [
  {
    id: previewUuid(163, 1),
    title: "Quarterly staff town hall",
    body: "All staff are invited to the quarterly town hall. Attendance details will be posted in the staff portal.",
    audience: "All staff",
    status: "published",
    published_by_name: "Test Admin B",
    published_at: isoAt(-2, 12),
    channels: ["in_app", "email"],
    pinned: true,
    expires_at: isoAt(14, 17),
  },
  {
    id: previewUuid(163, 2),
    title: "Fire drill schedule",
    body: "A hospital-wide fire drill is scheduled this week. Review the evacuation routes for your assigned area.",
    audience: "All departments",
    status: "published",
    published_by_name: "Test Admin B",
    published_at: isoAt(-1, 8),
    channels: ["in_app"],
    pinned: true,
    expires_at: isoAt(7, 17),
  },
  {
    id: previewUuid(163, 3),
    title: "Infection-control policy update",
    body: "The infection-control policy has been updated. Clinical staff should review the revised procedures before publication.",
    audience: "Clinical staff",
    status: "draft",
    published_by_name: null,
    published_at: null,
    channels: ["in_app", "email"],
    pinned: false,
    expires_at: null,
  },
];

export const announcementById = new Map(
  staffAnnouncements.map((announcement) => [announcement.id, announcement])
);

export const notificationStats: NotificationStats = {
  unread: notifications.filter((notification) => !notification.is_read).length,
  total: notifications.length,
  critical: notifications.filter(
    (notification) => notification.severity === "critical"
  ).length,
  queued: notifications.filter(
    (notification) => notification.status === "queued"
  ).length,
  failed: notifications.filter(
    (notification) => notification.status === "failed"
  ).length,
  announcements: staffAnnouncements.filter(
    (announcement) => announcement.status === "published"
  ).length,
};

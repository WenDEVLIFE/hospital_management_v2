import {
  CheckCircleIcon,
  ClockCircleIcon,
  DangerCircleIcon,
  MinusCircleIcon,
  RefreshIcon,
} from "@solar-icons/react/linear";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

type StatusConfig = {
  variant: BadgeVariant;
  label?: string;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  active: { variant: "success", label: "Active" },
  approved: { variant: "success", label: "Approved" },
  present: { variant: "success", label: "Present" },
  valid: { variant: "success", label: "Valid" },
  admitted: { variant: "success", label: "Admitted" },
  completed: { variant: "success", label: "Completed" },
  verified: { variant: "success", label: "Verified" },
  paid: { variant: "success", label: "Paid" },
  dispensed: { variant: "success", label: "Dispensed" },
  available: { variant: "success", label: "Available" },
  finalized: { variant: "success", label: "Finalized" },
  confirmed: { variant: "success", label: "Confirmed" },
  non_urgent: { variant: "success", label: "Non-urgent" },
  billed: { variant: "success", label: "Billed" },

  pending: { variant: "pending", label: "Pending" },
  waiting: { variant: "pending", label: "Waiting" },
  unpaid: { variant: "pending", label: "Unpaid" },
  draft: { variant: "pending", label: "Draft" },
  reserved: { variant: "pending", label: "Reserved" },
  collection: { variant: "pending", label: "Collection" },
  partially_paid: { variant: "pending", label: "Partially Paid" },
  partially_dispensed: { variant: "pending", label: "Partially Dispensed" },
  emergent: { variant: "pending", label: "Emergent" },
  observation: { variant: "pending", label: "Observation" },
  requested: { variant: "pending", label: "Requested" },
  pre_op: { variant: "pending", label: "Pre-op" },
  cleaning: { variant: "pending", label: "Cleaning" },
  on_leave: { variant: "pending", label: "On leave" },
  expiring: { variant: "pending", label: "Expiring" },
  late: { variant: "pending", label: "Late" },
  probationary: { variant: "pending", label: "Probationary" },
  sick: { variant: "pending", label: "Sick" },

  in_progress: { variant: "processing", label: "In Progress" },
  processing: { variant: "processing", label: "Processing" },
  in_consultation: { variant: "processing", label: "In Consultation" },
  open: { variant: "processing", label: "Open" },
  transferred: { variant: "processing", label: "Transferred" },
  scheduled: { variant: "processing", label: "Scheduled" },
  urgent: { variant: "processing", label: "Urgent" },
  triage: { variant: "processing", label: "In Triage" },
  in_treatment: { variant: "processing", label: "In Treatment" },
  in_use: { variant: "processing", label: "In Use" },
  leave: { variant: "processing", label: "On Leave" },
  study: { variant: "processing", label: "Study" },
  vacation: { variant: "info", label: "Vacation" },
  maternity: { variant: "info", label: "Maternity" },
  paternity: { variant: "info", label: "Paternity" },
  regular: { variant: "info", label: "Regular" },
  consultant: { variant: "info", label: "Consultant" },

  cancelled: { variant: "critical", label: "Cancelled" },
  no_show: { variant: "critical", label: "No Show" },
  rejected: { variant: "critical", label: "Rejected" },
  failed: { variant: "critical", label: "Failed" },
  critical: { variant: "critical", label: "Critical" },
  refunded: { variant: "critical", label: "Refunded" },
  out_of_stock: { variant: "critical", label: "Out of Stock" },
  expired: { variant: "critical", label: "Expired" },
  emergency: { variant: "critical", label: "Emergency" },
  absent: { variant: "critical", label: "Absent" },

  inactive: { variant: "inactive", label: "Inactive" },
  archived: { variant: "inactive", label: "Archived" },
  discharged: { variant: "inactive", label: "Discharged" },
  maintenance: { variant: "inactive", label: "Maintenance" },
  low_stock: { variant: "inactive", label: "Low Stock" },
  less_urgent: { variant: "inactive", label: "Less urgent" },
  recovery: { variant: "info", label: "Recovery" },
  not_billed: { variant: "inactive", label: "Not billed" },
  separated: { variant: "inactive", label: "Separated" },
  contractual: { variant: "inactive", label: "Contractual" },
  part_time: { variant: "inactive", label: "Part-time" },
  holiday: { variant: "inactive", label: "Holiday" },
  elective: { variant: "inactive", label: "Elective" },
};

function StatusIcon({ variant }: { variant: BadgeVariant }) {
  const iconClassName = "size-3.5 shrink-0";

  switch (variant) {
    case "success":
      return <CheckCircleIcon className={iconClassName} aria-hidden="true" />;
    case "pending":
      return <ClockCircleIcon className={iconClassName} aria-hidden="true" />;
    case "processing":
      return <RefreshIcon className={iconClassName} aria-hidden="true" />;
    case "critical":
      return <DangerCircleIcon className={iconClassName} aria-hidden="true" />;
    case "info":
      return <CheckCircleIcon className={iconClassName} aria-hidden="true" />;
    case "inactive":
    default:
      return <MinusCircleIcon className={iconClassName} aria-hidden="true" />;
  }
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function humanizeStatus(status: string) {
  return normalizeStatus(status)
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = normalizeStatus(status);
  const config = STATUS_MAP[normalized];
  const variant: BadgeVariant = config?.variant ?? "inactive";
  const label = config?.label ?? (humanizeStatus(status) || status || "Unknown");

  return (
    <Badge variant={variant} className={className}>
      <StatusIcon variant={variant} />
      <span>{label}</span>
    </Badge>
  );
}

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
  connected: { variant: "success", label: "Connected" },
  info: { variant: "info", label: "Info" },
  success: { variant: "success", label: "Success" },
  eligible: { variant: "success", label: "Eligible" },
  on_duty: { variant: "success", label: "On Duty" },
  compatible: { variant: "success", label: "Compatible" },
  negative: { variant: "success", label: "Negative" },
  passed: { variant: "success", label: "Passed" },
  none: { variant: "success", label: "No reaction" },
  released: { variant: "success", label: "Released" },
  read: { variant: "success", label: "Read" },
  published: { variant: "success", label: "Published" },
  ready: { variant: "success", label: "Ready" },
  delivered: { variant: "success", label: "Delivered" },
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
  manual: { variant: "pending", label: "Manual only" },
  unverified: { variant: "pending", label: "Unverified" },
  partially_approved: { variant: "pending", label: "Partially Approved" },
  deferred: { variant: "pending", label: "Deferred" },
  on_break: { variant: "pending", label: "On Break" },
  on_hold: { variant: "pending", label: "On Hold" },
  release_pending: { variant: "pending", label: "Release Pending" },
  unclaimed: { variant: "pending", label: "Unclaimed" },
  queued: { variant: "pending", label: "Queued" },
  warning: { variant: "pending", label: "Warning" },
  adjusted: { variant: "pending", label: "Adjusted" },
  repair: { variant: "pending", label: "Repair" },
  terminal: { variant: "pending", label: "Terminal" },
  mild: { variant: "pending", label: "Mild" },

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
  basic_life_support: { variant: "info", label: "Basic Life Support" },
  advanced_life_support: { variant: "info", label: "Advanced Life Support" },
  patient_transport: { variant: "info", label: "Patient Transport" },
  mobile_icu: { variant: "info", label: "Mobile ICU" },
  discharge: { variant: "info", label: "Discharge" },
  preventive: { variant: "info", label: "Preventive" },
  calibration: { variant: "info", label: "Calibration" },
  inspection: { variant: "info", label: "Inspection" },
  breakfast: { variant: "info", label: "Breakfast" },
  lunch: { variant: "info", label: "Lunch" },
  dinner: { variant: "info", label: "Dinner" },
  snack: { variant: "info", label: "Snack" },
  prepared: { variant: "processing", label: "Prepared" },
  submitted: { variant: "processing", label: "Submitted" },
  in_review: { variant: "processing", label: "In Review" },
  crossmatched: { variant: "processing", label: "Crossmatched" },
  identified: { variant: "processing", label: "Identified" },
  sent: { variant: "processing", label: "Sent" },
  occupied: { variant: "processing", label: "Occupied" },
  authorized: { variant: "processing", label: "Authorized" },
  issued: { variant: "processing", label: "Issued" },
  moderate: { variant: "processing", label: "Moderate" },
  collected: { variant: "processing", label: "Collected" },
  tested: { variant: "processing", label: "Tested" },
  dispatched: { variant: "processing", label: "Dispatched" },
  on_trip: { variant: "processing", label: "On Trip" },
  assigned: { variant: "processing", label: "Assigned" },
  en_route: { variant: "processing", label: "En Route" },
  on_scene: { variant: "processing", label: "On Scene" },
  transporting: { variant: "processing", label: "Transporting" },
  preparing: { variant: "processing", label: "Preparing" },

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
  denied: { variant: "critical", label: "Denied" },
  incompatible: { variant: "critical", label: "Incompatible" },
  discrepancy: { variant: "critical", label: "Discrepancy" },
  spill: { variant: "critical", label: "Spill" },
  isolation: { variant: "critical", label: "Isolation" },
  overdue: { variant: "critical", label: "Overdue" },
  positive: { variant: "critical", label: "Positive" },
  severe: { variant: "critical", label: "Severe" },

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
  not_connected: { variant: "inactive", label: "Not connected" },
  discarded: { variant: "inactive", label: "Discarded" },
  routine: { variant: "inactive", label: "Routine" },
  out_of_service: { variant: "inactive", label: "Out of Service" },
  discontinued: { variant: "inactive", label: "Discontinued" },
  off_duty: { variant: "inactive", label: "Off Duty" },
  retired: { variant: "inactive", label: "Retired" },
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

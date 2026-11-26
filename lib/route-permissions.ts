/**
 * Path → permission rules shared by the sidebar and the middleware guard.
 * The longest matching prefix wins, so "/settings/users" can require a
 * different permission than "/settings". A `null` permission means any
 * authenticated user may open the path.
 */
type RouteRule = {
  prefix: string;
  permission: string | null;
};

const ROUTE_RULES: RouteRule[] = [
  { prefix: "/dashboard", permission: null },

  { prefix: "/patients", permission: "patient.view" },
  { prefix: "/appointments", permission: "appointment.view" },
  { prefix: "/emergency", permission: "emergency.view" },
  { prefix: "/admissions", permission: "admission.view" },
  { prefix: "/discharges", permission: "admission.view" },

  { prefix: "/medical-records", permission: "medical_record.view" },
  { prefix: "/nursing", permission: "nursing.view" },
  { prefix: "/surgery", permission: "surgery.view" },
  { prefix: "/staff", permission: "hr.view" },

  { prefix: "/laboratory", permission: "laboratory.view" },
  { prefix: "/radiology", permission: "radiology.view" },
  { prefix: "/blood-bank", permission: "blood_bank.view" },

  { prefix: "/pharmacy", permission: "pharmacy.view" },
  { prefix: "/prescriptions", permission: "prescription.view" },

  { prefix: "/billing", permission: "billing.view" },
  { prefix: "/payments", permission: "billing.view" },
  { prefix: "/insurance", permission: "insurance.view" },

  { prefix: "/inventory", permission: "inventory.view" },
  { prefix: "/departments", permission: "department.view" },
  { prefix: "/rooms-beds", permission: "bed.view" },
  { prefix: "/ambulance", permission: "ambulance.view" },

  { prefix: "/dietary", permission: "dietary.view" },
  { prefix: "/housekeeping", permission: "housekeeping.view" },
  { prefix: "/equipment", permission: "equipment.view" },
  { prefix: "/mortuary", permission: "mortuary.view" },
  { prefix: "/notifications", permission: "notification.view" },

  { prefix: "/hr", permission: "hr.view" },
  { prefix: "/reports", permission: "reports.view" },
  { prefix: "/audit-logs", permission: "audit.view" },

  { prefix: "/settings/users", permission: "user.view" },
  { prefix: "/settings/account", permission: null },
  { prefix: "/settings", permission: "settings.view" },
];

export function permissionForPath(pathname: string): string | null {
  let match: RouteRule | undefined;

  for (const rule of ROUTE_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      if (!match || rule.prefix.length > match.prefix.length) {
        match = rule;
      }
    }
  }

  return match?.permission ?? null;
}

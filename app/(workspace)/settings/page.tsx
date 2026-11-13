import { connection } from "next/server";
import {
  BedIcon,
  Buildings2Icon,
  HistoryIcon,
  PaletteIcon,
  ServerIcon,
  UserCircleIcon,
  UsersGroupTwoRoundedIcon,
} from "@solar-icons/react/linear";

import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import {
  SettingsLinkList,
  type SettingsLink,
} from "@/components/settings/settings-link-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { checkSupabaseConnection } from "@/lib/supabase/health";

export const metadata = {
  title: "Settings",
};

const ACCOUNT_LINKS: SettingsLink[] = [
  {
    href: "/settings/account",
    title: "Account Details",
    description: "Your profile information and password.",
    icon: UserCircleIcon,
  },
];

const ADMINISTRATION_LINKS: SettingsLink[] = [
  {
    href: "/settings/users",
    title: "User Management",
    description: "Staff accounts, roles and access.",
    icon: UsersGroupTwoRoundedIcon,
  },
  {
    href: "/audit-logs",
    title: "Audit Logs",
    description: "Accountability trail for sensitive operations.",
    icon: HistoryIcon,
  },
];

const REFERENCE_LINKS: SettingsLink[] = [
  {
    href: "/departments",
    title: "Departments",
    description: "Hospital departments and service units.",
    icon: Buildings2Icon,
  },
  {
    href: "/rooms-beds",
    title: "Rooms & Beds",
    description: "Room inventory and bed availability.",
    icon: BedIcon,
  },
];

export default async function SettingsPage() {
  await connection();
  const supabase = await checkSupabaseConnection();

  const backendStatus =
    supabase.state === "connected"
      ? "connected"
      : supabase.state === "unreachable"
        ? "not_connected"
        : "inactive";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="System configuration and administration."
      />

      <PageSection
        title="My account"
        description="Your profile details and sign-in security."
      >
        <SettingsLinkList items={ACCOUNT_LINKS} />
      </PageSection>

      <PageSection
        title="Administration"
        description="Management areas for hospital system administration."
      >
        <SettingsLinkList items={ADMINISTRATION_LINKS} />
      </PageSection>

      <PageSection
        title="Hospital reference data"
        description="Departments, rooms and beds used across hospital modules."
      >
        <SettingsLinkList items={REFERENCE_LINKS} />
      </PageSection>

      <PageSection title="Backend" description="Connection state for this build.">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-hospital-border bg-hospital-surface p-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-hospital-surface-muted text-hospital-text-muted">
              <ServerIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-hospital-text">
                Supabase connection
              </p>
              <p className="mt-0.5 text-xs text-hospital-text-muted">
                {supabase.state === "connected"
                  ? "Project reachable"
                  : supabase.state === "unreachable"
                    ? "Configured but unreachable"
                    : "Not configured"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-hospital-text-muted">
                {supabase.state === "connected"
                  ? "Credentials are configured and the project is reachable. UI pages still render preview fixtures until the data layer is switched to Supabase."
                  : supabase.message}
              </p>
            </div>
          </div>
          <StatusBadge status={backendStatus} />
        </div>
      </PageSection>

      <PageSection
        title="Interface"
        description="Read-only values from the current design system theme."
      >
        <div className="flex items-center gap-2">
          <PaletteIcon
            className="size-4 text-hospital-text-muted"
            aria-hidden="true"
          />
          <p className="text-xs text-hospital-text-muted">
            Current theme values
          </p>
        </div>

        <dl className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-medium text-hospital-text-muted">
              Primary color token
            </dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm text-hospital-text">
              <span
                className="size-4 rounded-sm border border-hospital-border bg-hospital-green"
                aria-hidden="true"
              />
              <span className="font-mono text-xs">--hospital-green</span>
              <span className="text-hospital-text-muted">#007A55</span>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-hospital-text-muted">
              Base font size
            </dt>
            <dd className="mt-1 text-sm text-hospital-text">13px</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-hospital-text-muted">
              Interface font
            </dt>
            <dd className="mt-1 text-sm text-hospital-text">
              Plus Jakarta Sans
            </dd>
          </div>
        </dl>
      </PageSection>
    </div>
  );
}

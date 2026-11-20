"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  AltArrowDownIcon,
  BellIcon,
  HamburgerMenuIcon,
  Logout2Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
  UserCircleIcon,
} from "@solar-icons/react/linear";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLink,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { isNavItemActive, navigation } from "@/lib/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSidebar } from "./sidebar-provider";

export type HospitalHeaderProfile = {
  email?: string;
  role?: string;
};

export type HospitalHeaderProps = {
  profile?: HospitalHeaderProfile;
};

export function HospitalHeader({ profile }: HospitalHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { mobileOpen, toggleMobile, collapsed, toggleCollapsed } = useSidebar();

  const [accountEmail, setAccountEmail] = React.useState<string | undefined>(
    profile?.email
  );
  const [signingOut, setSigningOut] = React.useState(false);
  const mobileTriggerRef = React.useRef<HTMLButtonElement>(null);
  const wasMobileOpen = React.useRef(false);

  React.useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      if (active) {
        setAccountEmail(data.session?.user.email ?? profile?.email);
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [profile?.email]);

  const currentItem = React.useMemo(() => {
    const items = navigation.flatMap((section) => section.items);

    return items
      .filter((item) => isNavItemActive(pathname, item.href))
      .sort((left, right) => right.href.length - left.href.length)[0];
  }, [pathname]);

  React.useEffect(() => {
    if (wasMobileOpen.current && !mobileOpen) {
      mobileTriggerRef.current?.focus();
    }

    wasMobileOpen.current = mobileOpen;
  }, [mobileOpen]);

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    try {
      await getSupabaseBrowserClient().auth.signOut();
    } catch {
      // Navigate anyway; the proxy will resolve the remaining session state.
    } finally {
      setSigningOut(false);
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between gap-4 border-b border-hospital-green-hover bg-hospital-green px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          ref={mobileTriggerRef}
          type="button"
          onClick={toggleMobile}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          aria-controls="hospital-sidebar"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-hospital-green sm:hidden"
        >
          <HamburgerMenuIcon className="size-5" />
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
            <Image
              src="/assets/spmc_logo.png"
              alt=""
              width={36}
              height={36}
              className="size-9 object-contain"
              priority
            />
          </span>

          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-white">
              Southern Philippines Medical Center
            </span>
            <span className="truncate text-[11px] text-white/90">
              Hospital Management System
            </span>
          </span>
        </div>

        {currentItem ? (
          <span className="hidden min-w-0 truncate border-l border-white/20 pl-3 text-xs text-white/90 sm:block">
            {currentItem.label}
          </span>
        ) : null}

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          className="hidden size-9 cursor-pointer items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-hospital-green sm:inline-flex"
        >
          {collapsed ? (
            <PanelLeftOpenIcon className="size-5" />
          ) : (
            <PanelLeftCloseIcon className="size-5" />
          )}
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-hospital-green"
        >
          <BellIcon className="size-5" />
        </button>

        <DropdownMenu
          align="end"
          className="w-56"
          trigger={
            <button
              type="button"
              className="group inline-flex h-9 items-center gap-2 rounded-md border border-white/60 bg-hospital-green-hover px-3 text-xs font-medium text-white transition-colors hover:bg-hospital-green-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-hospital-green"
            >
              <UserCircleIcon className="size-4" aria-hidden="true" />
              <span>Account</span>
              <AltArrowDownIcon
                aria-hidden="true"
                className="size-3 transition-transform duration-150 ease-out group-aria-expanded:rotate-180"
              />
            </button>
          }
        >
          <DropdownMenuLabel>
            <p className="truncate text-hospital-text">{accountEmail ?? "Account"}</p>
            {profile?.role ? <p className="mt-1 font-normal">{profile.role}</p> : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLink href="/settings/account">
            <SettingsIcon className="size-4 text-hospital-text-muted" aria-hidden="true" />
            Account settings
          </DropdownMenuLink>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            destructive
            disabled={signingOut}
            icon={<Logout2Icon />}
            onSelect={() => void handleSignOut()}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenu>
      </div>
    </header>
  );
}

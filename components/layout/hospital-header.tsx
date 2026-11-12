"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AltArrowDownIcon,
  BellIcon,
  HamburgerMenuIcon,
  HospitalIcon,
  Logout2Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
  UserCircleIcon,
} from "@solar-icons/react/linear";
import { cn } from "@/lib/utils";
import { isNavItemActive, navigation } from "@/lib/navigation";
import { usePreviewSessionEmail } from "@/lib/use-preview-session";
import { useSidebar } from "./sidebar-provider";

const SESSION_KEY = "spmc_auth_session";

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

  const [menuOpen, setMenuOpen] = React.useState(false);
  const sessionEmail = usePreviewSessionEmail();
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const userMenuTriggerRef = React.useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = React.useRef<HTMLButtonElement>(null);
  const wasMobileOpen = React.useRef(false);

  const accountEmail = sessionEmail ?? profile?.email;

  const currentItem = React.useMemo(() => {
    const items = navigation.flatMap((section) => section.items);

    return items
      .filter((item) => isNavItemActive(pathname, item.href))
      .sort((left, right) => right.href.length - left.href.length)[0];
  }, [pathname]);

  React.useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
        userMenuTriggerRef.current?.focus();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        userMenuTriggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  React.useEffect(() => {
    if (wasMobileOpen.current && !mobileOpen) {
      mobileTriggerRef.current?.focus();
    }

    wasMobileOpen.current = mobileOpen;
  }, [mobileOpen]);

  const closeMenu = (restoreFocus = true) => {
    setMenuOpen(false);

    if (restoreFocus) {
      userMenuTriggerRef.current?.focus();
    }
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore storage failures and leave the workspace anyway.
    }

    closeMenu(false);
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between gap-4 border-b border-hospital-border bg-white px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          ref={mobileTriggerRef}
          type="button"
          onClick={toggleMobile}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          aria-controls="hospital-sidebar"
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-hospital-text-muted transition-colors hover:bg-hospital-surface-muted hover:text-hospital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1 sm:hidden"
        >
          <HamburgerMenuIcon className="size-5" />
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-hospital-green text-white">
            <HospitalIcon className="size-5" />
          </span>

          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-hospital-green-dark">
              Southern Philippines Medical Center
            </span>
            <span className="truncate text-[11px] text-hospital-text-muted">
              Hospital Management System
            </span>
          </span>
        </div>

        {currentItem ? (
          <span className="hidden min-w-0 truncate border-l border-hospital-border pl-3 text-xs text-hospital-text-muted sm:block">
            {currentItem.label}
          </span>
        ) : null}

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          className="hidden size-9 cursor-pointer items-center justify-center rounded-md text-hospital-text-muted transition-colors hover:bg-hospital-surface-muted hover:text-hospital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1 sm:inline-flex"
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
          className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-hospital-text-muted transition-colors hover:bg-hospital-surface-muted hover:text-hospital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
        >
          <BellIcon className="size-5" />
        </button>

        <div ref={userMenuRef} className="relative">
          <button
            ref={userMenuTriggerRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="account-menu"
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-hospital-border bg-white px-3 text-xs font-medium text-hospital-text transition-colors hover:bg-hospital-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
          >
            <UserCircleIcon className="size-4 text-hospital-text-muted" />
            <span>Account</span>
            <AltArrowDownIcon
              aria-hidden="true"
              className={cn(
                "size-3 text-hospital-text-muted transition-transform duration-150 ease-out",
                menuOpen && "rotate-180"
              )}
            />
          </button>

          {menuOpen ? (
            <div
              id="account-menu"
              role="menu"
              aria-label="Account menu"
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-hospital-border bg-white shadow-lg"
            >
              <div className="border-b border-hospital-border-subtle px-3 py-2">
                {accountEmail || profile?.role ? (
                  <>
                    {accountEmail ? (
                      <p className="truncate text-xs font-medium text-hospital-text">
                        {accountEmail}
                      </p>
                    ) : null}
                    {profile?.role ? (
                      <p className="mt-1 text-[11px] text-hospital-text-muted">
                        {profile.role}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="text-xs font-medium text-hospital-text">
                    Account
                  </p>
                )}
              </div>

              <div className="p-1">
                <Link
                  href="/settings/account"
                  role="menuitem"
                  onClick={() => closeMenu(false)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-hospital-text transition-colors hover:bg-hospital-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hospital-green focus-visible:ring-offset-1"
                >
                  <SettingsIcon className="size-4 text-hospital-text-muted" />
                  <span>Account settings</span>
                </Link>
              </div>

              <div className="mt-1 border-t border-hospital-border-subtle p-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-1"
                >
                  <Logout2Icon className="size-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

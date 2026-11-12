"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseIcon } from "@solar-icons/react/linear";
import { cn } from "@/lib/utils";
import { isNavItemActive, navigation } from "@/lib/navigation";
import { useSidebar } from "./sidebar-provider";

type SidebarNavProps = {
  collapsed: boolean;
  onNavigate?: () => void;
};

function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex-1 space-y-5 overflow-y-auto px-2 py-4"
    >
      {navigation.map((section) => (
        <div key={section.title}>
          {collapsed ? (
            <div
              aria-hidden="true"
              className="mx-auto mb-2 h-px w-8 bg-white/20"
            />
          ) : (
            <h2 className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-white/90">
              {section.title}
            </h2>
          )}

          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex cursor-pointer items-center gap-2 rounded-md py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-hospital-green",
                    collapsed
                      ? isActive
                        ? "justify-center border-l-2 border-white pl-[10px] pr-2"
                        : "justify-center px-2"
                      : isActive
                        ? "border-l-2 border-white pl-[10px] pr-3"
                        : "px-3",
                    isActive
                      ? "bg-hospital-green-light font-semibold text-hospital-green-dark"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive
                        ? "text-hospital-green"
                        : "text-white/80 group-hover:text-white"
                    )}
                  />
                  {collapsed ? null : (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-white/10 px-3 py-3",
        collapsed && "px-2 text-center"
      )}
    >
      {collapsed ? (
        <p className="text-[11px] text-white/90">v0.1.0</p>
      ) : (
        <>
          <p className="text-[11px] font-semibold text-white/90">SPMC HMS</p>
          <p className="text-[11px] text-white/90">v0.1.0</p>
        </>
      )}
    </div>
  );
}

export function HospitalSidebar() {
  const { mobileOpen, closeMobile, collapsed } = useSidebar();

  return (
    <>
      <aside
        aria-label="Main navigation"
        className={cn(
          "hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-hospital-green-hover bg-hospital-green sm:flex",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <SidebarNav collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} />
      </aside>

      <div
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={cn(
          "fixed inset-0 z-50 sm:hidden",
          !mobileOpen && "pointer-events-none"
        )}
      >
        <div
          aria-hidden="true"
          onClick={closeMobile}
          className={cn(
            "absolute inset-0 bg-slate-900/40 transition-opacity duration-150 ease-out",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />

        <aside
          id="hospital-sidebar"
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
          className={cn(
            "absolute inset-y-0 left-0 flex w-64 flex-col border-r border-hospital-green-hover bg-hospital-green shadow-lg transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
              SPMC HMS
            </span>

            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close navigation"
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-hospital-green"
            >
              <CloseIcon className="size-5" />
            </button>
          </div>

          <SidebarNav collapsed={false} onNavigate={closeMobile} />
          <SidebarFooter collapsed={false} />
        </aside>
      </div>
    </>
  );
}

"use client";

import * as React from "react";

type SidebarContextValue = {
  mobileOpen: boolean;
  collapsed: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
  toggleCollapsed: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const openMobile = React.useCallback(() => setMobileOpen(true), []);
  const closeMobile = React.useCallback(() => setMobileOpen(false), []);
  const toggleMobile = React.useCallback(
    () => setMobileOpen((isOpen) => !isOpen),
    []
  );
  const toggleCollapsed = React.useCallback(
    () => setCollapsed((isCollapsed) => !isCollapsed),
    []
  );

  React.useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      mobileOpen,
      collapsed,
      openMobile,
      closeMobile,
      toggleMobile,
      toggleCollapsed,
    }),
    [
      mobileOpen,
      collapsed,
      openMobile,
      closeMobile,
      toggleMobile,
      toggleCollapsed,
    ]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

"use client";

import * as React from "react";

export type PermissionContextValue = {
  isAdmin: boolean;
  permissions: string[];
};

const PermissionContext = React.createContext<PermissionContextValue>({
  isAdmin: false,
  permissions: [],
});

export function PermissionProvider({
  value,
  children,
}: {
  value: PermissionContextValue;
  children: React.ReactNode;
}) {
  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions(): PermissionContextValue {
  return React.useContext(PermissionContext);
}

/**
 * Returns a predicate for permission slugs. UI gating only — RLS and the RPC
 * permission checks remain the real authorization boundary.
 */
export function useCan(): (permission: string | undefined) => boolean {
  const { isAdmin, permissions } = usePermissions();

  return React.useCallback(
    (permission: string | undefined) => {
      if (!permission) {
        return true;
      }

      return isAdmin || permissions.includes(permission);
    },
    [isAdmin, permissions]
  );
}

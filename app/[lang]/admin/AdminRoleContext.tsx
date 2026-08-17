"use client";

import { createContext, useContext } from "react";

/**
 * Carries the viewer's role (resolved server-side by the admin layout's gate)
 * down to client views, so they can do UX-only gating (Verify for admin+,
 * role-change for superuser). The backend remains the authority on every
 * request; this is convenience only.
 */
const AdminRoleContext = createContext<string>("");

export function AdminRoleProvider({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  return (
    <AdminRoleContext.Provider value={role}>
      {children}
    </AdminRoleContext.Provider>
  );
}

export function useAdminRole(): string {
  return useContext(AdminRoleContext);
}

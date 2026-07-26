import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import type { UserRole } from "@shared/types";
import { useAuth } from "@/lib/auth";
import { LoadingBlock } from "./ui";

/**
 * Client-side gate. Convenience only — every route is independently
 * authorized server-side, since a client check protects nothing on its own.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingBlock label="Checking your session…" />;

  if (!user) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate replace to="/" />;
  }

  return <>{children}</>;
}

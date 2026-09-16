import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import type { UserRole } from "@shared/types";
import { roleSatisfiesAny } from "@shared/permissions";
import { homePathForRole, useAuth } from "@/lib/auth";
import { LoadingBlock } from "./ui";

/**
 * Client-side gate. Convenience only — every route is independently
 * authorized server-side, since a client check protects nothing on its own.
 *
 * Key rule: if `roles` includes "admin", a user with role "super_admin" is
 * also allowed through, because super_admin is a strict superset of admin.
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
    const isTargetingAdmin = location.pathname.startsWith("/admin");
    const targetLoginPath = isTargetingAdmin ? "/admin/login" : "/login";
    return <Navigate replace state={{ from: location.pathname }} to={targetLoginPath} />;
  }

  if (!roleSatisfiesAny(user.role, roles)) {
    return <Navigate replace to={homePathForRole(user.role)} />;
  }

  return <>{children}</>;
}

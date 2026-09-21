import { Navigate, useLocation } from "react-router-dom";
import { homePathForRole, useAuth } from "@/lib/auth";
import { LoadingBlock } from "./ui";

/**
 * REH-125: Dynamic router for /dashboard.
 * Redirects authenticated users to their role-specific dashboard:
 * - researcher -> /researcher
 * - respondent -> /inbox
 * - admin -> /admin/review-queue
 * - super_admin -> /admin
 * If not authenticated, redirects to /login.
 */
export function DashboardRedirect() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingBlock label="Redirecting to your dashboard…" />;
  }

  if (!user) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return <Navigate replace to={homePathForRole(user.role)} />;
}

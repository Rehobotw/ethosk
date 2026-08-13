import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { UserRole } from "@shared/types";

export function AuthRoleRedirect({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const paramRole = searchParams.get("role");
    const storedRole = localStorage.getItem("ethosk_last_role");
    const role: UserRole =
      paramRole === "respondent" || paramRole === "researcher"
        ? paramRole
        : storedRole === "respondent" || storedRole === "researcher"
        ? storedRole
        : "researcher";

    const remainingParams = new URLSearchParams(searchParams);
    remainingParams.delete("role");
    const queryString = remainingParams.toString() ? `?${remainingParams.toString()}` : "";

    navigate(`/${mode}/${role}${queryString}`, { replace: true });
  }, [mode, navigate, searchParams]);

  return null;
}

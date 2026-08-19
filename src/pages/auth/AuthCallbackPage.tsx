import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserRole } from "@shared/types";
import { LoadingBlock, Notice } from "@/components/ui";
import { api, setToken } from "@/lib/api";
import { homePathForRole, useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        let { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        // If session not ready yet, attempt to retrieve user or wait for hash parsing
        if (!session) {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            const res = await supabase.auth.getSession();
            session = res.data.session;
          }
        }

        if (!session) {
          throw new Error("No session established. Please try logging in again.");
        }

        // Store the token immediately so subsequent api calls use it
        setToken(session.access_token);

        const intendedRole = localStorage.getItem("ethosk_intended_role") as UserRole | null;

        // Ensure user row exists and sync role
        const response = await api<{ success: boolean; exists?: boolean; role?: UserRole; profile?: { name: string; email: string } }>("/auth/sync-oauth", {
          body: { role: intendedRole || undefined },
        });

        // Clear intended role
        localStorage.removeItem("ethosk_intended_role");

        // Reload the full session in the auth context
        await refresh();

        if (mounted) {
          const searchParams = new URLSearchParams(window.location.search);
          const fromPath = searchParams.get("from");

          if (response.exists === false && response.profile) {
            // User does not exist, and no intended role was provided
            // Route into Signup with Google profile pre-filled
            const queryParams = new URLSearchParams({
              name: response.profile.name,
              email: response.profile.email,
            });
            navigate(`/signup?${queryParams.toString()}`, { replace: true });
          } else if (fromPath && !fromPath.startsWith("/login") && !fromPath.startsWith("/signup")) {
            navigate(fromPath, { replace: true });
          } else {
            navigate(homePathForRole(response.role || "respondent"), { replace: true });
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to complete authentication.");
        }
      }
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate, refresh]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Notice tone="error" title="Authentication Error">
            <p>{error}</p>
            <button
              className="mt-4 text-primary font-medium hover:underline cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Return to login
            </button>
          </Notice>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingBlock label="Completing sign in..." />
    </div>
  );
}

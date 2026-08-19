import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserRole } from "@shared/types";
import { LoadingBlock, Notice } from "@/components/ui";
import { api } from "@/lib/api";
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session) {
          throw new Error("No session established. Please try logging in again.");
        }

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
          if (response.exists === false && response.profile) {
            // User does not exist, and no intended role was provided
            // Route into Signup with Google profile pre-filled
            const queryParams = new URLSearchParams({
              name: response.profile.name,
              email: response.profile.email,
            });
            navigate(`/signup?${queryParams.toString()}`, { replace: true });
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

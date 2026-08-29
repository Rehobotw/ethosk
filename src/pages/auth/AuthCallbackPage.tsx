import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { UserRole } from "@shared/types";
import { LoadingBlock } from "@/components/ui";
import { api, setToken } from "@/lib/api";
import { homePathForRole, useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { supabase } from "@/lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const { language } = useLanguage();
  const isAm = language === "am";
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
      <div className="bg-[#faf8ff] font-['Inter',sans-serif] text-[#131b2e] min-h-screen flex flex-col antialiased">
        <main className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="max-w-[680px] w-full bg-white border border-[#c0c7d0]/60 rounded-2xl p-8 md:p-12 text-center shadow-xs">
            <div className="mb-6 flex justify-center">
              <span
                className="material-symbols-outlined text-[#ba1a1a] text-[64px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lock_person
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-[#131b2e] mb-3 tracking-tight">
              {isAm ? "ማረጋገጫ ስህተት" : "Authentication Error"}
            </h1>
            <p className="text-xs md:text-sm text-[#50616b] mb-8 max-w-[480px] mx-auto leading-relaxed">
              {isAm
                ? "የመለያ ማረጋገጫ ሂደት ላይ ችግር አጋጥሟል። እባክዎ እንደገና ይሞክሩ ወይም ወደ መግቢያ ገጽ ይመለሱ።"
                : "We encountered an issue while verifying your account. Please try again or return to the login page."}
            </p>

            {/* Detailed error message */}
            <div className="mb-8 bg-[#fef0f0] border border-[#ba1a1a]/20 rounded-lg px-4 py-3 text-left max-w-[480px] mx-auto">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#ba1a1a] text-[18px] mt-0.5 shrink-0">info</span>
                <p className="text-xs text-[#ba1a1a]/80 leading-relaxed break-words">{error}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="bg-gradient-to-br from-[#005985] to-[#2872a1] text-white font-semibold text-xs md:text-sm px-6 py-3 rounded-lg w-full sm:w-auto flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>{isAm ? "ወደ መግቢያ ተመለስ" : "Return to Login"}</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="bg-white border border-[#c0c7d0] text-[#131b2e] font-semibold text-xs md:text-sm px-6 py-3 rounded-lg w-full sm:w-auto flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>{isAm ? "እንደገና ሞክር" : "Try Again"}</span>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-[#c0c7d0]/40">
              <p className="font-mono text-xs text-[#50616b] flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-slate-400">bug_report</span>
                <span>Error Code: AUTH_CALLBACK_FAILED</span>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-[#c0c7d0]/40 w-full py-6 px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center max-w-[1280px] mx-auto text-xs text-[#50616b] gap-4">
            <div className="font-bold text-[#005985]">Ethosk</div>
            <div className="flex gap-6">
              <Link to="/contact" className="hover:text-[#005985] transition-colors">
                Support
              </Link>
              <Link to="/privacy" className="hover:text-[#005985] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-[#005985] transition-colors">
                Terms of Service
              </Link>
            </div>
            <div>© {new Date().getFullYear()} Ethosk Platform. Professional Data Rigor.</div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingBlock label="Completing sign in..." />
    </div>
  );
}


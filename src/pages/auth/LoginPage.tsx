import { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserRole } from "@shared/types";
import { loginSchema, type LoginInput } from "@shared/validation/schemas";
import { Notice } from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { homePathForRole, isPathAllowedForRole, useAuth } from "@/lib/auth";
import { useAutofillSafeSubmit } from "@/lib/forms";
import { useLanguage } from "@/lib/language";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "./AuthShell";

export function LoginPage() {
  const { login, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const fromPath = (location.state as { from?: string })?.from || searchParams.get("from");

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const {
    register,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const watchEmail = watch("email");

  const handlePostLoginRedirect = (sessionRole: UserRole) => {
    if (fromPath && isPathAllowedForRole(fromPath, sessionRole)) {
      navigate(fromPath, { replace: true });
      return;
    }
    navigate(homePathForRole(sessionRole), { replace: true });
  };

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    try {
      const session = await login(values);
      handlePostLoginRedirect(session.role);
    } catch (error) {
      if (error instanceof ApiRequestError && (error.data as Record<string, unknown>)?.verification_required) {
        const email = (error.data as Record<string, unknown>)?.email as string || values.email;
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setFormError(
        error instanceof ApiRequestError ? error.message : "Could not sign in. Try again.",
      );
    }
  };

  const { formRef, onSubmit: handleFormSubmit } = useAutofillSafeSubmit(form, onSubmit);

  const handleDemoFill = async (email: string) => {
    setValue("email", email);
    setValue("password", "ethosk-demo-2024");
    setFormError(null);
    try {
      const session = await login({ email, password: "ethosk-demo-2024" });
      handlePostLoginRedirect(session.role);
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : "Could not sign in. Try again.",
      );
    }
  };

  const handleGoogleLogin = async () => {
    setFormError(null);
    setIsGoogleLoading(true);
    try {
      localStorage.removeItem("ethosk_intended_role");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback${fromPath ? `?from=${encodeURIComponent(fromPath)}` : ""}`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setFormError(error.message || "Failed to initialize Google login.");
      setIsGoogleLoading(false);
    }
  };

  if (!loading && user) {
    return (
      <AuthShell
        footer={
          <button className="font-semibold text-primary hover:underline cursor-pointer" onClick={() => logout()} type="button">
            Log out to switch accounts
          </button>
        }
        subtitle="You are currently signed in to Ethosk."
        title="Already Logged In"
      >
        <div className="space-y-4 rounded-xl p-4 text-center">
          <p className="font-body-md text-on-surface">
            Currently logged in as <strong className="text-primary">{user.full_name || user.email}</strong> ({user.role}).
          </p>
          <div className="flex flex-col gap-2 sm:flex-row justify-center">
            <button
              onClick={() => handlePostLoginRedirect(user.role)}
              className="primary-gradient-btn px-6 py-2.5 rounded-full text-white font-semibold text-sm cursor-pointer"
              type="button"
            >
              Go to {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal
            </button>
            <button
              onClick={() => logout()}
              className="px-6 py-2.5 rounded-full border border-outline-variant text-primary font-semibold text-sm hover:bg-surface-container transition-colors cursor-pointer"
              type="button"
            >
              Log Out &amp; Switch Account
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  const isAm = language === "am";

  return (
    <AuthShell
      footer={
        <>
          {isAm ? "መለያ የለዎትም? " : "Don't have an account? "}
          <Link
            className="font-semibold text-primary hover:underline"
            to="/signup"
          >
            {t("nav.signup")}
          </Link>
        </>
      }
      subtitle={isAm ? "እንኳን ደህና መጡ። እባክዎ መረጃዎን ያስገቡ::" : "Welcome back. Please enter your email and password."}
      title={isAm ? "ወደ Ethosk ይግቡ" : "Sign In to Ethosk"}
    >
      <div className="space-y-4">
        <button
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-outline-variant/60 bg-surface-container-low hover:bg-surface-container transition-colors text-on-surface font-label-md text-sm cursor-pointer disabled:opacity-50"
          disabled={isGoogleLoading || isSubmitting}
          onClick={handleGoogleLogin}
          type="button"
        >
          {isGoogleLoading ? (
            <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
          ) : (
            <img alt="Google" className="h-5 w-5" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" />
          )}
          <span>{isAm ? "በ Google ይቀጥሉ" : "Continue with Google"}</span>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant/40" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface-container-lowest px-3 text-on-surface-variant font-label-md">
              {isAm ? "ወይም በኢሜይል ይቀጥሉ" : "Or continue with email"}
            </span>
          </div>
        </div>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={handleFormSubmit}
        ref={formRef}
      >
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="font-label-md text-label-md text-on-surface block" htmlFor="email">
            {isAm ? "የኢሜይል አድራሻ" : "Email Address"}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </span>
            <input
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/60 rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              id="email"
              inputMode="email"
              placeholder="name@example.com"
              type="email"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-error mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="font-label-md text-label-md text-on-surface block" htmlFor="password">
              {isAm ? "የይለፍ ቃል" : "Password"}
            </label>
            <Link
              className="font-label-md text-xs text-primary hover:underline transition-colors"
              to={watchEmail ? `/forgot-password?email=${encodeURIComponent(watchEmail)}` : "/forgot-password"}
            >
              {isAm ? "የይለፍ ቃል ረሱ?" : "Forgot password?"}
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </span>
            <input
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-3 bg-surface-container-low border border-outline-variant/60 rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              id="password"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              {...register("password")}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              onClick={() => setShowPassword((shown) => !shown)}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-error mt-1">{errors.password.message}</p>
          )}
        </div>

        {formError ? <Notice tone="error">{formError}</Notice> : null}

        {/* Submit Button */}
        <button
          className="w-full primary-gradient-btn text-white font-title-lg text-base py-3.5 px-4 rounded-full flex items-center justify-center gap-2 hover:shadow-lg active:scale-95 transition-all shadow-md disabled:opacity-50 mt-2 cursor-pointer"
          disabled={isSubmitting || isGoogleLoading}
          type="submit"
        >
          {isSubmitting ? (
            <span className="material-symbols-outlined animate-spin text-white text-lg">progress_activity</span>
          ) : null}
          <span>{isAm ? "ግቡ" : "Sign In"}</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </form>
      
      {/* Quick Demo Login Shortcut */}
      <div className="mt-5 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 p-3 text-center">
        <p className="font-label-caps text-[11px] text-surface-tint uppercase tracking-wider">
          ⚡ {t("auth.demo_login_title")}
        </p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            className="flex flex-col items-center justify-center rounded-lg bg-white border border-outline-variant/30 px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container transition-colors shadow-xs cursor-pointer"
            onClick={() => void handleDemoFill("researcher@ethosk.com")}
            type="button"
          >
            <span className="font-bold text-primary">Researcher Demo</span>
            <span className="text-[10px] text-on-surface-variant">researcher@ethosk.com</span>
          </button>
          <button
            className="flex flex-col items-center justify-center rounded-lg bg-white border border-outline-variant/30 px-3 py-1.5 text-xs text-on-surface hover:bg-surface-container transition-colors shadow-xs cursor-pointer"
            onClick={() => void handleDemoFill("respondent@ethosk.com")}
            type="button"
          >
            <span className="font-bold text-primary">Respondent Demo</span>
            <span className="text-[10px] text-on-surface-variant">respondent@ethosk.com</span>
          </button>
        </div>
      </div>
    </AuthShell>
  );
}

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserRole } from "@shared/types";
import { loginSchema, type LoginInput } from "@shared/validation/schemas";
import { Button, Field, Icon, Input, Notice } from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { homePathForRole, useAuth } from "@/lib/auth";
import { useAutofillSafeSubmit } from "@/lib/forms";
import { useLanguage } from "@/lib/language";
import { AuthShell, RoleTabs } from "./AuthShell";

export function LoginPage() {
  const { login, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const requestedRole = (searchParams.get("role") as UserRole) || "researcher";
  const [role, setRole] = useState<UserRole>(requestedRole);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    try {
      const session = await login({ ...values, role });
      navigate(homePathForRole(session.role), { replace: true });
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

  const handleDemoFill = async (targetRole: UserRole, email: string) => {
    setRole(targetRole);
    setValue("email", email);
    setValue("password", "ethosk-demo-2024");
    setFormError(null);
    try {
      const session = await login({ email, password: "ethosk-demo-2024", role: targetRole });
      navigate(homePathForRole(session.role), { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : "Could not sign in. Try again.",
      );
    }
  };

  if (!loading && user) {
    return (
      <AuthShell
        footer={
          <button className="font-semibold text-primary hover:underline" onClick={() => logout()} type="button">
            Log out to switch accounts
          </button>
        }
        subtitle="You are currently signed in to Ethosk."
        title="Already Logged In"
      >
        <div className="space-y-4 rounded-xl glass-pressed p-4 text-center">
          <p className="font-body-md text-on-surface">
            Currently logged in as <strong className="text-primary">{user.full_name || user.email}</strong> ({user.role}).
          </p>
          <div className="flex flex-col gap-2 sm:flex-row justify-center">
            <Button onClick={() => navigate(homePathForRole(user.role))}>
              Go to {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal
            </Button>
            <Button variant="outline" onClick={() => logout()}>
              Log Out &amp; Switch Account
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      footer={
        <>
          Don&rsquo;t have an account?{" "}
          <Link className="font-semibold text-primary hover:underline" to={`/signup?role=${role}`}>
            {t("nav.signup")}
          </Link>
        </>
      }
      subtitle={t("auth.login_subtitle")}
      title={t("auth.login_title")}
    >
      <RoleTabs onChange={setRole} value={role} />

      {/* Quick Demo Login Shortcuts */}
      <div className="mt-5 rounded-xl glass-pressed p-3 text-center">
        <p className="font-label-caps text-[12px] font-semibold text-surface-tint uppercase tracking-wide">
          ⚡ {t("auth.demo_login_title")}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            className="flex flex-col items-center justify-center rounded-xl bg-white/60 backdrop-blur-xl border border-white/40 p-2 text-[11px] font-medium text-on-surface hover:bg-white/80 transition-colors"
            onClick={() => void handleDemoFill("researcher", "researcher@ethosk.com")}
            type="button"
          >
            <span className="font-bold text-primary">{t("auth.demo_researcher")}</span>
            <span className="text-[10px] text-on-surface-variant">researcher@ethosk.com</span>
          </button>

          <button
            className="flex flex-col items-center justify-center rounded-xl bg-white/60 backdrop-blur-xl border border-white/40 p-2 text-[11px] font-medium text-on-surface hover:bg-white/80 transition-colors"
            onClick={() => void handleDemoFill("respondent", "respondent@ethosk.com")}
            type="button"
          >
            <span className="font-bold text-primary">{t("auth.demo_respondent")}</span>
            <span className="text-[10px] text-on-surface-variant">respondent@ethosk.com</span>
          </button>
        </div>
      </div>

      <form
        className="mt-5 space-y-4"
        onSubmit={handleFormSubmit}
        ref={formRef}
      >
        <div className="space-y-4 rounded-xl bg-white/60 backdrop-blur-xl border border-white/40 p-5">
          <Field error={errors.email?.message} label={t("auth.email")}>
            <Input
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.com"
              type="email"
              {...register("email")}
            />
          </Field>

          <Field
            action={
              <Link
                className="font-label-caps text-label-caps uppercase text-surface-tint hover:text-primary hover:underline"
                to={watchEmail ? `/forgot-password?email=${encodeURIComponent(watchEmail)}` : "/forgot-password"}
              >
                Forgot?
              </Link>
            }
            error={errors.password?.message}
            label={t("auth.password")}
          >
            <div className="relative">
              <Input
                autoComplete="current-password"
                className="pr-11"
                type={showPassword ? "text" : "password"}
                {...register("password")}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => setShowPassword((shown) => !shown)}
                type="button"
              >
                <Icon className="text-[20px]" name={showPassword ? "visibility_off" : "visibility"} />
              </button>
            </div>
          </Field>
        </div>

        {formError ? <Notice tone="error">{formError}</Notice> : null}

        <button
          className="primary-gradient-btn w-full py-3.5 rounded-xl font-body-lg font-semibold flex items-center justify-center gap-2 shadow-md transform hover:-translate-y-0.5 transition-all magnetic-btn disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <span className="material-symbols-outlined animate-spin text-white text-lg">progress_activity</span>
          ) : null}
          <span className="text-white">
            {t("nav.login")} ({role === "researcher" ? t("auth.role_researcher") : t("auth.role_respondent")})
          </span>
          <span className="material-symbols-outlined text-lg text-white">arrow_forward</span>
        </button>
      </form>
    </AuthShell>
  );
}

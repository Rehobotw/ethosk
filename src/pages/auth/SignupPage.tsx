import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserRole } from "@shared/types";
import { signupSchema, type SignupInput } from "@shared/validation/schemas";
import { Button, Field, Input, Notice } from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { homePathForRole, useAuth } from "@/lib/auth";
import { useAutofillSafeSubmit } from "@/lib/forms";
import { useLanguage } from "@/lib/language";
import { AuthShell, RoleTabs } from "./AuthShell";

interface SignupPageProps {
  forcedRole?: "researcher" | "respondent";
}

export function SignupPage({ forcedRole }: SignupPageProps) {
  const { signup, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const requestedParam = searchParams.get("role") as string;
  const requestedRole: "respondent" | "researcher" =
    forcedRole || (requestedParam === "researcher" ? "researcher" : "respondent");
  const [role, setRole] = useState<"respondent" | "researcher">(requestedRole);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (forcedRole) {
      setRole(forcedRole);
      localStorage.setItem("ethosk_last_role", forcedRole);
    }
  }, [forcedRole]);

  const handleRoleChange = (newRole: UserRole) => {
    const validRole = newRole === "researcher" ? "researcher" : "respondent";
    setRole(validRole);
    localStorage.setItem("ethosk_last_role", validRole);
    navigate(`/signup/${validRole}`, { replace: true });
  };

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: "", email: "", password: "", role: requestedRole },
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (values: SignupInput) => {
    setFormError(null);
    try {
      localStorage.setItem("ethosk_last_role", role);
      const result = await signup({ ...values, role });
      if (result.verification_required) {
        navigate(`/verify-email?email=${encodeURIComponent(result.email)}`);
      } else {
        navigate(role === "respondent" ? "/profile" : homePathForRole(role as UserRole), {
          replace: true,
        });
      }
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : "Could not create your account. Try again.",
      );
    }
  };

  const { formRef, onSubmit: handleFormSubmit } = useAutofillSafeSubmit(form, onSubmit);

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
              Log Out to Register as {requestedRole.charAt(0).toUpperCase() + requestedRole.slice(1)}
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  const isResearcher = role === "researcher";
  const title = isResearcher ? "Create Researcher Account" : "Create Respondent Account";
  const subtitle = isResearcher
    ? "Design verified studies, target tailored demographics, and unlock actionable insights across Ethiopia."
    : "Join Ethiopia's verified community, share your opinion on important topics, and receive instant payouts.";

  return (
    <AuthShell
      footer={
        <div className="space-y-2">
          <div>
            Already registered?{" "}
            <Link className="font-semibold text-primary hover:underline" to={`/login/${role}`}>
              {t("nav.login")} ({isResearcher ? "Researcher" : "Respondent"})
            </Link>
          </div>
          <div className="text-xs text-on-surface-variant">
            {isResearcher ? (
              <>
                Looking to participate and earn?{" "}
                <Link className="font-semibold text-primary hover:underline" to="/signup/respondent">
                  Sign up as Respondent
                </Link>
              </>
            ) : (
              <>
                Conducting research or surveys?{" "}
                <Link className="font-semibold text-primary hover:underline" to="/signup/researcher">
                  Sign up as Researcher
                </Link>
              </>
            )}
          </div>
        </div>
      }
      subtitle={subtitle}
      title={title}
    >
      <RoleTabs onChange={handleRoleChange} value={role} />

      <form
        className="mt-5 space-y-4"
        onSubmit={handleFormSubmit}
        ref={formRef}
      >
        <div className="space-y-4 rounded-xl bg-white/60 backdrop-blur-xl border border-white/40 p-5">
          <Field error={errors.full_name?.message} label={t("auth.full_name")}>
            <Input autoComplete="name" placeholder="Abebe Bekele" {...register("full_name")} />
          </Field>

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
            error={errors.password?.message}
            hint="At least 8 characters."
            label={t("auth.password")}
          >
            <Input autoComplete="new-password" type="password" {...register("password")} />
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
            {t("nav.signup")} ({isResearcher ? t("auth.role_researcher") : t("auth.role_respondent")})
          </span>
          <span className="material-symbols-outlined text-lg text-white">arrow_forward</span>
        </button>

        <p className="text-center font-body-md text-[12px] text-on-surface-variant">
          By continuing you consent to Ethosk processing the details you provide, as described in our
          data-handling notice under Proclamation 1321/2024.
        </p>
      </form>
    </AuthShell>
  );
}

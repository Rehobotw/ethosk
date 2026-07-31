import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserRole } from "@shared/types";
import { signupSchema, type SignupInput } from "@shared/validation/schemas";
import { Button, Field, Icon, Input, Notice } from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { homePathForRole, useAuth } from "@/lib/auth";
import { useAutofillSafeSubmit } from "@/lib/forms";
import { useLanguage } from "@/lib/language";
import { AuthShell, RoleTabs } from "./AuthShell";

export function SignupPage() {
  const { signup, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const requestedRole = (searchParams.get("role") as UserRole) || "respondent";
  const [role, setRole] = useState<UserRole>(requestedRole);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: "", phone: "", password: "", role: requestedRole },
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (values: SignupInput) => {
    setFormError(null);
    try {
      const session = await signup({ ...values, role });
      // A new respondent needs a profile before anything can match them.
      navigate(session.role === "respondent" ? "/profile" : homePathForRole(session.role), {
        replace: true,
      });
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
        <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="font-body-md text-on-surface">
            Currently logged in as <strong className="text-primary">{user.full_name || user.phone}</strong> ({user.role}).
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

  return (
    <AuthShell
      footer={
        <>
          Already registered?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/login">
            {t("nav.login")}
          </Link>
        </>
      }
      subtitle={t("auth.signup_subtitle")}
      title={t("auth.signup_title")}
    >
      <RoleTabs onChange={setRole} value={role} />

      <form
        className="mt-stack-md space-y-stack-md"
        onSubmit={handleFormSubmit}
        ref={formRef}
      >
        <div className="space-y-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
          <Field error={errors.full_name?.message} label={t("auth.full_name")}>
            <Input autoComplete="name" placeholder="Abebe Bekele" {...register("full_name")} />
          </Field>

          <Field error={errors.phone?.message} label={t("auth.phone")}>
            <Input
              autoComplete="tel"
              inputMode="tel"
              placeholder="0912345678"
              {...register("phone")}
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

        <Button className="w-full py-3" loading={isSubmitting} type="submit">
          {t("nav.signup")} ({role === "researcher" ? t("auth.role_researcher") : t("auth.role_respondent")})
          <Icon className="text-[18px]" name="arrow_forward" />
        </Button>

        <p className="text-center font-body-sm text-[12px] text-on-surface-variant">
          By continuing you consent to Ethosk processing the details you provide, as described in our
          data-handling notice under Proclamation 1321/2024.
        </p>
      </form>
    </AuthShell>
  );
}

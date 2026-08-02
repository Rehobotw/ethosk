import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyEmailSchema, type VerifyEmailInput } from "@shared/validation/schemas";
import { Button, Field, Icon, Input, Notice } from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { homePathForRole, useAuth } from "@/lib/auth";
import { useAutofillSafeSubmit } from "@/lib/forms";
import { useLanguage } from "@/lib/language";
import { AuthShell } from "./AuthShell";

export function VerifyEmailPage() {
  const { verifyEmail, resendCode, user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const initialCode = searchParams.get("code") || "";

  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const form = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: initialEmail,
      code: initialCode,
    },
  });

  const {
    register,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const currentEmail = watch("email");

  useEffect(() => {
    if (initialEmail) {
      setValue("email", initialEmail);
    }
    if (initialCode) {
      setValue("code", initialCode);
    }
  }, [initialEmail, initialCode, setValue]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onSubmit = async (values: VerifyEmailInput) => {
    setFormError(null);
    setInfoMessage(null);
    try {
      const session = await verifyEmail(values);
      if (session.role === "respondent") {
        navigate("/profile", { replace: true });
      } else {
        navigate(homePathForRole(session.role), { replace: true });
      }
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : "Invalid verification code. Please check and try again.",
      );
    }
  };

  const { formRef, onSubmit: handleFormSubmit } = useAutofillSafeSubmit(form, onSubmit);

  const handleResend = async () => {
    if (!currentEmail || cooldown > 0) return;
    setFormError(null);
    setIsResending(true);
    try {
      const result = await resendCode({ email: currentEmail });
      setInfoMessage(result.message || "A new verification code has been sent.");
      setCooldown(30);
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : "Failed to resend code. Try again later.",
      );
    } finally {
      setIsResending(false);
    }
  };

  if (!loading && user && user.email_verified) {
    navigate(homePathForRole(user.role), { replace: true });
    return null;
  }

  return (
    <AuthShell
      footer={
        <>
          Already verified?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/login">
            {t("nav.login")}
          </Link>
        </>
      }
      subtitle={t("auth.verify_subtitle")}
      title={t("auth.verify_title")}
    >
      <form className="mt-stack-md space-y-stack-md" onSubmit={handleFormSubmit} ref={formRef}>
        <div className="space-y-stack-md rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md">
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
            error={errors.code?.message}
            hint="Enter the 6-digit verification code"
            label={t("auth.verification_code")}
          >
            <Input
              autoComplete="one-time-code"
              className="text-center font-mono text-lg tracking-widest"
              maxLength={8}
              placeholder="123456"
              {...register("code")}
            />
          </Field>
        </div>

        {formError ? <Notice tone="error">{formError}</Notice> : null}
        {infoMessage ? <Notice tone="info">{infoMessage}</Notice> : null}

        <Button className="w-full py-3" loading={isSubmitting} type="submit">
          Verify & Continue
          <Icon className="text-[18px]" name="check_circle" />
        </Button>

        <div className="flex items-center justify-between pt-2">
          <button
            className="text-xs text-primary font-medium hover:underline disabled:opacity-50"
            disabled={isResending || cooldown > 0}
            onClick={() => void handleResend()}
            type="button"
          >
            {isResending
              ? "Sending…"
              : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Didn't receive a code? Resend"}
          </button>

          <Link className="text-xs text-on-surface-variant hover:underline" to="/login">
            Back to login
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

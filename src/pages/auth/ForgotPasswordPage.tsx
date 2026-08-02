import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@shared/validation/schemas";
import { Button, Field, Icon, Input, Notice } from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAutofillSafeSubmit } from "@/lib/forms";
import { useLanguage } from "@/lib/language";
import { AuthShell } from "./AuthShell";

export function ForgotPasswordPage() {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [step, setStep] = useState<"request" | "reset" | "success">(
    initialEmail ? "reset" : "request",
  );
  const [email, setEmail] = useState(initialEmail);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Form for Step 1: Request Reset Code
  const requestForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: initialEmail },
  });

  // Form for Step 2: Enter OTP & New Password
  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      code: "",
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const onRequestSubmit = async (values: ForgotPasswordInput) => {
    setFormError(null);
    setInfoMessage(null);
    try {
      const result = await forgotPassword(values);
      setEmail(values.email);
      resetForm.setValue("email", values.email);
      setInfoMessage(result.message || "A 6-digit reset code has been sent to your email.");
      setCooldown(30);
      setStep("reset");
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : "Could not request password reset. Please verify your email and try again.",
      );
    }
  };

  const onResetSubmit = async (values: ResetPasswordInput) => {
    setFormError(null);
    setInfoMessage(null);
    try {
      const result = await resetPassword(values);
      setInfoMessage(result.message || "Password successfully updated.");
      setStep("success");
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : "Invalid or expired reset code. Please try again.",
      );
    }
  };

  const { formRef: requestFormRef, onSubmit: handleRequestSubmit } = useAutofillSafeSubmit(
    requestForm,
    onRequestSubmit,
  );

  const { formRef: resetFormRef, onSubmit: handleResetSubmit } = useAutofillSafeSubmit(
    resetForm,
    onResetSubmit,
  );

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setFormError(null);
    setIsResending(true);
    try {
      const result = await forgotPassword({ email });
      setInfoMessage(result.message || "A new 6-digit reset code has been sent.");
      setCooldown(30);
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : "Failed to resend reset code. Try again later.",
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell
      footer={
        step === "success" ? null : (
          <>
            Remember your password?{" "}
            <Link className="font-bold text-primary hover:underline" to="/login">
              {t("auth.signIn")}
            </Link>
          </>
        )
      }
      subtitle={
        step === "request"
          ? "Enter your account email to receive a 6-digit recovery OTP code."
          : step === "reset"
            ? `Enter the 6-digit code sent to ${email} and choose a new password.`
            : "Your account password has been updated securely."
      }
      title={
        step === "request"
          ? "Forgot Password"
          : step === "reset"
            ? "Reset Password"
            : "Password Reset Complete"
      }
    >
      {formError && (
        <div className="mb-stack-md">
          <Notice tone="error">{formError}</Notice>
        </div>
      )}

      {infoMessage && step !== "success" && (
        <div className="mb-stack-md">
          <Notice tone="success">{infoMessage}</Notice>
        </div>
      )}

      {step === "request" && (
        <form
          ref={requestFormRef}
          className="space-y-stack-md"
          noValidate
          onSubmit={handleRequestSubmit}
        >
          <Field
            error={requestForm.formState.errors.email?.message}
            label={t("auth.email")}
          >
            <Input
              autoComplete="email"
              autoFocus
              inputMode="email"
              placeholder="name@example.com"
              type="email"
              {...requestForm.register("email")}
            />
          </Field>

          <Button
            className="w-full"
            loading={requestForm.formState.isSubmitting}
            type="submit"
            variant="primary"
          >
            Send Reset Code
          </Button>
        </form>
      )}

      {step === "reset" && (
        <form
          ref={resetFormRef}
          className="space-y-stack-md"
          noValidate
          onSubmit={handleResetSubmit}
        >
          <Field
            error={resetForm.formState.errors.code?.message}
            label="6-Digit Reset Code"
          >
            <Input
              autoComplete="one-time-code"
              autoFocus
              className="text-center font-mono text-xl tracking-[0.25em]"
              maxLength={8}
              placeholder="123456"
              {...resetForm.register("code")}
            />
          </Field>

          <Field
            error={resetForm.formState.errors.new_password?.message}
            label="New Password"
          >
            <div className="relative">
              <Input
                autoComplete="new-password"
                className="pr-11"
                placeholder="At least 8 characters"
                type={showPassword ? "text" : "password"}
                {...resetForm.register("new_password")}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                onClick={() => setShowPassword((prev) => !prev)}
                type="button"
              >
                <Icon name={showPassword ? "visibility_off" : "visibility"} />
              </button>
            </div>
          </Field>

          <Field
            error={resetForm.formState.errors.confirm_password?.message}
            label="Confirm New Password"
          >
            <div className="relative">
              <Input
                autoComplete="new-password"
                className="pr-11"
                placeholder="Re-type your new password"
                type={showConfirmPassword ? "text" : "password"}
                {...resetForm.register("confirm_password")}
              />
              <button
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                type="button"
              >
                <Icon name={showConfirmPassword ? "visibility_off" : "visibility"} />
              </button>
            </div>
          </Field>

          <Button
            className="w-full"
            loading={resetForm.formState.isSubmitting}
            type="submit"
            variant="primary"
          >
            Reset Password
          </Button>

          <div className="flex items-center justify-between pt-stack-xs text-xs text-on-surface-variant">
            <button
              className="text-primary hover:underline"
              onClick={() => setStep("request")}
              type="button"
            >
              ← Change email
            </button>
            <button
              className="font-medium text-primary hover:underline disabled:opacity-50"
              disabled={cooldown > 0 || isResending}
              onClick={handleResend}
              type="button"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend Code"}
            </button>
          </div>
        </form>
      )}

      {step === "success" && (
        <div className="space-y-stack-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <Icon className="text-3xl" name="check_circle" />
          </div>

          <div className="space-y-2">
            <h3 className="font-title-md text-lg font-bold text-on-surface">
              Password Reset Successfully
            </h3>
            <p className="text-sm text-on-surface-variant">
              You can now sign in with your newly updated password.
            </p>
          </div>

          <Button
            className="w-full"
            onClick={() => navigate("/login")}
            variant="primary"
          >
            Sign In Now
          </Button>
        </div>
      )}
    </AuthShell>
  );
}

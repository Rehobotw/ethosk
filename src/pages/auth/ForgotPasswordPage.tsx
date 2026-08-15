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
import { Notice } from "@/components/ui";
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
            <Link className="font-semibold text-primary hover:underline" to="/login">
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
        <div className="mb-4">
          <Notice tone="error">{formError}</Notice>
        </div>
      )}

      {infoMessage && step !== "success" && (
        <div className="mb-4">
          <Notice tone="success">{infoMessage}</Notice>
        </div>
      )}

      {step === "request" && (
        <form
          ref={requestFormRef}
          className="space-y-4"
          noValidate
          onSubmit={handleRequestSubmit}
        >
          <div className="space-y-1.5">
            <label className="font-label-md text-label-md text-on-surface block" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </span>
              <input
                autoComplete="email"
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/60 rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                id="email"
                inputMode="email"
                placeholder="name@example.com"
                type="email"
                {...requestForm.register("email")}
              />
            </div>
            {requestForm.formState.errors.email && (
              <p className="text-xs text-error mt-1">{requestForm.formState.errors.email.message}</p>
            )}
          </div>

          <button
            className="w-full primary-gradient-btn text-white font-title-lg text-base py-3.5 px-4 rounded-full flex items-center justify-center gap-2 hover:shadow-lg active:scale-95 transition-all shadow-md disabled:opacity-50 mt-2"
            disabled={requestForm.formState.isSubmitting}
            type="submit"
          >
            {requestForm.formState.isSubmitting ? (
              <span className="material-symbols-outlined animate-spin text-white text-lg">progress_activity</span>
            ) : null}
            <span>Send Reset Code</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </form>
      )}

      {step === "reset" && (
        <form
          ref={resetFormRef}
          className="space-y-4"
          noValidate
          onSubmit={handleResetSubmit}
        >
          <div className="space-y-1.5">
            <label className="font-label-md text-label-md text-on-surface block" htmlFor="code">
              6-Digit Reset Code
            </label>
            <input
              autoComplete="one-time-code"
              autoFocus
              className="w-full py-3 bg-surface-container-low border border-outline-variant/60 rounded-lg font-mono text-center text-xl tracking-[0.25em] text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none font-bold"
              id="code"
              maxLength={8}
              placeholder="123456"
              {...resetForm.register("code")}
            />
            {resetForm.formState.errors.code && (
              <p className="text-xs text-error mt-1">{resetForm.formState.errors.code.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="font-label-md text-label-md text-on-surface block" htmlFor="new_password">
              New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </span>
              <input
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-3 bg-surface-container-low border border-outline-variant/60 rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                id="new_password"
                placeholder="At least 8 characters"
                type={showPassword ? "text" : "password"}
                {...resetForm.register("new_password")}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => setShowPassword((prev) => !prev)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {resetForm.formState.errors.new_password && (
              <p className="text-xs text-error mt-1">{resetForm.formState.errors.new_password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="font-label-md text-label-md text-on-surface block" htmlFor="confirm_password">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </span>
              <input
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-3 bg-surface-container-low border border-outline-variant/60 rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                id="confirm_password"
                placeholder="Re-type your new password"
                type={showConfirmPassword ? "text" : "password"}
                {...resetForm.register("confirm_password")}
              />
              <button
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
            {resetForm.formState.errors.confirm_password && (
              <p className="text-xs text-error mt-1">{resetForm.formState.errors.confirm_password.message}</p>
            )}
          </div>

          <button
            className="w-full primary-gradient-btn text-white font-title-lg text-base py-3.5 px-4 rounded-full flex items-center justify-center gap-2 hover:shadow-lg active:scale-95 transition-all shadow-md disabled:opacity-50 mt-2"
            disabled={resetForm.formState.isSubmitting}
            type="submit"
          >
            {resetForm.formState.isSubmitting ? (
              <span className="material-symbols-outlined animate-spin text-white text-lg">progress_activity</span>
            ) : null}
            <span>Reset Password</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          <div className="flex items-center justify-between pt-2 text-xs text-on-surface-variant">
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
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <span className="material-symbols-outlined text-4xl" data-filled="true">check_circle</span>
          </div>

          <div className="space-y-2">
            <h3 className="font-headline-lg text-xl text-on-surface">
              Password Reset Successfully
            </h3>
            <p className="font-body-md text-sm text-on-surface-variant">
              You can now sign in with your newly updated password.
            </p>
          </div>

          <button
            className="w-full primary-gradient-btn text-white font-title-lg text-base py-3.5 px-4 rounded-full flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
            onClick={() => navigate("/login")}
            type="button"
          >
            <span>Sign In Now</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      )}
    </AuthShell>
  );
}

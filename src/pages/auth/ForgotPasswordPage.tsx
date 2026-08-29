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
import { Icon, Notice } from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAutofillSafeSubmit } from "@/lib/forms";

function calculateStrength(pwd: string): { score: number; label: string; color: string; width: string } {
  if (!pwd) {
    return { score: 0, label: "Too Weak", color: "bg-red-500", width: "0%" };
  }
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 1) {
    return { score: 1, label: "Weak", color: "bg-red-500", width: "25%" };
  }
  if (score <= 3) {
    return { score: 2, label: "Moderate", color: "bg-amber-500", width: "60%" };
  }
  return { score: 3, label: "Strong", color: "bg-emerald-600", width: "100%" };
}

export function ForgotPasswordPage() {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [step, setStep] = useState<"request" | "sent" | "reset" | "success">(
    initialEmail ? "reset" : "request",
  );
  const [email, setEmail] = useState(initialEmail);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Form for Step 1: Request Reset Code / Link
  const requestForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: initialEmail },
  });

  // Form for Step 2: Enter OTP & Set New Password
  const resetForm = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      code: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const newPasswordValue = resetForm.watch("new_password") || "";
  const strength = calculateStrength(newPasswordValue);

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
      setInfoMessage(result.message || "A secure recovery link and code have been sent to your email.");
      setCooldown(30);
      setStep("sent");
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
    <div className="min-h-screen bg-[#cbdbf6]/40 flex flex-col justify-between p-4 md:p-6 font-sans antialiased text-[#0b1c30]">
      {/* Top Header Brand Logo */}
      <header className="w-full flex flex-col items-center py-4">
        <span className="material-symbols-outlined text-4xl text-[#001d29] mb-1">
          account_balance
        </span>
        <Link to="/" className="text-xl md:text-2xl font-headline font-bold text-[#001d29] tracking-tight">
          Ethosk Institutional
        </Link>
      </header>

      {/* Centered Modal / Card Container */}
      <main className="flex-1 flex items-center justify-center py-6 w-full max-w-md mx-auto">
        <div className="bg-white rounded-2xl border border-[#c1c7cc]/40 shadow-[0_12px_24px_-4px_rgba(0,51,69,0.05)] w-full p-6 md:p-8 flex flex-col items-center text-center">
          {formError && (
            <div className="w-full mb-4 text-left">
              <Notice tone="error">{formError}</Notice>
            </div>
          )}

          {infoMessage && step !== "success" && step !== "sent" && (
            <div className="w-full mb-4 text-left">
              <Notice tone="success">{infoMessage}</Notice>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STATE 1: REQUEST LINK (Stitch Screen ad52d263e7ed4475a3ed) ── */}
          {/* ════════════════════════════════════════════════════════════ */}
          {step === "request" && (
            <div className="w-full flex flex-col items-center">
              {/* Circular Lock Icon */}
              <div className="w-16 h-16 rounded-full bg-[#eff4ff] text-[#001d29] flex items-center justify-center mb-4 border border-[#c1c7cc]/20 shrink-0">
                <Icon className="text-[32px]" name="lock" />
              </div>

              <h1 className="text-2xl font-headline font-bold text-[#001d29] mb-2 tracking-tight">
                Reset your password
              </h1>
              <p className="text-xs md:text-sm text-[#41484c] mb-6 max-w-sm leading-relaxed">
                Enter your email address and we will send you a secure link to reset your password.
              </p>

              <form
                ref={requestFormRef}
                className="w-full space-y-4 text-left"
                noValidate
                onSubmit={handleRequestSubmit}
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#001d29] block" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    autoComplete="email"
                    autoFocus
                    className="w-full px-4 py-3 bg-[#f8f9ff] border border-[#c1c7cc] rounded-lg text-xs md:text-sm text-[#001d29] placeholder:text-[#71787c]/60 focus:ring-2 focus:ring-[#001d29] focus:border-[#001d29] transition-all outline-none"
                    id="email"
                    inputMode="email"
                    placeholder="name@institution.edu"
                    type="email"
                    {...requestForm.register("email")}
                  />
                  {requestForm.formState.errors.email && (
                    <p className="text-xs text-red-600 mt-1">
                      {requestForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  className="w-full bg-[#001d29] hover:bg-[#003345] text-white font-bold text-xs md:text-sm py-3.5 px-6 rounded-full flex items-center justify-center gap-2 hover:shadow-md active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50 mt-4"
                  disabled={requestForm.formState.isSubmitting}
                  type="submit"
                >
                  {requestForm.formState.isSubmitting ? (
                    <Icon className="animate-spin text-white text-[18px]" name="progress_activity" />
                  ) : null}
                  <span>Send Reset Link</span>
                  <Icon className="text-[18px]" name="arrow_forward" />
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-[#E2E8F0] w-full text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#001d29] hover:underline inline-flex items-center gap-1 transition-colors"
                >
                  <Icon className="text-[14px]" name="arrow_back" />
                  <span>Return to Login</span>
                </Link>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STATE 2: EMAIL SENT (Stitch Screen c79adb0bbbfa427aba74)   ── */}
          {/* ════════════════════════════════════════════════════════════ */}
          {step === "sent" && (
            <div className="w-full flex flex-col items-center">
              {/* Circular Checkmark Icon */}
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-200/50 shrink-0">
                <Icon className="text-[32px]" name="check_circle" />
              </div>

              <h1 className="text-2xl font-headline font-bold text-[#001d29] mb-2 tracking-tight">
                Password reset link sent
              </h1>
              <p className="text-xs md:text-sm text-[#41484c] mb-6 max-w-sm leading-relaxed">
                We have sent a password reset link to <strong className="text-[#001d29] font-bold">{email}</strong>. Please check your inbox and follow the instructions.
              </p>

              <div className="w-full space-y-3">
                <button
                  type="button"
                  onClick={() => setStep("reset")}
                  className="w-full bg-[#001d29] hover:bg-[#003345] text-white font-bold text-xs md:text-sm py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <span>Enter 6-Digit Code &amp; Set Password</span>
                  <Icon className="text-[18px]" name="key" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full bg-[#eff4ff] hover:bg-[#dde9ff] text-[#001d29] font-semibold text-xs md:text-sm py-3 px-6 rounded-full transition-colors cursor-pointer"
                >
                  Back to Login
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E2E8F0] w-full text-center text-xs text-[#71787c]">
                <p>
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isResending || cooldown > 0}
                    className="font-bold text-[#001d29] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {cooldown > 0 ? `resend in ${cooldown}s` : "request another link"}
                  </button>
                  .
                </p>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STATE 3: SET NEW PASSWORD (Stitch Screen 447e177f1afd45af) ── */}
          {/* ════════════════════════════════════════════════════════════ */}
          {step === "reset" && (
            <div className="w-full flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#eff4ff] text-[#001d29] flex items-center justify-center mb-4 border border-[#c1c7cc]/20 shrink-0">
                <Icon className="text-[32px]" name="key" />
              </div>

              <h1 className="text-2xl font-headline font-bold text-[#001d29] mb-2 tracking-tight">
                Set new password
              </h1>
              <p className="text-xs md:text-sm text-[#41484c] mb-6 max-w-sm leading-relaxed">
                Please create a secure password to finalize your account recovery.
              </p>

              <form
                ref={resetFormRef}
                className="w-full space-y-4 text-left"
                noValidate
                onSubmit={handleResetSubmit}
              >
                {/* 6-Digit Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#001d29] block" htmlFor="code">
                    6-Digit Verification Code
                  </label>
                  <input
                    autoComplete="one-time-code"
                    autoFocus
                    className="w-full py-2.5 bg-[#f8f9ff] border border-[#c1c7cc] rounded-lg font-mono text-center text-lg tracking-[0.2em] text-[#001d29] focus:ring-2 focus:ring-[#001d29] focus:border-[#001d29] transition-all outline-none font-bold"
                    id="code"
                    maxLength={8}
                    placeholder="123456"
                    {...resetForm.register("code")}
                  />
                  {resetForm.formState.errors.code && (
                    <p className="text-xs text-red-600 mt-1">{resetForm.formState.errors.code.message}</p>
                  )}
                  <p className="text-xs text-[#71787c] pt-0.5">
                    Didn't get a code or has it expired?{" "}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending || cooldown > 0}
                      className="font-bold text-[#001d29] hover:underline cursor-pointer disabled:opacity-50 disabled:no-underline"
                    >
                      {isResending ? "Sending…" : cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                    </button>
                  </p>
                </div>

                {/* New Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#001d29] block" htmlFor="new_password">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      autoComplete="new-password"
                      className="w-full px-4 py-3 pr-10 bg-[#f8f9ff] border border-[#c1c7cc] rounded-lg text-xs md:text-sm text-[#001d29] placeholder:text-[#71787c]/60 focus:ring-2 focus:ring-[#001d29] focus:border-[#001d29] transition-all outline-none"
                      id="new_password"
                      placeholder="Enter new password"
                      type={showPassword ? "text" : "password"}
                      {...resetForm.register("new_password")}
                    />
                    <button
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#71787c] hover:text-[#001d29] cursor-pointer"
                      onClick={() => setShowPassword((prev) => !prev)}
                      type="button"
                    >
                      <Icon className="text-[18px]" name={showPassword ? "visibility_off" : "visibility"} />
                    </button>
                  </div>
                  {resetForm.formState.errors.new_password && (
                    <p className="text-xs text-red-600 mt-1">
                      {resetForm.formState.errors.new_password.message}
                    </p>
                  )}

                  {/* Visual Strength Meter (Stitch spec) */}
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="w-full bg-[#dde9ff] h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full ${strength.color} rounded-full transition-all duration-300`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#71787c] mt-0.5">
                      <span className="font-bold uppercase tracking-wider">{strength.label}</span>
                      <span>Min 8 chars</span>
                    </div>
                  </div>
                </div>

                {/* Confirm New Password Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#001d29] block" htmlFor="confirm_password">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      autoComplete="new-password"
                      className="w-full px-4 py-3 pr-10 bg-[#f8f9ff] border border-[#c1c7cc] rounded-lg text-xs md:text-sm text-[#001d29] placeholder:text-[#71787c]/60 focus:ring-2 focus:ring-[#001d29] focus:border-[#001d29] transition-all outline-none"
                      id="confirm_password"
                      placeholder="Confirm new password"
                      type={showConfirmPassword ? "text" : "password"}
                      {...resetForm.register("confirm_password")}
                    />
                    <button
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#71787c] hover:text-[#001d29] cursor-pointer"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      type="button"
                    >
                      <Icon className="text-[18px]" name={showConfirmPassword ? "visibility_off" : "visibility"} />
                    </button>
                  </div>
                  {resetForm.formState.errors.confirm_password && (
                    <p className="text-xs text-red-600 mt-1">
                      {resetForm.formState.errors.confirm_password.message}
                    </p>
                  )}
                </div>

                {/* Primary CTA */}
                <button
                  className="w-full bg-[#001d29] hover:bg-[#003345] text-white font-bold text-xs md:text-sm py-3.5 px-6 rounded-full flex items-center justify-center gap-2 hover:shadow-md active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50 mt-3"
                  disabled={resetForm.formState.isSubmitting}
                  type="submit"
                >
                  {resetForm.formState.isSubmitting ? (
                    <Icon className="animate-spin text-white text-[18px]" name="progress_activity" />
                  ) : null}
                  <span>Update Password &amp; Log In</span>
                  <Icon className="text-[18px]" name="arrow_forward" />
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-[#E2E8F0] w-full text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#71787c] hover:text-[#001d29] hover:underline inline-flex items-center gap-1 transition-colors"
                >
                  Cancel and return to login
                </Link>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════ */}
          {/* STATE 4: SUCCESS                                           ── */}
          {/* ════════════════════════════════════════════════════════════ */}
          {step === "success" && (
            <div className="w-full flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-200/50 shrink-0">
                <Icon className="text-[32px]" name="task_alt" />
              </div>

              <h1 className="text-2xl font-headline font-bold text-[#001d29] mb-2 tracking-tight">
                Password Reset Complete
              </h1>
              <p className="text-xs md:text-sm text-[#41484c] mb-6 max-w-sm leading-relaxed">
                Your account password has been updated securely. You can now log in with your new credentials.
              </p>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full bg-[#001d29] hover:bg-[#003345] text-white font-bold text-xs md:text-sm py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <span>Proceed to Login</span>
                <Icon className="text-[18px]" name="arrow_forward" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Footer (Stitch spec) */}
      <footer className="w-full py-4 flex justify-center text-center">
        <p className="text-[11px] font-mono text-[#71787c] uppercase tracking-wider">
          © 2026 Ethosk Institutional Research Infrastructure. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

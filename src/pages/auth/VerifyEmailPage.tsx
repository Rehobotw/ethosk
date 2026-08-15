import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyEmailSchema, type VerifyEmailInput } from "@shared/validation/schemas";
import { Notice } from "@/components/ui";
import { ApiRequestError } from "@/lib/api";
import { homePathForRole, useAuth } from "@/lib/auth";
import { useAutofillSafeSubmit } from "@/lib/forms";
import { useLanguage } from "@/lib/language";
import { AuthShell } from "./AuthShell";

export function VerifyEmailPage() {
  const { verifyEmail, resendCode, user, loading } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAm = language === "am";
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
          : isAm
            ? "ልክ ያልሆነ የማረጋገጫ ኮድ። እባክዎ አረጋግጠው እንደገና ይሞክሩ።"
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
      setInfoMessage(
        result.message ||
          (isAm ? "አዲስ የማረጋገጫ ኮድ ወደ ኢሜይልዎ ተልኳል።" : "A new verification code has been sent."),
      );
      setCooldown(30);
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : isAm
            ? "ኮድ እንደገና መላክ አልተቻለም። እባክዎ ቆይተው እንደገና ይሞክሩ።"
            : "Failed to resend code. Try again later.",
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
          {isAm ? "አስቀድመው አረጋግጠዋል? " : "Already verified? "}
          <Link className="font-semibold text-primary hover:underline" to="/login">
            {isAm ? "ግቡ" : "Log in"}
          </Link>
        </>
      }
      subtitle={
        isAm
          ? "ወደ ኢሜይል አድራሻዎ የተላከውን ባለ 6 አሃዝ ኮድ ያስገቡ"
          : "Enter the 6-digit code sent to your email address"
      }
      title={isAm ? "ኢሜይልዎን ያረጋግጡ" : "Verify your email"}
    >
      <form className="space-y-5" onSubmit={handleFormSubmit} ref={formRef}>
        {/* Email Address Field */}
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

        {/* 6-digit Verification Code */}
        <div className="space-y-1.5">
          <label className="font-label-md text-label-md text-on-surface block" htmlFor="code">
            {isAm ? "የማረጋገጫ ኮድ" : "Verification Code"}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">key</span>
            </span>
            <input
              autoComplete="one-time-code"
              className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/60 rounded-lg font-mono text-center text-lg tracking-[0.3em] font-bold text-primary placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              id="code"
              maxLength={8}
              placeholder="123456"
              type="text"
              {...register("code")}
            />
          </div>
          {errors.code && (
            <p className="text-xs text-error mt-1">{errors.code.message}</p>
          )}
        </div>

        {formError ? <Notice tone="error">{formError}</Notice> : null}
        {infoMessage ? <Notice tone="info">{infoMessage}</Notice> : null}

        {/* Submit Button */}
        <button
          className="w-full primary-gradient-btn text-white font-title-lg text-base py-3.5 px-6 rounded-full flex items-center justify-center gap-2 hover:shadow-lg active:scale-95 transition-all shadow-md disabled:opacity-50 mt-2 cursor-pointer"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <span className="material-symbols-outlined animate-spin text-white text-lg">progress_activity</span>
          ) : null}
          <span>{isAm ? "አረጋግጥ እና ቀጥል" : "Verify & Continue"}</span>
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
        </button>

        {/* Resend and Back Links */}
        <div className="flex items-center justify-between pt-3">
          <button
            className="text-xs text-primary font-semibold hover:underline disabled:opacity-50 cursor-pointer"
            disabled={isResending || cooldown > 0}
            onClick={() => void handleResend()}
            type="button"
          >
            {isResending
              ? (isAm ? "በመላክ ላይ…" : "Sending…")
              : cooldown > 0
                ? (isAm ? `በ ${cooldown} ሰከንድ ውስጥ እንደገና ይላኩ` : `Resend code in ${cooldown}s`)
                : (isAm ? "ኮድ አልደረሰዎትም? እንደገና ይላኩ" : "Didn't receive a code? Resend")}
          </button>

          <Link className="text-xs text-on-surface-variant font-medium hover:text-primary transition-colors" to="/login">
            {isAm ? "ወደ መግቢያ ተመለስ" : "Back to login"}
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

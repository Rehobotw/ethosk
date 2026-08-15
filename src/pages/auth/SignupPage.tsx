import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserRole } from "@shared/types";
import { signupSchema, type SignupInput } from "@shared/validation/schemas";
import { ApiRequestError } from "@/lib/api";
import { homePathForRole, useAuth } from "@/lib/auth";
import { useAutofillSafeSubmit } from "@/lib/forms";
import { useLanguage } from "@/lib/language";
import { supabase } from "@/lib/supabase";

interface SignupPageProps {
  role?: "respondent" | "researcher";
}

export function SignupPage({ role: initialRole }: SignupPageProps) {
  const { signup, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const queryRole = searchParams.get("role") as "respondent" | "researcher" | null;
  const [role, setRole] = useState<"respondent" | "researcher">(initialRole || queryRole || "respondent");

  const prefilledEmail = searchParams.get("email") || "";
  const prefilledName = searchParams.get("name") || "";

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    } else if (queryRole) {
      setRole(queryRole);
    }
  }, [initialRole, queryRole]);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: prefilledName, email: prefilledEmail, password: "", role },
  });

  const {
    register,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = form;

  const passwordVal = watch("password") || "";

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: "", width: "0%", color: "bg-surface-variant", textClass: "" };
    if (pwd.length < 6) return { label: "Weak", width: "33%", color: "bg-error/70", textClass: "text-error" };
    if (pwd.length < 10) return { label: "Fair", width: "66%", color: "bg-secondary-fixed-dim", textClass: "text-on-surface-variant" };
    return { label: "Strong", width: "100%", color: "bg-primary", textClass: "text-primary font-semibold" };
  };

  const strength = getPasswordStrength(passwordVal);

  useEffect(() => {
    reset({ full_name: prefilledName, email: prefilledEmail, password: "", role });
  }, [role, reset, prefilledName, prefilledEmail]);

  // When role changes via the toggle, also update the form's hidden role field
  const handleRoleSwitch = (newRole: "respondent" | "researcher") => {
    setRole(newRole);
    setValue("role", newRole);
  };

  const onSubmit = async (values: SignupInput) => {
    setFormError(null);
    try {
      const result = await signup({ ...values, role });
      if (result.verification_required) {
        navigate(`/verify-email?email=${encodeURIComponent(result.email)}`);
      } else {
        navigate(
          role === "respondent" ? "/profile?complete_profile=true" : homePathForRole(role as UserRole),
          { replace: true },
        );
      }
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : "Could not create your account. Try again.",
      );
    }
  };

  const { formRef, onSubmit: handleFormSubmit } = useAutofillSafeSubmit(form, onSubmit);

  const handleGoogleSignup = async () => {
    setFormError(null);
    setIsGoogleLoading(true);
    try {
      localStorage.setItem("ethosk_intended_role", role);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setFormError(error.message || "Failed to initialize Google signup.");
      setIsGoogleLoading(false);
    }
  };

  if (!loading && user) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-[480px] bg-white rounded-2xl p-8 border border-slate-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.06)] text-center space-y-4">
          <p className="text-sm text-slate-700">
            Currently logged in as <strong className="text-[#00456d]">{user.full_name || user.email}</strong> ({user.role}).
          </p>
          <div className="flex flex-col gap-2 sm:flex-row justify-center">
            <button
              onClick={() => navigate(homePathForRole(user.role))}
              className="px-6 py-2.5 rounded-xl bg-[#00456d] text-white font-semibold text-sm hover:bg-[#003556] transition-all"
              type="button"
            >
              Go to {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal
            </button>
            <button
              onClick={() => logout()}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-[#00456d] font-semibold text-sm hover:bg-slate-50 transition-colors"
              type="button"
            >
              Log Out &amp; Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isResearcher = role === "researcher";
  const isAm = language === "am";

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F4F7FA] text-on-background relative overflow-x-hidden">
      {/* ── Top Navigation Header ── */}
      <header className="w-full h-16 flex items-center justify-between px-6 md:px-12 bg-white border-b border-slate-200/60 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link className="flex items-center gap-2" to="/">
            <span className="font-['Newsreader',serif] text-xl text-[#00456d] font-bold">Ethosk</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* ── Role Toggle (top right) ── */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/60">
              <button
                type="button"
                onClick={() => handleRoleSwitch("respondent")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  role === "respondent"
                    ? "bg-white text-[#00456d] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {isAm ? "ተሳታፊ" : "Respondent"}
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch("researcher")}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  role === "researcher"
                    ? "bg-white text-[#00456d] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {isAm ? "ተመራማሪ" : "Researcher"}
              </button>
            </div>

            {/* Language Switcher */}
            <button
              aria-label={language === "en" ? "Switch to Amharic" : "Switch to English"}
              className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-3 py-1.5 text-xs border border-slate-200/60 cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={toggleLanguage}
              type="button"
            >
              <span className="w-4 h-4 rounded-full bg-[#00456d]/10 text-[#00456d] flex items-center justify-center text-[9px] font-bold">
                {language.toUpperCase()}
              </span>
              <span className="text-slate-600 text-xs font-medium">
                {language === "en" ? "አማርኛ" : "English"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-4 md:px-8 relative z-10">
        <div className={`w-full ${isResearcher ? "max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center" : "max-w-[480px]"}`}>

          {/* Left Panel: Trust & Brand Narrative (Stitch Screen ecdae819c560416e9ba237d5e0a28018) */}
          {isResearcher ? (
            <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 bg-[#cbe6ff]/30 rounded-2xl border border-[#c0c7d0]/30 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004162]/10 w-fit text-xs font-bold text-[#004162]">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Researcher Infrastructure</span>
                </div>
                <h2 className="font-['Newsreader',serif] text-3xl font-bold text-[#001e30] leading-tight tracking-tight">
                  Access verified respondents you can trust
                </h2>
              </div>

              <div className="flex flex-col gap-6 mt-8 mb-4">
                {/* Trust Indicator 1 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-xs text-[#004162]">
                    <span className="material-symbols-outlined text-[22px]">fingerprint</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#001e30]">ID-verified panel</h3>
                    <p className="text-xs text-[#41484e] mt-0.5 leading-relaxed">
                      Every respondent undergoes rigorous identity verification before entering the marketplace.
                    </p>
                  </div>
                </div>

                {/* Trust Indicator 2 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-xs text-[#004162]">
                    <span className="material-symbols-outlined text-[22px]">security</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#001e30]">Deterministic fraud checks</h3>
                    <p className="text-xs text-[#41484e] mt-0.5 leading-relaxed">
                      Real-time behavioral analysis and programmatic screening filters out low-quality data.
                    </p>
                  </div>
                </div>

                {/* Trust Indicator 3 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-xs text-[#004162]">
                    <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#001e30]">Reserved budgets</h3>
                    <p className="text-xs text-[#41484e] mt-0.5 leading-relaxed">
                      Transparent pricing with no surprise costs. You control exactly what you spend.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#004162]/10">
                <p className="text-xs text-[#41484e]/70">
                  &copy; {new Date().getFullYear()} Ethosk Research Systems. All rights reserved.
                </p>
              </div>
            </div>
          ) : null}

          {/* Right Card / Main Signup Card */}
          <div className={`w-full ${isResearcher ? "lg:col-span-6" : ""} bg-white rounded-2xl border border-slate-200/60 p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]`}>

            {/* Heading */}
            <div className="mb-8 text-center">
              <h1 className="font-['Newsreader',serif] text-2xl font-bold text-[#0D253A] tracking-tight mb-2">
                {isResearcher
                  ? (isAm ? "የተመራማሪ መለያ ይክፈቱ" : "Create a Researcher Account")
                  : (isAm ? "መለያዎን ይክፈቱ" : "Create your account")}
              </h1>
              <p className="text-sm text-slate-500">
                {isResearcher
                  ? (isAm ? "ከፍተኛ ጥራት ያላቸውን ግንዛቤዎች ለመሰብሰብ የተረጋገጠውን መድረክ ይቀላቀሉ።" : "Join the verified marketplace to gather high-quality insights.")
                  : (isAm ? "በአስተማማኝ የብሔራዊ መታወቂያ ምዝገባ ጉዞዎን ይጀምሩ።" : "Start your journey with secure national ID registration.")}
              </p>
            </div>

            {/* Google Quick Button */}
            <div className="mb-6 space-y-4">
              <button
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-700 font-semibold text-sm"
                disabled={isGoogleLoading || isSubmitting}
                onClick={handleGoogleSignup}
                type="button"
              >
                {isGoogleLoading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#00456d]" />
                ) : (
                  <img alt="Google" className="h-5 w-5" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" />
                )}
                <span>{isAm ? "በ Google ይቀጥሉ" : "Continue with Google"}</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium">
                    {isAm ? "ወይም በኢሜይል ይመዝገቡ" : "Or register with email"}
                  </span>
                </div>
              </div>
            </div>

            {/* Sign-up Form */}
            <form className="space-y-5" onSubmit={handleFormSubmit} ref={formRef}>
              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider" htmlFor="full_name">
                  {isAm ? "ሙሉ ስም" : "Full Name"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </span>
                  <input
                    autoComplete="name"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00456d]/20 focus:border-[#00456d]/40 transition-all outline-none"
                    id="full_name"
                    placeholder={isAm ? "አበበ ከበደ" : "Abebe Kebede"}
                    type="text"
                    {...register("full_name")}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-xs text-rose-600 mt-1">{errors.full_name.message}</p>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider" htmlFor="email">
                  {isResearcher ? (isAm ? "የስራ ኢሜይል" : "Work email") : (isAm ? "የኢሜይል አድራሻ" : "Email address")}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </span>
                  <input
                    autoComplete="email"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00456d]/20 focus:border-[#00456d]/40 transition-all outline-none"
                    id="email"
                    placeholder={isResearcher ? "name@institution.edu.et" : "name@example.com"}
                    type="email"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password Input with Strength Indicator */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider" htmlFor="password">
                  {isAm ? "የይለፍ ቃል" : "Password"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </span>
                  <input
                    autoComplete="new-password"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-12 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00456d]/20 focus:border-[#00456d]/40 transition-all outline-none"
                    id="password"
                    placeholder={isAm ? "ጠንካራ የይለፍ ቃል ያስገቡ" : "Enter a strong password"}
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-[#00456d] transition-colors"
                    onClick={() => setShowPassword((s) => !s)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordVal.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-slate-100">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <span className={`text-xs ${strength.textClass}`}>
                      {strength.label}
                    </span>
                  </div>
                )}

                {errors.password && (
                  <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
                )}
              </div>

              {formError ? (
                <div className="rounded-lg bg-rose-50 border border-rose-200/60 px-4 py-3">
                  <p className="text-sm text-rose-700 font-medium">{formError}</p>
                </div>
              ) : null}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  className="w-full py-3.5 px-6 rounded-xl bg-[#00456d] text-white font-semibold text-sm shadow-sm hover:bg-[#003556] active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                  disabled={isSubmitting || isGoogleLoading}
                  type="submit"
                >
                  {isSubmitting ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : null}
                  <span>{isAm ? "መለያ ይክፈቱ" : "Create account"}</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </form>

            {/* Footer Navigation */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                {isAm ? "መለያ አለዎት? " : "Already have an account? "}
                <Link className="font-semibold text-[#00456d] hover:underline ml-1" to={`/login/${role}`}>
                  {isAm ? "ግቡ" : "Log in"}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full bg-white border-t border-slate-200/60 mt-auto relative z-20">
        <div className="w-full py-5 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-3 max-w-7xl mx-auto">
          <div className="font-['Newsreader',serif] text-[#00456d] font-bold">
            Ethosk
          </div>
          <div className="text-xs text-slate-400 text-center md:text-left">
            &copy; {new Date().getFullYear()} Ethosk. {isAm ? "መብቱ በህግ የተጠበቀ ነው::" : "All rights reserved."}
          </div>
          <div className="flex gap-6 text-xs">
            <Link className="text-slate-400 hover:text-[#00456d] transition-colors" to="/privacy">
              {isAm ? "የግላዊነት ፖሊሲ" : "Privacy"}
            </Link>
            <Link className="text-slate-400 hover:text-[#00456d] transition-colors" to="/terms">
              {isAm ? "የአገልግሎት ውሎች" : "Terms"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

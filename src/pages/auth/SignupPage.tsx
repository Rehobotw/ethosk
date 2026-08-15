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
  const role: "respondent" | "researcher" = initialRole || queryRole || "respondent";

  const prefilledEmail = searchParams.get("email") || "";
  const prefilledName = searchParams.get("name") || "";

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: prefilledName, email: prefilledEmail, password: "", role },
  });

  const {
    register,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  const passwordVal = watch("password") || "";

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: "", width: "0%", color: "bg-slate-200", textClass: "" };
    if (pwd.length < 6) return { label: "Weak", width: "33%", color: "bg-red-500", textClass: "text-red-600" };
    if (pwd.length < 10) return { label: "Fair", width: "66%", color: "bg-amber-500", textClass: "text-amber-600" };
    return { label: "Strong", width: "100%", color: "bg-[#00456d]", textClass: "text-[#00456d] font-semibold" };
  };

  const strength = getPasswordStrength(passwordVal);

  useEffect(() => {
    reset({ full_name: prefilledName, email: prefilledEmail, password: "", role });
  }, [role, reset, prefilledName, prefilledEmail]);

  const onSubmit = async (values: SignupInput) => {
    setFormError(null);
    try {
      const result = await signup({ ...values, role });
      if (result.verification_required) {
        navigate(`/verify-email?email=${encodeURIComponent(result.email)}`);
      } else {
        navigate(
          role === "respondent" ? "/respondent/onboarding" : homePathForRole(role as UserRole),
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
    <div className="min-h-screen flex flex-col justify-between bg-[#F7FAFD] text-[#181c1e] relative overflow-x-hidden font-['Inter',sans-serif]">
      {/* ── Top Navigation Header ── */}
      <header className="w-full h-16 flex items-center justify-between px-6 md:px-12 bg-white/80 backdrop-blur-md border-b border-slate-200/60 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link className="flex items-center gap-2" to="/">
            <span className="font-['Newsreader',serif] text-2xl text-[#00456d] font-bold">Ethosk</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Top Right Endpoint Link without toggles */}
            {isResearcher ? (
              <div className="text-xs text-slate-600 hidden sm:flex items-center gap-1.5">
                <span>{isAm ? "ጥናቶችን መመለስ ይፈልጋሉ?" : "Want to participate & earn?"}</span>
                <Link
                  to="/signup/respondent"
                  className="font-semibold text-[#00456d] hover:text-[#1d5d8a] hover:underline transition-colors"
                >
                  {isAm ? "እንደ ተሳታፊ ይመዝገቡ →" : "Sign up as Respondent →"}
                </Link>
              </div>
            ) : (
              <div className="text-xs text-slate-600 hidden sm:flex items-center gap-1.5">
                <span>{isAm ? "የምርምር መረጃ ይፈልጋሉ?" : "Looking for research data?"}</span>
                <Link
                  to="/signup/researcher"
                  className="font-semibold text-[#00456d] hover:text-[#1d5d8a] hover:underline transition-colors"
                >
                  {isAm ? "እንደ ተመራማሪ ይመዝገቡ →" : "Sign up as Researcher →"}
                </Link>
              </div>
            )}

            {/* Language Switcher */}
            <button
              aria-label={language === "en" ? "Switch to Amharic" : "Switch to English"}
              className="flex items-center gap-1.5 bg-slate-100/80 rounded-lg px-3 py-1.5 text-xs border border-slate-200/60 cursor-pointer hover:bg-slate-100 transition-colors"
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

      {/* ── Main Content Container (Exact Split Layout) ── */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-16 px-4 md:px-8 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* ══════════════════════════════════════════════════
              LEFT SIDE: Split Layout Narrative
             ══════════════════════════════════════════════════ */}
          {isResearcher ? (
            /* Researcher Left Side (Stitch Screen ecdae819c560416e9ba237d5e0a28018) */
            <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 md:p-10 bg-[#cde5ff]/35 rounded-2xl border border-[#c1c7d0]/40 shadow-xs backdrop-blur-sm min-h-[520px]">
              <div className="flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00456d]/10 w-fit text-xs font-bold text-[#00456d]">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>{isAm ? "የተመራማሪ መሠረተ ልማት" : "Researcher Infrastructure"}</span>
                </div>
                <h2 className="font-['Newsreader',serif] text-3xl md:text-4xl font-bold text-[#001d32] leading-tight tracking-tight">
                  {isAm ? "የተረጋገጡ እና አስተማማኝ ተሳታፊዎችን ያግኙ" : "Access verified respondents you can trust"}
                </h2>
                <p className="text-xs text-[#4b6078] leading-relaxed">
                  {isAm
                    ? "ከፍተኛ ጥራት ያላቸውን ግንዛቤዎች ለመሰብሰብ የተረጋገጠውን መድረክ ይቀላቀሉ።"
                    : "Deploy targeted surveys to Ethiopia's premier identity-verified research panel."}
                </p>
              </div>

              <div className="flex flex-col gap-5 mt-6 mb-4">
                {/* Trust Indicator 1 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-xs text-[#00456d] border border-slate-200/60">
                    <span className="material-symbols-outlined text-[22px]">badge</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#001d32]">
                      {isAm ? "በመታወቂያ የተረጋገጡ ተሳታፊዎች" : "ID-verified panel"}
                    </h3>
                    <p className="text-xs text-[#4b6078] mt-0.5 leading-relaxed">
                      {isAm
                        ? "እያንዳንዱ ተሳታፊ ከመመዝገቡ በፊት ትክክለኛ ማንነቱ በጥብቅ ይረጋገጣል።"
                        : "Every respondent undergoes rigorous identity verification before entering the marketplace."}
                    </p>
                  </div>
                </div>

                {/* Trust Indicator 2 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-xs text-[#00456d] border border-slate-200/60">
                    <span className="material-symbols-outlined text-[22px]">security</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#001d32]">
                      {isAm ? "ራስ-ሰር የማጭበርበር መቆጣጠሪያ" : "Deterministic fraud checks"}
                    </h3>
                    <p className="text-xs text-[#4b6078] mt-0.5 leading-relaxed">
                      {isAm
                        ? "የቀጥታ ስነ-ምግባር ትንተና እና የማጣሪያ ቴክኖሎጂ ዝቅተኛ ጥራት ያላቸውን መረጃዎች ያጣራል።"
                        : "Real-time behavioral analysis and programmatic screening filters out low-quality data."}
                    </p>
                  </div>
                </div>

                {/* Trust Indicator 3 */}
                <div className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-xs text-[#00456d] border border-slate-200/60">
                    <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#001d32]">
                      {isAm ? "ግልጽ እና የተጠበቀ በጀት" : "Reserved budgets"}
                    </h3>
                    <p className="text-xs text-[#4b6078] mt-0.5 leading-relaxed">
                      {isAm
                        ? "ግልጽ የዋጋ አሰጣጥ ያለምንም ድብቅ ወጪ። ወጪዎትን ሙሉ በሙሉ ይቆጣጠራሉ።"
                        : "Transparent pricing with no surprise costs. You control exactly what you spend."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#00456d]/10">
                <p className="text-[11px] text-[#4b6078]">
                  &copy; {new Date().getFullYear()} Ethosk Research Systems. All rights reserved.
                </p>
              </div>
            </div>
          ) : (
            /* Respondent Left Side (Stitch Screen e86088af4b2d4d288308c15f020cb9ed) */
            <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 md:p-10 bg-[#cde5ff]/35 rounded-2xl border border-[#c1c7d0]/40 shadow-xs backdrop-blur-sm min-h-[520px]">
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00456d]/10 w-fit text-xs font-bold text-[#00456d]">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>{isAm ? "የተረጋገጠ የተሳታፊ ገበያ" : "Verified Research Marketplace"}</span>
                </div>
                <h2 className="font-['Newsreader',serif] text-3xl md:text-4xl font-bold text-[#001d32] leading-tight tracking-tight">
                  {isAm ? "ሀሳብዎን በማጋራት ገቢ ያግኙ" : "Earn by sharing your unique perspective."}
                </h2>
                <p className="text-xs text-[#4b6078] leading-relaxed">
                  {isAm
                    ? "ከፍተኛ ዋጋ ባላቸው የኢንተርፕራይዝ ጥናቶች ውስጥ የሚሳተፉ በሺዎች የሚቆጠሩ የተረጋገጡ ተሳታፊዎችን ይቀላቀሉ።"
                    : "Join thousands of verified respondents participating in high-value enterprise research."}
                </p>
              </div>

              {/* 3-Step Journey */}
              <div className="space-y-6 relative my-6">
                {/* Connecting line */}
                <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-[#cde5ff] -z-0"></div>

                {/* Step 1 */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-[#1d5d8a] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#001d32]">
                      {isAm ? "1. ማንነትዎን ያረጋግጡ" : "1. Verify Identity"}
                    </h3>
                    <p className="text-xs text-[#4b6078] mt-0.5 leading-relaxed">
                      {isAm
                        ? "መድረኩን ፍትሃዊ ለማድረግ መታወቂያዎን እናረጋግጣለን።"
                        : "We check your ID for consistency to keep the platform fair — not to judge you."}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#c1c7d0] text-[#00456d] flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">manage_search</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#001d32]">
                      {isAm ? "2. ጥናቶችን ያግኙ" : "2. Find Surveys"}
                    </h3>
                    <p className="text-xs text-[#4b6078] mt-0.5 leading-relaxed">
                      {isAm
                        ? "ከመገለጫዎ ጋር የሚዛመዱ የታለሙ ጥናቶችን ያግኙ።"
                        : "Match with targeted enterprise research studies that fit your profile."}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#c1c7d0] text-[#00456d] flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[#001d32]">
                      {isAm ? "3. ሽልማት ያግኙ" : "3. Earn Rewards"}
                    </h3>
                    <p className="text-xs text-[#4b6078] mt-0.5 leading-relaxed">
                      {isAm
                        ? "በመረጡት የክፍያ መንገድ በቀጥታ ተገቢውን ክፍያ ይቀበሉ።"
                        : "Receive fair compensation directly to your preferred payment method."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#00456d]/10">
                <p className="text-[11px] text-[#4b6078]">
                  &copy; {new Date().getFullYear()} Ethosk Research Systems. All rights reserved.
                </p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              RIGHT SIDE: Signup Form Card
             ══════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 w-full max-w-[480px] mx-auto bg-white rounded-2xl border border-slate-200/70 p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">

            {/* Mobile switch to other role */}
            <div className="sm:hidden mb-6 pb-4 border-b border-slate-100 text-center">
              {isResearcher ? (
                <Link to="/signup/respondent" className="text-xs font-semibold text-[#00456d]">
                  {isAm ? "እንደ ተሳታፊ መመዝገብ ይፈልጋሉ? እዚህ ይጫኑ →" : "Want to participate & earn? Switch to Respondent →"}
                </Link>
              ) : (
                <Link to="/signup/researcher" className="text-xs font-semibold text-[#00456d]">
                  {isAm ? "እንደ ተመራማሪ መመዝገብ ይፈልጋሉ? እዚህ ይጫኑ →" : "Looking for research data? Switch to Researcher →"}
                </Link>
              )}
            </div>

            {/* Heading */}
            <div className="mb-6 text-center">
              <h1 className="font-['Newsreader',serif] text-2xl md:text-3xl font-bold text-[#0D253A] tracking-tight mb-2">
                {isResearcher
                  ? (isAm ? "የተመራማሪ መለያ ይክፈቱ" : "Create a Researcher Account")
                  : (isAm ? "የተሳታፊ መለያ ይክፈቱ" : "Create a Respondent Account")}
              </h1>
              <p className="text-xs text-slate-500">
                {isResearcher
                  ? (isAm ? "ከፍተኛ ጥራት ያላቸውን ግንዛቤዎች ለመሰብሰብ የተረጋገጠውን መድረክ ይቀላቀሉ።" : "Join the verified marketplace to gather high-quality insights.")
                  : (isAm ? "ጥናቶችን በመመለስ ገቢ ለማግኘት አሁኑኑ ይመዝገቡ።" : "Sign up to participate in research and earn rewards.")}
              </p>
            </div>

            {/* Google Quick Button */}
            <div className="mb-6 space-y-4">
              <button
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-slate-700 font-semibold text-sm cursor-pointer shadow-xs"
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
            <form className="space-y-4" onSubmit={handleFormSubmit} ref={formRef}>
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
                    {...register("full_name")}
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:border-[#00456d] focus:ring-2 focus:ring-[#00456d]/10 outline-none transition-all placeholder:text-slate-400"
                    id="full_name"
                    placeholder={isAm ? "ለምሳሌ፡ ዮናስ ታደሰ" : "e.g. Abebe Kebede"}
                    type="text"
                  />
                </div>
                {errors.full_name ? (
                  <p className="text-xs text-red-500">{errors.full_name.message}</p>
                ) : null}
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider" htmlFor="email">
                  {isAm ? "ኢሜይል" : "Email Address"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                  </span>
                  <input
                    {...register("email")}
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:border-[#00456d] focus:ring-2 focus:ring-[#00456d]/10 outline-none transition-all placeholder:text-slate-400"
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                  />
                </div>
                {errors.email ? (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                ) : null}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider" htmlFor="password">
                  {isAm ? "የይለፍ ቃል" : "Password"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </span>
                  <input
                    {...register("password")}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:border-[#00456d] focus:ring-2 focus:ring-[#00456d]/10 outline-none transition-all placeholder:text-slate-400"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword((prev) => !prev)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordVal.length > 0 && (
                  <div className="pt-1 space-y-1">
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">
                        {isAm ? "የይለፍ ቃል ጥንካሬ" : "Password strength"}
                      </span>
                      <span className={strength.textClass}>{strength.label}</span>
                    </div>
                  </div>
                )}

                {errors.password ? (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                ) : null}
              </div>

              {/* Form Error Banner */}
              {formError ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                  {formError}
                </div>
              ) : null}

              {/* Submit CTA */}
              <button
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#00456d] hover:bg-[#1d5d8a] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <span>
                      {isResearcher
                        ? (isAm ? "የተመራማሪ መለያ ፍጠር" : "Create Researcher Account")
                        : (isAm ? "ተመዝገብ እና ገቢ አግኝ" : "Sign Up to Earn")}
                    </span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Login Link */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                {isAm ? "መለያ አለዎት? " : "Already have an account? "}
                <Link
                  className="font-semibold text-[#00456d] hover:underline"
                  to={isResearcher ? "/login/researcher" : "/login/respondent"}
                >
                  {isAm ? "ይግቡ" : "Log in"}
                </Link>
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
        <p>&copy; {new Date().getFullYear()} Ethosk Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

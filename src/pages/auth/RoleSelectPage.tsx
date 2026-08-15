import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/lib/language";

export function RoleSelectPage() {
  const { language } = useLanguage();
  const isAm = language === "am";
  const { pathname } = useLocation();
  const isSignup = pathname.startsWith("/signup");

  const heading = isSignup
    ? (isAm ? "መለያዎን ይክፈቱ" : "Create your account")
    : (isAm ? "እንኳን ደህና መጡ" : "Welcome back");

  const subheading = isSignup
    ? (isAm ? "ኢትዮስክን እንዴት እንደሚጠቀሙ ይምረጡ" : "Choose how you'll use Ethosk")
    : (isAm ? "እንደ… ይግቡ" : "Log in as…");

  const roles = [
    {
      key: "researcher" as const,
      icon: "science",
      label: isAm ? "ተመራማሪ" : "Researcher",
      description: isSignup
        ? (isAm
            ? "ጥናቶችን ይንደፉ፣ የተረጋገጡ ተሳታፊዎችን ያግኙ እና አስተማማኝ የምርምር መረጃዎችን ይሰብስቡ::"
            : "Design surveys, target verified audiences, and get defensible research data.")
        : (isAm
            ? "ዳሽቦርድዎን እና የትንታኔ መረጃዎችዎን ይድረሱ፣ ጥናቶችን ያስተዳድሩ::"
            : "Access your dashboard, analytics, and manage studies."),
      path: isSignup ? "/signup/researcher" : "/login/researcher",
      accent: "from-[#002446] to-[#004a8f]",
    },
    {
      key: "respondent" as const,
      icon: "person",
      label: isAm ? "ተሳታፊ / ምላሽ ሰጪ" : "Respondent",
      description: isSignup
        ? (isAm
            ? "ማንነትዎን ያረጋግጡ፣ በሚከፈልባቸው ጥናቶች ይሳተፉ እና ክፍያዎችን ያግኙ::"
            : "Get verified, participate in paid studies, and earn rewards.")
        : (isAm
            ? "የደረሱ ጥናቶችን ይመልከቱ፣ ጥናቶችን ያጠናቅቁ እና ገቢዎን ይፈትሹ::"
            : "View your inbox, complete surveys, and check your earnings."),
      path: isSignup ? "/signup/respondent" : "/login/respondent",
      accent: "from-[#1a6b3c] to-[#2e9e5c]",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f1fe] via-[#dde8fa] to-[#cbe6ff] flex flex-col items-center justify-center px-6 py-16 relative">
      {/* Ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#b8d8f8] rounded-full mix-blend-multiply filter blur-[150px] opacity-40 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#8fcdff] rounded-full mix-blend-multiply filter blur-[180px] opacity-40 pointer-events-none" />

      {/* Logo */}
      <Link className="mb-10 text-2xl font-headline-lg text-primary" to="/">
        Ethosk
      </Link>

      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-display-lg text-primary tracking-tight">
          {heading}
        </h1>
        <p className="mt-3 text-on-surface-variant font-body-lg text-lg">
          {subheading}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 max-w-2xl w-full">
        {roles.map((role) => (
          <Link
            className="group relative bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl p-8 flex flex-col items-center text-center gap-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
            key={role.key}
            to={role.path}
          >
            {/* Gradient accent bar at top */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${role.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />

            {/* Icon circle */}
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.accent} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
            >
              <span className="material-symbols-outlined text-white text-3xl">
                {role.icon}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-headline-md text-primary font-bold">
                {role.label}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant font-body-md leading-relaxed max-w-xs">
                {role.description}
              </p>
            </div>

            {/* Arrow indicator */}
            <div className="mt-auto pt-2 flex items-center gap-1.5 text-sm font-semibold text-primary/60 group-hover:text-primary transition-colors">
              <span>{isSignup ? (isAm ? "ይጀምሩ" : "Get started") : (isAm ? "ይቀጥሉ" : "Continue")}</span>
              <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-10 text-sm text-on-surface-variant">
        {isSignup ? (
          <>
            {isAm ? "መለያ አለዎት? " : "Already have an account? "}
            <Link className="text-primary font-semibold hover:underline" to="/login">
              {isAm ? "ግቡ" : "Log in"}
            </Link>
          </>
        ) : (
          <>
            {isAm ? "መለያ የለዎትም? " : "Don't have an account? "}
            <Link className="text-primary font-semibold hover:underline" to="/signup">
              {isAm ? "ተመዝገቡ" : "Sign up"}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

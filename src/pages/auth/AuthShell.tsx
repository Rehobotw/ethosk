import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { UserRole } from "@shared/types";
import { Icon } from "@/components/ui";
import { useLanguage } from "@/lib/language";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col relative bg-surface-bright text-primary">
      {/* Background Shader — same as MarketingLayout */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-gradient-to-br from-surface-bright via-surface-container-low to-primary-fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-fixed rounded-full mix-blend-multiply filter blur-[150px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-inverse-primary rounded-full mix-blend-multiply filter blur-[180px] opacity-40" />
      </div>

      {/* Top bar */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <button
          aria-label={language === "en" ? "Switch to Amharic" : "Switch to English"}
          className="flex items-center gap-2 bg-white/60 backdrop-blur-xl rounded-full px-3 py-1.5 text-sm border border-white/40 cursor-pointer hover:bg-white/80 transition-colors"
          onClick={toggleLanguage}
          title={language === "en" ? "Switch to Amharic (አማርኛ)" : "Switch to English"}
          type="button"
        >
          <span className="w-5 h-5 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-[10px] font-bold">
            {language.toUpperCase()}
          </span>
          <span className="text-primary/80 text-sm font-medium">
            {language === "en" ? "Amharic" : "English"}
          </span>
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-margin-mobile py-12 relative z-[1]">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center">
            <Link className="text-2xl font-headline-lg text-primary" to="/">
              Ethosk
            </Link>
            <h1 className="mt-6 text-3xl font-headline-lg font-bold leading-tight text-primary">
              {title}
            </h1>
            <p className="mt-2 font-body-md text-on-surface-variant">
              {subtitle}
            </p>
          </div>

          {/* Glassmorphic form container */}
          <div className="mt-8 glass-silk rounded-2xl p-8">{children}</div>

          <div className="mt-6 text-center font-body-md text-on-surface-variant">
            {footer}
          </div>

          <div className="mt-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-xl border border-white/40 px-4 py-2 font-label-caps text-label-caps uppercase text-on-surface-variant shadow-sm">
              <Icon className="text-[16px] text-primary" filled name="verified_user" />
              Fayda Verified Access
            </span>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/40 bg-white/40 backdrop-blur-3xl px-margin-mobile py-4 text-center relative z-[1]">
        <p className="font-body-md text-[12px] text-on-surface-variant">
          © {new Date().getFullYear()} Ethosk. All rights reserved.
        </p>
        <p className="mt-1 font-label-caps text-[10px] uppercase text-on-surface-variant/60">
          Fully compliant with Federal Democratic Republic of Ethiopia Proclamation 1321/2024
        </p>
      </footer>
    </div>
  );
}

/** The segmented Researcher / Respondent selector from the login design. */
export function RoleTabs({
  value,
  onChange,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
}) {
  const { t } = useLanguage();
  const options: { role: UserRole; label: string; icon: string }[] = [
    { role: "researcher", label: t("auth.role_researcher"), icon: "science" },
    { role: "respondent", label: t("auth.role_respondent"), icon: "groups" },
  ];

  return (
    <div
      className="flex rounded-full bg-white/60 backdrop-blur-xl border border-white/40 p-1"
      role="tablist"
    >
      {options.map((option) => {
        const active = value === option.role;
        return (
          <button
            aria-selected={active}
            className={clsx(
              "flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition-all",
              active
                ? "primary-gradient-btn shadow-md text-white"
                : "text-on-surface-variant hover:text-primary hover:bg-white/40",
            )}
            key={option.role}
            onClick={() => onChange(option.role)}
            role="tab"
            type="button"
          >
            <Icon className="text-[16px]" filled={active} name={option.icon} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

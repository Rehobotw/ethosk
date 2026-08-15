import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import type { UserRole } from "@shared/types";
import { Icon } from "@/components/ui";
import { useLanguage } from "@/lib/language";
import { AuthSlideshow } from "./AuthSlideshow";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  role,
  topRightAction,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  role?: UserRole | "respondent" | "researcher";
  topRightAction?: ReactNode;
}) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-surface-bright text-on-background">
      {/* ── Left Panel: Trust & Brand Narrative (Stitch split-panel for login) ── */}
      {role ? (
        <div className="relative hidden lg:flex lg:w-[45%] flex-col justify-between p-10 lg:p-12 overflow-hidden border-r border-outline-variant/20 bg-primary-fixed shrink-0 min-h-screen">
          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-surface-container-low opacity-50 pointer-events-none" />

          {/* Slideshow content */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            <AuthSlideshow role={role} variant="panel" />
          </div>

          {/* Copyright */}
          <div className="relative z-10 mt-auto pt-6">
            <p className="font-label-md text-label-md text-on-primary-fixed-variant/80">
              © {new Date().getFullYear()} Ethosk Research Systems. All rights reserved.
            </p>
          </div>
        </div>
      ) : null}

      {/* ── Right Panel: Form Canvas ── */}
      <div
        className={clsx(
          "flex-1 flex flex-col justify-center items-center relative min-h-screen",
          "p-6 sm:p-8 md:p-12",
        )}
        style={{
          background:
            "radial-gradient(circle at 80% 20%, rgba(143,205,255,0.1) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(0,89,133,0.1) 0%, transparent 50%)",
        }}
      >
        {/* Top Right Actions */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 flex items-center gap-4 z-10">
          {topRightAction}
          {/* Language switcher */}
          <button
            aria-label={language === "en" ? "Switch to Amharic" : "Switch to English"}
            className="flex items-center gap-1.5 bg-slate-100/80 backdrop-blur-md rounded-lg px-3 py-1.5 text-xs border border-slate-200/60 cursor-pointer hover:bg-slate-100 transition-colors"
            onClick={toggleLanguage}
            title={language === "en" ? "Switch to Amharic (አማርኛ)" : "Switch to English"}
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

        {/* Logo */}
        {!role ? (
          <Link className="flex items-center gap-2 mb-6 mt-2" to="/">
            <span className="font-headline-lg text-2xl text-primary font-bold tracking-tight">Ethosk</span>
          </Link>
        ) : (
          <div className="lg:hidden flex items-center gap-2 mb-8 mt-4">
            <Icon className="text-primary" filled name="hub" />
            <span className="font-title-md text-title-md text-primary tracking-tight">Ethosk</span>
          </div>
        )}

        {/* Glass form card matching Stitch glass-card pattern */}
        <div
          className="w-full max-w-[440px] rounded-xl p-6 sm:p-8 md:p-10 my-auto"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(192,199,208,0.4)",
            boxShadow: "0 4px 20px rgba(0,89,133,0.08)",
          }}
        >
          {/* Title block */}
          <div className="text-center mb-8">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
              {title}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {subtitle}
            </p>
          </div>

          {children}

          {/* Divider + secondary action */}
          <div className="mt-8 flex items-center justify-center">
            <div className="border-t border-outline-variant/40 flex-grow" />
            <span className="px-4 font-label-md text-label-md text-on-surface-variant">or</span>
            <div className="border-t border-outline-variant/40 flex-grow" />
          </div>

          <div className="mt-6 text-center flex flex-col gap-3">
            <div className="font-body-md text-body-md text-on-surface-variant">
              {footer}
            </div>
            <div className="inline-flex items-center justify-center gap-1 bg-surface-container-high px-3 py-1.5 rounded-full mx-auto w-max border border-outline-variant/20">
              <Icon className="text-on-surface-variant text-[14px]" name="domain" />
              <span className="font-label-caps text-label-caps text-on-surface-variant tracking-wider">
                {role === "researcher"
                  ? "For research teams and institutions"
                  : "ID-verified respondent panel"}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile copyright */}
        <div className="mt-8 text-center w-full lg:hidden pb-4">
          <p className="font-label-md text-label-md text-on-surface-variant/60">
            © {new Date().getFullYear()} Ethosk
          </p>
        </div>
      </div>
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

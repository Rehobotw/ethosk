import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { ThemeToggle } from "@/lib/theme";
import { Icon } from "../ui";
import { LanguageToggle } from "../ui/LanguageToggle";
import { ResearcherAvatar } from "./ResearcherAvatar";
import { isNavActive } from "./researcherNav";

export function ResearcherLayout() {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const isAm = language === "am";
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isBuilderPage =
    pathname === "/researcher/surveys/new" ||
    pathname.startsWith("/survey-builder/manual") ||
    pathname.startsWith("/researcher/surveys/new/manual") ||
    (pathname.startsWith("/researcher/surveys/") && pathname.endsWith("/edit"));

  const primaryNav = [
    { label: isAm ? "ዳሽቦርድ" : "Dashboard", to: "/researcher", icon: "dashboard" },
    { label: isAm ? "የጥናት አዘጋጅ" : "Survey Builder", to: "/survey-builder", icon: "edit_note" },
    { label: isAm ? "የጥናት መለጠፍ" : "Survey Posting", to: "/survey-posting", icon: "send" },
    { label: isAm ? "ትንታኔ" : "Analytics", to: "/researcher/analytics", icon: "analytics" },
    { label: isAm ? "ቦርሳ" : "Wallet", to: "/researcher/wallet", icon: "account_balance_wallet" },
  ];

  const secondaryNav = [
    { label: isAm ? "የእርዳታ ማዕከል" : "Help Center", to: "/researcher/help", icon: "help" },
  ];

  const adminPrimaryNav = [
    { label: isAm ? "አጠቃላይ እይታ" : "Overview", to: "/admin", icon: "dashboard" },
    { label: isAm ? "የማረጋገጫ ወረፋ" : "Review Queue", to: "/admin/review-queue", icon: "rule" },
    { label: isAm ? "የጥናት ማጽደቆች" : "Survey Approvals", to: "/admin/survey-approvals", icon: "task_alt" },
    { label: isAm ? "የተመራማሪ ማጽደቆች" : "Researcher Approvals", to: "/admin/researcher-approvals", icon: "how_to_reg" },
  ];

  const superAdminPrimaryNav = [
    { label: isAm ? "አጠቃላይ እይታ" : "Overview", to: "/admin", icon: "dashboard" },
    { label: isAm ? "የፋይናንስ ሁኔታ" : "Financials & Escrow", to: "/admin/revenue", icon: "payments" },
    { label: isAm ? "የማረጋገጫ ወረፋ" : "Review Queue", to: "/admin/review-queue", icon: "rule" },
    { label: isAm ? "የጥናት ማጽደቆች" : "Survey Approvals", to: "/admin/survey-approvals", icon: "task_alt" },
    { label: isAm ? "የተመራማሪ ማጽደቆች" : "Researcher Approvals", to: "/admin/researcher-approvals", icon: "how_to_reg" },
    { label: isAm ? "የተጠቃሚዎች አስተዳደር" : "User Management", to: "/admin/users", icon: "group" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-on-surface flex">
      {/* ── Desktop & Mobile Sidebar (Exact Stitch Design) ── */}
      <aside
        className={clsx(
          "fixed md:sticky top-0 left-0 z-40 flex h-screen w-[260px] flex-col border-r border-[#c1c7cc]/60 bg-[#ebf3f9] p-4 transition-transform shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Stitch Sidebar Header */}
        <div className="px-2 mb-6 pt-2">
          <Link to="/researcher">
            <h1 className="font-headline-md text-2xl font-bold text-primary tracking-tight">
              Ethosk
            </h1>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Operational Hub
            </p>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1.5 flex-1 overflow-y-auto">
          {(user?.role === "super_admin"
            ? superAdminPrimaryNav
            : user?.role === "admin"
              ? adminPrimaryNav
              : primaryNav
          ).map((item) => (
            <SidebarLink
              active={isNavActive(pathname, item.to)}
              icon={item.icon}
              key={item.to}
              label={item.label}
              onNavigate={() => setSidebarOpen(false)}
              to={item.to}
            />
          ))}
        </nav>

        {/* Secondary items at bottom */}
        <div className="mt-auto space-y-1.5 border-t border-[#c1c7cc]/60 pt-4">
          {(user?.role === "admin" || user?.role === "super_admin" ? [] : secondaryNav).map((item) => (
            <SidebarLink
              active={isNavActive(pathname, item.to)}
              icon={item.icon}
              key={item.to}
              label={item.label}
              onNavigate={() => setSidebarOpen(false)}
              to={item.to}
            />
          ))}

          <button
            onClick={() => void logout()}
            className="flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-[#5A6E7F] hover:text-error hover:bg-error/5 transition-colors cursor-pointer"
            type="button"
          >
            <Icon className="text-[20px]" name="logout" />
            <span>{isAm ? "ውጣ" : "Log Out"}</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FF] h-screen overflow-hidden">
        {/* Top Header: Matching Stitch Design */}
        <header className="shrink-0 z-30 w-full h-16 bg-white/95 backdrop-blur-md border-b border-[#c1c7cc]/50 flex items-center justify-between px-6">
          {/* Mobile hamburger + Logo */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              aria-label="Toggle navigation"
              className="p-1 rounded-lg hover:bg-slate-200/60 cursor-pointer"
              onClick={() => setSidebarOpen((open) => !open)}
              type="button"
            >
              <Icon name={sidebarOpen ? "close" : "menu"} />
            </button>
            <span className="font-headline-md text-lg font-bold text-primary">Ethosk</span>
          </div>

          {/* Search bar on desktop */}
          <div className="hidden md:flex items-center w-96 bg-[#eff4ff] border border-[#c1c7cc]/50 rounded-full px-4 py-2 focus-within:border-primary transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">
              search
            </span>
            <input
              aria-label="Search surveys"
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant w-full p-0"
              placeholder={isAm ? "ጥናቶችን ፈልግ..." : "Search surveys, templates..."}
              type="search"
            />
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <button
              aria-label="Notifications"
              className="p-2 text-on-surface-variant hover:bg-[#eff4ff] rounded-full transition-colors relative cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <ResearcherAvatar />
          </div>
        </header>

        {/* Page Outlet */}
        <main
          className={clsx(
            isBuilderPage
              ? "flex-1 flex flex-col min-h-0 overflow-hidden"
              : "flex-1 overflow-y-auto px-6 pb-12 pt-4 md:px-8 max-w-7xl mx-auto w-full",
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  to,
  icon,
  label,
  active,
  onNavigate,
}: {
  to: string;
  icon: string;
  label: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors text-sm",
        active
          ? "bg-[#004B63] text-white font-bold shadow-xs hover:bg-[#004B63]/90"
          : "text-on-surface-variant hover:bg-[#dde9ff] hover:text-on-surface font-medium",
      )}
      onClick={onNavigate}
      to={to}
    >
      <Icon className="text-[20px]" filled={active} name={icon} />
      <span>{label}</span>
    </Link>
  );
}

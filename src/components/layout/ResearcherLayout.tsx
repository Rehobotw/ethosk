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
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAm = language === "am";
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isBuilderPage =
    pathname === "/researcher/surveys/new" ||
    (pathname.startsWith("/researcher/surveys/") && pathname.endsWith("/edit"));

  const primaryNav = [
    { label: isAm ? "ዳሽቦርድ" : "Dashboard", to: "/researcher", icon: "dashboard" },
    { label: isAm ? "የጥናት አዘጋጅ" : "Survey Builder", to: "/researcher/surveys/new", icon: "edit_note" },
    { label: isAm ? "የእኔ ጥናቶች" : "My Surveys", to: "/researcher/surveys", icon: "send" },
    { label: isAm ? "ትንታኔ" : "Analytics", to: "/researcher/analytics", icon: "analytics" },
    { label: isAm ? "ቦርሳ" : "Wallet", to: "/researcher/wallet", icon: "account_balance_wallet" },
  ];

  const secondaryNav = [
    { label: isAm ? "የደንበኝነት ምዝገባ" : "Subscription", to: "/researcher/subscription", icon: "star" },
    { label: isAm ? "መገለጫ" : "Profile", to: "/researcher/profile", icon: "person" },
    { label: isAm ? "ቅንብሮች" : "Settings", to: "/researcher/settings", icon: "settings" },
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
    <div className="min-h-screen bg-[#F4F7FA] text-on-surface flex">
      {/* ── Desktop & Mobile Sidebar (Stitch Screen 3b68c8dbda7342c6847547b652d3be48 & ce402508206046399e6c6f58c4cdcf6b) ── */}
      <aside
        className={clsx(
          "fixed md:sticky top-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200/80 bg-[#F4F7FA] p-4 transition-transform shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Stitch Sidebar Header */}
        <div className="px-2 mb-6 pt-2">
          <Link to="/researcher">
            <h1 className="font-headline-md text-xl font-bold text-primary tracking-tight">
              {isAm ? "ኢቶስክ ምርምር" : "Ethosk Research"}
            </h1>
            <p className="text-xs text-on-surface-variant font-medium">
              {isAm ? "የአሰራር ማዕከል" : "Operational Hub"}
            </p>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1 flex-1 overflow-y-auto">
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
        <div className="mt-auto space-y-1 border-t border-slate-200/80 pt-4">
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
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F4F7FA]">
        {/* Top Header: Rendered for Dashboard and general pages, omitted on Builder (which has its own dedicated toolbar) */}
        {!isBuilderPage ? (
          <header className="sticky top-0 z-30 w-full h-16 md:h-20 bg-[#F4F7FA]/90 backdrop-blur-md flex items-center justify-between px-6 md:px-8">
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
            <div className="hidden md:flex items-center w-full max-w-md">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  search
                </span>
                <input
                  aria-label="Search surveys"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-[#5A6E7F] transition-all shadow-2xs"
                  placeholder={isAm ? "ምርምር ፈልግ..." : "Search research…"}
                  type="search"
                />
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <ThemeToggle />
              <button
                aria-label="Notifications"
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-white rounded-full transition-colors relative cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
              </button>
              <ResearcherAvatar />
            </div>
          </header>
        ) : null}

        {/* Page Outlet */}
        <main
          className={clsx(
            isBuilderPage
              ? "flex-1 flex flex-col h-screen overflow-hidden"
              : "flex-1 px-6 pb-12 pt-2 md:px-8 max-w-7xl mx-auto w-full",
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
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all text-sm duration-150",
        active
          ? "bg-primary/10 text-primary font-bold shadow-xs"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium",
      )}
      onClick={onNavigate}
      to={to}
    >
      <Icon className="text-[20px]" filled={active} name={icon} />
      <span>{label}</span>
    </Link>
  );
}

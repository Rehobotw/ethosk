import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/lib/theme";
import { Icon, TierBadge } from "../ui";
import { isNavActive, PRIMARY_NAV, SECONDARY_NAV } from "./researcherNav";

export function ResearcherLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="fixed top-0 z-50 w-full border-b border-outline-variant bg-surface">
        <div className="flex h-16 items-center justify-between px-margin-mobile md:px-gutter">
          <div className="flex items-center gap-stack-md">
            <button
              aria-label="Toggle navigation"
              className="md:hidden"
              onClick={() => setSidebarOpen((open) => !open)}
              type="button"
            >
              <Icon name={sidebarOpen ? "close" : "menu"} />
            </button>
            <Link className="font-headline-md text-headline-md font-bold text-primary" to="/researcher">
              Ethosk
            </Link>
          </div>

          <div className="flex items-center gap-stack-md">
            <div className="hidden items-center gap-stack-sm rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1.5 md:flex">
              <Icon className="text-[18px] text-outline" name="search" />
              <input
                aria-label="Search surveys"
                className="w-48 bg-transparent font-body-sm text-body-sm outline-none placeholder:text-outline"
                placeholder="Search surveys…"
                type="search"
              />
            </div>
            <ThemeToggle />
            <Icon className="text-on-surface-variant" name="notifications" />
            <button
              aria-label="Log out"
              className="flex items-center gap-stack-sm"
              onClick={logout}
              type="button"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-status-badge text-status-badge text-on-primary">
                {initials(user?.full_name)}
              </span>
            </button>
          </div>
        </div>
      </header>

      <aside
        className={clsx(
          "fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-outline-variant bg-surface p-stack-md transition-transform md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-stack-md">
          <p className="font-title-sm text-body-md font-bold text-on-surface">Researcher Portal</p>
          {user ? (
            <div className="mt-stack-sm">
              <TierBadge tier={user.verification_tier} />
            </div>
          ) : null}
        </div>

        <nav className="space-y-base">
          {PRIMARY_NAV.map((item) => (
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

        <div className="mt-auto space-y-base border-t border-outline-variant pt-stack-md">
          {SECONDARY_NAV.map((item) => (
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

      {/* No marketing footer in here: the sidebar is the navigation, and a second
          set of sign-up and language links belongs on the public pages, not on a
          working dashboard. */}
      <div className="pt-16 md:pl-64">
        <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-container-max p-margin-mobile md:p-gutter">
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
        "flex items-center gap-stack-sm rounded-xl p-stack-sm transition-all",
        active
          ? "bg-secondary-container font-semibold text-on-secondary-container"
          : "text-on-surface-variant hover:bg-surface-container-highest",
      )}
      onClick={onNavigate}
      to={to}
    >
      <Icon filled={active} name={icon} />
      <span className="font-title-sm text-body-md">{label}</span>
    </Link>
  );
}

function initials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

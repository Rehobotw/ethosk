import { Link, NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { Icon, TierBadge } from "../ui";

/** The four that earn a thumb-sized target in the mobile tab bar. */
const PRIMARY_TABS = [
  { label: "Inbox", to: "/inbox", icon: "inbox", end: true },
  { label: "History", to: "/history", icon: "history", end: false },
  { label: "Wallet", to: "/wallet", icon: "account_balance_wallet", end: false },
  { label: "Profile", to: "/profile", icon: "account_circle", end: false },
];

/**
 * The sidebar has room for the screens that are otherwise only reachable by
 * following a link out of another page.
 *
 * Profile is deliberately absent: the header avatar links to it from every
 * screen, so a sidebar entry would be a second control for the same destination.
 */
const SIDEBAR_NAV = [
  PRIMARY_TABS[0]!,
  PRIMARY_TABS[1]!,
  PRIMARY_TABS[2]!,
  { label: "Verification", to: "/verify", icon: "verified_user", end: false },
  { label: "Documents", to: "/documents", icon: "folder", end: false },
];

/**
 * Respondent shell.
 *
 * Mobile is still the design target — a compact bar on top, thumb-reachable tabs
 * at the bottom. From `md` up the same destinations move into a fixed sidebar and
 * the content column widens, so a respondent on a laptop is not reading a
 * phone-width strip down the middle of an empty page.
 */
export function RespondentLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20 text-on-background md:pb-0">
      <header className="fixed top-0 z-50 w-full border-b border-outline-variant bg-surface/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-stack-md px-margin-mobile md:h-16 md:px-gutter">
          <Link
            className="font-headline-md text-title-sm font-bold text-primary md:text-headline-md"
            to="/inbox"
          >
            Ethosk
          </Link>

          <div className="flex shrink-0 items-center gap-stack-md">
            <Icon className="text-on-surface-variant" name="notifications" />
            <Link
              aria-label="Profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-status-badge text-status-badge text-on-primary"
              to="/profile"
            >
              {(user?.full_name?.[0] ?? "?").toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar replaces the tab bar from md up; below that the tab bar is the
          better target and this is hidden entirely rather than made collapsible. */}
      <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-64 flex-col border-r border-outline-variant bg-surface p-stack-md md:flex">
        <div className="mb-stack-md">
          <p className="font-title-sm text-body-md font-bold text-on-surface">
            {user?.full_name ?? "Respondent"}
          </p>
          {user ? (
            <div className="mt-stack-sm">
              <TierBadge tier={user.verification_tier} />
            </div>
          ) : null}
        </div>

        <nav className="space-y-base">
          {SIDEBAR_NAV.map((item) => (
            <NavLink
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-stack-sm rounded-xl p-stack-sm transition-all",
                  isActive
                    ? "bg-secondary-container font-semibold text-on-secondary-container"
                    : "text-on-surface-variant hover:bg-surface-container-highest",
                )
              }
              end={item.end}
              key={item.to}
              to={item.to}
            >
              {({ isActive }) => (
                <>
                  <Icon filled={isActive} name={item.icon} />
                  <span className="font-title-sm text-body-md">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          className="mt-auto flex items-center gap-stack-sm rounded-xl p-stack-sm text-on-surface-variant transition-all hover:bg-surface-container-highest"
          onClick={logout}
          type="button"
        >
          <Icon name="logout" />
          <span className="font-title-sm text-body-md">Log out</span>
        </button>
      </aside>

      <div className="pt-14 md:pl-64 md:pt-16">
        <main className="mx-auto w-full max-w-2xl px-margin-mobile py-stack-md md:max-w-4xl md:px-gutter md:py-stack-lg">
          <Outlet />
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-outline-variant bg-surface md:hidden">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-around">
          {PRIMARY_TABS.map((tab) => (
            <NavLink
              className={({ isActive }) =>
                clsx(
                  "flex flex-col items-center gap-base transition-colors",
                  isActive ? "text-primary" : "text-on-surface-variant hover:text-primary",
                )
              }
              end={tab.end}
              key={tab.to}
              to={tab.to}
            >
              {({ isActive }) => (
                <>
                  <Icon filled={isActive} name={tab.icon} />
                  <span className="font-label-caps text-[10px] uppercase">{tab.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

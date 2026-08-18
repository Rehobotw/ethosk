/** Sidebar destinations for the researcher portal, in the order they appear in Stitch. */
export const PRIMARY_NAV = [
  { label: "Dashboard", to: "/researcher", icon: "dashboard" },
  { label: "Survey Builder", to: "/survey-builder", icon: "edit_note" },
  { label: "My Surveys", to: "/researcher/surveys", icon: "send" },
  { label: "Analytics", to: "/researcher/analytics", icon: "analytics" },
  { label: "Wallet", to: "/researcher/wallet", icon: "account_balance_wallet" },
];

export const SECONDARY_NAV = [
  { label: "Subscription", to: "/researcher/subscription", icon: "star" },
  { label: "Profile", to: "/researcher/profile", icon: "person" },
  { label: "Settings", to: "/researcher/settings", icon: "settings" },
  { label: "Help Center", to: "/researcher/help", icon: "help" },
];

/** Every sidebar path, so a test can assert across all of them at once. */
export const NAV_PATHS = [...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => item.to);

/**
 * Whether a sidebar item should be highlighted for the current URL.
 *
 * Exactly one item is highlighted for any URL in the portal. Plain prefix matching
 * cannot achieve that, because "Survey Builder" lives at `/survey-builder`
 * (or `/researcher/surveys/new`) — underneath "My Surveys" — so both would light up on the builder.
 */
export function isNavActive(pathname: string, to: string): boolean {
  // The dashboard is the portal root, so a prefix match would claim every page.
  if (to === "/researcher") return pathname === "/researcher";

  if (to === "/survey-builder" || to === "/researcher/surveys/new") {
    return (
      pathname.startsWith("/survey-builder") ||
      pathname.startsWith("/researcher/surveys/new")
    );
  }

  if (to === "/researcher/surveys") {
    // Editing or reviewing a survey belongs to the list; creating one (and its
    // sub-routes: /manual, /import, /ai) has its own entry.
    return (
      pathname.startsWith("/researcher/surveys") &&
      !pathname.startsWith("/researcher/surveys/new")
    );
  }

  return pathname === to || pathname.startsWith(`${to}/`);
}

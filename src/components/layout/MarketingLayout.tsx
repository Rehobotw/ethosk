import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import { Button, Icon } from "../ui";
import { LanguageToggle } from "../ui/LanguageToggle";
import { useAuth, homePathForRole } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { ThemeToggle } from "@/lib/theme";
import { Footer } from "./Footer";

export function MarketingLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navLinks = [
    { label: t("nav.how_it_works"), to: "/#how" },
    { label: t("nav.platform"), to: "/#product" },
    { label: t("nav.verification"), to: "/#verification" },
    { label: t("nav.for_researchers"), to: "/learn/researchers" },
    { label: t("nav.for_respondents"), to: "/learn/respondents" },
  ];

  // Route changes leave the drawer open otherwise, since the layout persists.
  useEffect(() => setMenuOpen(false), [pathname]);

  // The header sits over the dark hero, so it stays transparent at the top of the
  // page and only picks up a background once content is behind it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onDarkHeader = pathname === "/" && !scrolled && !menuOpen;

  return (
    <div className="min-h-screen bg-background text-on-background">
      <header
        className={clsx(
          "fixed top-0 z-50 w-full transition-colors duration-300",
          onDarkHeader
            ? "border-b border-transparent"
            : "border-b border-outline-variant bg-surface/85 backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex h-16 max-w-container-max items-center justify-between px-margin-mobile md:px-gutter">
          <Link
            className={clsx(
              "font-headline-md text-headline-md font-bold tracking-tight transition-colors",
              onDarkHeader ? "text-on-primary" : "text-primary",
            )}
            to="/"
          >
            Ethosk
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                className={clsx(
                  "rounded-full px-3 py-2 font-body-sm text-body-sm transition-colors",
                  onDarkHeader
                    ? "text-primary-fixed-dim hover:bg-primary-fixed/10 hover:text-primary-fixed"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-primary",
                )}
                key={link.to}
                to={link.to}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-stack-sm">
            <LanguageToggle />
            <ThemeToggle />
            {user ? (
              <Link to={homePathForRole(user.role)}>
                <Button
                  className={clsx(
                    onDarkHeader && "bg-surface-container-lowest text-primary hover:bg-primary-fixed",
                  )}
                >
                  {t("nav.dashboard")}
                </Button>
              </Link>
            ) : (
              <>
                <Link className="hidden sm:block" to="/login">
                  <Button
                    className={clsx(
                      onDarkHeader &&
                        "text-primary-fixed-dim hover:bg-primary-fixed/10 hover:text-primary-fixed",
                    )}
                    variant="ghost"
                  >
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    className={clsx(
                      onDarkHeader && "bg-surface-container-lowest text-primary hover:bg-primary-fixed",
                    )}
                  >
                    {t("nav.signup")}
                  </Button>
                </Link>
              </>
            )}

            <button
              aria-expanded={menuOpen}
              aria-label="Toggle navigation"
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors lg:hidden",
                onDarkHeader
                  ? "text-primary-fixed hover:bg-primary-fixed/10"
                  : "text-on-surface-variant hover:bg-surface-container",
              )}
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              <Icon name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav className="border-t border-outline-variant bg-surface px-margin-mobile py-stack-sm lg:hidden">
            {navLinks.map((link) => (
              <Link
                className="block rounded-xl px-3 py-3 font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                key={link.to}
                to={link.to}
              >
                {link.label}
              </Link>
            ))}
            <Link
              className="mt-base block rounded-xl px-3 py-3 font-title-sm text-body-md font-semibold text-primary transition-colors hover:bg-surface-container sm:hidden"
              to="/login"
            >
              Log in
            </Link>
          </nav>
        ) : null}
      </header>

      {/* The home hero supplies its own top spacing behind the transparent header. */}
      <main className={pathname === "/" ? "" : "pt-16"}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

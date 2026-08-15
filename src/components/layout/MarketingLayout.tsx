import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth, homePathForRole } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { Footer } from "./Footer";

export function MarketingLayout() {
  const { user } = useAuth();
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  /* Scroll to anchor when hash changes */
  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      }
    }
  }, [hash, pathname]);

  const scrollTo = useCallback(
    (sectionId: string) => {
      if (pathname === "/") {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        navigate(`/#${sectionId}`);
      }
    },
    [pathname, navigate],
  );

  return (
    <div className="antialiased relative bg-[#f8f9ff] text-[#004162] min-h-screen flex flex-col font-body-md">
      {/* ── Background Shader ── */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-gradient-to-br from-[#f8f9ff] via-[#eff4ff] to-[#cbe6ff]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#cbe6ff] rounded-full mix-blend-multiply filter blur-[150px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#8fcdff] rounded-full mix-blend-multiply filter blur-[180px] opacity-40" />
      </div>

      {/* ── TopNavBar (Stitch Screen Header) ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 flex justify-between items-center max-w-full mx-auto w-full h-20 bg-white/50 backdrop-blur-2xl text-[#004162] font-body-lg shadow-xs border-b border-white/60">
        <div className="flex items-center gap-2">
          <Link className="text-2xl font-headline-lg text-[#004162] font-extrabold tracking-tight" to="/">
            Ethosk
          </Link>
        </div>

        <nav className="hidden lg:flex gap-8 text-sm font-semibold tracking-wide">
          <button
            className="text-[#004162]/80 hover:text-[#004162] transition-colors bg-transparent border-none cursor-pointer text-sm font-semibold"
            onClick={() => scrollTo("how")}
            type="button"
          >
            {language === "am" ? "እንዴት እንደሚሰራ" : "How it works"}
          </button>
          <button
            className="text-[#004162]/80 hover:text-[#004162] transition-colors bg-transparent border-none cursor-pointer text-sm font-semibold"
            onClick={() => scrollTo("features")}
            type="button"
          >
            {language === "am" ? "ባህሪያት" : "Features"}
          </button>
          <button
            className="text-[#004162]/80 hover:text-[#004162] transition-colors bg-transparent border-none cursor-pointer text-sm font-semibold"
            onClick={() => scrollTo("verification")}
            type="button"
          >
            {language === "am" ? "ማረጋገጫ" : "Verification"}
          </button>
          <button
            className="text-[#004162]/80 hover:text-[#004162] transition-colors bg-transparent border-none cursor-pointer text-sm font-semibold"
            onClick={() => scrollTo("pricing")}
            type="button"
          >
            {language === "am" ? "የዋጋ ዝርዝር" : "Pricing"}
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <button
            aria-label={language === "en" ? "Switch to Amharic" : "Switch to English"}
            className="hidden md:flex items-center gap-2 bg-white/70 backdrop-blur-xl rounded-full px-3 py-1.5 text-xs border border-white/60 cursor-pointer hover:bg-white transition-colors"
            onClick={toggleLanguage}
            title={language === "en" ? "Switch to Amharic (አማርኛ)" : "Switch to English"}
            type="button"
          >
            <span className="w-5 h-5 rounded-full bg-[#cbe6ff] text-[#004162] flex items-center justify-center text-[10px] font-bold">
              {language.toUpperCase()}
            </span>
            <span className="text-[#004162] text-xs font-bold">
              {language === "en" ? "አማርኛ" : "English"}
            </span>
          </button>

          {user ? (
            <Link to={homePathForRole(user.role)}>
              <button
                className="primary-gradient-btn px-6 py-2.5 rounded-full font-bold text-sm text-white shadow-md"
                type="button"
              >
                {language === "am" ? "ዳሽቦርድ" : "Dashboard"}
              </button>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link className="text-[#004162] font-bold hover:underline transition-colors text-sm px-2" to="/login">
                {language === "am" ? "ግቡ" : "Log in"}
              </Link>
              <Link to="/signup">
                <button
                  className="primary-gradient-btn px-6 py-2.5 rounded-full font-bold text-sm text-white shadow-md hover:opacity-95 transition-all cursor-pointer"
                  type="button"
                >
                  {language === "am" ? "ተመዝገቡ" : "Sign up"}
                </button>
              </Link>
            </div>
          )}

          <button
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#004162] lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen ? (
        <nav className="fixed top-20 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-b border-white/60 p-6 flex flex-col gap-4 shadow-xl lg:hidden">
          <button
            className="text-[#004162] font-bold py-2 text-left"
            onClick={() => {
              setMenuOpen(false);
              scrollTo("how");
            }}
            type="button"
          >
            {language === "am" ? "እንዴት እንደሚሰራ" : "How it works"}
          </button>
          <button
            className="text-[#004162] font-bold py-2 text-left"
            onClick={() => {
              setMenuOpen(false);
              scrollTo("features");
            }}
            type="button"
          >
            {language === "am" ? "ባህሪያት" : "Features"}
          </button>
          <button
            className="text-[#004162] font-bold py-2 text-left"
            onClick={() => {
              setMenuOpen(false);
              scrollTo("verification");
            }}
            type="button"
          >
            {language === "am" ? "ማረጋገጫ" : "Verification"}
          </button>
          <button
            className="text-[#004162] font-bold py-2 text-left"
            onClick={() => {
              setMenuOpen(false);
              scrollTo("pricing");
            }}
            type="button"
          >
            {language === "am" ? "የዋጋ ዝርዝር" : "Pricing"}
          </button>
          <div className="flex items-center gap-2 py-2">
            <button
              className="flex items-center gap-2 bg-white/70 rounded-full px-3 py-1.5 text-sm border border-white/60 text-[#004162]"
              onClick={toggleLanguage}
              type="button"
            >
              <span className="w-5 h-5 rounded-full bg-[#cbe6ff] text-[#004162] flex items-center justify-center text-[10px] font-bold">
                {language.toUpperCase()}
              </span>
              <span className="text-[#004162] text-xs font-bold">
                {language === "en" ? "አማርኛ" : "English"}
              </span>
            </button>
          </div>
          {user ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
              <Link to={homePathForRole(user.role)}>
                <button
                  className="primary-gradient-btn w-full py-3 rounded-full font-bold text-sm text-white"
                  type="button"
                >
                  {language === "am" ? "ዳሽቦርድ" : "Dashboard"}
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
              <Link className="text-center py-2 text-[#004162] font-bold" to="/login">
                {language === "am" ? "ግቡ" : "Log in"}
              </Link>
              <Link to="/signup">
                <button
                  className="primary-gradient-btn w-full py-3 rounded-full font-bold text-sm text-white"
                  type="button"
                >
                  {language === "am" ? "ተመዝገቡ" : "Sign up"}
                </button>
              </Link>
            </div>
          )}
        </nav>
      ) : null}

      <main className="w-full flex-grow">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

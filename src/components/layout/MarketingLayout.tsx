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

  /* Scroll to anchor when hash changes (works on same page and after navigation) */
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
    <div className="antialiased relative bg-[#e4eefb] text-primary min-h-screen flex flex-col">
      {/* Background Shader */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-gradient-to-br from-[#e8f1fe] via-[#dde8fa] to-[#cbe6ff]">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#b8d8f8] rounded-full mix-blend-multiply filter blur-[150px] opacity-50" />
        <div className="absolute top-[10%] right-[-5%] w-[50%] h-[50%] bg-[#a8d4ff] rounded-full mix-blend-multiply filter blur-[140px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-[#8fcdff] rounded-full mix-blend-multiply filter blur-[180px] opacity-50" />
      </div>

      {/* TopNavBar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 flex justify-between items-center max-w-full mx-auto w-full h-20 bg-white/40 backdrop-blur-2xl text-primary font-body-lg shadow-sm border-b border-white/40">
        <div className="flex items-center gap-2">
          <Link className="text-2xl font-headline-lg text-primary" to="/">
            <span className="text-2xl font-headline-lg text-primary">Ethosk</span>
          </Link>
        </div>

        <nav className="hidden lg:flex gap-8 text-sm font-semibold tracking-wide">
          <button
            className="text-primary/70 hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
            onClick={() => scrollTo("how")}
            type="button"
          >
            How it works
          </button>
          <button
            className="text-primary/70 hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
            onClick={() => scrollTo("product")}
            type="button"
          >
            Platform
          </button>
          <button
            className="text-primary/70 hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
            onClick={() => scrollTo("verification")}
            type="button"
          >
            Verification
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {/* Language Toggle — no dark mode icon */}
          <button
            aria-label={language === "en" ? "Switch to Amharic" : "Switch to English"}
            className="hidden md:flex items-center gap-2 bg-white/60 backdrop-blur-xl rounded-full px-3 py-1.5 text-sm border border-white/40 cursor-pointer hover:bg-white/80 transition-colors"
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

          {user ? (
            <Link to={homePathForRole(user.role)}>
              <button
                className="primary-gradient-btn px-6 py-2.5 rounded-full font-bold text-sm shadow-md transform hover:-translate-y-0.5 transition-all"
                type="button"
              >
                Dashboard
              </button>
            </Link>
          ) : (
            <>
              <Link className="text-primary/70 font-bold hover:text-primary transition-colors text-sm ml-2" to="/login">
                Log in
              </Link>
              <Link to="/signup">
                <button
                  className="primary-gradient-btn px-6 py-2.5 rounded-full font-bold text-sm shadow-md transform hover:-translate-y-0.5 transition-all"
                  type="button"
                >
                  Sign up
                </button>
              </Link>
            </>
          )}

          <button
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            className="flex h-9 w-9 items-center justify-center rounded-full text-primary lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </header>

      {menuOpen ? (
        <nav className="fixed top-20 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-b border-white/60 p-6 flex flex-col gap-4 shadow-xl lg:hidden">
          <button
            className="text-primary font-semibold py-2 text-left"
            onClick={() => {
              setMenuOpen(false);
              scrollTo("how");
            }}
            type="button"
          >
            How it works
          </button>
          <button
            className="text-primary font-semibold py-2 text-left"
            onClick={() => {
              setMenuOpen(false);
              scrollTo("product");
            }}
            type="button"
          >
            Platform
          </button>
          <button
            className="text-primary font-semibold py-2 text-left"
            onClick={() => {
              setMenuOpen(false);
              scrollTo("verification");
            }}
            type="button"
          >
            Verification
          </button>
          <div className="flex items-center gap-2 py-2">
            <button
              className="flex items-center gap-2 bg-white/60 backdrop-blur-xl rounded-full px-3 py-1.5 text-sm border border-white/40"
              onClick={toggleLanguage}
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
          {!user && (
            <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
              <Link className="text-center py-2 text-primary font-bold" to="/login">
                Log in
              </Link>
              <Link to="/signup">
                <button
                  className="primary-gradient-btn w-full py-3 rounded-full font-bold text-sm text-white"
                  type="button"
                >
                  Sign up
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

import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { Icon } from "../ui";
import { LanguageToggle } from "../ui/LanguageToggle";
import { RespondentAvatar } from "./RespondentAvatar";

export function RespondentLayout() {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const isAm = language === "am";
  const [searchQuery, setSearchQuery] = useState("");

  // In Stitch, only Inbox (/inbox) and History (/history) have the top search bar header on desktop
  const showTopSearchBar = location.pathname === "/inbox" || location.pathname === "/history";

  const SIDEBAR_NAV = [
    { label: isAm ? "የገቡ ጥናቶች" : "Inbox", to: "/inbox", icon: "mail", end: true },
    { label: isAm ? "የጥናት ታሪክ" : "Survey History", to: "/history", icon: "history", end: false },
    { label: isAm ? "ቦርሳ / ገቢ" : "Wallet", to: "/wallet", icon: "account_balance_wallet", end: false },
  ];

  const SIDEBAR_BOTTOM = [
    { label: isAm ? "ማረጋገጫ" : "Verification", to: "/verify", icon: "verified_user", end: false },
    { label: isAm ? "ቅንብሮች" : "Settings", to: "/profile", icon: "settings", end: false },
  ];

  const MOBILE_TABS = [
    { label: isAm ? "የገቡ ጥናቶች" : "Inbox", to: "/inbox", icon: "mail", end: true },
    { label: isAm ? "ቦርሳ" : "Wallet", to: "/wallet", icon: "account_balance_wallet", end: false },
    { label: isAm ? "ማረጋገጫ" : "Verified", to: "/verify", icon: "verified_user", end: false },
  ];

  const initials = (user?.full_name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#f7fafd] pb-16 text-[#181c1e] md:pb-0 font-['Inter',sans-serif]">

      {/* ══════════════════════════════════════════════════
          Mobile Top Header (below md)
         ══════════════════════════════════════════════════ */}
      <header className="md:hidden flex justify-between items-center px-4 w-full sticky top-0 z-50 bg-white h-16 border-b border-[#c1c7d0]">
        <div className="font-['Newsreader',serif] text-xl font-bold text-[#00456d]">Ethosk</div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <span className="material-symbols-outlined text-[#41474f]">notifications</span>
          <RespondentAvatar compact />
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          Desktop Sidebar (md and above) — Stitch design
         ══════════════════════════════════════════════════ */}
      <nav className="hidden md:flex flex-col h-screen w-56 fixed left-0 top-0 bg-[#f1f4f7] border-r border-[#c1c7d0] pt-10 z-40">
        {/* Logo + User Card */}
        <div className="px-4 mb-6">
          <div className="font-['Newsreader',serif] text-2xl font-bold text-[#00456d] mb-5 tracking-tight">
            Ethosk
          </div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-full bg-[#1d5d8a] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#c1c7d0]">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-[#181c1e] truncate w-28" title="Trust Center">
                Trust Center
              </h2>
              <p className="text-[10px] text-[#41474f]">Verified Status</p>
            </div>
          </div>
        </div>

        {/* Main Nav Items */}
        <ul className="flex flex-col gap-0.5 flex-grow px-0">
          {SIDEBAR_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-2 py-2.5 cursor-pointer transition-colors group",
                    isActive
                      ? "text-[#00456d] font-bold border-l-4 border-[#00456d] pl-3.5 bg-[#e5e8eb]"
                      : "text-[#41474f] pl-4 hover:bg-[#e5e8eb] hover:text-[#00456d]",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className="text-[19px] transition-colors"
                      filled={isActive}
                      name={item.icon}
                    />
                    <span className="text-xs font-semibold tracking-wide">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Bottom Section: Settings + Logout */}
        <div className="mt-auto border-t border-[#c1c7d0] pt-3 pb-5 px-0">
          <ul className="flex flex-col gap-0.5">
            {SIDEBAR_BOTTOM.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-2 py-2.5 cursor-pointer transition-colors group",
                      isActive
                        ? "text-[#00456d] font-bold border-l-4 border-[#00456d] pl-3.5 bg-[#e5e8eb]"
                        : "text-[#41474f] pl-4 hover:bg-[#e5e8eb] hover:text-[#00456d]",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className="text-[19px] transition-colors"
                        filled={isActive}
                        name={item.icon}
                      />
                      <span className="text-xs font-semibold tracking-wide">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                className="flex items-center gap-2 py-2.5 pl-4 cursor-pointer transition-colors text-[#41474f] hover:bg-[#e5e8eb] hover:text-[#ba1a1a] w-full text-left"
                onClick={logout}
                type="button"
              >
                <Icon className="text-[19px]" name="logout" />
                <span className="text-xs font-semibold tracking-wide">
                  {isAm ? "ውጣ" : "Logout"}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════
          Desktop Top Bar (Only shown on Inbox & History)
         ══════════════════════════════════════════════════ */}
      {showTopSearchBar && (
        <div className="hidden md:flex justify-between items-center px-10 w-full sticky top-0 z-30 bg-white h-16 border-b border-[#c1c7d0] md:pl-[calc(14rem+2.5rem)]">
          {/* Search Bar */}
          <div className="flex-grow max-w-xl mx-4">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#717880]">
                search
              </span>
              <input
                className="w-full bg-[#f7fafd] text-sm text-[#41474f] placeholder:text-[#717880] border border-[#c1c7d0] rounded-md pl-10 pr-4 py-2 focus:outline-none focus:border-[#1d5d8a] focus:ring-2 focus:ring-[#1d5d8a]/10 transition-shadow"
                placeholder={isAm ? "ጥናት ፈልግ..." : "Search research..."}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right: Notifications + Language + User Info */}
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <button className="text-[#41474f] hover:text-[#00456d] transition-colors cursor-pointer relative" type="button">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#ba1a1a] rounded-full" />
            </button>

            <div className="border-l border-[#c1c7d0] pl-4">
              <RespondentAvatar />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          Main Content Area
         ══════════════════════════════════════════════════ */}
      <div className="pt-0 md:pl-56">
        <main className="p-4 md:p-10 max-w-[1440px] mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ══════════════════════════════════════════════════
          Mobile Bottom Navigation (below md)
         ══════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-[#c1c7d0] h-16 flex justify-around items-center z-50">
        {MOBILE_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center w-full h-full transition-colors",
                isActive
                  ? "text-[#00456d] font-bold"
                  : "text-[#41474f]",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="text-[22px]" filled={isActive} name={tab.icon} />
                <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

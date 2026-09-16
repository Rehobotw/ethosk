import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { Icon } from "../ui";
import { LanguageToggle } from "../ui/LanguageToggle";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const isAm = language === "am";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const adminNavItems = [
    { label: isAm ? "አጠቃላይ እይታ" : "Overview", to: "/admin", icon: "dashboard", end: true },
    {
      label: isAm ? "የተጠቃሚዎች አስተዳደር" : "User Management",
      to: "/admin/users",
      icon: "group",
      end: false,
      superAdminOnly: true,
    },
    {
      label: isAm ? "የማረጋገጫ ወረፋ" : "Verification Queue",
      to: "/admin/review-queue",
      icon: "fact_check",
      end: false,
    },
    {
      label: isAm ? "የጥናት ማጽደቆች" : "Survey Approvals",
      to: "/admin/survey-approvals",
      icon: "task_alt",
      end: false,
    },
    {
      label: isAm ? "የተመራማሪ ማጽደቆች" : "Researcher Approvals",
      to: "/admin/researcher-approvals",
      icon: "how_to_reg",
      end: false,
    },
    {
      label: isAm ? "የማስታረቅ ወረፋ" : "Reconciliation Queue",
      to: "/admin/reconciliation",
      icon: "sync_alt",
      end: false,
    },
    {
      label: isAm ? "የመረጃ ጥያቄዎች" : "Data Requests",
      to: "/admin/data-requests",
      icon: "privacy_tip",
      end: false,
    },
    {
      label: isAm ? "የፋይናንስ ሁኔታ" : "Financials",
      to: "/admin/revenue",
      icon: "payments",
      end: false,
      superAdminOnly: true,
    },
    {
      label: isAm ? "ቅንብሮች" : "Settings",
      to: "/admin/settings",
      icon: "settings",
      end: false,
      superAdminOnly: true,
    },
  ];

  const visibleNavItems = adminNavItems.filter(
    (item) => !item.superAdminOnly || user?.role === "super_admin",
  );

  const initials = (user?.full_name || "Admin")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7fafd] text-[#181c1e] font-['Inter',sans-serif] antialiased">
      {/* ══════════════════════════════════════════════════
          Desktop Sidebar (Exact Stitch Screen 4406e41c481449329fcd8e4e79ffddcc)
         ══════════════════════════════════════════════════ */}
      <aside
        className={clsx(
          "fixed md:sticky top-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-[#c1c7d0] bg-white transition-transform shrink-0 overflow-y-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="px-6 py-6 flex flex-col items-start border-b border-[#c1c7d0]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded bg-[#1d5d8a] text-white flex items-center justify-center font-['Newsreader',serif] font-bold text-lg">
              E
            </div>
            <div>
              <h1 className="font-['Newsreader',serif] text-xl font-bold text-[#00456d] leading-none">
                {user?.role === "super_admin" ? "Ethosk" : isAm ? "ኢቶስክ አድሚን" : "Research Suite"}
              </h1>
              <p className="text-[10px] font-semibold text-[#4b6078] uppercase tracking-wider mt-1">
                {isAm ? "የአስተዳዳሪ ፖርታል" : "Admin Portal"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 flex flex-col gap-1 px-3">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer transition-all text-xs font-semibold rounded-lg",
                  isActive
                    ? "text-[#00456d] font-bold border-r-4 border-[#00456d] bg-[#cde5ff] rounded-r-none"
                    : "text-[#4b6078] hover:bg-[#ebeef1] hover:text-[#00456d]",
                )
              }
              onClick={() => setSidebarOpen(false)}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="text-[20px] transition-colors"
                    filled={isActive}
                    name={item.icon}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-4 border-t border-[#c1c7d0] flex flex-col gap-2 mt-auto">
          <Link
            to="/admin/revenue"
            className="w-full bg-[#00456d] text-white py-2.5 px-4 rounded-lg text-xs font-semibold hover:bg-[#1d5d8a] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>{isAm ? "አዲስ ሪፖርት" : "New Report"}</span>
          </Link>

          <div className="mt-2 flex flex-col gap-0.5">
            <Link
              to="/#how"
              className="text-[#4b6078] hover:bg-[#ebeef1] transition-all flex items-center gap-3 px-4 py-2 cursor-pointer rounded-lg text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">contact_support</span>
              <span>{isAm ? "የእርዳታ ማዕከል" : "Help Center"}</span>
            </Link>

            <button
              onClick={logout}
              className="text-[#4b6078] hover:bg-red-50 hover:text-red-700 transition-all flex items-center gap-3 px-4 py-2 cursor-pointer rounded-lg text-xs w-full text-left"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>{isAm ? "ውጣ" : "Log Out"}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════
          Main Layout Area (Top Header + Content Canvas)
         ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* TopNavBar */}
        <header className="w-full h-14 border-b border-[#c1c7d0] bg-white flex justify-between items-center px-6 md:px-10 shrink-0 z-10">
          {/* Left: Mobile hamburger + Search */}
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-1 text-[#4b6078] hover:text-[#00456d]"
              onClick={() => setSidebarOpen((prev) => !prev)}
              type="button"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <h2 className="font-['Newsreader',serif] text-xl font-bold text-[#00456d] md:hidden">
              Ethosk
            </h2>

            <div className="hidden md:flex relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#717880] text-[18px]">
                search
              </span>
              <input
                className="pl-10 pr-4 py-1.5 bg-[#f1f4f7] border border-[#c1c7d0] rounded-md text-xs text-[#181c1e] placeholder:text-[#717880] focus:outline-none focus:border-[#00456d] focus:ring-2 focus:ring-[#00456d]/10 w-64 transition-all"
                placeholder={isAm ? "ምርምር ፈልግ..." : "Search research..."}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              to="/admin/notifications"
              className="text-[#4b6078] hover:bg-[#f1f4f7] p-2 rounded-full transition-colors cursor-pointer relative flex items-center justify-center"
              aria-label="Admin Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full" />
            </Link>

            <Link
              to="/#how"
              className="text-[#4b6078] hover:bg-[#f1f4f7] p-2 rounded-full transition-colors cursor-pointer hidden sm:flex"
            >
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
            </Link>

            <div className="h-6 w-px bg-[#c1c7d0] mx-1" />

            <div className="relative">
              <button
                className="flex items-center gap-2 hover:bg-[#f1f4f7] py-1 px-2 rounded-md transition-colors cursor-pointer"
                onClick={() => setProfileOpen((prev) => !prev)}
                type="button"
              >
                <div className="w-8 h-8 rounded-full bg-[#1d5d8a] text-white flex items-center justify-center font-bold text-xs border border-[#c1c7d0]">
                  {initials}
                </div>
                <span className="text-xs font-semibold text-[#181c1e] hidden md:block">
                  {user?.full_name || "Admin Profile"}
                </span>
                <span className="material-symbols-outlined text-[#717880] text-[18px]">
                  expand_more
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#c1c7d0] rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-[#c1c7d0]/40">
                    <p className="text-xs font-bold text-[#181c1e]">{user?.full_name || "Admin"}</p>
                    <p className="text-[10px] text-[#4b6078]">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-[#cbe2fe]/40 text-[#00456d] text-[10px] font-bold uppercase">
                      {user?.role?.replace("_", " ")}
                    </span>
                  </div>
                  {user?.role === "super_admin" && (
                    <Link
                      to="/admin/settings"
                      className="w-full px-4 py-2 text-left text-xs text-[#4b6078] hover:bg-[#f1f4f7] flex items-center gap-2"
                      onClick={() => setProfileOpen(false)}
                    >
                      <span className="material-symbols-outlined text-[16px]">settings</span>
                      <span>Profile Settings</span>
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-[#f7fafd]">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

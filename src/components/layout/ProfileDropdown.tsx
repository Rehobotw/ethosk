import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon, TierBadge } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";

export function ProfileDropdown() {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const isAm = language === "am";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 250);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  if (!user) return null;

  const initials = (user.full_name || user.email || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const profilePath = user.role === "researcher" ? "/researcher/profile" : "/profile";

  const isVerified = user.verification_tier && user.verification_tier !== "0_registered";
  const isSubscribed = user.subscription_tier === "subscribed" || user.role === "admin";

  const getStatusLabel = () => {
    if (user.role === "researcher") {
      const verText = isVerified
        ? (isAm ? "መታወቂያ የተረጋገጠ" : "ID Verified")
        : (isAm ? "ያልተረጋገጠ" : "Unverified");
      const planText = isSubscribed
        ? (isAm ? "ፕሮ እቅድ" : "Pro Tier")
        : (isAm ? "ነፃ እቅድ" : "Free Tier");
      return `${verText} · ${planText}`;
    }

    switch (user.verification_tier) {
      case "1_id_verified":
        return isAm ? "ደረጃ 1 ተረጋግጧል" : "Tier 1 Verified";
      case "2_attribute_verified":
        return isAm ? "ደረጃ 2 ተረጋግጧል" : "Tier 2 Verified";
      case "3_institution_attested":
        return isAm ? "ደረጃ 3 በተቋም ተረጋግጧል" : "Tier 3 Attested";
      default:
        return isAm ? "ያልተረጋገጠ (ደረጃ 0)" : "Unverified (Tier 0)";
    }
  };

  const handleClickAvatar = (e: React.MouseEvent) => {
    // Direct click on the avatar navigates to the Profile Hub
    e.preventDefault();
    setOpen(false);
    navigate(profilePath);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={dropdownRef}
    >
      {/* Persistent Avatar button: On click navigates to Profile; on hover opens status card */}
      <button
        aria-expanded={open}
        aria-label="User profile and account status"
        className="group flex items-center gap-1.5 rounded-full p-1 transition-all hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        onClick={handleClickAvatar}
        type="button"
      >
        <div className="relative">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-primary font-status-badge text-status-badge font-bold text-on-primary shadow-sm ring-2 transition-all ${
              isVerified
                ? "ring-emerald-500/70 group-hover:ring-emerald-500"
                : "ring-amber-500/50 group-hover:ring-amber-500"
            }`}
          >
            {initials}
          </span>
          {isVerified ? (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white ring-1 ring-surface">
              <Icon className="text-[10px]" filled name="check" />
            </span>
          ) : (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-white ring-1 ring-surface">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          )}
        </div>

        <Icon
          className={`hidden sm:inline-block text-[18px] text-on-surface-variant transition-transform duration-200 ${
            open ? "rotate-180 text-primary" : ""
          }`}
          name="arrow_drop_down"
        />
      </button>

      {/* Hover Status Card / Dropdown Menu */}
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2.5 w-[280px] origin-top-right rounded-xl bg-white border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.12)] animate-fade-in overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-4 bg-gradient-to-b from-[#00456d]/[0.03] to-transparent">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-['Newsreader',serif] text-[15px] font-semibold text-[#0D253A] truncate leading-tight">
                  {user.full_name || (user.role === "researcher" ? "Researcher" : "Respondent")}
                </p>
                <p className="text-[12px] text-slate-500 truncate mt-0.5">
                  {user.email}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-[#00456d]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00456d]">
                {user.role}
              </span>
            </div>

            {/* Status row */}
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/80 border border-slate-100 px-3 py-2">
              <Icon
                className={`text-[15px] ${isVerified ? "text-emerald-600" : "text-amber-500"}`}
                filled={Boolean(isVerified)}
                name={isVerified ? "verified_user" : "pending"}
              />
              <span className="text-[11px] font-semibold text-slate-700 truncate">
                {getStatusLabel()}
              </span>
              {user.verification_tier && (
                <span className="ml-auto"><TierBadge tier={user.verification_tier} /></span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100 mx-4" />

          {/* Action Links */}
          <div className="py-2 px-2">
            {user.role === "researcher" ? (
              <>
                <Link
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00456d] transition-colors"
                  onClick={() => setOpen(false)}
                  to="/researcher/profile?tab=profile"
                >
                  <Icon className="text-[18px] text-slate-400" name="person" />
                  <span>{isAm ? "የተመራማሪ ፕሮፋይል" : "Researcher Profile"}</span>
                </Link>

                <Link
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00456d] transition-colors"
                  onClick={() => setOpen(false)}
                  to="/researcher/profile?tab=verification"
                >
                  <Icon className="text-[18px] text-slate-400" name="verified" />
                  <span>{isAm ? "የማረጋገጫ ሁኔታ" : "Verification Status"}</span>
                </Link>

                <Link
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00456d] transition-colors"
                  onClick={() => setOpen(false)}
                  to="/researcher/profile?tab=subscription"
                >
                  <Icon className="text-[18px] text-slate-400" name="star" />
                  <span>{isAm ? "የደንበኝነት ምዝገባ እና እቅዶች" : "Subscription & Plans"}</span>
                </Link>

                <Link
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00456d] transition-colors"
                  onClick={() => setOpen(false)}
                  to="/researcher"
                >
                  <Icon className="text-[18px] text-slate-400" name="dashboard" />
                  <span>{isAm ? "የተመራማሪ ዳሽቦርድ" : "Dashboard"}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00456d] transition-colors"
                  onClick={() => setOpen(false)}
                  to="/profile"
                >
                  <Icon className="text-[18px] text-slate-400" name="account_circle" />
                  <span>{isAm ? "የፕሮፋይል ቅንብሮች" : "Profile Settings"}</span>
                </Link>

                <Link
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00456d] transition-colors"
                  onClick={() => setOpen(false)}
                  to="/verify"
                >
                  <Icon className="text-[18px] text-slate-400" name="verified" />
                  <span>{isAm ? "የማረጋገጫ ማዕከል" : "Verification Hub"}</span>
                </Link>

                <Link
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-[#00456d] transition-colors"
                  onClick={() => setOpen(false)}
                  to="/inbox"
                >
                  <Icon className="text-[18px] text-slate-400" name="inbox" />
                  <span>{isAm ? "የተሳታፊ የጥናት ሳጥን" : "Respondent Inbox"}</span>
                </Link>
              </>
            )}
          </div>

          {/* Divider + Logout */}
          <div className="h-px bg-slate-100 mx-4" />
          <div className="py-2 px-2">
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              type="button"
            >
              <Icon className="text-[18px]" name="logout" />
              <span>{isAm ? "ውጣ" : "Log Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

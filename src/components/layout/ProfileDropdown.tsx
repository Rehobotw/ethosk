import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon, TierBadge } from "@/components/ui";
import { homePathForRole, useAuth } from "@/lib/auth";

export function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const profilePath = user.role === "researcher" ? "/researcher/settings" : "/profile";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        aria-expanded={open}
        aria-label="User profile menu"
        className="flex items-center gap-1.5 rounded-full p-1 transition-all hover:bg-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/30"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-status-badge text-status-badge text-on-primary shadow-sm">
          {initials}
        </span>
        <Icon
          className={`text-[18px] text-on-surface-variant transition-transform ${
            open ? "rotate-180" : ""
          }`}
          name="arrow_drop_down"
        />
      </button>

      {open && (
        <>
          {/* Backdrop overlay for visual separation */}
          <div
            className="fixed inset-0 z-40 bg-black/5 md:bg-transparent"
            onClick={() => setOpen(false)}
          />

          <div
            className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-sm"
            style={{
              boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
              animation: "dropdown-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
          >
            <div className="border-b border-outline-variant/60 pb-3 mb-2 px-2">
              <p className="font-title-sm text-body-md font-bold text-on-surface truncate">
                {user.full_name || "User"}
              </p>
              <p className="font-body-sm text-[12px] text-on-surface-variant truncate">
                {user.email} · <span className="capitalize font-semibold text-primary">{user.role}</span>
              </p>
              {user.verification_tier ? (
                <div className="mt-2">
                  <TierBadge tier={user.verification_tier} />
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <Link
                className="flex items-center gap-stack-sm rounded-xl px-3 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-high transition-colors"
                onClick={() => setOpen(false)}
                to={profilePath}
              >
                <Icon className="text-[18px] text-primary" name="account_circle" />
                My Profile & Settings
              </Link>

              <Link
                className="flex items-center gap-stack-sm rounded-xl px-3 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-high transition-colors"
                onClick={() => setOpen(false)}
                to={homePathForRole(user.role)}
              >
                <Icon className="text-[18px] text-primary" name="dashboard" />
                My Portal
              </Link>

              <button
                className="flex w-full items-center gap-stack-sm rounded-xl px-3 py-2 font-body-sm text-body-sm font-semibold text-error hover:bg-error/10 transition-colors"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                type="button"
              >
                <Icon className="text-[18px]" name="logout" />
                Log Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";

interface ResearcherAvatarProps {
  fullName?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  subscriptionTier?: "free" | "subscribed" | "pro";
  customNavigateTo?: string;
}

/**
 * Spec ref: §4.1 Researcher Avatar component spec (v3)
 *
 * Anatomy:
 * - Avatar: 36×36 px circular image / initials
 * - Text block (two lines):
 *     Top line: Full name — bold
 *     Bottom line: Subscription tier label — "Free Plan" or "Pro Tier"
 * - Corner badge: bottom-right of the avatar circle, blue background, white checkmark icon.
 *     Visible only when identity (National ID) is verified.
 *     Absent (clean avatar edge) when unverified.
 *
 * Interaction:
 * - Click: entire container navigates to /profile/settings
 * - Hover: subtle background tint only — no dropdown, no popover, no content change
 *
 * Variants:
 * - R1: Unverified + Free Plan -> Corner Badge: Hidden, Bottom Line: "Free Plan"
 * - R2: Unverified + Pro Tier  -> Corner Badge: Hidden, Bottom Line: "Pro Tier"
 * - R3: Verified   + Free Plan -> Corner Badge: Visible (blue, checkmark), Bottom Line: "Free Plan"
 * - R4: Verified   + Pro Tier  -> Corner Badge: Visible (blue, checkmark), Bottom Line: "Pro Tier"
 */
export function ResearcherAvatar({
  fullName,
  avatarUrl,
  isVerified: propIsVerified,
  subscriptionTier: propSubscriptionTier,
  customNavigateTo = "/profile/settings",
}: ResearcherAvatarProps = {}) {
  let user: any = null;
  try {
    const auth = useAuth();
    user = auth?.user ?? null;
  } catch {}

  let language = "en";
  try {
    const lang = useLanguage();
    language = lang?.language ?? "en";
  } catch {}

  const isAm = language === "am";

  const name = fullName || user?.full_name || user?.email || "Researcher";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? "")
    .join("");

  const isVerified =
    propIsVerified !== undefined
      ? propIsVerified
      : Boolean(
          user?.researcher_verification_level === "id_verified" ||
          (user?.verification_tier && user.verification_tier !== "0_registered")
        );

  const isSubscribed =
    propSubscriptionTier !== undefined
      ? propSubscriptionTier === "subscribed" || propSubscriptionTier === "pro"
      : Boolean(user?.subscription_tier === "subscribed" || user?.role === "admin");

  const tierLabel = isSubscribed
    ? (isAm ? "ፕሮ እቅድ" : "Pro Tier")
    : (isAm ? "ነፃ እቅድ" : "Free Plan");

  return (
    <Link
      to={customNavigateTo}
      className="group flex items-center gap-3 px-2.5 py-1.5 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer text-left select-none"
      title={`${name} · ${tierLabel}`}
      data-testid="researcher-avatar-container"
    >
      {/* 2-line Text block (Top line: Full name bold, Bottom line: Tier label) */}
      <div className="flex flex-col items-end text-right">
        <span className="text-sm font-bold text-[#0D253A] leading-tight tracking-tight">
          {name}
        </span>
        <span className="text-[11px] font-medium text-[#5A6E7F] leading-tight">
          {tierLabel}
        </span>
      </div>

      {/* Avatar Container: 36×36 px circular image with bottom-right corner badge */}
      <div className="relative w-9 h-9 shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#00456d] text-white font-bold text-xs flex items-center justify-center border border-white/80 shadow-2xs">
            {initials || "R"}
          </div>
        )}

        {/* Corner Badge: bottom-right of avatar circle, blue background, white checkmark icon */}
        {isVerified && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#0066cc] border-[1.5px] border-white flex items-center justify-center shadow-xs"
            title={isAm ? "መታወቂያ የተረጋገጠ" : "Verified Identity"}
            data-testid="verified-corner-badge"
          >
            <svg
              className="w-2 h-2 text-white stroke-current stroke-[2.5]"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2.5 6L5 8.5L9.5 3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </Link>
  );
}

import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { TIER_RANK } from "@shared/types";

interface RespondentAvatarProps {
  fullName?: string;
  avatarUrl?: string;
  verificationTier?: string;
  /** Compact mode for mobile header — hides the text block */
  compact?: boolean;
  customNavigateTo?: string;
}

/**
 * Spec ref: §3.1 Respondent Avatar component (v3)
 *
 * Anatomy:
 * - Avatar: 36×36 px circular image / initials
 * - Text block (two lines):
 *     Top line: Full name — bold
 *     Bottom line: Verification tier label
 * - Inline badge (next to text, NOT corner badge — different from researcher):
 *     Yellow "Tier 1" when `verification_tier === "1_id_verified"`
 *     Blue "Tier 2" when `verification_tier >= "2_attribute_verified"`
 *     No badge when `verification_tier === "0_registered"`
 *
 * Interaction:
 * - Click: navigates to /respondent/profile
 * - Hover: subtle background tint only — no dropdown, no popover
 */
export function RespondentAvatar({
  fullName,
  avatarUrl,
  verificationTier: propTier,
  compact = false,
  customNavigateTo = "/profile",
}: RespondentAvatarProps = {}) {
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
  const name = fullName || user?.full_name || user?.email || "Respondent";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? "")
    .join("");

  const tier = propTier || user?.verification_tier || "0_registered";
  const tierRank = TIER_RANK[tier as keyof typeof TIER_RANK] ?? 0;

  // Badge config based on tier
  let badge: { label: string; color: string; bg: string } | null = null;
  if (tierRank >= 2) {
    badge = {
      label: isAm ? "ደረጃ 2" : "Tier 2",
      color: "#1565c0",
      bg: "#e3f2fd",
    };
  } else if (tierRank >= 1) {
    badge = {
      label: isAm ? "ደረጃ 1" : "Tier 1",
      color: "#f57f17",
      bg: "#fff8e1",
    };
  }

  const tierLabel = tierRank >= 2
    ? (isAm ? "ባህሪ የተረጋገጠ" : "Attribute Verified")
    : tierRank >= 1
      ? (isAm ? "መታወቂያ የተረጋገጠ" : "ID Verified")
      : (isAm ? "መሰረታዊ" : "Registered");

  return (
    <Link
      to={customNavigateTo}
      className="group flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-[#e5e8eb] transition-colors cursor-pointer text-left select-none"
      title={`${name} · ${tierLabel}`}
      data-testid="respondent-avatar-container"
    >
      {/* Avatar: 36×36 px circular */}
      <div className="relative w-9 h-9 shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-9 h-9 rounded-full object-cover border border-[#c1c7d0]"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#1d5d8a] text-white font-bold text-xs flex items-center justify-center border border-[#c1c7d0]">
            {initials || "R"}
          </div>
        )}
      </div>

      {/* Text block + inline badge (hidden in compact mode) */}
      {!compact && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#181c1e] truncate max-w-[120px]">
              {name}
            </span>
            {/* Inline tier badge */}
            {badge && (
              <span
                className="shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none"
                style={{ backgroundColor: badge.bg, color: badge.color }}
                data-testid="tier-inline-badge"
              >
                {badge.label}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#41474f] leading-tight">
            {tierLabel}
          </span>
        </div>
      )}
    </Link>
  );
}

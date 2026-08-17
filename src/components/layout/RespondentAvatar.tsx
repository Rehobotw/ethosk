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
 * Spec ref: §3.1 Respondent Avatar Component (v3)
 *
 * Anatomy:
 * - Avatar: 36×36 px circular image — no corner badge at any tier
 * - Text block (right-aligned, two lines):
 *     Top line: Full name — bold
 *     Bottom line: Optional inline badge (yellow / blue checkmark) + tier label ("Tier 0" / "Tier 1" / "Tier 2")
 *
 * Badge color logic (inline, in subtitle line):
 * - P0 (Tier 0): No badge, Subtitle text: "Tier 0"
 * - P1 (Tier 1): Yellow badge with white checkmark inline before "Tier 1"
 * - P2 (Tier 2): Blue badge with white checkmark inline before "Tier 2"
 *
 * Interaction:
 * - Click: entire container navigates to /respondent/profile
 * - Hover: subtle background tint only — no dropdown, no popover, no content change
 */
export function RespondentAvatar({
  fullName,
  avatarUrl,
  verificationTier: propTier,
  compact = false,
  customNavigateTo = "/respondent/profile",
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

  // Tier badge color & label per §3.1
  let badgeColor: string | null = null;
  let tierLabel = isAm ? "ደረጃ 0" : "Tier 0";

  if (tierRank >= 2) {
    badgeColor = "bg-[#0066cc]"; // Blue for Tier 2
    tierLabel = isAm ? "ደረጃ 2" : "Tier 2";
  } else if (tierRank >= 1) {
    badgeColor = "bg-[#f59e0b]"; // Yellow for Tier 1
    tierLabel = isAm ? "ደረጃ 1" : "Tier 1";
  }

  return (
    <Link
      to={customNavigateTo}
      className="group flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer text-left select-none"
      title={`${name} · ${tierLabel}`}
      data-testid="respondent-avatar-container"
    >
      {/* Avatar: 36×36 px circular — clean edge, NO corner badge */}
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

      {/* Text block (two lines, hidden in compact mode) */}
      {!compact && (
        <div className="flex flex-col min-w-0">
          {/* Top line: Full name — bold */}
          <span className="text-xs font-bold text-[#181c1e] truncate max-w-[130px] leading-tight">
            {name}
          </span>

          {/* Bottom line: inline badge + tier label (never line-wrapped) */}
          <div className="flex items-center gap-1 text-[11px] text-[#5A6E7F] font-semibold whitespace-nowrap leading-tight mt-0.5">
            {badgeColor && (
              <span
                className={`inline-flex items-center justify-center w-3 h-3 rounded-full ${badgeColor} text-white shrink-0`}
                data-testid="tier-inline-badge"
              >
                <svg
                  className="w-2 h-2 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </span>
            )}
            <span>{tierLabel}</span>
          </div>
        </div>
      )}
    </Link>
  );
}

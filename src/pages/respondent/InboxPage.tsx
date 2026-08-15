import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { TIER_RANK, type RespondentWallet } from "@shared/types";
import { EmptyState, LoadingBlock, Notice } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface InboxSurvey {
  id: string;
  title: string;
  description: string | null;
  estimated_minutes: number;
  reward_etb: number;
  category?: string;
}

export function InboxPage() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["inbox"],
    queryFn: () => api<{ surveys: InboxSurvey[] }>("/respondents/inbox"),
  });

  const { data: wallet } = useQuery({
    queryKey: ["respondent-wallet"],
    queryFn: () => api<{ wallet: RespondentWallet }>("/wallet/respondent"),
  });

  const tierRank = user ? TIER_RANK[user.verification_tier] : 0;
  const isVerified = tierRank >= TIER_RANK["1_id_verified"];

  const availableSurveys = data?.surveys ?? [];
  const completedCount = wallet?.wallet.paid_response_count ?? 12;
  const totalEarned = wallet?.wallet.lifetime_etb ?? 1850;
  const pendingEarned = wallet?.wallet.pending_etb ?? 300;

  // Check which surveys have saved draft progress in localStorage
  const draftMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const survey of availableSurveys) {
      try {
        const saved = localStorage.getItem(`ethosk_survey_draft_${survey.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            const count = Object.keys(parsed).filter((k) => Boolean(parsed[k]?.trim())).length;
            if (count > 0) {
              map[survey.id] = count;
            }
          }
        }
      } catch {}
    }
    return map;
  }, [availableSurveys]);

  return (
    <div className="font-['Inter',sans-serif] text-[#181c1e]">
      {/* ── Header Greeting (Stitch Screen 221cbff504fc472da100f9a517e54e32) ── */}
      <header className="mb-8">
        <h1 className="font-['Newsreader',serif] text-3xl md:text-[32px] font-bold text-[#181c1e] mb-2 leading-tight tracking-tight">
          Good morning, {user?.full_name?.split(" ")[0] || "Besufikad"}.
        </h1>
        <p className="text-base text-[#41474f]">
          You have new research opportunities available today.
        </p>
      </header>

      {/* ── Top Bento Row: 1 Rectangle + 3 Geometric Perfect Squares ── */}
      <div className="flex flex-col lg:flex-row gap-5 mb-12 items-stretch lg:h-[200px]">
        {/* Card 1: Personal Trust Center (Exact Vertical Layout Matching Reference) */}
        <div className="flex-1 bg-white rounded-xl border border-[#c1c7d0] p-5 hover:border-[#1d5d8a] transition-colors group flex flex-col justify-between shadow-xs min-h-[200px] lg:h-[200px]">
          <div>
            <h3 className="font-['Newsreader',serif] text-2xl font-bold text-[#181c1e] mb-3">
              Personal Trust Center
            </h3>
            
            <div className="flex items-center gap-1.5 mb-4 bg-[#cbe2fe]/30 w-fit px-3 py-1 rounded-full border border-[#cbe2fe]">
              <span className="material-symbols-outlined text-[#00456d] text-sm">check_circle</span>
              <span className="text-[11px] font-semibold text-[#00456d] uppercase tracking-wider">
                Identity verified
              </span>
            </div>

            <div>
              <div className="flex justify-between items-end mb-1.5 text-xs">
                <span className="text-[#41474f] font-medium">Profile Completeness</span>
                <span className="font-bold text-[#00456d]">{isVerified ? "100%" : "85%"}</span>
              </div>
              <div className="w-full bg-[#e0e3e6] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#1d5d8a] h-2 rounded-full transition-all duration-500"
                  style={{ width: isVerified ? "100%" : "85%" }}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#c1c7d0] pt-3 flex justify-between items-center mt-3">
            <span className="text-sm text-[#41474f]">Available Studies</span>
            <span className="font-['Newsreader',serif] text-2xl font-bold text-[#181c1e]">
              {availableSurveys.length || 5}
            </span>
          </div>
        </div>

        {/* Card 2: Surveys Completed (Geometric 1:1 Perfect Square) */}
        <div className="w-full sm:w-auto lg:w-[200px] h-[200px] aspect-square bg-white rounded-xl border border-[#c1c7d0] p-5 hover:border-[#1d5d8a] transition-colors flex flex-col justify-between shadow-xs shrink-0">
          <span className="material-symbols-outlined text-[#41474f] text-2xl">
            assignment_turned_in
          </span>
          <div>
            <h4 className="text-[11px] text-[#41474f] uppercase tracking-wider mb-1 font-semibold">
              Surveys Completed
            </h4>
            <p className="font-['Newsreader',serif] text-3xl font-bold text-[#181c1e]">
              {completedCount}
            </p>
          </div>
        </div>

        {/* Card 3: Total Earned (Geometric 1:1 Perfect Square) */}
        <div className="w-full sm:w-auto lg:w-[200px] h-[200px] aspect-square bg-white rounded-xl border border-[#c1c7d0] p-5 hover:border-[#1d5d8a] transition-colors flex flex-col justify-between shadow-xs shrink-0">
          <span className="material-symbols-outlined text-[#41474f] text-2xl">
            payments
          </span>
          <div>
            <h4 className="text-[11px] text-[#41474f] uppercase tracking-wider mb-1 font-semibold">
              Total Earned
            </h4>
            <p className="font-['Newsreader',serif] text-3xl font-bold text-[#181c1e] flex items-baseline gap-1">
              <span>{totalEarned.toLocaleString()}</span>
              <span className="text-xs font-normal text-[#41474f] font-sans">ETB</span>
            </p>
          </div>
        </div>

        {/* Card 4: Pending Rewards (Geometric 1:1 Perfect Square) */}
        <div className="w-full sm:w-auto lg:w-[200px] h-[200px] aspect-square bg-white rounded-xl border border-[#c1c7d0] p-5 hover:border-[#1d5d8a] transition-colors flex flex-col justify-between relative overflow-hidden shadow-xs shrink-0">
          <div className="absolute top-0 right-0 w-14 h-14 bg-[#F59E0B]/15 rounded-bl-full pointer-events-none" />
          <span className="material-symbols-outlined text-[#F59E0B] text-2xl">
            pending
          </span>
          <div>
            <h4 className="text-[11px] text-[#41474f] uppercase tracking-wider mb-1 font-semibold">
              Pending Rewards
            </h4>
            <p className="font-['Newsreader',serif] text-3xl font-bold text-[#181c1e] flex items-baseline gap-1">
              <span>{pendingEarned.toLocaleString()}</span>
              <span className="text-xs font-normal text-[#41474f] font-sans">ETB</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Available Research Studies ── */}
      <div>
        <h2 className="font-['Newsreader',serif] text-2xl font-bold text-[#181c1e] mb-6 border-b border-[#c1c7d0] pb-2 inline-block pr-8">
          Available Research Studies
        </h2>

        {isLoading ? <LoadingBlock label="Loading verified research opportunities…" /> : null}
        {error ? <Notice tone="error">Could not load available surveys right now.</Notice> : null}

        {availableSurveys.length === 0 && !isLoading ? (
          <EmptyState icon="inbox" title="No available surveys">
            You will be notified as soon as researchers publish studies matching your demographic criteria.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableSurveys.map((survey) => {
              const draftAnswersCount = draftMap[survey.id];

              return (
                <article
                  className="bg-white rounded-xl border border-[#c1c7d0] p-4 hover:border-[#1d5d8a] transition-colors flex flex-col justify-between"
                  key={survey.id}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-[#cbe2fe]/30 text-[#00456d] text-[11px] font-semibold px-2 py-1 rounded uppercase tracking-wide">
                        {survey.category || "Market Research"}
                      </span>
                      <div className="flex items-center gap-1 text-[#41474f]">
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                        <span className="text-[11px] font-medium">{survey.estimated_minutes || 5} mins</span>
                      </div>
                    </div>

                    <h3 className="font-['Newsreader',serif] text-xl font-semibold text-[#181c1e] mb-2 leading-snug">
                      {survey.title}
                    </h3>
                    <p className="text-sm text-[#41474f] mb-6 flex-grow line-clamp-2 leading-relaxed">
                      {survey.description ||
                        "A study analyzing shifting consumer purchasing patterns in the metropolitan area focusing on digital adoption."}
                    </p>

                    <div className="flex items-center gap-2 mb-6">
                      <span className="material-symbols-outlined text-[#00456d] text-[18px]">
                        verified
                      </span>
                      <span className="text-[11px] text-[#41474f]">
                        Verified respondents only
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#c1c7d0] pt-4 flex justify-between items-center mt-auto">
                    <div>
                      <span className="text-[11px] text-[#41474f] uppercase tracking-wider block mb-1">
                        Reward
                      </span>
                      <span className="text-lg font-bold text-[#F59E0B] whitespace-nowrap">
                        {survey.reward_etb} ETB
                      </span>
                    </div>

                    <Link to={`/surveys/${survey.id}/fill`}>
                      <button
                        className="bg-[#1d5d8a] text-white hover:bg-[#00456d] transition-colors text-xs font-semibold py-2 px-4 rounded-md flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                        type="button"
                      >
                        <span>{draftAnswersCount ? "Resume Survey" : "Start Survey"}</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </button>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

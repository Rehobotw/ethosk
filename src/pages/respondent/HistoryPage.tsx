import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, LoadingBlock, Notice } from "@/components/ui";
import { api } from "@/lib/api";

interface HistoryItem {
  id: string;
  survey_id: string;
  title: string;
  description?: string | null;
  category?: string;
  reward_etb: number;
  completed_at: string;
  time_spent_seconds?: number;
  quality_status?: "passed" | "pending" | "flagged";
  payout_status?: "paid" | "pending" | "withheld";
}

type FilterTab = "all" | "completed" | "review" | "flagged";

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function HistoryPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["respondent-history"],
    queryFn: () => api<{ history: HistoryItem[] }>("/respondents/history"),
  });

  const items = data?.history ?? [];

  const counts = useMemo(() => {
    let completed = 0;
    let review = 0;
    let flagged = 0;
    for (const item of items) {
      if (item.quality_status === "flagged") flagged++;
      else if (item.quality_status === "pending") review++;
      else completed++;
    }
    return { all: items.length, completed, review, flagged };
  }, [items]);

  const filtered = useMemo(() => {
    if (activeTab === "completed") return items.filter((i) => i.quality_status !== "flagged" && i.quality_status !== "pending");
    if (activeTab === "review") return items.filter((i) => i.quality_status === "pending");
    if (activeTab === "flagged") return items.filter((i) => i.quality_status === "flagged");
    return items;
  }, [items, activeTab]);

  const totalEarned = items.filter((i) => i.payout_status === "paid" || (!i.quality_status || i.quality_status === "passed")).reduce((sum, i) => sum + i.reward_etb, 0);
  const pendingEtb = items.filter((i) => i.quality_status === "pending").reduce((sum, i) => sum + i.reward_etb, 0);
  const passRate = items.length > 0 ? ((counts.completed / items.length) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8 font-body-md text-on-surface">
      {/* ── Header (Stitch Screen 249d1056b68a41029a25f2154ab7e978) ── */}
      <div>
        <h1 className="text-3xl md:text-4xl font-headline-lg font-bold text-[#004162] mb-2 tracking-tight">
          Survey Participation History
        </h1>
        <p className="text-base text-on-surface-variant max-w-2xl">
          Review your submitted responses, quality check outcomes, and earned ETB balances.
        </p>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {([
            { key: "all" as FilterTab, label: `All Submissions (${counts.all})` },
            { key: "completed" as FilterTab, label: `Completed & Paid (${counts.completed})` },
            { key: "review" as FilterTab, label: `Under Review (${counts.review})` },
            { key: "flagged" as FilterTab, label: `Flagged (${counts.flagged})` },
          ]).map((tab) => (
            <button
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? "bg-[#2872A1] text-white shadow-sm"
                  : "bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-variant"
              }`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Metrics Bento Grid (4 Cards) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Surveys Taken */}
        <div className="bg-white rounded-xl border border-[#E1E8EE] p-5 hover:border-[#1d5d8a] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-outline text-xl">fact_check</span>
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Surveys Taken
            </h3>
          </div>
          <p className="text-4xl font-display-lg font-bold text-[#004162] mt-auto">{counts.all}</p>
        </div>

        {/* Metric 2: Total Rewards Earned */}
        <div className="bg-white rounded-xl border border-[#E1E8EE] p-5 hover:border-[#1d5d8a] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <span className="material-symbols-outlined text-teal-600 text-xl">account_balance_wallet</span>
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Total Rewards Earned
            </h3>
          </div>
          <div className="flex items-baseline gap-2 relative z-10 mt-auto">
            <p className="text-4xl font-display-lg font-bold text-[#004162]">{totalEarned.toLocaleString()}</p>
            <span className="text-base text-on-surface-variant font-medium">ETB</span>
            <span className="material-symbols-outlined text-teal-600 text-[18px] ml-1">check_circle</span>
          </div>
        </div>

        {/* Metric 3: Pending Verification */}
        <div className="bg-white rounded-xl border border-[#E1E8EE] p-5 hover:border-[#1d5d8a] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-amber-500 text-xl">pending</span>
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Pending Verification
            </h3>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <p className="text-4xl font-display-lg font-bold text-amber-500">{pendingEtb}</p>
            <span className="text-base text-amber-500/80 font-medium">ETB</span>
          </div>
        </div>

        {/* Metric 4: Quality Pass Rate */}
        <div className="bg-white rounded-xl border border-[#E1E8EE] border-t-4 border-t-teal-500 p-5 hover:border-[#1d5d8a] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-teal-600 text-xl">verified</span>
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Quality Pass Rate
            </h3>
          </div>
          <div className="mt-auto">
            <p className="text-4xl font-display-lg font-bold text-[#004162]">{passRate}%</p>
            <p className="text-xs font-semibold text-teal-700 mt-1">High Trust Respondent score</p>
          </div>
        </div>
      </div>

      {/* ── Survey Records List ── */}
      {isLoading ? <LoadingBlock label="Loading your participation records…" /> : null}
      {error ? <Notice tone="error">Could not load your survey history right now.</Notice> : null}

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon="history" title="No surveys match this filter">
          Complete available surveys from your inbox to build your research participation record.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const isPassed = !item.quality_status || item.quality_status === "passed";
            const isPending = item.quality_status === "pending";
            const isFlagged = item.quality_status === "flagged";

            return (
              <div
                className={`bg-white rounded-xl border border-[#E1E8EE] p-6 hover:border-[#1d5d8a] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center ${
                  isFlagged ? "bg-red-50/30" : ""
                }`}
                key={item.id}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-headline-md font-bold text-primary mb-1 truncate">
                    {item.title}
                  </h4>
                  <p className="text-sm text-outline mb-3 flex items-center flex-wrap gap-2">
                    <span className="bg-surface-container px-2 py-0.5 rounded text-xs font-medium text-on-surface-variant">
                      {item.category || "Market Research"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant" />
                    Completed on{" "}
                    {new Date(item.completed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    <span className="w-1 h-1 rounded-full bg-outline-variant" />
                    <span className={isFlagged ? "text-error font-medium" : ""}>
                      Time Spent: {formatDuration(item.time_spent_seconds)}
                    </span>
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {isPassed ? (
                      <>
                        <span className="bg-teal-500/10 text-teal-800 px-3 py-1 rounded-full text-xs font-semibold border border-teal-200 flex items-center gap-1">
                          ✓ Passed (Legibility &amp; velocity verified)
                        </span>
                        <span className="bg-teal-500/10 text-teal-800 px-3 py-1 rounded-full text-xs font-semibold border border-teal-200 flex items-center gap-1">
                          ✓ Paid to Wallet
                        </span>
                      </>
                    ) : isPending ? (
                      <>
                        <span className="bg-amber-500/10 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold border border-amber-200 flex items-center gap-1">
                          ⏳ In Review (Automated consistency check)
                        </span>
                        <span className="bg-amber-500/10 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold border border-amber-200 flex items-center gap-1">
                          Pending Escrow Release
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="bg-red-500/10 text-red-800 px-3 py-1 rounded-full text-xs font-semibold border border-red-200 flex items-center gap-1">
                          ⚠ Flagged (Rule: Completion speed below threshold)
                        </span>
                        <span className="bg-red-500/10 text-red-800 px-3 py-1 rounded-full text-xs font-semibold border border-red-200 flex items-center gap-1">
                          Failed
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-4 min-w-[200px] shrink-0">
                  <div className="text-left lg:text-right">
                    <p className="text-xs text-outline uppercase tracking-wider mb-0.5 font-semibold">Reward</p>
                    {isPassed ? (
                      <p className="text-xl font-headline-md font-bold text-amber-500">
                        +{item.reward_etb} ETB
                      </p>
                    ) : isPending ? (
                      <p className="text-xl font-headline-md font-medium text-outline">
                        +{item.reward_etb} ETB <span className="text-sm font-normal">(Pending)</span>
                      </p>
                    ) : (
                      <>
                        <p className="text-xl font-headline-md font-medium text-outline line-through decoration-red-500 opacity-50">
                          {item.reward_etb} ETB
                        </p>
                        <p className="text-xs text-error font-medium mt-0.5">0 ETB (Withheld)</p>
                      </>
                    )}
                  </div>

                  {isPassed ? (
                    <button
                      className="bg-[#EDF3FF] text-primary hover:bg-[#DCE7FF] px-4 py-2 rounded-lg text-xs font-semibold transition-colors border border-[#CDE5FF] w-full sm:w-auto cursor-pointer"
                      type="button"
                    >
                      View Submission Summary
                    </button>
                  ) : isPending ? (
                    <button
                      className="bg-transparent text-primary hover:bg-surface-container border border-primary px-4 py-2 rounded-lg text-xs font-semibold transition-colors w-full sm:w-auto cursor-pointer"
                      type="button"
                    >
                      View Questions
                    </button>
                  ) : (
                    <a
                      className="text-primary hover:text-[#004162] text-xs font-semibold underline underline-offset-4 transition-colors cursor-pointer"
                      href="#"
                    >
                      Request Manual Review
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer CTA Banner ── */}
      <div className="p-4 rounded-xl border border-outline-variant bg-[#f8f9ff] flex items-start gap-4">
        <span className="material-symbols-outlined text-primary mt-0.5 text-xl">info</span>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Looking for more earning opportunities? Head over to your{" "}
          <Link className="text-primary font-medium hover:underline" to="/inbox">
            Available Surveys
          </Link>{" "}
          inbox to match with new active research panels.
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { SurveyRecord } from "@shared/types";
import {
  Card,
  EmptyState,
  Icon,
  LoadingBlock,
  SectionHeading,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface SurveyWithStats extends SurveyRecord {
  response_count: number;
  targeted_count: number;
}

const CREATION_CARDS = [
  {
    icon: "edit_note",
    title: "Build Manually",
    description: "Design your survey question by question with the full builder.",
    to: "/survey-builder/manual",
    color: "#00456d",
    bgGradient: "from-[#e8f4fd] to-[#f0f7fb]",
  },
  {
    icon: "upload_file",
    title: "Import Survey",
    description: "Upload an existing survey document (.docx, .pdf, .txt).",
    to: "/survey-builder/import",
    color: "#2e7d32",
    bgGradient: "from-[#e8f5e9] to-[#f1f8e9]",
  },
  {
    icon: "auto_awesome",
    title: "AI Survey Generator",
    description: "Describe your research goal and let AI draft your questions.",
    to: "/survey-builder/ai",
    color: "#6a1b9a",
    bgGradient: "from-[#f3e5f5] to-[#fce4ec]",
  },
] as const;

export function SurveyNewLandingPage() {
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isSubscribed = Boolean(
    (user?.subscription_tier as string) === "subscribed" ||
    (user?.subscription_tier as string) === "pro" ||
    user?.role === "admin"
  );

  const { data, isLoading } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => api<{ surveys: SurveyWithStats[] }>("/surveys"),
  });

  const recentDrafts = (data?.surveys ?? [])
    .filter((s) => s.status === "wip" || s.status === "draft")
    .slice(0, 5);

  return (
    <div className="space-y-stack-lg">
      {/* ── Page Header ── */}
      <SectionHeading
        subtitle="Choose how you'd like to create your next survey."
        title="Create a New Survey"
      />

      {/* ── 3 Creation Method Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CREATION_CARDS.map((card) => {
          const isAiCard = card.to === "/survey-builder/ai";
          const requiresUpgrade = isAiCard && !isSubscribed;

          const cardContent = (
            <Card className={`p-6 bg-gradient-to-br ${card.bgGradient} border-transparent hover:shadow-lg hover:scale-[1.02] transition-all duration-200 h-full`}>
              <div className="flex flex-col items-center text-center gap-4">
                {/* Icon Circle */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <span
                    className="material-symbols-outlined text-[32px]"
                    style={{ color: card.color, fontVariationSettings: "'FILL' 1" }}
                  >
                    {card.icon}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <div className="flex items-center justify-center gap-1.5 mb-1.5">
                    <h3
                      className="text-lg font-bold"
                      style={{ color: card.color }}
                    >
                      {card.title}
                    </h3>
                    {isAiCard && !isSubscribed && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#6a1b9a]/15 text-[#6a1b9a]">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div
                  className="mt-auto flex items-center gap-1 text-xs font-semibold opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ color: card.color }}
                >
                  <span>{requiresUpgrade ? "Upgrade to Unlock" : "Get Started"}</span>
                  <Icon className="text-[14px]" name={requiresUpgrade ? "lock" : "arrow_forward"} />
                </div>
              </div>
            </Card>
          );

          if (requiresUpgrade) {
            return (
              <button
                key={card.to}
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="group block text-left w-full cursor-pointer"
              >
                {cardContent}
              </button>
            );
          }

          return (
            <Link
              key={card.to}
              to={card.to}
              className="group block"
            >
              {cardContent}
            </Link>
          );
        })}
      </div>

      {/* ── Free Tier Upgrade Modal ── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-outline-variant/30 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#6a1b9a]/10 text-[#6a1b9a] flex items-center justify-center mx-auto">
              <span
                className="material-symbols-outlined text-[32px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#6a1b9a]/10 text-[#6a1b9a] text-[11px] font-bold uppercase tracking-wider">
                Pro Feature
              </span>
              <h3 className="text-xl font-bold text-[#0D253A] mt-2 mb-1.5 font-headline-lg">
                Unlock AI Survey Generator
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Generate tailored, high-rigor survey questions in seconds from your research goal. Available on Pro researcher plans.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link to="/researcher/subscription" className="w-full">
                <button
                  type="button"
                  className="w-full py-2.5 bg-[#6a1b9a] hover:bg-[#4a148c] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Icon className="text-[16px]" name="lock_open" />
                  Upgrade Subscription
                </button>
              </Link>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-on-surface-variant rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Drafts Section ── */}
      <div className="mt-2">
        <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <Icon className="text-[20px] text-on-surface-variant" name="history" />
          Recent Drafts
        </h2>

        {isLoading ? <LoadingBlock label="Loading recent drafts…" /> : null}

        {!isLoading && recentDrafts.length === 0 ? (
          <EmptyState icon="draft" title="No drafts yet">
            Your work-in-progress surveys will appear here.
          </EmptyState>
        ) : null}

        {recentDrafts.length > 0 && (
          <div className="space-y-3">
            {recentDrafts.map((survey) => (
              <Link
                key={survey.id}
                to={`/researcher/surveys/${survey.id}/edit`}
                className="block"
              >
                <Card className="p-4 hover:shadow-md hover:border-primary/30 transition-all group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            survey.status === "wip"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-surface-container-high text-on-surface-variant"
                          }`}
                        >
                          {survey.status === "wip" ? "Work in Progress" : "Draft"}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          {new Date(survey.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                        {survey.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {survey.questions.length} question{survey.questions.length === 1 ? "" : "s"}
                        {survey.reward_etb ? ` · ${survey.reward_etb} ETB reward` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-primary text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <span>Resume</span>
                      <Icon className="text-[16px]" name="arrow_forward" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}

            {(data?.surveys ?? []).filter((s) => s.status === "wip" || s.status === "draft").length > 5 && (
              <Link
                to="/researcher/surveys"
                className="text-sm text-primary font-semibold hover:underline flex items-center gap-1"
              >
                View all surveys
                <Icon className="text-[14px]" name="arrow_forward" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Helper Note ── */}
      <p className="flex items-center gap-stack-sm font-body-sm text-[12px] text-on-surface-variant mt-4">
        <Icon className="text-[16px]" name="info" />
        All surveys go through mandatory admin review before reaching respondents.
      </p>
    </div>
  );
}

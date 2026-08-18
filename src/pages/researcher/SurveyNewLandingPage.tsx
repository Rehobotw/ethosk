import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SurveyRecord } from "@shared/types";
import {
  Button,
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
    description: "Upload a Word document, PDF, or text file to extract questions.",
    to: "/survey-builder/import",
    color: "#00695c",
    bgGradient: "from-[#e0f2f1] to-[#e8f5e9]",
  },
  {
    icon: "auto_awesome",
    title: "AI Survey Generator",
    description: "Describe your research goal and let AI draft the survey for you.",
    to: "/survey-builder/ai",
    color: "#6a1b9a",
    bgGradient: "from-[#f3e5f5] to-[#fce4ec]",
  },
] as const;

function getBuilderType(survey: SurveyRecord): "Manual" | "Import" | "AI" {
  const title = (survey.title || "").toLowerCase();
  const hasAiQuestions = survey.questions?.some((q) => q.id?.includes("ai"));
  const hasImportQuestions = survey.questions?.some((q) => q.id?.includes("import") || q.id?.includes("imp"));

  if (title.startsWith("ai ") || title.includes("ai draft") || hasAiQuestions) return "AI";
  if (title.includes("import") || hasImportQuestions) return "Import";
  return "Manual";
}

function getBuilderBadgeStyle(type: "Manual" | "Import" | "AI"): { bg: string; text: string } {
  switch (type) {
    case "AI":
      return { bg: "bg-[#6a1b9a]/10", text: "text-[#6a1b9a]" };
    case "Import":
      return { bg: "bg-[#00695c]/10", text: "text-[#00695c]" };
    case "Manual":
    default:
      return { bg: "bg-[#00456d]/10", text: "text-[#00456d]" };
  }
}

export function SurveyNewLandingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<SurveyWithStats | null>(null);

  const isSubscribed = Boolean(
    (user?.subscription_tier as string) === "subscribed" ||
    (user?.subscription_tier as string) === "pro" ||
    user?.role === "admin"
  );

  const { data, isLoading } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => api<{ surveys: SurveyWithStats[] }>("/surveys"),
  });

  // Only surface WIP and draft surveys (§4.3.5 — excluded when promoted to final_draft)
  const recentDrafts = (data?.surveys ?? [])
    .filter((s) => s.status === "wip" || s.status === "draft")
    .slice(0, 5);

  const deleteDraft = useMutation({
    mutationFn: (surveyId: string) =>
      api(`/surveys/${surveyId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
      setDraftToDelete(null);
    },
  });

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

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── Recent Work-in-Progress Section (§4.3.5)                     ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="mt-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0D253A] flex items-center gap-2">
            <Icon className="text-[20px] text-primary" name="history" />
            Recent Work-in-Progress
          </h2>
          {recentDrafts.length > 0 && (
            <span className="text-xs font-medium text-on-surface-variant">
              Same dataset as Dashboard WIP tab
            </span>
          )}
        </div>

        {isLoading ? <LoadingBlock label="Loading recent drafts…" /> : null}

        {!isLoading && recentDrafts.length === 0 ? (
          <EmptyState icon="draft" title="No drafts yet — start one above.">
            Work-in-progress surveys saved as draft will surface here for quick resuming.
          </EmptyState>
        ) : null}

        {!isLoading && recentDrafts.length > 0 && (
          <div className="space-y-3">
            {recentDrafts.map((survey) => {
              const builderType = getBuilderType(survey);
              const badgeStyle = getBuilderBadgeStyle(builderType);
              const titleDisplay = survey.title?.trim() ? survey.title : "Untitled Survey";
              const lastEdited = new Date(survey.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <Card
                  key={survey.id}
                  className="p-4 hover:shadow-md hover:border-primary/30 transition-all group border border-outline-variant/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {/* Builder Type Badge (§4.3.5) */}
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeStyle.bg} ${badgeStyle.text}`}
                        >
                          {builderType} Builder
                        </span>

                        {/* Status tag */}
                        <span className="rounded-md px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800">
                          Work in Progress
                        </span>

                        {/* Last edited timestamp (§4.3.5) */}
                        <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <Icon className="text-[14px]" name="schedule" />
                          Edited {lastEdited}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-[#0D253A] truncate group-hover:text-primary transition-colors">
                        {titleDisplay}
                      </h3>

                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {survey.questions.length} question{survey.questions.length === 1 ? "" : "s"}
                        {survey.reward_etb ? ` · ${survey.reward_etb} ETB reward` : ""}
                      </p>
                    </div>

                    {/* Right actions: Resume & Delete (§4.3.5) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate(`/survey-builder/manual/${survey.id}`)}
                        className="px-4 py-2 bg-primary hover:bg-[#003450] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Icon className="text-[16px]" name="edit" />
                        <span>Resume Editing</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDraftToDelete(survey)}
                        className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete draft"
                      >
                        <Icon className="text-[18px]" name="delete" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {(data?.surveys ?? []).filter((s) => s.status === "wip" || s.status === "draft").length > 5 && (
              <div className="pt-1">
                <Link
                  to="/researcher/surveys"
                  className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
                >
                  View all drafts on Dashboard
                  <Icon className="text-[14px]" name="arrow_forward" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal (§4.3.5) ── */}
      {draftToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-outline-variant/30 space-y-4">
            <div className="flex items-center gap-3 text-error">
              <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center">
                <Icon className="text-[22px] text-error" name="delete_forever" />
              </div>
              <h3 className="text-base font-bold text-on-surface">
                Delete Draft Survey?
              </h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-on-surface">"{draftToDelete.title || "Untitled Survey"}"</strong>?
              This will remove it from both the Recent list and your Dashboard Work-in-Progress tab.
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setDraftToDelete(null)}
                disabled={deleteDraft.isPending}
                type="button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deleteDraft.mutate(draftToDelete.id)}
                disabled={deleteDraft.isPending}
                className="bg-error hover:bg-error/90 text-white font-bold"
                type="button"
              >
                {deleteDraft.isPending ? "Deleting…" : "Delete Draft"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Helper Note ── */}
      <p className="flex items-center gap-stack-sm font-body-sm text-[12px] text-on-surface-variant mt-4">
        <Icon className="text-[16px]" name="info" />
        All surveys go through mandatory admin review before reaching respondents.
      </p>
    </div>
  );
}

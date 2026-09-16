import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SurveyRecord } from "@shared/types";
import { Button, Card, EmptyState, Icon, LoadingBlock } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface SurveyWithStats extends SurveyRecord {
  response_count: number;
  targeted_count: number;
}

const TEMPLATES = [
  {
    id: "csat",
    icon: "description",
    title: "Consumer Satisfaction Baseline",
    topic: "Consumer Satisfaction Baseline",
    questions: [
      {
        id: "q1",
        type: "single_choice" as const,
        text: "Overall, how satisfied are you with our service?",
        options: ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"],
        required: true,
      },
      {
        id: "q2",
        type: "single_choice" as const,
        text: "How likely are you to recommend us to a colleague or friend?",
        options: ["1 - Not likely", "2", "3 - Neutral", "4", "5 - Extremely likely"],
        required: true,
      },
      {
        id: "q3",
        type: "text" as const,
        text: "What is the single most important improvement we could make?",
        required: false,
      },
    ],
  },
  {
    id: "ngo-health",
    icon: "health_and_safety",
    title: "NGO Healthcare Access Assessment",
    topic: "NGO Healthcare Access Assessment",
    questions: [
      {
        id: "q1",
        type: "single_choice" as const,
        text: "How far is the nearest primary health center from your residence?",
        options: ["Under 15 minutes", "15–30 minutes", "30–60 minutes", "Over 1 hour"],
        required: true,
      },
      {
        id: "q2",
        type: "single_choice" as const,
        text: "Have essential medications been consistently available during your visits?",
        options: ["Always available", "Often available", "Rarely available", "Never available"],
        required: true,
      },
      {
        id: "q3",
        type: "text" as const,
        text: "What primary barrier prevents households in your community from seeking medical care?",
        required: false,
      },
    ],
  },
  {
    id: "fintech",
    icon: "account_balance",
    title: "Financial Inclusion & Mobile Money",
    topic: "Financial Inclusion & Mobile Money",
    questions: [
      {
        id: "q1",
        type: "single_choice" as const,
        text: "Which mobile money services do you use regularly?",
        options: ["Telebirr", "CBE Birr", "Both Telebirr & CBE Birr", "None"],
        required: true,
      },
      {
        id: "q2",
        type: "single_choice" as const,
        text: "How frequently do you make digital merchant payments?",
        options: ["Daily", "Several times a week", "Once a week", "Rarely / Never"],
        required: true,
      },
      {
        id: "q3",
        type: "text" as const,
        text: "What would make digital payments more convenient for your everyday purchases?",
        required: false,
      },
    ],
  },
];

function getBuilderType(survey: SurveyRecord): "Manual" | "Import" | "AI" {
  if (survey.builder_type === "ai") return "AI";
  if (survey.builder_type === "import") return "Import";
  if (survey.builder_type === "manual") return "Manual";

  const title = (survey.title || "").toLowerCase();
  const hasAiQuestions = survey.questions?.some((q) => q.id?.includes("ai"));
  const hasImportQuestions = survey.questions?.some(
    (q) => q.id?.includes("import") || q.id?.includes("imp"),
  );

  if (title.startsWith("ai ") || title.includes("ai draft") || hasAiQuestions) return "AI";
  if (title.includes("import") || hasImportQuestions) return "Import";
  return "Manual";
}

export function getResumePath(survey: SurveyRecord): string {
  const type = getBuilderType(survey);
  if (type === "Import") return `/survey-builder/import/${survey.id}`;
  if (type === "AI") return `/survey-builder/manual/${survey.id}?source=ai`;
  return `/survey-builder/manual/${survey.id}`;
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
    user?.role === "admin",
  );

  const { data, isLoading } = useQuery({
    queryKey: ["surveys"],
    queryFn: () => api<{ surveys: SurveyWithStats[] }>("/surveys"),
  });

  // Surface only WIP and draft surveys (§4.3.5 — excluded when promoted to final_draft)
  const recentDrafts = (data?.surveys ?? [])
    .filter((s) => s.status === "wip" || s.status === "draft")
    .slice(0, 5);

  const deleteDraft = useMutation({
    mutationFn: (surveyId: string) => api(`/surveys/${surveyId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["surveys"] });
      setDraftToDelete(null);
    },
  });

  const createFromTemplate = useMutation({
    mutationFn: async (template: (typeof TEMPLATES)[number]) => {
      const res = await api<SurveyRecord>("/surveys", {
        method: "POST",
        body: JSON.stringify({
          title: template.title,
          description: `Research study created from ${template.title} template.`,
          questions: template.questions,
          reward_etb: 15,
          status: "wip",
        }),
      });
      return res;
    },
    onSuccess: (survey) => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      navigate(`/survey-builder/manual/${survey.id}`);
    },
  });

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-8 pb-12">
      <header className="border-b border-[#d9e2ea] pb-5 pt-2">
        <Link
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[#4b6078] hover:text-[#00456d]"
          to="/researcher"
        >
          <Icon className="text-[16px]" name="arrow_back" />
          Researcher dashboard
        </Link>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-[#004162] md:text-3xl">
          Create a survey
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-[#4b6078]">
          Start a new working draft using the method that best fits your research workflow.
        </p>
      </header>

      <section className="overflow-hidden rounded-xl border border-[#d9e2ea] bg-white shadow-sm">
        <div className="border-b border-[#e7edf2] px-5 py-4 md:px-6">
          <h2 className="font-headline text-lg font-bold text-[#004162]">
            Choose a creation method
          </h2>
          <p className="mt-1 text-sm text-[#5a6e7f]">
            You can edit every draft before it is sent for review.
          </p>
        </div>

        <div className="divide-y divide-[#e7edf2]">
          <Link
            className="group flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-[#f5f9fc] md:flex-row md:items-center md:px-6"
            to="/survey-builder/manual"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#eaf3fb] text-[#176f9f]">
              <Icon className="text-[23px]" name="edit_document" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[#102f44]">Manual builder</h3>
              <p className="mt-1 text-sm leading-5 text-[#5a6e7f]">
                Create questions, response options, and skip logic from scratch.
              </p>
              <p className="mt-2 text-xs font-medium text-[#176f9f]">
                Question types · Logic branching · Free
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#176f9f] group-hover:text-[#00456d]">
              Start building <Icon className="text-[18px]" name="arrow_forward" />
            </span>
          </Link>

          <Link
            className="group flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-[#f5f9fc] md:flex-row md:items-center md:px-6"
            to="/survey-builder/import"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#eaf3fb] text-[#176f9f]">
              <Icon className="text-[23px]" name="upload_file" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[#102f44]">Import a questionnaire</h3>
              <p className="mt-1 text-sm leading-5 text-[#5a6e7f]">
                Upload an existing document and convert its questions into editable survey blocks.
              </p>
              <p className="mt-2 text-xs font-medium text-[#176f9f]">
                DOCX · PDF · CSV · Google Forms export
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#176f9f] group-hover:text-[#00456d]">
              Import file <Icon className="text-[18px]" name="arrow_forward" />
            </span>
          </Link>

          {isSubscribed ? (
            <Link
              className="group flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-[#f5f9fc] md:flex-row md:items-center md:px-6"
              to="/survey-builder/ai"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f1ecfa] text-[#6a1b9a]">
                <Icon className="text-[23px]" name="auto_awesome" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[#102f44]">Generate with AI</h3>
                <p className="mt-1 text-sm leading-5 text-[#5a6e7f]">
                  Create a structured first draft from your research objective and target audience.
                </p>
                <p className="mt-2 text-xs font-medium text-[#6a1b9a]">Available on your plan</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#6a1b9a] group-hover:text-[#4f1373]">
                Create draft <Icon className="text-[18px]" name="arrow_forward" />
              </span>
            </Link>
          ) : (
            <button
              className="group flex w-full flex-col gap-4 px-5 py-5 text-left transition-colors hover:bg-[#f5f9fc] md:flex-row md:items-center md:px-6"
              onClick={() => setShowUpgradeModal(true)}
              type="button"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f1ecfa] text-[#6a1b9a]">
                <Icon className="text-[23px]" name="auto_awesome" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[#102f44]">Generate with AI</h3>
                <p className="mt-1 text-sm leading-5 text-[#5a6e7f]">
                  Create a structured first draft from your research objective and target audience.
                </p>
                <p className="mt-2 text-xs font-medium text-[#6a1b9a]">
                  Available with a Pro researcher plan
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#6a1b9a] group-hover:text-[#4f1373]">
                View plan options <Icon className="text-[18px]" name="arrow_forward" />
              </span>
            </button>
          )}
        </div>
      </section>

      {/* ── Validated Research Templates Section (Stitch Design) ── */}
      <div className="pt-6 border-t border-[#E2E8F0]">
        <p className="text-xs md:text-sm text-[#41484E] mb-3.5 font-bold">
          Or start from a validated research template:
        </p>

        <div className="flex flex-wrap gap-3">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => createFromTemplate.mutate(tmpl)}
              disabled={createFromTemplate.isPending}
              className="bg-white border border-[#E2E8F0] hover:border-[#2872A1] hover:text-[#2872A1] hover:bg-[#EDF3FF] px-4 py-2 rounded-full text-xs md:text-[13px] text-[#001d29] transition-all shadow-xs flex items-center gap-2 cursor-pointer font-medium disabled:opacity-50"
            >
              <Icon className="text-[16px] text-[#2872A1]" name={tmpl.icon} />
              <span>{tmpl.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Pro Upgrade Modal ── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-outline-variant/30 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EDF3FF] text-[#2872A1] flex items-center justify-center mx-auto">
              <Icon className="text-[32px]" name="auto_awesome" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0B2B42] text-white text-[11px] font-bold uppercase tracking-wider font-mono">
                Pro Feature
              </span>
              <h3 className="text-xl font-bold text-[#004162] mt-2 mb-1.5 font-headline">
                Unlock AI Survey Generator
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Generate tailored, high-rigor survey questions in seconds from your research goal.
                Available on Pro researcher plans.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link to="/researcher/subscription" className="w-full">
                <button
                  type="button"
                  className="w-full py-2.5 bg-[#0B2B42] hover:bg-[#001d29] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
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
      <div className="mt-4 pt-6 border-t border-[#E2E8F0] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#004162] flex items-center gap-2 font-headline">
            <Icon className="text-[20px] text-[#2872A1]" name="history" />
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
                  className="p-4 hover:shadow-md hover:border-[#2872A1]/30 transition-all group border border-outline-variant/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {/* Builder Type Badge */}
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeStyle.bg} ${badgeStyle.text}`}
                        >
                          {builderType} Builder
                        </span>

                        {/* Status tag */}
                        <span className="rounded-md px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800">
                          Work in Progress
                        </span>

                        {/* Last edited timestamp */}
                        <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                          <Icon className="text-[14px]" name="schedule" />
                          Edited {lastEdited}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-[#0D253A] truncate group-hover:text-[#2872A1] transition-colors">
                        {titleDisplay}
                      </h3>

                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {survey.questions.length} question{survey.questions.length === 1 ? "" : "s"}
                        {survey.reward_etb ? ` · ${survey.reward_etb} ETB reward` : ""}
                      </p>
                    </div>

                    {/* Right actions: Resume & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate(getResumePath(survey))}
                        className="px-4 py-2 bg-[#2872A1] hover:bg-[#001d29] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
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

            {(data?.surveys ?? []).filter((s) => s.status === "wip" || s.status === "draft")
              .length > 5 && (
              <div className="pt-1">
                <Link
                  to="/researcher/surveys"
                  className="text-xs text-[#2872A1] font-bold hover:underline inline-flex items-center gap-1"
                >
                  View all drafts on Dashboard
                  <Icon className="text-[14px]" name="arrow_forward" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {draftToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-outline-variant/30 space-y-4">
            <div className="flex items-center gap-3 text-error">
              <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center">
                <Icon className="text-[22px] text-error" name="delete_forever" />
              </div>
              <h3 className="text-base font-bold text-on-surface">Delete Draft Survey?</h3>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-on-surface">
                "{draftToDelete.title || "Untitled Survey"}"
              </strong>
              ? This will remove it from both the Recent list and your Dashboard Work-in-Progress
              tab.
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
    </div>
  );
}

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Icon, LoadingBlock, Notice } from "@/components/ui";

export interface SubmissionDetail {
  id: string;
  survey_id: string;
  survey_title: string;
  description?: string | null;
  reward_etb: number;
  completed_at: string;
  total_time_seconds?: number;
  time_per_question?: Record<string, number>;
  quality_status?: "passed" | "pending" | "flagged";
  payout_status?: "paid" | "pending" | "withheld";
  category?: string;
  questions: {
    id: string;
    text: string;
    type: "single_choice" | "multi_choice" | "text";
    options?: string[];
    isSectionHeader?: boolean;
  }[];
  answers: Record<string, string | string[]>;
}

interface SubmissionSummaryModalProps {
  responseId: string;
  onClose: () => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function SubmissionSummaryModal({ responseId, onClose }: SubmissionSummaryModalProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["submission-summary", responseId],
    queryFn: () => api<{ submission: SubmissionDetail }>(`/respondents/history/${responseId}`),
    enabled: !!responseId,
  });

  const submission = data?.submission;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock background scrolling while modal is active
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  const isPassed = !submission?.quality_status || submission.quality_status === "passed";
  const isPending = submission?.quality_status === "pending";

  let questionCounter = 0;

  return (
    <div
      aria-labelledby="summary-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-outline-variant bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-outline-variant/60 bg-surface-container-lowest shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="bg-surface-container px-2.5 py-0.5 rounded-full text-xs font-semibold text-on-surface-variant">
                {submission?.category || "Survey Submission"}
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              {submission?.completed_at ? (
                <span className="text-xs text-outline font-medium">
                  Completed on{" "}
                  {new Date(submission.completed_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              ) : null}
            </div>
            <h2
              className="text-xl sm:text-2xl font-headline-md font-bold text-[#004162] tracking-tight leading-snug"
              id="summary-modal-title"
            >
              {submission?.survey_title || "Submission Summary"}
            </h2>
            {submission?.description ? (
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                {submission.description}
              </p>
            ) : null}
          </div>

          <button
            aria-label="Close"
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface shrink-0 cursor-pointer"
            onClick={onClose}
            type="button"
          >
            <Icon className="text-xl" name="close" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-surface">
          {isLoading ? (
            <div className="py-12">
              <LoadingBlock label="Loading your submission details…" />
            </div>
          ) : error ? (
            <div className="py-8 space-y-4">
              <Notice tone="error">
                Could not load this submission summary. The record may have expired or is unavailable.
              </Notice>
              <button
                className="text-primary text-xs font-semibold underline underline-offset-4 cursor-pointer"
                onClick={() => refetch()}
                type="button"
              >
                Try reloading
              </button>
            </div>
          ) : submission ? (
            <>
              {/* Overview Metrics Bento Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Metric 1: Reward Outcome */}
                <div className="bg-[#F8FAFC] rounded-xl border border-[#E1E8EE] p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-outline text-xs font-semibold uppercase tracking-wider mb-1">
                    <Icon className="text-base text-teal-600" name="account_balance_wallet" />
                    <span>Reward</span>
                  </div>
                  <div>
                    {isPassed ? (
                      <>
                        <p className="text-lg font-bold text-teal-700">+{submission.reward_etb} ETB</p>
                        <p className="text-[11px] text-teal-600 font-medium">Credited to wallet</p>
                      </>
                    ) : isPending ? (
                      <>
                        <p className="text-lg font-bold text-amber-600">+{submission.reward_etb} ETB</p>
                        <p className="text-[11px] text-amber-600 font-medium">Pending escrow</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-bold text-outline line-through">
                          {submission.reward_etb} ETB
                        </p>
                        <p className="text-[11px] text-error font-medium">Reward withheld</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Metric 2: Quality Outcome */}
                <div className="bg-[#F8FAFC] rounded-xl border border-[#E1E8EE] p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-outline text-xs font-semibold uppercase tracking-wider mb-1">
                    <Icon className="text-base text-primary" name="verified" />
                    <span>Quality</span>
                  </div>
                  <div>
                    {isPassed ? (
                      <>
                        <p className="text-sm font-bold text-teal-700 flex items-center gap-1">
                          <Icon className="text-sm" name="check_circle" />
                          Passed
                        </p>
                        <p className="text-[11px] text-outline">Verified valid</p>
                      </>
                    ) : isPending ? (
                      <>
                        <p className="text-sm font-bold text-amber-600 flex items-center gap-1">
                          <Icon className="text-sm" name="hourglass_empty" />
                          In Review
                        </p>
                        <p className="text-[11px] text-outline">Consistency check</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-error flex items-center gap-1">
                          <Icon className="text-sm" name="warning" />
                          Flagged
                        </p>
                        <p className="text-[11px] text-outline">Speed threshold</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Metric 3: Time Spent */}
                <div className="bg-[#F8FAFC] rounded-xl border border-[#E1E8EE] p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-outline text-xs font-semibold uppercase tracking-wider mb-1">
                    <Icon className="text-base text-primary" name="timer" />
                    <span>Time Spent</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#004162]">
                      {formatDuration(submission.total_time_seconds)}
                    </p>
                    <p className="text-[11px] text-outline">Total recorded</p>
                  </div>
                </div>

                {/* Metric 4: Questions Count */}
                <div className="bg-[#F8FAFC] rounded-xl border border-[#E1E8EE] p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-outline text-xs font-semibold uppercase tracking-wider mb-1">
                    <Icon className="text-base text-primary" name="format_list_bulleted" />
                    <span>Questions</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#004162]">
                      {submission.questions.filter((q) => !q.isSectionHeader).length}
                    </p>
                    <p className="text-[11px] text-outline">Answers submitted</p>
                  </div>
                </div>
              </div>

              {/* Submitted Questions and Answers */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-1 border-b border-outline-variant/40">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                    <Icon className="text-base text-primary" name="quiz" />
                    Submitted Responses
                  </h3>
                  <span className="text-xs text-outline font-medium">Read-only audit record</span>
                </div>

                {submission.questions.length === 0 ? (
                  <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low text-center text-sm text-outline">
                    No question records attached to this survey.
                  </div>
                ) : (
                  submission.questions.map((question) => {
                    if (question.isSectionHeader) {
                      return (
                        <div
                          className="pt-4 pb-2 border-b border-outline-variant/70 flex items-center gap-2"
                          key={question.id}
                        >
                          <Icon className="text-primary text-xl" name="segment" />
                          <h4 className="text-base font-bold text-primary font-headline-sm">
                            {question.text}
                          </h4>
                        </div>
                      );
                    }

                    questionCounter++;
                    const displayIndex = questionCounter;
                    const answer = submission.answers[question.id];
                    const timing = submission.time_per_question?.[question.id];

                    return (
                      <div
                        className="rounded-xl border border-[#E1E8EE] bg-[#FAFCFF] p-4 sm:p-5 space-y-3 transition-colors hover:border-[#CBD5E1]"
                        key={question.id}
                      >
                        {/* Question Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold font-mono shrink-0">
                              Q{displayIndex}
                            </span>
                            <div>
                              <h5 className="text-sm sm:text-base font-semibold text-on-surface leading-snug">
                                {question.text}
                              </h5>
                              <span className="text-[11px] font-medium text-outline uppercase tracking-wider mt-0.5 inline-block">
                                {question.type === "single_choice"
                                  ? "Single Choice"
                                  : question.type === "multi_choice"
                                    ? "Multiple Choice"
                                    : "Open-ended Text"}
                              </span>
                            </div>
                          </div>
                          {timing !== undefined && timing > 0 ? (
                            <span className="text-xs text-outline flex items-center gap-1 shrink-0 bg-white px-2 py-1 rounded border border-[#E1E8EE]">
                              <Icon className="text-[14px]" name="schedule" />
                              {timing}s
                            </span>
                          ) : null}
                        </div>

                        {/* Answers Rendering */}
                        <div className="pl-0 sm:pl-8">
                          {question.type === "single_choice" && question.options && question.options.length > 0 ? (
                            <div className="space-y-1.5">
                              {question.options.map((opt) => {
                                const isSelected = opt === answer;
                                return (
                                  <div
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm border transition-colors ${
                                      isSelected
                                        ? "bg-teal-500/10 border-teal-500 text-teal-900 font-semibold shadow-xs"
                                        : "bg-white border-outline-variant/60 text-on-surface-variant/70"
                                    }`}
                                    key={opt}
                                  >
                                    <Icon
                                      className={`text-base ${isSelected ? "text-teal-700" : "text-outline-variant"}`}
                                      name={isSelected ? "radio_button_checked" : "radio_button_unchecked"}
                                    />
                                    <span className="flex-1">{opt}</span>
                                    {isSelected ? (
                                      <span className="ml-auto text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                                        Your Choice
                                      </span>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          ) : question.type === "multi_choice" && question.options && question.options.length > 0 ? (
                            <div className="space-y-1.5">
                              {question.options.map((opt) => {
                                const isSelected = Array.isArray(answer)
                                  ? answer.includes(opt)
                                  : answer === opt;
                                return (
                                  <div
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm border transition-colors ${
                                      isSelected
                                        ? "bg-teal-500/10 border-teal-500 text-teal-900 font-semibold shadow-xs"
                                        : "bg-white border-outline-variant/60 text-on-surface-variant/70"
                                    }`}
                                    key={opt}
                                  >
                                    <Icon
                                      className={`text-base ${isSelected ? "text-teal-700" : "text-outline-variant"}`}
                                      name={isSelected ? "check_box" : "check_box_outline_blank"}
                                    />
                                    <span className="flex-1">{opt}</span>
                                    {isSelected ? (
                                      <span className="ml-auto text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                                        Selected
                                      </span>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-3.5 bg-white rounded-lg border border-outline-variant/80 text-sm text-on-surface leading-relaxed">
                              <p className="text-[11px] uppercase tracking-wider font-semibold text-outline mb-1.5 flex items-center gap-1">
                                <Icon className="text-sm text-teal-600" name="edit_note" />
                                Submitted Answer
                              </p>
                              {answer ? (
                                <p className="whitespace-pre-wrap font-body-md text-on-surface">
                                  {typeof answer === "string" ? answer : JSON.stringify(answer)}
                                </p>
                              ) : (
                                <p className="text-outline italic text-xs">No response provided</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-outline-variant/60 bg-surface-container-lowest shrink-0">
          <div className="text-xs text-outline hidden sm:block">
            Ethosk Research Respondent Registry • Authenticated Submission
          </div>
          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
            <button
              className="px-4 py-2 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5"
              onClick={() => window.print()}
              type="button"
            >
              <Icon className="text-sm" name="print" />
              Print / Save
            </button>
            <button
              className="px-5 py-2 rounded-lg bg-[#2872A1] hover:bg-[#1d5d8a] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

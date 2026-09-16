import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TIER_RANK, type Question, type TargetLanguage, type VerificationTier } from "@shared/types";
import type { SubmitResponseInput } from "@shared/validation/schemas";
import { QuestionInput } from "@/components/survey-fill/QuestionInput";
import { useQuestionTimer } from "@/components/survey-fill/useQuestionTimer";
import { useTextMetrics } from "@/components/survey-fill/useTextMetrics";
import { Button, Card, Icon, LoadingBlock, Notice, Select } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ChatMode } from "./ChatMode";

interface FillPayload {
  id: string;
  title: string;
  description: string | null;
  reward_etb: number | null;
  questions: Question[];
  translations: Partial<Record<TargetLanguage, string[]>>;
  min_verification_tier?: VerificationTier;
}

type Language = "en" | TargetLanguage;

const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  am: "አማርኛ (Amharic)",
  om: "Afaan Oromoo",
};

export function SurveyFillPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const timer = useQuestionTimer();
  const textMetrics = useTextMetrics();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<Language>("en");
  const [activeMode, setActiveMode] = useState<"standard" | "chat" | "voice">("standard");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["survey-fill", id],
    queryFn: () => api<FillPayload>(`/surveys/${id}/fill`),
    staleTime: Infinity,
    retry: false,
  });

  // Restore saved draft on mount
  useEffect(() => {
    if (!id) return;
    try {
      const saved = localStorage.getItem(`ethosk_survey_draft_${id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setAnswers(parsed);
          setIsDraftRestored(true);
        }
      }
    } catch (e) {
      console.warn("Failed to restore survey draft from storage:", e);
    }
  }, [id]);

  // Save answers to draft storage whenever answers change
  const updateAnswer = (questionId: string, value: string) => {
    textMetrics.recordValue(questionId, value);
    setAnswers((current) => {
      const next = { ...current, [questionId]: value };
      try {
        localStorage.setItem(`ethosk_survey_draft_${id}`, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist survey draft:", e);
      }
      return next;
    });
  };

  const submit = useMutation({
    mutationFn: (payload: SubmitResponseInput) =>
      api<{ response_id: string; reward_etb: number }>(`/surveys/${id}/responses`, {
        body: payload,
      }),
    onSuccess: () => {
      setSubmitted(true);
      try {
        localStorage.removeItem(`ethosk_survey_draft_${id}`);
      } catch {}
    },
  });

  const availableLanguages = useMemo<Language[]>(() => {
    const languages: Language[] = ["en"];
    for (const code of ["am", "om"] as TargetLanguage[]) {
      if (data?.translations?.[code]?.length) languages.push(code);
    }
    return languages;
  }, [data]);

  if (isLoading) return <FillFrame><LoadingBlock label="Opening the survey…" /></FillFrame>;

  if (error) {
    const message =
      error instanceof ApiRequestError ? error.message : "This survey could not be opened.";
    return (
      <FillFrame>
        <Notice tone="error" title="Cannot open this survey">
          {message}
        </Notice>
        <Link className="mt-stack-md inline-block" to="/inbox">
          <Button variant="outline">Back to inbox</Button>
        </Link>
      </FillFrame>
    );
  }

  if (!data) return null;

  // Verification Tier Gate Routing
  const userTierRank = user ? TIER_RANK[user.verification_tier] : 0;
  const requiredTier = data.min_verification_tier || "0_registered";
  const requiredRank = TIER_RANK[requiredTier];

  if (userTierRank < requiredRank) {
    const needsTier1 = userTierRank === 0 && requiredRank >= 1;
    return (
      <FillFrame>
        <Card className="p-stack-lg text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <Icon className="text-3xl" name="lock" />
          </div>
          <h1 className="font-headline-md text-headline-md text-primary">
            Verification Required
          </h1>
          <p className="font-body-md text-on-surface-variant max-w-md mx-auto">
            This study requires {requiredTier === "1_id_verified" ? "Tier 1 (Fayda National ID)" : "Tier 2 (Attribute / Document)"} verification. Complete verification to unlock this and other high-paying surveys.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to={needsTier1 ? "/verify" : "/documents"}>
              <Button>
                {needsTier1 ? "Complete Fayda ID Verification" : "Upload Verification Documents"}
              </Button>
            </Link>
            <Link to="/inbox">
              <Button variant="outline">Back to Inbox</Button>
            </Link>
          </div>
        </Card>
      </FillFrame>
    );
  }

  if (submitted) {
    return (
      <FillFrame>
        <Card className="p-stack-lg text-center">
          <Icon className="text-[40px] text-status-passed" filled name="task_alt" />
          <h1 className="mt-stack-sm font-headline-md text-headline-md text-on-surface">
            Response submitted
          </h1>
          <p className="mt-stack-sm font-body-md text-body-md text-on-surface-variant">
            Thank you. Your answers have been recorded
            {submit.data?.reward_etb
              ? ` and ${submit.data.reward_etb} ETB has been credited to your wallet`
              : ""}
            .
          </p>
          <Link className="mt-stack-lg inline-block" to="/inbox">
            <Button>Back to inbox</Button>
          </Link>
        </Card>
      </FillFrame>
    );
  }

  const questionText = (question: Question, index: number): string => {
    if (language === "en") return question.text;
    if (question.consistencyCheck) return question.text;
    return data.translations?.[language]?.[index] ?? question.text;
  };

  const handleSubmit = () => {
    const missing = data.questions.filter(
      (question) => question.required !== false && !answers[question.id]?.trim(),
    );

    if (missing.length > 0) {
      setValidationError(
        `Please answer all ${data.questions.length} questions before submitting. ${missing.length} remaining.`,
      );
      return;
    }

    setValidationError(null);
    const { timePerQuestion, totalTimeSeconds } = timer.finalize();
    submit.mutate({
      answers,
      time_per_question: timePerQuestion,
      total_time_seconds: totalTimeSeconds,
      text_metrics: textMetrics.finalize(),
    });
  };

  if (activeMode === "chat") {
    return (
      <FillFrame>
        <ChatMode
          availableLanguages={availableLanguages}
          initialLanguage={language}
          onFallback={() => setActiveMode("standard")}
          onFinish={(chatAnswers, timings) => {
            const mergedAnswers = { ...answers, ...chatAnswers };
            setAnswers(mergedAnswers);
            try {
              localStorage.removeItem(`ethosk_survey_draft_${id}`);
            } catch {}
            submit.mutate({
              answers: mergedAnswers,
              time_per_question: timings.time_per_question,
              total_time_seconds: timings.total_time_seconds,
              text_metrics: textMetrics.finalize(),
            });
          }}
          onLanguageChange={setLanguage}
          questions={data.questions}
          submitting={submit.isPending}
          surveyId={data.id}
          title={data.title}
        />
      </FillFrame>
    );
  }

  if (activeMode === "voice") {
    return (
      <FillFrame>
        <div className="p-8 text-center bg-white rounded-2xl border border-outline-variant space-y-4 max-w-lg mx-auto my-12 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">mic</span>
          </div>
          <h2 className="font-title-lg text-title-lg font-bold text-on-surface">Voice Survey Mode (Coming Soon)</h2>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            Automated voice interview mode is currently in development (Spec v3 §7.4). Please complete the survey using standard web form or AI chat mode.
          </p>
          <div className="pt-2">
            <button
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer inline-flex items-center gap-2"
              onClick={() => setActiveMode("standard")}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Return to Standard Form</span>
            </button>
          </div>
        </div>
      </FillFrame>
    );
  }

  const answeredCount = data.questions.filter((q) => Boolean(answers[q.id]?.trim())).length;
  const progressPercent = Math.min(100, Math.round((answeredCount / data.questions.length) * 100));

  return (
    <FillFrame>
      {/* Top Glassmorphism Sticky Header */}
      <div className="sticky top-4 z-30 bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl p-4 md:p-5 mb-8 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Study
              </span>
              {data.reward_etb ? (
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  ⚡ {data.reward_etb} ETB Reward
                </span>
              ) : null}
            </div>
            <p className="text-xs font-extrabold text-[#0D253A] truncate font-headline-md tracking-tight uppercase">
              Study Questions
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {availableLanguages.length > 1 && (
              <Select
                aria-label="Language"
                className="w-auto text-xs py-1.5 bg-slate-50 border-slate-200 font-semibold text-slate-700"
                onChange={(event) => setLanguage(event.target.value as Language)}
                value={language}
              >
                {availableLanguages.map((code) => (
                  <option key={code} value={code}>
                    {LANGUAGE_LABELS[code]}
                  </option>
                ))}
              </Select>
            )}

            <button
              aria-disabled="true"
              className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center gap-1.5 opacity-60 cursor-not-allowed"
              disabled
              title="Voice survey mode is coming soon (§7.4)"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">mic</span>
              <span>Voice (Coming Soon)</span>
            </button>

            <button
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              onClick={() => setActiveMode("chat")}
              title="Switch to AI Chat Mode"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">forum</span>
              <span>AI Chat</span>
            </button>

            <Link
              aria-label="Leave survey"
              to="/inbox"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Icon name="close" className="text-xl" />
            </Link>
          </div>
        </div>

        {/* Progress Bar Meter */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Progress: <strong className="text-primary">{answeredCount}</strong> of{" "}
              <strong>{data.questions.length}</strong> answered
            </span>
            <span className="text-primary font-bold">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/50">
            <div
              className="h-full bg-gradient-to-r from-primary via-indigo-600 to-sky-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Hero Header Overview Banner */}
      <div className="bg-gradient-to-br from-primary/5 via-white to-sky-50/50 border border-slate-200/80 rounded-2xl p-6 md:p-8 mb-8 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-bold bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="material-symbols-outlined text-sm text-primary">verified</span>
            Verified Researcher Study
          </span>
          <span className="text-xs font-medium text-slate-500">
            Estimated time: {Math.max(3, Math.round(data.questions.length * 1.5))} mins
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-headline-lg font-bold text-[#0D253A] tracking-tight leading-snug">
          {data.title}
        </h1>

        {data.description && (
          <p className="mt-3 text-sm md:text-base text-slate-600 leading-relaxed max-w-3xl">
            {data.description}
          </p>
        )}
      </div>

      {isDraftRestored && (
        <div className="mb-6">
          <Notice tone="info">
            Draft progress restored. You can continue answering from where you left off.
          </Notice>
        </div>
      )}

      {/* Form & Question Cards */}
      <form
        className="space-y-6 pb-24"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {data.questions.map((question, index) => {
          const isAnswered = Boolean(answers[question.id]?.trim());
          const isSection = ((question.type as string) === "section");

          if (isSection) {
            return (
              <div key={question.id} className="pt-4 pb-2 border-b border-slate-200">
                <h3 className="text-lg font-headline-md font-bold text-primary">
                  {questionText(question, index)}
                </h3>
              </div>
            );
          }

          return (
            <div
              key={question.id}
              className={`bg-white rounded-2xl border transition-all p-6 md:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ${
                isAnswered ? "border-slate-200" : "border-slate-200 hover:border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono">
                    Q{index + 1}
                  </span>
                  {question.required !== false && (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Required
                    </span>
                  )}
                </div>

                {isAnswered && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Answered
                  </span>
                )}
              </div>

              <h3 className="text-base md:text-lg font-headline-sm font-bold text-[#0D253A] mb-4 leading-snug">
                {questionText(question, index)}
              </h3>

              <QuestionInput
                onBlur={() => timer.blurQuestion(question.id)}
                onChange={(val) => updateAnswer(question.id, val)}
                onFocus={() => timer.focusQuestion(question.id)}
                onKeystroke={() => textMetrics.recordKeystroke(question.id)}
                onPaste={() => textMetrics.recordPaste(question.id)}
                question={question}
                value={answers[question.id] || ""}
              />
            </div>
          );
        })}

        {validationError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-rose-600">error</span>
            <span>{validationError}</span>
          </div>
        )}

        {/* Bottom Floating Submit Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="text-xs text-slate-600 hidden sm:block">
              <span className="font-bold text-slate-800">
                {answeredCount} of {data.questions.length}
              </span>{" "}
              questions answered
            </div>

            <Button
              className="bg-primary hover:bg-primary-container text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 ml-auto cursor-pointer"
              loading={submit.isPending}
              type="submit"
            >
              <span>Submit Response ({answeredCount}/{data.questions.length})</span>
              <span className="material-symbols-outlined text-base">send</span>
            </Button>
          </div>
        </div>
      </form>
    </FillFrame>
  );
}

function FillFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 px-4 sm:px-6 md:px-8">
      <div className="max-w-3xl mx-auto">{children}</div>
    </div>
  );
}

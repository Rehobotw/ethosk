import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TIER_RANK, isSectionHeader, type Question, type TargetLanguage, type VerificationTier } from "@shared/types";
import type { SubmitResponseInput } from "@shared/validation/schemas";
import { QuestionInput } from "@/components/survey-fill/QuestionInput";
import { useQuestionTimer } from "@/components/survey-fill/useQuestionTimer";
import { useTextMetrics } from "@/components/survey-fill/useTextMetrics";
import { Button, Card, Icon, LoadingBlock, Notice, Select } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ChatMode } from "./ChatMode";
import { SurveyCompletionSuccessDesktopPage } from "./SurveyCompletionSuccessDesktopPage";

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
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});
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
      } catch {
        // Ignore localStorage access failures
      }
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
    const formattedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return (
      <SurveyCompletionSuccessDesktopPage
        surveyTitle={data?.title}
        rewardEtb={submit.data?.reward_etb ?? data?.reward_etb ?? 25}
        completionDate={formattedDate}
      />
    );
  }

  const questionText = (question: Question, index: number): string => {
    if (language === "en") return question.text;
    if (question.consistencyCheck) return question.text;
    return data.translations?.[language]?.[index] ?? question.text;
  };

  const handleSubmit = () => {
    const missing = data.questions.filter(
      (question) => !isSectionHeader(question.text) && question.required !== false && !answers[question.id]?.trim(),
    );

    if (missing.length > 0) {
      const errors: Record<string, string> = {};
      for (const q of missing) {
        errors[q.id] = "This question requires an answer before submitting.";
      }
      setQuestionErrors(errors);
      setValidationError(
        `Please answer all required questions before submitting. ${missing.length} remaining.`,
      );
      // Scroll to the first unanswered question
      const firstId = missing[0]?.id;
      if (firstId) {
        const el = document.getElementById(`question-card-${firstId}`);
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    setValidationError(null);
    setQuestionErrors({});
    const { timePerQuestion, totalTimeSeconds } = timer.finalize();
    const finalAnswers = { ...answers };
    for (const q of data.questions) {
      if (isSectionHeader(q.text) && !finalAnswers[q.id]) {
        finalAnswers[q.id] = "[section_header]";
      }
    }
    submit.mutate({
      answers: finalAnswers,
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
            } catch {
              // Ignore localStorage access failures
            }
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

  const nonSectionQuestions = data.questions.filter((q) => !isSectionHeader(q.text));
  const totalQuestionCount = nonSectionQuestions.length > 0 ? nonSectionQuestions.length : data.questions.length;
  const answeredCount = nonSectionQuestions.filter((q) => Boolean(answers[q.id]?.trim())).length;
  const progressPercent = Math.min(100, Math.round((answeredCount / totalQuestionCount) * 100));

  return (
    <FillFrame>
      {/* Sticky Progress Bar & Format Bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-stack-sm mb-stack-md border-b border-outline-variant/30">
        <div className="flex items-center justify-between gap-stack-md mb-2">
          <div>
            <h1 className="font-title-sm text-title-sm text-primary font-bold truncate max-w-xs md:max-w-md">
              {data.title}
            </h1>
            <p className="font-body-sm text-xs text-on-surface-variant">
              {totalQuestionCount} questions{data.reward_etb ? ` · ${data.reward_etb} ETB reward` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {availableLanguages.length > 1 && (
              <Select
                aria-label="Language"
                className="w-auto text-xs py-1"
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
              className="px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold flex items-center gap-1.5 opacity-50 cursor-not-allowed text-on-surface-variant"
              disabled
              title="Voice survey mode is coming soon (§7.4)"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">mic</span>
              <span>Voice (Coming Soon)</span>
            </button>

            <button
              className="px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container flex items-center gap-1.5 transition-all text-primary cursor-pointer"
              onClick={() => setActiveMode("chat")}
              title="Switch to AI Chat Mode"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">forum</span>
              <span>Chat</span>
            </button>

            <Link aria-label="Leave survey" to="/inbox">
              <Icon className="text-on-surface-variant hover:text-primary transition-colors p-1" name="close" />
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-on-surface-variant">
            <span>
              {answeredCount === totalQuestionCount
                ? "All questions answered"
                : `${answeredCount} of ${totalQuestionCount} answered`}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-container-high overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {data.description && (
        <p className="mb-stack-md font-body-md text-body-md text-on-surface-variant">
          {data.description}
        </p>
      )}

      {isDraftRestored && (
        <Notice tone="info">
          Draft progress restored. You can continue answering from where you left off.
        </Notice>
      )}

      <form
        className="space-y-stack-md"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {data.questions.map((question, index) => {
          if (isSectionHeader(question.text)) {
            return (
              <div
                key={question.id}
                id={`question-card-${question.id}`}
                className="pt-6 pb-2 border-b border-primary/20 flex items-center gap-2"
              >
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">bookmark</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-primary tracking-widest uppercase block">
                    Section
                  </span>
                  <h3 className="text-base font-bold text-on-surface">
                    {questionText(question, index)}
                  </h3>
                </div>
              </div>
            );
          }
          return (
            <Card
              key={question.id}
              id={`question-card-${question.id}`}
              className={questionErrors[question.id] ? "border border-error/60 ring-1 ring-error/20" : undefined}
            >
              <p className="font-semibold text-sm mb-3 text-slate-800">{questionText(question, index)}</p>
              <QuestionInput
                onBlur={() => timer.blurQuestion(question.id)}
                onChange={(val) => {
                  updateAnswer(question.id, val);
                  if (questionErrors[question.id]) {
                    setQuestionErrors((prev) => {
                      const next = { ...prev };
                      delete next[question.id];
                      return next;
                    });
                  }
                }}
                onFocus={() => timer.focusQuestion(question.id)}
                onKeystroke={() => textMetrics.recordKeystroke(question.id)}
                onPaste={() => textMetrics.recordPaste(question.id)}
                question={question}
                value={answers[question.id] || ""}
              />
              {questionErrors[question.id] && (
                <p className="mt-2 text-xs text-error font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {questionErrors[question.id]}
                </p>
              )}
            </Card>
          );
        })}

        {validationError && <Notice tone="error">{validationError}</Notice>}

        <div className="pt-stack-md flex justify-end gap-3">
          <Button
            className="px-8 py-3 font-semibold"
            loading={submit.isPending}
            type="submit"
          >
            Submit Response ({answeredCount}/{totalQuestionCount})
          </Button>
        </div>
      </form>
    </FillFrame>
  );
}

function FillFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background py-stack-md px-margin-mobile md:px-margin-desktop">
      <div className="max-w-3xl mx-auto">{children}</div>
    </div>
  );
}

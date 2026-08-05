import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Question, TargetLanguage } from "@shared/types";
import type { SubmitResponseInput } from "@shared/validation/schemas";
import { QuestionInput } from "@/components/survey-fill/QuestionInput";
import { useQuestionTimer } from "@/components/survey-fill/useQuestionTimer";
import { useTextMetrics } from "@/components/survey-fill/useTextMetrics";
import { Button, Card, Icon, LoadingBlock, Notice, Select } from "@/components/ui";
import { ApiRequestError, api } from "@/lib/api";
import { ChatMode } from "./ChatMode";

interface FillPayload {
  id: string;
  title: string;
  description: string | null;
  reward_etb: number | null;
  questions: Question[];
  translations: Partial<Record<TargetLanguage, string[]>>;
}

type Language = "en" | TargetLanguage;

const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  am: "አማርኛ (Amharic)",
  om: "Afaan Oromoo",
};

export function SurveyFillPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const timer = useQuestionTimer();
  const textMetrics = useTextMetrics();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<Language>("en");
  const [chatMode, setChatMode] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["survey-fill", id],
    queryFn: () => api<FillPayload>(`/surveys/${id}/fill`),
    // The consistency check is placed randomly, so refetching mid-fill would move
    // the question out from under the respondent.
    staleTime: Infinity,
    retry: false,
  });

  const submit = useMutation({
    mutationFn: (payload: SubmitResponseInput) =>
      api<{ response_id: string; reward_etb: number }>(`/surveys/${id}/responses`, {
        body: payload,
      }),
    onSuccess: () => setSubmitted(true),
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

  if (submitted) {
    const reward = submit.data?.reward_etb ?? data.reward_etb ?? 0;
    return (
      <FillFrame>
        <Card className="p-stack-lg text-center">
          <Icon className="text-[40px] text-status-passed" filled name="task_alt" />
          <h1 className="mt-stack-sm font-headline-md text-headline-md text-on-surface">
            Response submitted
          </h1>
          {reward > 0 ? (
            <div className="mt-stack-md flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 font-label-caps text-label-caps text-amber-600 font-semibold border border-amber-500/20">
                <Icon className="text-[16px]" name="schedule" />
                Pending Payment: {reward} ETB
              </span>
            </div>
          ) : null}
          <p className="mt-stack-sm font-body-md text-body-md text-on-surface-variant">
            Thank you. Your answers have been recorded
            {reward > 0
              ? ` and your reward of ${reward} ETB is currently in Pending Payment status while being processed into your wallet.`
              : "."}
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
    // The consistency check is generated per respondent and has no translation, so
    // it always shows its English text.
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

  if (chatMode) {
    return (
      <FillFrame>
        <ChatMode
          onFallback={() => setChatMode(false)}
          onFinish={(chatAnswers) => {
            setAnswers((current) => ({ ...current, ...chatAnswers }));
            setChatMode(false);
          }}
          questions={data.questions}
          surveyId={data.id}
          title={data.title}
        />
      </FillFrame>
    );
  }

  return (
    <FillFrame>
      <div className="mb-stack-md flex items-start justify-between gap-stack-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary">{data.title}</h1>
          <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
            {data.questions.length} question{data.questions.length === 1 ? "" : "s"}
            {data.reward_etb ? ` · ${data.reward_etb} ETB` : ""}
          </p>
        </div>
        <Link aria-label="Leave survey" to="/inbox">
          <Icon className="text-on-surface-variant" name="close" />
        </Link>
      </div>

      {data.description ? (
        <Card className="mb-stack-md p-stack-md">
          <h2 className="font-label-caps text-label-caps uppercase text-on-surface-variant">
            About this study
          </h2>
          {/* `whitespace-pre-line` keeps the researcher's paragraph breaks, which
              is the difference between a readable brief and one long block. */}
          <p className="mt-stack-sm whitespace-pre-line font-body-md text-body-md text-on-surface-variant">
            {data.description}
          </p>
        </Card>
      ) : null}

      <div className="mb-stack-md flex flex-wrap items-center gap-stack-sm">
        {availableLanguages.length > 1 ? (
          <Select
            aria-label="Language"
            className="w-auto"
            onChange={(event) => setLanguage(event.target.value as Language)}
            value={language}
          >
            {availableLanguages.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_LABELS[code]}
              </option>
            ))}
          </Select>
        ) : null}

        <Button icon="forum" onClick={() => setChatMode(true)} variant="outline">
          Switch to chat mode
        </Button>
      </div>

      <div className="space-y-stack-md">
        {data.questions.map((question, index) => (
          <Card className="p-stack-md" key={question.id}>
            <div className="mb-stack-sm flex items-start gap-stack-sm">
              <span className="rounded bg-primary-container px-stack-sm py-1 font-status-badge text-status-badge text-on-primary-container">
                Q{index + 1}
              </span>
              <p className="flex-1 font-title-sm text-title-sm text-on-surface">
                {questionText(question, index)}
              </p>
            </div>

            <QuestionInput
              onBlur={() => timer.blurQuestion(question.id)}
              onChange={(next) => {
                textMetrics.recordValue(question.id, next);
                setAnswers((current) => ({ ...current, [question.id]: next }));
              }}
              onFocus={() => timer.focusQuestion(question.id)}
              onKeystroke={() => textMetrics.recordKeystroke(question.id)}
              onPaste={() => textMetrics.recordPaste(question.id)}
              question={question}
              value={answers[question.id] ?? ""}
            />
          </Card>
        ))}
      </div>

      {validationError ? (
        <div className="mt-stack-md">
          <Notice tone="warning">{validationError}</Notice>
        </div>
      ) : null}

      {submit.error ? (
        <div className="mt-stack-md">
          <Notice tone="error">
            {submit.error instanceof ApiRequestError
              ? submit.error.message
              : "Your response could not be submitted."}
          </Notice>
          {submit.error instanceof ApiRequestError &&
          submit.error.code === "ALREADY_RESPONDED" ? (
            <Button className="mt-stack-sm" onClick={() => navigate("/inbox")} variant="outline">
              Back to inbox
            </Button>
          ) : null}
        </div>
      ) : null}

      <Button
        className="mt-stack-md w-full py-3"
        loading={submit.isPending}
        onClick={handleSubmit}
      >
        Submit response
      </Button>

      <p className="mt-stack-sm text-center font-body-sm text-[12px] text-on-surface-variant">
        Submitting records a consent event against your account.
      </p>
    </FillFrame>
  );
}

/** Distraction-free frame: no tab bar, so a partial fill is not casually abandoned. */
function FillFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-2xl px-margin-mobile py-stack-md">{children}</div>
    </div>
  );
}

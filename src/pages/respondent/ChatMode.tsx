import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isSectionHeader, type Question, type TargetLanguage } from "@shared/types";
import { Button, Card, Icon, Input, Notice, Select, Spinner } from "@/components/ui";
import { api } from "@/lib/api";

type Language = "en" | TargetLanguage;

const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  am: "አማርኛ (Amharic)",
  om: "Afaan Oromoo",
};

function renderMessageContent(content: string) {
  const parts = content.split(/(\*\*.*?\*\*)/g);
  return (
    <div className="space-y-1">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const inner = part.slice(2, -2).trim();
          if (isSectionHeader(inner)) {
            return (
              <div
                key={i}
                className="my-2 py-1 px-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
              >
                <Icon name="bookmark" className="text-[16px]" />
                <span>{inner}</span>
              </div>
            );
          }
          return (
            <strong key={i} className="font-semibold text-primary">
              {inner}
            </strong>
          );
        }
        return (
          <span key={i} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      })}
    </div>
  );
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isFollowup?: boolean;
}

interface ChatTurnResponse {
  reply: string | null;
  fallback_to_form: boolean;
  question_index: number | null;
  question_type: "single_choice" | "multi_choice" | "text" | null;
  options: string[] | null;
  is_followup: boolean;
  is_complete: boolean;
  total_questions: number;
  message?: string;
}

export interface ChatTimingData {
  time_per_question: Record<string, number>;
  total_time_seconds: number;
}

export function ChatMode({
  surveyId,
  title,
  questions,
  initialLanguage = "en",
  availableLanguages = ["en"],
  onLanguageChange,
  onFinish,
  onFallback,
  submitting = false,
}: {
  surveyId: string;
  title: string;
  questions: Question[];
  initialLanguage?: Language;
  availableLanguages?: Language[];
  onLanguageChange?: (lang: Language) => void;
  onFinish: (answers: Record<string, string>, timings: ChatTimingData) => void;
  onFallback: () => void;
  submitting?: boolean;
}) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [collectedAnswers, setCollectedAnswers] = useState<Record<string, string>>({});
  
  const firstRealIndex = questions.findIndex((q) => !isSectionHeader(q.text));
  const initialQ = firstRealIndex !== -1 ? questions[firstRealIndex] : questions[0];
  const [currentTurnMeta, setCurrentTurnMeta] = useState<{
    question_index: number | null;
    question_type: "single_choice" | "multi_choice" | "text" | null;
    options: string[] | null;
    is_followup: boolean;
    is_complete: boolean;
  }>({
    question_index: firstRealIndex !== -1 ? firstRealIndex : 0,
    question_type: initialQ?.type ?? "text",
    options: initialQ?.options ?? null,
    is_followup: false,
    is_complete: false,
  });

  const [selectedMultiOptions, setSelectedMultiOptions] = useState<string[]>([]);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // Timing tracking
  const sessionStartedAt = useRef<number>(Date.now());
  const questionStartTime = useRef<number>(Date.now());
  const timingsRef = useRef<Record<string, number>>({});
  const currentQuestionIndexRef = useRef<number>(0);

  const scrollAnchor = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const turn = useMutation({
    mutationFn: (history: { role: "user" | "assistant"; content: string }[]) =>
      api<ChatTurnResponse>(`/surveys/${surveyId}/chat`, {
        body: { messages: history, language },
      }),
    onSuccess: (result) => {
      if (result.fallback_to_form || !result.reply) {
        setFallbackNotice(result.message ?? "Chat mode is unavailable.");
        return;
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.reply!, isFollowup: result.is_followup },
      ]);

      let effectiveIdx = result.question_index;
      if (effectiveIdx !== null && isSectionHeader(questions[effectiveIdx]?.text)) {
        while (effectiveIdx !== null && effectiveIdx < questions.length && isSectionHeader(questions[effectiveIdx]?.text)) {
          effectiveIdx++;
        }
        if (effectiveIdx >= questions.length) effectiveIdx = null;
      }
      const activeQ = effectiveIdx !== null ? questions[effectiveIdx] : null;

      setCurrentTurnMeta({
        question_index: effectiveIdx,
        question_type: (activeQ?.type ?? result.question_type) ?? null,
        options: activeQ?.options ?? result.options,
        is_followup: result.is_followup,
        is_complete: result.is_complete || (effectiveIdx === null && result.is_complete),
      });

      setSelectedMultiOptions([]);

      if (typeof effectiveIdx === "number") {
        currentQuestionIndexRef.current = effectiveIdx;
        questionStartTime.current = Date.now();
      }
    },
    onError: () => setFallbackNotice("Chat mode is unavailable."),
  });

  // Start conversation on mount
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    turn.mutate([]);
  }, [turn]);

  // Auto scroll to bottom
  useEffect(() => {
    if (typeof scrollAnchor.current?.scrollIntoView === "function") {
      scrollAnchor.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, turn.isPending, currentTurnMeta.options]);

  const handleLanguageSelect = (newLang: Language) => {
    setLanguage(newLang);
    onLanguageChange?.(newLang);
  };

  // Record elapsed time for the answered question
  const recordQuestionTiming = (qIndex: number) => {
    const q = questions[qIndex];
    if (!q) return;
    const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);
    timingsRef.current[q.id] = (timingsRef.current[q.id] ?? 0) + Math.max(1, elapsed);
  };

  const handleSendAnswer = (answerText: string) => {
    const content = answerText.trim();
    if (!content) return;

    const qIdx = currentTurnMeta.question_index ?? currentQuestionIndexRef.current;
    const currentQ = questions[qIdx];

    // Record timing for this question
    if (qIdx !== null) {
      recordQuestionTiming(qIdx);
    }

    // Save answer under question ID
    if (currentQ && !currentTurnMeta.is_followup) {
      setCollectedAnswers((prev) => ({ ...prev, [currentQ.id]: content }));
    } else if (currentQ && currentTurnMeta.is_followup) {
      // Append follow-up detail
      setCollectedAnswers((prev) => ({
        ...prev,
        [currentQ.id]: prev[currentQ.id] ? `${prev[currentQ.id]} — ${content}` : content,
      }));
    }

    const history: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(history);
    setDraft("");
    turn.mutate(history.map(({ role, content }) => ({ role, content })));
  };

  const handleMultiChoiceToggle = (option: string) => {
    setSelectedMultiOptions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option],
    );
  };

  const handleConfirmMultiChoice = () => {
    if (selectedMultiOptions.length === 0) return;
    handleSendAnswer(selectedMultiOptions.join(", "));
  };

  const handleFinish = () => {
    const totalTimeSeconds = Math.round((Date.now() - sessionStartedAt.current) / 1000);
    const finalAnswers = { ...collectedAnswers };
    for (const q of questions) {
      if (isSectionHeader(q.text) && !finalAnswers[q.id]) {
        finalAnswers[q.id] = "[section_header]";
      }
    }
    onFinish(finalAnswers, {
      time_per_question: timingsRef.current,
      total_time_seconds: totalTimeSeconds,
    });
  };

  // Calculate current progress (ignoring section dividers)
  const actualQuestions = questions.filter((q) => !isSectionHeader(q.text));
  const totalCount = actualQuestions.length > 0 ? actualQuestions.length : questions.length;
  const answeredCount = actualQuestions.filter((q) => collectedAnswers[q.id]?.trim()).length;
  const currentActualRank =
    currentTurnMeta.question_index !== null
      ? actualQuestions.findIndex((q) => q.id === questions[currentTurnMeta.question_index!]?.id) + 1
      : Math.min(answeredCount + 1, totalCount);
  const currentDisplayIndex = currentActualRank > 0 ? currentActualRank : Math.min(answeredCount + 1, totalCount);
  const progressPercent = Math.min(100, Math.round((answeredCount / totalCount) * 100));

  const isAllAnswered = currentTurnMeta.is_complete || answeredCount >= totalCount;

  const currentActiveQuestion =
    currentTurnMeta.question_index !== null
      ? questions[currentTurnMeta.question_index]
      : null;

  return (
    <div className="flex flex-col h-[85vh] max-h-[900px]">
      {/* Sticky Progress Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md pb-stack-sm border-b border-outline-variant/30">
        <div className="flex items-center justify-between gap-stack-sm mb-2">
          <div>
            <span className="font-label-sm uppercase tracking-wider text-primary font-bold">
              Conversational Mode
            </span>
            <h1 className="font-title-sm text-title-sm text-on-surface truncate max-w-xs md:max-w-md">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {availableLanguages.length > 1 && (
              <Select
                aria-label="Language"
                className="w-auto text-xs py-1"
                onChange={(e) => handleLanguageSelect(e.target.value as Language)}
                value={language}
              >
                {availableLanguages.map((code) => (
                  <option key={code} value={code}>
                    {LANGUAGE_LABELS[code]}
                  </option>
                ))}
              </Select>
            )}

            <Button icon="list_alt" onClick={onFallback} variant="ghost">
              Form mode
            </Button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[12px] font-medium text-on-surface-variant">
            <span>
              {isAllAnswered
                ? "All questions answered"
                : `Question ${currentDisplayIndex} of ${totalCount}`}
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

      {fallbackNotice && (
        <div className="my-stack-sm">
          <Notice tone="warning" title="Chat mode unavailable">
            {fallbackNotice} Your answers so far are kept — continue in standard form mode.
            <div className="mt-stack-sm">
              <Button onClick={onFallback} variant="outline">
                Continue in form mode
              </Button>
            </div>
          </Notice>
        </div>
      )}

      {/* Main Chat Flow Container */}
      <Card className="flex-1 flex flex-col p-stack-md mt-stack-sm overflow-hidden border border-outline-variant/30 shadow-sm rounded-2xl">
        <div className="flex-1 space-y-stack-md overflow-y-auto pr-1">
          {messages.map((message, index) => (
            <div
              className={`flex gap-stack-sm ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
              key={`${message.role}-${index}`}
            >
              {message.role === "assistant" && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-xs">
                  <Icon className="text-[18px]" name="support_agent" />
                </span>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-stack-md py-stack-sm font-body-md ${
                  message.role === "user"
                    ? "bg-primary text-on-primary rounded-tr-xs"
                    : "bg-surface-container-low text-on-surface border border-outline-variant/20 rounded-tl-xs shadow-xs"
                }`}
              >
                {message.isFollowup && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                    <Icon className="text-[14px]" name="help_outline" />
                    <span>Follow-up prompt</span>
                  </div>
                )}
                {message.role === "assistant" ? (
                  renderMessageContent(message.content)
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {turn.isPending && (
            <div className="flex items-center gap-stack-sm text-on-surface-variant pl-2">
              <Spinner />
              <span className="font-body-sm text-xs">AI is thinking…</span>
            </div>
          )}

          {/* MCQ Quick-Reply Chips for Active Question */}
          {!turn.isPending && !isAllAnswered && currentTurnMeta.options && currentTurnMeta.options.length > 0 && (
            <div className="pt-2 pl-10 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                {currentTurnMeta.question_type === "multi_choice"
                  ? "Select all options that apply:"
                  : "Quick reply options:"}
              </p>

              <div className="flex flex-wrap gap-2">
                {currentTurnMeta.options.map((opt, i) => {
                  const isSelected = selectedMultiOptions.includes(opt);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={turn.isPending}
                      onClick={() => {
                        if (currentTurnMeta.question_type === "multi_choice") {
                          handleMultiChoiceToggle(opt);
                        } else {
                          handleSendAnswer(opt);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all shadow-xs ${
                        currentTurnMeta.question_type === "multi_choice" && isSelected
                          ? "bg-primary text-on-primary border border-primary scale-[1.02]"
                          : "bg-surface-container hover:bg-primary/10 text-on-surface border border-outline-variant/40 hover:border-primary/40"
                      }`}
                    >
                      {currentTurnMeta.question_type === "multi_choice" && (
                        <Icon
                          className="text-[16px]"
                          name={isSelected ? "check_box" : "check_box_outline_blank"}
                        />
                      )}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {currentTurnMeta.question_type === "multi_choice" && (
                <div className="pt-2">
                  <Button
                    disabled={selectedMultiOptions.length === 0 || turn.isPending}
                    onClick={handleConfirmMultiChoice}
                  >
                    Confirm selection ({selectedMultiOptions.length})
                  </Button>
                </div>
              )}
            </div>
          )}

          <div ref={scrollAnchor} />
        </div>

        {/* Active Question Prompt Indicator */}
        {!isAllAnswered && currentActiveQuestion && !isSectionHeader(currentActiveQuestion.text) && (
          <div className="mt-stack-sm px-stack-sm py-1.5 bg-surface-container/60 border border-outline-variant/30 rounded-xl flex items-center justify-between text-xs text-on-surface-variant gap-2">
            <span className="font-semibold text-primary shrink-0">
              Q{currentDisplayIndex}:
            </span>
            <span className="truncate flex-1 font-medium text-on-surface">
              {currentActiveQuestion.text}
            </span>
            {currentActiveQuestion.type && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-container-highest shrink-0">
                {currentActiveQuestion.type.replace("_", " ")}
              </span>
            )}
          </div>
        )}

        {/* Completed State or Input Box */}
        {isAllAnswered ? (
          <div className="mt-stack-md pt-stack-md border-t border-outline-variant/30 bg-surface-container-lowest p-stack-sm rounded-xl text-center space-y-2">
            <p className="font-medium text-sm text-status-passed flex items-center justify-center gap-1">
              <Icon name="check_circle" /> Survey responses completed!
            </p>
            <Button
              className="w-full py-3"
              loading={submitting}
              onClick={handleFinish}
            >
              Review and Submit Response
            </Button>
          </div>
        ) : (
          <div className="mt-stack-sm flex items-center gap-stack-sm border-t border-outline-variant/30 pt-stack-sm">
            <Input
              disabled={turn.isPending || Boolean(fallbackNotice)}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendAnswer(draft);
                }
              }}
              placeholder={
                currentTurnMeta.is_followup
                  ? "Type your detailed answer…"
                  : "Type your answer or select an option above…"
              }
              value={draft}
            />
            <Button
              aria-label="Send"
              disabled={turn.isPending || !draft.trim() || Boolean(fallbackNotice)}
              onClick={() => handleSendAnswer(draft)}
            >
              <Icon className="text-[18px]" name="send" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

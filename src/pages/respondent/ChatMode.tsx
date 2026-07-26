import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Question } from "@shared/types";
import { Button, Card, Icon, Input, Notice, Spinner } from "@/components/ui";
import { api } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  reply: string | null;
  fallback_to_form: boolean;
  message?: string;
}

/**
 * Conversational path through the same questions (FR-RESP-7).
 *
 * Answers collected here are mapped back onto the question IDs in order, so the
 * response that gets scored has the same shape as a form-mode submission. If the
 * provider fails at any point the session falls back to form mode rather than
 * stranding the respondent mid-survey.
 */
export function ChatMode({
  surveyId,
  title,
  questions,
  onFinish,
  onFallback,
}: {
  surveyId: string;
  title: string;
  questions: Question[];
  onFinish: (answers: Record<string, string>) => void;
  onFallback: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [collected, setCollected] = useState<string[]>([]);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const scrollAnchor = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const turn = useMutation({
    mutationFn: (history: ChatMessage[]) =>
      api<ChatResponse>(`/surveys/${surveyId}/chat`, { body: { messages: history } }),
    onSuccess: (result) => {
      if (result.fallback_to_form || !result.reply) {
        setFallbackNotice(result.message ?? "Chat mode is unavailable.");
        return;
      }
      setMessages((current) => [...current, { role: "assistant", content: result.reply! }]);
    },
    onError: () => setFallbackNotice("Chat mode is unavailable."),
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    turn.mutate([]);
  }, [turn]);

  useEffect(() => {
    scrollAnchor.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const content = draft.trim();
    if (!content) return;

    const history: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(history);
    setCollected((current) => [...current, content]);
    setDraft("");
    turn.mutate(history);
  };

  const finish = () => {
    const answers: Record<string, string> = {};
    questions.forEach((question, index) => {
      const answer = collected[index];
      if (answer) answers[question.id] = answer;
    });
    onFinish(answers);
  };

  const answeredAll = collected.length >= questions.length;

  return (
    <div>
      <div className="mb-stack-md flex items-center justify-between gap-stack-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-primary">{title}</h1>
          <p className="mt-base font-body-sm text-body-sm text-on-surface-variant">
            Chat mode · {collected.length} of {questions.length} answered
          </p>
        </div>
        <Button icon="list_alt" onClick={onFallback} variant="ghost">
          Form mode
        </Button>
      </div>

      {fallbackNotice ? (
        <div className="mb-stack-md">
          <Notice tone="warning" title="Chat mode unavailable">
            {fallbackNotice} Your answers so far are kept — continue in the standard form.
            <div className="mt-stack-sm">
              <Button onClick={onFallback} variant="outline">
                Continue in form mode
              </Button>
            </div>
          </Notice>
        </div>
      ) : null}

      <Card className="flex h-[60vh] flex-col p-stack-md">
        <div className="flex-1 space-y-stack-md overflow-y-auto">
          {messages.map((message, index) => (
            <div
              className={`flex gap-stack-sm ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
              key={`${message.role}-${index}`}
            >
              {message.role === "assistant" ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                  <Icon className="text-[18px]" name="support_agent" />
                </span>
              ) : null}
              <p
                className={`max-w-[75%] whitespace-pre-wrap rounded-xl px-stack-md py-stack-sm font-body-md text-body-md ${
                  message.role === "user"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface"
                }`}
              >
                {message.content}
              </p>
            </div>
          ))}

          {turn.isPending ? (
            <div className="flex items-center gap-stack-sm text-on-surface-variant">
              <Spinner />
              <span className="font-body-sm text-body-sm">Typing…</span>
            </div>
          ) : null}

          <div ref={scrollAnchor} />
        </div>

        <div className="mt-stack-md flex gap-stack-sm border-t border-outline-variant pt-stack-md">
          <Input
            disabled={turn.isPending || Boolean(fallbackNotice)}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            placeholder="Type your answer…"
            value={draft}
          />
          <Button
            aria-label="Send"
            disabled={turn.isPending || !draft.trim() || Boolean(fallbackNotice)}
            onClick={send}
          >
            <Icon className="text-[18px]" name="send" />
          </Button>
        </div>
      </Card>

      {answeredAll ? (
        <Button className="mt-stack-md w-full py-3" onClick={finish}>
          Review and submit
        </Button>
      ) : null}
    </div>
  );
}

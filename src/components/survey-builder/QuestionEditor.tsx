import { useState } from "react";
import type { Question, QuestionType, TargetLanguage } from "@shared/types";
import { Button, Icon, Notice, Select, Textarea, Toggle } from "../ui";

export interface ImproveResult {
  original: string;
  improved: string;
  unchanged: boolean;
}

/**
 * Interface per §15.2 of the blueprint: an improvement is always shown beside the
 * original with an explicit accept/reject, never silently applied.
 */
export interface QuestionEditorProps {
  question: Question;
  index: number;
  translations?: Partial<Record<TargetLanguage, string>>;
  onChange: (next: Question) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onImprove: (questionId: string) => Promise<ImproveResult>;
  canRemove: boolean;
  /**
   * Why a rewrite cannot be requested yet, if it cannot. Set means the control is
   * disabled and says so up front, rather than letting the researcher discover the
   * obstacle by clicking.
   */
  improveDisabledReason?: string;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "Single Choice",
  multi_choice: "Multi Choice",
  text: "Text Entry",
};

export function QuestionEditor({
  question,
  index,
  translations,
  onChange,
  onRemove,
  onMove,
  onImprove,
  canRemove,
  improveDisabledReason,
}: QuestionEditorProps) {
  const [suggestion, setSuggestion] = useState<ImproveResult | null>(null);
  const [improving, setImproving] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [showTranslations, setShowTranslations] = useState(false);

  const hasChoices = question.type !== "text";

  const requestImprove = async () => {
    setImproving(true);
    setImproveError(null);
    try {
      const result = await onImprove(question.id);
      if (result.unchanged) {
        setImproveError(
          "The rewrite service is unavailable right now, so the question is unchanged.",
        );
        return;
      }
      setSuggestion(result);
    } catch (error) {
      // Anything thrown here already explains itself — an unmet precondition, a
      // rejected request, a real outage. Reporting all of them as "could not
      // reach" sent researchers looking for a network fault that did not exist.
      setImproveError(
        error instanceof Error && error.message
          ? error.message
          : "Could not reach the rewrite service. The question is unchanged.",
      );
    } finally {
      setImproving(false);
    }
  };

  const updateOption = (optionIndex: number, value: string) => {
    const options = [...(question.options ?? [])];
    options[optionIndex] = value;
    onChange({ ...question, options });
  };

  return (
    <div className="relative rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-lg">
      <div className="mb-stack-md flex items-start justify-between gap-stack-md">
        <div className="flex-1">
          <div className="mb-stack-sm flex flex-wrap items-center gap-stack-sm">
            <span className="rounded bg-primary-container px-stack-sm py-1 font-status-badge text-status-badge text-on-primary-container">
              Q{index + 1}
            </span>
            <Select
              aria-label={`Question ${index + 1} type`}
              className="w-auto py-1 text-body-sm"
              onChange={(event) => {
                const type = event.target.value as QuestionType;
                onChange({
                  ...question,
                  type,
                  // Choice questions need at least two options to be answerable.
                  options:
                    type === "text"
                      ? undefined
                      : question.options?.length
                        ? question.options
                        : ["", ""],
                });
              }}
              value={question.type}
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            aria-label={`Question ${index + 1} text`}
            onChange={(event) => onChange({ ...question, text: event.target.value })}
            placeholder="Enter your question here…"
            rows={2}
            value={question.text}
          />
        </div>

        <div className="ml-stack-md flex flex-col gap-base">
          <button
            aria-label="Move question up"
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-subtle hover:text-primary disabled:opacity-30"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            type="button"
          >
            <Icon className="text-[20px]" name="keyboard_arrow_up" />
          </button>
          <button
            aria-label="Move question down"
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-subtle hover:text-primary"
            onClick={() => onMove(1)}
            type="button"
          >
            <Icon className="text-[20px]" name="keyboard_arrow_down" />
          </button>
          <button
            aria-label="Delete question"
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error disabled:opacity-30"
            disabled={!canRemove}
            onClick={onRemove}
            type="button"
          >
            <Icon className="text-[20px]" name="delete" />
          </button>
        </div>
      </div>

      {hasChoices ? (
        <div className="mb-stack-md space-y-stack-sm">
          {(question.options ?? []).map((option, optionIndex) => (
            <div className="flex items-center gap-stack-sm" key={optionIndex}>
              <Icon
                className="text-outline"
                name={
                  question.type === "single_choice"
                    ? "radio_button_unchecked"
                    : "check_box_outline_blank"
                }
              />
              <input
                aria-label={`Option ${optionIndex + 1}`}
                className="flex-1 rounded-lg border-none bg-surface-subtle p-2 font-body-md text-body-md focus:ring-1 focus:ring-primary"
                onChange={(event) => updateOption(optionIndex, event.target.value)}
                placeholder={`Option ${optionIndex + 1}`}
                value={option}
              />
              <button
                aria-label={`Remove option ${optionIndex + 1}`}
                className="text-outline transition-colors hover:text-error disabled:opacity-30"
                disabled={(question.options?.length ?? 0) <= 2}
                onClick={() =>
                  onChange({
                    ...question,
                    options: (question.options ?? []).filter((_, i) => i !== optionIndex),
                  })
                }
                type="button"
              >
                <Icon name="close" />
              </button>
            </div>
          ))}

          <button
            className="mt-stack-sm flex items-center gap-stack-sm font-body-sm text-body-sm text-primary hover:underline"
            onClick={() => onChange({ ...question, options: [...(question.options ?? []), ""] })}
            type="button"
          >
            <Icon className="text-sm" name="add" /> Add Option
          </button>
        </div>
      ) : null}

      {suggestion ? (
        <div className="mb-stack-md rounded-xl border border-dashed border-primary bg-primary/5 p-stack-md">
          <p className="font-label-caps text-label-caps uppercase text-primary">
            Suggested rewrite
          </p>
          <div className="mt-stack-sm grid gap-stack-md md:grid-cols-2">
            <div>
              <p className="font-label-caps text-[10px] uppercase text-on-surface-variant">
                Original
              </p>
              <p className="mt-base rounded border border-outline-variant/30 bg-white p-2 font-body-md text-body-md text-on-surface">
                {suggestion.original}
              </p>
            </div>
            <div>
              <p className="font-label-caps text-[10px] uppercase text-on-surface-variant">
                Rewritten
              </p>
              <p className="mt-base rounded border border-primary/30 bg-white p-2 font-body-md text-body-md text-on-surface">
                {suggestion.improved}
              </p>
            </div>
          </div>
          <div className="mt-stack-md flex gap-stack-sm">
            <Button
              onClick={() => {
                onChange({ ...question, text: suggestion.improved });
                setSuggestion(null);
              }}
              variant="primary"
            >
              Accept rewrite
            </Button>
            <Button onClick={() => setSuggestion(null)} variant="ghost">
              Keep original
            </Button>
          </div>
        </div>
      ) : null}

      {improveError ? (
        <div className="mb-stack-md">
          <Notice onDismiss={() => setImproveError(null)} tone="warning">
            {improveError}
          </Notice>
        </div>
      ) : null}

      {translations && (translations.am || translations.om) ? (
        <>
          <button
            className="mb-stack-sm flex items-center gap-stack-sm font-label-caps text-label-caps uppercase text-primary"
            onClick={() => setShowTranslations((shown) => !shown)}
            type="button"
          >
            <Icon className="text-[16px]" name="translate" />
            {showTranslations ? "Hide" : "Show"} translations
          </button>

          {showTranslations ? (
            <div className="mb-stack-md rounded-xl border border-dashed border-outline-variant bg-surface-subtle p-stack-md">
              <div className="grid gap-stack-md md:grid-cols-2">
                {translations.am ? (
                  <div>
                    <p className="mb-1 font-label-caps text-[10px] uppercase text-on-surface-variant">
                      Amharic (AI generated)
                    </p>
                    <p className="rounded border border-outline-variant/30 bg-white p-2 font-body-md text-on-surface">
                      {translations.am}
                    </p>
                  </div>
                ) : null}
                {translations.om ? (
                  <div>
                    <p className="mb-1 font-label-caps text-[10px] uppercase text-on-surface-variant">
                      Afan Oromo (AI generated)
                    </p>
                    <p className="rounded border border-outline-variant/30 bg-white p-2 font-body-md text-on-surface">
                      {translations.om}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-stack-sm border-t border-outline-variant pt-stack-md">
        <div className="flex flex-wrap items-center gap-stack-sm">
          <Button
            disabled={Boolean(improveDisabledReason)}
            icon="bolt"
            loading={improving}
            onClick={requestImprove}
            title={improveDisabledReason}
            variant="secondary"
          >
            AI Improve
          </Button>
          {improveDisabledReason ? (
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {improveDisabledReason}
            </span>
          ) : null}
        </div>

        <Toggle
          checked={question.required !== false}
          label="Required"
          onChange={(next) => onChange({ ...question, required: next })}
        />
      </div>
    </div>
  );
}

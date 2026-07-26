import type { Question } from "@shared/types";
import { Icon, Textarea } from "../ui";

export function QuestionInput({
  question,
  value,
  onChange,
  onFocus,
  onBlur,
  onKeystroke,
  onPaste,
}: {
  question: Question;
  value: string;
  onChange: (next: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  /** Called per character-producing key, for the typing-speed fraud signal. */
  onKeystroke?: () => void;
  onPaste?: () => void;
}) {
  if (question.type === "text") {
    return (
      <Textarea
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        // Counted on keydown rather than on change so held-key repeats and
        // programmatic value changes are measured the same way a person types.
        onKeyDown={(event) => {
          if (event.key.length === 1 || event.key === "Backspace" || event.key === "Enter") {
            onKeystroke?.();
          }
        }}
        onPaste={() => onPaste?.()}
        placeholder="Type your answer…"
        rows={3}
        value={value}
      />
    );
  }

  if (question.type === "single_choice") {
    return (
      <div className="space-y-stack-sm" onBlur={onBlur} onFocus={onFocus}>
        {(question.options ?? []).map((option) => {
          const selected = value === option;
          return (
            <button
              className={`flex w-full items-center gap-stack-sm rounded-lg border p-stack-sm text-left font-body-md text-body-md transition-colors ${
                selected
                  ? "border-primary bg-primary/5 text-on-surface"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary"
              }`}
              key={option}
              onClick={() => onChange(option)}
              type="button"
            >
              <Icon
                className={selected ? "text-primary" : "text-outline"}
                filled={selected}
                name={selected ? "radio_button_checked" : "radio_button_unchecked"}
              />
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  // Multi-choice answers are stored as a single pipe-delimited string so the
  // answers map stays Record<string, string> end to end.
  const selectedValues = value ? value.split("|").filter(Boolean) : [];

  return (
    <div className="space-y-stack-sm" onBlur={onBlur} onFocus={onFocus}>
      {(question.options ?? []).map((option) => {
        const selected = selectedValues.includes(option);
        return (
          <button
            className={`flex w-full items-center gap-stack-sm rounded-lg border p-stack-sm text-left font-body-md text-body-md transition-colors ${
              selected
                ? "border-primary bg-primary/5 text-on-surface"
                : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary"
            }`}
            key={option}
            onClick={() => {
              const next = selected
                ? selectedValues.filter((item) => item !== option)
                : [...selectedValues, option];
              onChange(next.join("|"));
            }}
            type="button"
          >
            <Icon
              className={selected ? "text-primary" : "text-outline"}
              filled={selected}
              name={selected ? "check_box" : "check_box_outline_blank"}
            />
            {option}
          </button>
        );
      })}
    </div>
  );
}

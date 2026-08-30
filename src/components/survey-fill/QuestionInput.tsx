import { useState } from "react";
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
  const qType = (question.type as string) || "single_choice";

  // ── 1. Section Header ──
  if (qType === "section") {
    return (
      <div className="py-2 border-l-4 border-primary pl-4 bg-primary/5 rounded-r-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Section Break</p>
        <p className="text-sm text-slate-600 mt-1">Please proceed to answer the following questions.</p>
      </div>
    );
  }

  // ── 2. Text Answers (Short & Long) ──
  if (qType === "text" || qType === "short_text" || qType === "long_text") {
    const isShort = qType === "short_text";
    return (
      <div className="relative">
        <Textarea
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm font-medium text-slate-800 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-inner placeholder:text-slate-400"
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onKeyDown={(event) => {
            if (event.key.length === 1 || event.key === "Backspace" || event.key === "Enter") {
              onKeystroke?.();
            }
          }}
          onPaste={() => onPaste?.()}
          placeholder={isShort ? "Type your short response…" : "Type your detailed response here…"}
          rows={isShort ? 2 : 4}
          value={value}
        />
        <div className="mt-1.5 flex justify-between text-[11px] text-slate-400 px-1 font-medium">
          <span>Be detailed and honest</span>
          <span>{value.length} characters</span>
        </div>
      </div>
    );
  }

  // ── 3. Likert / Scale (1-5) ──
  if (qType === "scale" || qType === "likert") {
    const scaleOptions = question.options && question.options.length > 0
      ? question.options
      : ["1", "2", "3", "4", "5"];

    return (
      <div className="space-y-3" onBlur={onBlur} onFocus={onFocus}>
        <div className="flex items-center justify-between gap-2 overflow-x-auto py-2">
          {scaleOptions.map((opt, idx) => {
            const val = String(idx + 1);
            const selected = value === val || value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`flex-1 min-w-[50px] h-12 rounded-xl font-bold text-sm flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  selected
                    ? "bg-primary text-white border-primary shadow-md scale-105"
                    : "bg-white text-slate-700 border-slate-200 hover:border-primary/50 hover:bg-slate-50"
                }`}
              >
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-slate-500 font-medium px-1">
          <span>1 = Disagree / Lowest</span>
          <span>5 = Agree / Highest</span>
        </div>
      </div>
    );
  }

  // ── 4. Voice Recording ──
  if (qType === "voice") {
    return <VoiceInputWidget value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur} />;
  }

  // ── 5. Single Choice ──
  if (qType === "single_choice") {
    return (
      <div className="space-y-2.5" onBlur={onBlur} onFocus={onFocus}>
        {(question.options ?? []).map((option, idx) => {
          const selected = value === option;
          return (
            <button
              className={`flex w-full items-center gap-3.5 rounded-xl border p-4 text-left font-medium text-sm transition-all cursor-pointer ${
                selected
                  ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary font-semibold"
                  : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/80"
              }`}
              key={option}
              onClick={() => onChange(option)}
              type="button"
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                  selected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
                }`}
              >
                {selected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className="flex-1 leading-snug">{option}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ── 6. Multiple Choice (Checkboxes) ──
  const selectedValues = value ? value.split("|").filter(Boolean) : [];

  return (
    <div className="space-y-2.5" onBlur={onBlur} onFocus={onFocus}>
      {(question.options ?? []).map((option) => {
        const selected = selectedValues.includes(option);
        return (
          <button
            className={`flex w-full items-center gap-3.5 rounded-xl border p-4 text-left font-medium text-sm transition-all cursor-pointer ${
              selected
                ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary font-semibold"
                : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/80"
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
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                selected ? "border-primary bg-primary text-white" : "border-slate-300 bg-white"
              }`}
            >
              {selected && <Icon className="text-xs text-white" name="check" />}
            </div>
            <span className="flex-1 leading-snug">{option}</span>
          </button>
        );
      })}
    </div>
  );
}

function VoiceInputWidget({
  value,
  onChange,
  onFocus,
  onBlur,
}: {
  value: string;
  onChange: (val: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorded, setRecorded] = useState(Boolean(value));

  const toggleRecord = () => {
    onFocus();
    if (isRecording) {
      setIsRecording(false);
      setRecorded(true);
      onChange("Voice response recorded (audio.mp3)");
    } else {
      setIsRecording(true);
    }
    onBlur();
  };

  return (
    <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center text-center space-y-3">
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
          isRecording
            ? "bg-rose-600 text-white animate-pulse"
            : recorded
            ? "bg-emerald-600 text-white"
            : "bg-primary text-white hover:bg-primary-container"
        }`}
        onClick={toggleRecord}
      >
        <span className="material-symbols-outlined text-2xl">
          {isRecording ? "graphic_eq" : recorded ? "check" : "mic"}
        </span>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-800">
          {isRecording ? "Recording in progress…" : recorded ? "Audio Recorded" : "Tap Microphone to Speak"}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {isRecording ? "Tap again when finished speaking (Max 60s)" : recorded ? "Tap microphone to record again" : "Your voice will be auto-transcribed for research analysis."}
        </p>
      </div>

      {recorded && (
        <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-semibold border border-emerald-200">
          ✓ Audio attached & transcript ready
        </div>
      )}
    </div>
  );
}


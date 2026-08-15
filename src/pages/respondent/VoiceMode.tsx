import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Question, TargetLanguage } from "@shared/types";

type Language = "en" | TargetLanguage;

export function VoiceMode({
  surveyId: _surveyId,
  title,
  questions,
  initialLanguage = "en",
  onFinish,
  onFallback,
}: {
  surveyId: string;
  title: string;
  questions: Question[];
  initialLanguage?: Language;
  onFinish: (answers: Record<string, string>) => void;
  onFallback: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isPlayingPrompt, setIsPlayingPrompt] = useState(false);
  const [promptDuration] = useState(16);
  const [collectedAnswers, setCollectedAnswers] = useState<Record<string, string>>({});

  const currentQ = questions[currentIdx] || questions[0] || { id: "q1", text: "Sample Question", type: "text" as const, required: true };
  const progressPercent = Math.round(((currentIdx + 1) / Math.max(1, questions.length)) * 100);

  // Recording timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordDuration((d) => (d >= 120 ? 120 : d + 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Auto assign a qualitative response for the prototype
      const transcript =
        language === "am"
          ? "አብዛኛው ችግራችን የመጣው በመጓጓዣ እጥረት እና በቂ የማቀዝቀዣ ክፍሎች ባለመኖራቸው ነው..."
          : "Most of our challenges came from logistical bottlenecks and limited cold storage facilities during peak harvesting season.";
      setCollectedAnswers((prev) => ({
        ...prev,
        [currentQ.id]: transcript,
      }));
    } else {
      setRecordDuration(0);
      setIsRecording(true);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setIsRecording(false);
      setRecordDuration(0);
    } else {
      onFinish(collectedAnswers);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 font-body-md text-on-surface">
      {/* ── 1. Header (Stitch Screen ac605f547d8147cc94644474a41a3729) ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-headline-lg font-bold text-primary mb-2 tracking-tight">
              Voice Survey Experience
            </h1>
            <p className="text-sm md:text-base text-on-surface-variant max-w-2xl">
              Responses are end-to-end encrypted and transcribed securely for qualitative analysis. Your privacy is paramount.
            </p>
          </div>
          <button
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            onClick={onFallback}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            Switch to Text Form
          </button>
        </div>
      </div>

      {/* ── 2. Readiness Banner ── */}
      <div className="bg-[#EDF3FF] rounded-xl p-4 md:p-5 border border-primary-fixed-dim flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-primary font-medium text-xs md:text-sm">
            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
            <span>Microphone Connected &amp; Calibrated</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-outline-variant/60" />
          <div className="flex items-center gap-2 text-on-surface-variant text-xs md:text-sm">
            <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
            <span>Low Noise Environment</span>
          </div>
        </div>

        <div className="relative w-full sm:w-auto">
          <select
            className="w-full sm:w-auto appearance-none bg-white border border-outline-variant/50 rounded-lg py-2 pl-3 pr-9 text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
            onChange={(e) => setLanguage(e.target.value as Language)}
            value={language}
          >
            <option value="en">English</option>
            <option value="am">Amharic (አማርኛ)</option>
            <option value="om">Afaan Oromoo</option>
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">
            arrow_drop_down
          </span>
        </div>
      </div>

      {/* ── 3. Survey Card ── */}
      <div className="bg-white rounded-xl border border-[#E1E8EE] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,89,133,0.06)]">
        {/* Card Header & Stepper */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-xl font-headline-md font-bold text-on-surface max-w-lg">
              {title}
            </h2>
            <span className="text-xs font-semibold text-secondary">
              Question {currentIdx + 1} of {questions.length}
            </span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="space-y-10">
          {/* Section A (Listen to Prompt) */}
          <div>
            <h3 className="text-xs font-label-caps text-secondary uppercase mb-4 tracking-wider font-semibold">
              A. Listen to Prompt
            </h3>
            <div className="bg-[#f8f9ff] rounded-xl p-4 border border-outline-variant/40 flex flex-col md:flex-row gap-4 md:items-center">
              <div className="flex items-center gap-3">
                <button
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-[#003450] transition-all shadow-xs active:scale-95 cursor-pointer"
                  onClick={() => setIsPlayingPrompt(!isPlayingPrompt)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isPlayingPrompt ? "pause" : "play_arrow"}
                  </span>
                </button>
                <span className="text-xs text-secondary font-mono min-w-[70px]">
                  0:{promptDuration} / 0:42
                </span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="w-full bg-outline-variant/40 h-1.5 rounded-full relative cursor-pointer">
                  <div className="absolute left-0 top-0 h-full bg-primary rounded-full" style={{ width: "38%" }} />
                  <div className="absolute w-3 h-3 bg-primary rounded-full top-1/2 -translate-y-1/2 shadow-xs" style={{ left: "38%" }} />
                </div>
              </div>
            </div>
            <p className="mt-4 text-base md:text-lg text-on-surface border-l-4 border-secondary-container pl-4 italic font-serif">
              "{currentQ.text}"
            </p>
          </div>

          {/* Section B (Speak / Record Response) */}
          <div className="border-t border-outline-variant/30 pt-8">
            <h3 className="text-xs font-label-caps text-secondary uppercase mb-6 tracking-wider font-semibold flex items-center gap-2">
              <span>B. Record Response</span>
              {isRecording && <span className="inline-flex w-2 h-2 rounded-full bg-error animate-pulse" />}
            </h3>

            <div className="flex flex-col items-center justify-center p-8 bg-[#f8f9ff] rounded-xl border border-outline-variant/40 text-center relative overflow-hidden">
              {/* Timer */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-error/10 text-error px-3 py-1 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                <span>{formatTimer(recordDuration)} / 2:00 max</span>
              </div>

              {/* Mic Button */}
              <button
                className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 relative z-10 cursor-pointer shadow-lg transition-all active:scale-95 ${
                  isRecording
                    ? "bg-error text-white animate-pulse ring-8 ring-error/20"
                    : "bg-primary text-white hover:bg-[#003450]"
                }`}
                onClick={toggleRecording}
                type="button"
              >
                <span className="material-symbols-outlined text-[40px]">
                  {isRecording ? "stop" : "mic"}
                </span>
              </button>

              {/* Waveform Visualizer */}
              <div className="flex items-end gap-1.5 h-12 mb-6 opacity-80">
                {[30, 60, 100, 40, 80, 50, 90, 70, 40, 100, 60, 30].map((h, i) => (
                  <div
                    className={`w-1.5 bg-primary rounded-t-sm transition-all duration-300 ${
                      isRecording ? "animate-pulse" : ""
                    }`}
                    key={i}
                    style={{ height: isRecording ? `${h}%` : "20%" }}
                  />
                ))}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  className="px-4 py-2 rounded-lg border border-outline-variant text-secondary text-xs font-semibold hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer"
                  onClick={() => {
                    setIsRecording(false);
                    setRecordDuration(0);
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">replay</span>
                  <span>Re-record Audio</span>
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-all flex items-center gap-1.5 cursor-pointer"
                  onClick={() => setIsRecording(false)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">pause</span>
                  <span>Pause</span>
                </button>
                <button
                  className="px-4 py-2 rounded-lg border border-outline-variant text-secondary text-xs font-semibold hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">play_circle</span>
                  <span>Playback My Recording</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section C (Live Transcription Preview) */}
          <div className="border-t border-outline-variant/30 pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h3 className="text-xs font-label-caps text-secondary uppercase tracking-wider font-semibold">
                C. Live Transcription Preview
              </h3>
              <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 w-fit">
                <span className="material-symbols-outlined text-[14px]">done_all</span>
                <span>Audio Legibility &amp; Clarity Checked</span>
              </span>
            </div>

            <div className="bg-[#f8f9ff] border border-outline-variant/40 rounded-xl p-5 min-h-[110px] relative text-sm leading-relaxed">
              <p className="mb-2 text-on-surface-variant">
                <span className="font-semibold text-secondary">Amharic:</span>{" "}
                {collectedAnswers[currentQ.id]
                  ? "አብዛኛው ችግራችን የመጣው በመጓጓዣ እጥረት እና በቂ የማቀዝቀዣ ክፍሎች ባለመኖራቸው ነው..."
                  : "ድምጽዎን ሲመዘግቡ እዚህ ጋር በራስ-ሰር ይገለበጣል..."}
              </p>
              <p className="text-on-surface">
                <span className="font-semibold text-secondary">English:</span>{" "}
                {collectedAnswers[currentQ.id] ||
                  "Your transcribed answer will stream here live with neural speech-to-text validation..."}
              </p>
              {isRecording && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1 text-primary animate-pulse text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  <span>Transcribing…</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Bottom Actions ── */}
      <div className="flex justify-between items-center border-t border-outline-variant/30 pt-6">
        <Link
          className="text-sm text-on-surface-variant hover:text-primary transition-colors underline decoration-outline-variant underline-offset-4"
          to="/inbox"
        >
          Save Draft &amp; Exit
        </Link>
        <button
          className="bg-primary hover:bg-[#003450] text-white text-xs font-bold px-7 py-3 rounded-lg shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          onClick={handleNext}
          type="button"
        >
          <span>{currentIdx < questions.length - 1 ? "Next Question" : "Submit Voice Survey"}</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

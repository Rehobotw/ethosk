import type { FraudFlag, FraudSignals, TextMetrics } from "../types.js";

export interface ScoreResponseInput {
  questionCount: number;
  totalTimeSeconds: number;
  /** Substantive answers only — the consistency-check duplicate is excluded. */
  answers: Record<string, string>;
  /**
   * Whether the rephrased duplicate matched its original. `null` when the survey
   * was too short for a check to be inserted.
   */
  consistencyCheckPassed: boolean | null;
  /** Typing telemetry keyed by question id, for free-text answers only. */
  textMetrics?: Record<string, TextMetrics>;
}

export interface ScoreResponseResult {
  flag: FraudFlag;
  signals: FraudSignals;
}

export interface ScoreThresholds {
  minSecondsPerQuestion: number;
  straightLineThreshold: number;
  /** Answers at or above this length are treated as "long text". */
  longTextMinChars: number;
  /** Sustained characters per second above which typing is implausible. */
  maxTypingCharsPerSecond: number;
}

export const DEFAULT_THRESHOLDS: ScoreThresholds = {
  minSecondsPerQuestion: 8,
  straightLineThreshold: 0.7,
  longTextMinChars: 80,
  maxTypingCharsPerSecond: 15,
};

/**
 * The fraud decision. Deterministic, dependency-free, and binary: a response is
 * flagged as fraud or it is not.
 *
 * No AI is involved. The flag is computed from the signals below and nothing
 * else, so a response is scored identically every time and an unavailable model
 * cannot change the outcome.
 *
 * A signal only flags when it is genuinely indicative of fraud. Being merely
 * inconclusive is not fraud, so it does not flag.
 */
export function scoreResponse(
  input: ScoreResponseInput,
  thresholds: ScoreThresholds = DEFAULT_THRESHOLDS,
): ScoreResponseResult {
  const expectedMinSeconds = input.questionCount * thresholds.minSecondsPerQuestion;

  const values = Object.values(input.answers);
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  const mostCommon = values.length ? Math.max(...Object.values(counts)) : 0;
  const straightLineRatio = values.length ? mostCommon / values.length : 0;

  const tooFast = input.totalTimeSeconds < expectedMinSeconds;
  // Straight-lining is only meaningful once there are enough answers for a
  // repeated value to be a pattern rather than a coincidence.
  const straightLining = values.length >= 4 && straightLineRatio >= thresholds.straightLineThreshold;

  const text = analyzeTextMetrics(input.textMetrics, thresholds);

  const tripped: string[] = [];
  if (input.consistencyCheckPassed === false) tripped.push("consistency_check");
  if (tooFast) tripped.push("too_fast");
  if (straightLining) tripped.push("straight_lining");
  if (text.pastedLongText) tripped.push("pasted_long_text");
  if (text.impossibleTypingSpeed) tripped.push("typing_speed");

  const signals: FraudSignals = {
    total_time_seconds: input.totalTimeSeconds,
    expected_min_seconds: expectedMinSeconds,
    straight_line_ratio: Number(straightLineRatio.toFixed(2)),
    consistency_check_passed: input.consistencyCheckPassed,
    max_typing_chars_per_second: text.maxCharsPerSecond,
    pasted_long_text: text.pastedLongText,
    tripped,
  };

  return { flag: isFraud(input, tooFast, straightLining, text) ? "flagged" : "clean", signals };
}

/**
 * Flags when a signal contradicts data we already hold, or when two independent
 * weak signals agree.
 *
 * A failed consistency check flags on its own: the respondent gave two different
 * answers to the same question, which is self-contradiction rather than
 * suspicion. Pasted or impossibly-fast long text flags on its own for the same
 * reason — the text demonstrably was not composed in the field.
 *
 * Speed and straight-lining are each individually weak (a fast, decisive
 * respondent is not a fraudster), so either alone is not enough; together they
 * are.
 */
function isFraud(
  input: ScoreResponseInput,
  tooFast: boolean,
  straightLining: boolean,
  text: TextAnalysis,
): boolean {
  if (input.consistencyCheckPassed === false) return true;
  if (text.pastedLongText || text.impossibleTypingSpeed) return true;
  return tooFast && straightLining;
}

interface TextAnalysis {
  maxCharsPerSecond: number | null;
  pastedLongText: boolean;
  impossibleTypingSpeed: boolean;
}

function analyzeTextMetrics(
  metrics: Record<string, TextMetrics> | undefined,
  thresholds: ScoreThresholds,
): TextAnalysis {
  const result: TextAnalysis = {
    maxCharsPerSecond: null,
    pastedLongText: false,
    impossibleTypingSpeed: false,
  };

  if (!metrics) return result;

  for (const entry of Object.values(metrics)) {
    // Short answers carry no signal: "yes" typed quickly is not suspicious.
    if (entry.length < thresholds.longTextMinChars) continue;

    // A long answer with essentially no keystrokes behind it was pasted, whether
    // or not the paste event itself was observed.
    if (entry.pastes > 0 || entry.keystrokes < entry.length / 4) {
      result.pastedLongText = true;
    }

    if (entry.typingSeconds > 0) {
      const rate = entry.length / entry.typingSeconds;
      result.maxCharsPerSecond = Math.max(result.maxCharsPerSecond ?? 0, Number(rate.toFixed(1)));
      if (rate > thresholds.maxTypingCharsPerSecond) {
        result.impossibleTypingSpeed = true;
      }
    }
  }

  return result;
}

/** Human-readable labels for the signals that tripped, for the researcher UI. */
export const SIGNAL_LABELS: Record<string, string> = {
  consistency_check: "Contradicted an earlier answer",
  too_fast: "Completed faster than the expected minimum",
  straight_lining: "Repeated the same answer throughout",
  pasted_long_text: "Long answer was pasted, not typed",
  typing_speed: "Typed faster than is plausible",
};

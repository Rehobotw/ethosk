import type { FraudFlag, Question } from "../types.js";

/** Below this many completed responses the AI summary is suppressed (FR-RSR-8a). */
export const MIN_RESPONSES_FOR_SUMMARY = 5;

export interface AggregateInputResponse {
  answers: Record<string, string>;
  fraud_flag: FraudFlag;
}

export interface SurveyAnalytics {
  response_count: number;
  targeted_count: number;
  completion_rate: number;
  flagged_count: number;
  clean_count: number;
  /** Per-question answer distributions, excluding flagged responses by default. */
  distributions: Record<string, Record<string, number>>;
  ai_summary: string[] | null;
}

export interface AggregateOptions {
  /**
   * Include `flagged` responses in the distributions. Off by default so flagged
   * noise does not skew the charts, but a researcher can toggle it on to inspect
   * everything (§15.6).
   */
  includeFlagged?: boolean;
}

/**
 * Aggregates raw responses into the dashboard payload. Free-text answers are
 * bucketed by exact value; nothing here is sent to a model — the caller passes
 * only these aggregates to the summary prompt, never raw rows (§15.6).
 */
export function aggregateResponses(
  responses: AggregateInputResponse[],
  questions: Question[],
  targetedCount: number,
  options: AggregateOptions = {},
): Omit<SurveyAnalytics, "ai_summary"> {
  const flaggedCount = responses.filter((r) => r.fraud_flag === "flagged").length;
  const cleanCount = responses.length - flaggedCount;

  const counted = options.includeFlagged
    ? responses
    : responses.filter((r) => r.fraud_flag !== "flagged");

  const distributions: Record<string, Record<string, number>> = {};
  for (const question of questions) {
    // Free-text answers are unbounded, so charting them is not meaningful.
    if (question.type === "text") continue;

    const buckets: Record<string, number> = {};
    for (const option of question.options ?? []) {
      buckets[option] = 0;
    }
    for (const response of counted) {
      const answer = response.answers[question.id];
      if (answer === undefined || answer === "") continue;
      // Multi-choice answers arrive as a delimited string.
      const values: string[] = question.type === "multi_choice" ? answer.split("|") : [answer];
      for (const value of values) {
        const key = value.trim();
        if (!key) continue;
        buckets[key] = (buckets[key] ?? 0) + 1;
      }
    }
    distributions[question.id] = buckets;
  }

  return {
    response_count: responses.length,
    targeted_count: targetedCount,
    completion_rate: targetedCount > 0 ? round2(responses.length / targetedCount) : 0,
    flagged_count: flaggedCount,
    clean_count: cleanCount,
    distributions,
  };
}

export function shouldGenerateSummary(responseCount: number): boolean {
  return responseCount >= MIN_RESPONSES_FOR_SUMMARY;
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

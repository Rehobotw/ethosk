import { useCallback, useRef } from "react";

/**
 * Accumulates time-on-question from focus and blur events.
 *
 * No countdown or elapsed time is ever surfaced to the respondent: showing one
 * would let a bad-faith respondent pace themselves against the threshold
 * (FR-RESP-5). The totals are submitted with the response and reconciled
 * server-side.
 */
export function useQuestionTimer() {
  const totals = useRef<Record<string, number>>({});
  const activeQuestion = useRef<string | null>(null);
  const activeSince = useRef<number>(0);
  const startedAt = useRef<number>(Date.now());

  const commitActive = useCallback(() => {
    const questionId = activeQuestion.current;
    if (!questionId) return;

    const elapsedSeconds = (Date.now() - activeSince.current) / 1000;
    totals.current[questionId] = (totals.current[questionId] ?? 0) + elapsedSeconds;
    activeQuestion.current = null;
  }, []);

  const focusQuestion = useCallback(
    (questionId: string) => {
      // Focus can move between controls inside one question (radio options); only
      // restart the clock when the question itself changes.
      if (activeQuestion.current === questionId) return;
      commitActive();
      activeQuestion.current = questionId;
      activeSince.current = Date.now();
    },
    [commitActive],
  );

  const blurQuestion = useCallback(
    (questionId: string) => {
      if (activeQuestion.current !== questionId) return;
      commitActive();
    },
    [commitActive],
  );

  const finalize = useCallback(() => {
    commitActive();
    const timePerQuestion = Object.fromEntries(
      Object.entries(totals.current).map(([id, seconds]) => [id, Math.round(seconds)]),
    );
    const totalTimeSeconds = Math.round((Date.now() - startedAt.current) / 1000);
    return { timePerQuestion, totalTimeSeconds };
  }, [commitActive]);

  return { focusQuestion, blurQuestion, finalize };
}

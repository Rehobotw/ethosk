import { useCallback, useRef } from "react";
import type { TextMetrics } from "@shared/types";

/** Gaps longer than this end the current typing burst rather than counting as typing. */
const IDLE_GAP_MS = 3_000;

interface Tracker {
  keystrokes: number;
  pastes: number;
  typingMs: number;
  lastKeyAt: number;
  length: number;
}

/**
 * Records how a free-text answer was produced: keystrokes, active typing time,
 * and paste events.
 *
 * Only active typing counts toward the elapsed time — pauses longer than
 * `IDLE_GAP_MS` are excluded, so a respondent who stops to think is not measured
 * as a slow typist and, more importantly, someone who pastes an answer cannot
 * hide it behind a long idle period.
 *
 * Nothing here is shown to the respondent, for the same reason the question timer
 * is hidden: a visible metric is a metric that can be paced against.
 */
export function useTextMetrics() {
  const trackers = useRef<Record<string, Tracker>>({});

  const get = (questionId: string): Tracker => {
    const existing = trackers.current[questionId];
    if (existing) return existing;
    const created: Tracker = {
      keystrokes: 0,
      pastes: 0,
      typingMs: 0,
      lastKeyAt: 0,
      length: 0,
    };
    trackers.current[questionId] = created;
    return created;
  };

  const recordKeystroke = useCallback((questionId: string) => {
    const tracker = get(questionId);
    const now = Date.now();

    if (tracker.lastKeyAt > 0) {
      const gap = now - tracker.lastKeyAt;
      if (gap <= IDLE_GAP_MS) tracker.typingMs += gap;
    }

    tracker.keystrokes += 1;
    tracker.lastKeyAt = now;
  }, []);

  const recordPaste = useCallback((questionId: string) => {
    get(questionId).pastes += 1;
  }, []);

  const recordValue = useCallback((questionId: string, value: string) => {
    get(questionId).length = value.length;
  }, []);

  const finalize = useCallback((): Record<string, TextMetrics> => {
    return Object.fromEntries(
      Object.entries(trackers.current).map(([questionId, tracker]) => [
        questionId,
        {
          length: tracker.length,
          keystrokes: tracker.keystrokes,
          typingSeconds: Number((tracker.typingMs / 1000).toFixed(1)),
          pastes: tracker.pastes,
        } satisfies TextMetrics,
      ]),
    );
  }, []);

  return { recordKeystroke, recordPaste, recordValue, finalize };
}

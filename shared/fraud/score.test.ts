import { describe, expect, it } from "vitest";
import { DEFAULT_THRESHOLDS, scoreResponse, type ScoreResponseInput } from "./score.js";

const base: ScoreResponseInput = {
  questionCount: 5,
  totalTimeSeconds: 180,
  answers: { q1: "A", q2: "B", q3: "C", q4: "B", q5: "22" },
  consistencyCheckPassed: true,
};

describe("scoreResponse", () => {
  it("returns clean for a thoughtful, varied, consistent response", () => {
    const result = scoreResponse(base);

    expect(result.flag).toBe("clean");
    expect(result.signals.expected_min_seconds).toBe(40);
    expect(result.signals.straight_line_ratio).toBe(0.4);
    expect(result.signals.tripped).toEqual([]);
  });

  it("flags a response that is both too fast and straight-lined", () => {
    const result = scoreResponse({
      ...base,
      questionCount: 10,
      totalTimeSeconds: 41,
      answers: { q1: "B", q2: "B", q3: "B", q4: "B", q5: "A" },
    });

    expect(result.flag).toBe("flagged");
    expect(result.signals.straight_line_ratio).toBe(0.8);
    expect(result.signals.tripped).toContain("too_fast");
    expect(result.signals.tripped).toContain("straight_lining");
  });

  it("flags a slow, varied response purely for contradicting an earlier answer", () => {
    const result = scoreResponse({
      ...base,
      totalTimeSeconds: 300,
      consistencyCheckPassed: false,
    });

    expect(result.flag).toBe("flagged");
    expect(result.signals.tripped).toEqual(["consistency_check"]);
  });

  it("does not flag when only the timing signal trips", () => {
    const result = scoreResponse({
      ...base,
      questionCount: 10,
      totalTimeSeconds: 30,
      answers: { q1: "A", q2: "B", q3: "C", q4: "D" },
    });

    expect(result.flag).toBe("clean");
    expect(result.signals.tripped).toEqual(["too_fast"]);
  });

  it("does not flag when only the straight-line signal trips", () => {
    const result = scoreResponse({
      ...base,
      questionCount: 2,
      totalTimeSeconds: 600,
      answers: { q1: "A", q2: "A", q3: "A", q4: "A" },
    });

    expect(result.flag).toBe("clean");
    expect(result.signals.straight_line_ratio).toBe(1);
  });

  it("treats a missing consistency check as inconclusive, not as a failure", () => {
    const result = scoreResponse({ ...base, consistencyCheckPassed: null });

    expect(result.flag).toBe("clean");
    expect(result.signals.consistency_check_passed).toBeNull();
  });

  it("ignores straight-lining on very short surveys where a repeat is coincidence", () => {
    const result = scoreResponse({
      ...base,
      questionCount: 3,
      totalTimeSeconds: 5,
      answers: { q1: "Yes", q2: "Yes", q3: "Yes" },
    });

    expect(result.signals.tripped).not.toContain("straight_lining");
    expect(result.flag).toBe("clean");
  });

  it("does not divide by zero when there are no answers", () => {
    const result = scoreResponse({
      questionCount: 0,
      totalTimeSeconds: 0,
      answers: {},
      consistencyCheckPassed: null,
    });

    expect(result.signals.straight_line_ratio).toBe(0);
    expect(result.flag).toBe("clean");
  });

  it("honours injected thresholds rather than hardcoded ones", () => {
    const input: ScoreResponseInput = {
      ...base,
      questionCount: 3,
      totalTimeSeconds: 20,
      answers: { q1: "A", q2: "B", q3: "C" },
    };

    expect(scoreResponse(input, DEFAULT_THRESHOLDS).signals.tripped).toContain("too_fast");
    expect(
      scoreResponse(input, { ...DEFAULT_THRESHOLDS, minSecondsPerQuestion: 5 }).signals.tripped,
    ).toEqual([]);
  });
});

describe("scoreResponse long-text signals", () => {
  const longAnswer = "x".repeat(400);

  it("flags a long answer that arrived with no keystrokes behind it", () => {
    const result = scoreResponse({
      ...base,
      totalTimeSeconds: 600,
      answers: { ...base.answers, q6: longAnswer },
      textMetrics: {
        q6: { length: 400, keystrokes: 0, typingSeconds: 0, pastes: 1 },
      },
    });

    expect(result.flag).toBe("flagged");
    expect(result.signals.pasted_long_text).toBe(true);
    expect(result.signals.tripped).toContain("pasted_long_text");
  });

  it("flags a long answer typed faster than is plausible", () => {
    const result = scoreResponse({
      ...base,
      totalTimeSeconds: 600,
      answers: { ...base.answers, q6: longAnswer },
      textMetrics: {
        // Every character accounted for by a keystroke, but in 5 seconds.
        q6: { length: 400, keystrokes: 400, typingSeconds: 5, pastes: 0 },
      },
    });

    expect(result.flag).toBe("flagged");
    expect(result.signals.max_typing_chars_per_second).toBe(80);
    expect(result.signals.tripped).toContain("typing_speed");
  });

  it("leaves a genuinely typed long answer clean", () => {
    const result = scoreResponse({
      ...base,
      totalTimeSeconds: 600,
      answers: { ...base.answers, q6: longAnswer },
      textMetrics: {
        q6: { length: 400, keystrokes: 430, typingSeconds: 120, pastes: 0 },
      },
    });

    expect(result.flag).toBe("clean");
    expect(result.signals.tripped).toEqual([]);
  });

  it("ignores typing metrics on short answers, where speed carries no signal", () => {
    const result = scoreResponse({
      ...base,
      answers: { ...base.answers, q6: "Yes" },
      textMetrics: {
        q6: { length: 3, keystrokes: 0, typingSeconds: 0.1, pastes: 1 },
      },
    });

    expect(result.flag).toBe("clean");
    expect(result.signals.pasted_long_text).toBe(false);
    expect(result.signals.max_typing_chars_per_second).toBeNull();
  });

  it("reports the fastest rate across several long answers", () => {
    const result = scoreResponse({
      ...base,
      totalTimeSeconds: 900,
      textMetrics: {
        q6: { length: 200, keystrokes: 210, typingSeconds: 100, pastes: 0 },
        q7: { length: 300, keystrokes: 310, typingSeconds: 60, pastes: 0 },
      },
    });

    expect(result.signals.max_typing_chars_per_second).toBe(5);
  });
});

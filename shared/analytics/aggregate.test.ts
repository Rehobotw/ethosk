import { describe, expect, it } from "vitest";
import type { Question } from "../types.js";
import { aggregateResponses, shouldGenerateSummary } from "./aggregate.js";

const questions: Question[] = [
  { id: "q1", text: "Pick one", type: "single_choice", options: ["A", "B"] },
  { id: "q2", text: "Pick many", type: "multi_choice", options: ["X", "Y"] },
  { id: "q3", text: "Say anything", type: "text" },
];

describe("aggregateResponses", () => {
  it("counts flags separately and reports completion against the targeted pool", () => {
    const result = aggregateResponses(
      [
        { answers: { q1: "A" }, fraud_flag: "clean" },
        { answers: { q1: "B" }, fraud_flag: "flagged" },
        { answers: { q1: "B" }, fraud_flag: "clean" },
      ],
      questions,
      10,
    );

    expect(result.response_count).toBe(3);
    expect(result.clean_count).toBe(2);
    expect(result.flagged_count).toBe(1);
    expect(result.completion_rate).toBe(0.3);
  });

  it("excludes flagged responses from distributions by default", () => {
    const result = aggregateResponses(
      [
        { answers: { q1: "A" }, fraud_flag: "clean" },
        { answers: { q1: "B" }, fraud_flag: "flagged" },
      ],
      questions,
      2,
    );

    expect(result.distributions.q1).toEqual({ A: 1, B: 0 });
  });

  it("includes flagged responses when explicitly asked to", () => {
    const result = aggregateResponses(
      [
        { answers: { q1: "A" }, fraud_flag: "clean" },
        { answers: { q1: "B" }, fraud_flag: "flagged" },
      ],
      questions,
      2,
      { includeFlagged: true },
    );

    expect(result.distributions.q1).toEqual({ A: 1, B: 1 });
  });

  it("seeds every declared option so unpicked options still chart as zero", () => {
    const result = aggregateResponses([{ answers: { q1: "A" }, fraud_flag: "clean" }], questions, 1);
    expect(result.distributions.q1).toEqual({ A: 1, B: 0 });
  });

  it("splits multi-choice answers into their individual options", () => {
    const result = aggregateResponses(
      [{ answers: { q2: "X|Y" }, fraud_flag: "clean" }],
      questions,
      1,
    );
    expect(result.distributions.q2).toEqual({ X: 1, Y: 1 });
  });

  it("does not build a distribution for free-text questions", () => {
    const result = aggregateResponses(
      [{ answers: { q3: "a long opinion" }, fraud_flag: "clean" }],
      questions,
      1,
    );
    expect(result.distributions.q3).toBeUndefined();
  });

  it("reports a zero completion rate rather than dividing by zero", () => {
    const result = aggregateResponses([], questions, 0);
    expect(result.completion_rate).toBe(0);
    expect(result.response_count).toBe(0);
  });
});

describe("shouldGenerateSummary", () => {
  it("suppresses the summary below five responses", () => {
    expect(shouldGenerateSummary(4)).toBe(false);
    expect(shouldGenerateSummary(5)).toBe(true);
  });
});

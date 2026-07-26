import { describe, expect, it } from "vitest";
import type { Question } from "../types.js";
import {
  buildConsistencyQuestion,
  consistencyCheckId,
  evaluateConsistency,
  isConsistencyCheckId,
  MIN_QUESTIONS_FOR_CHECK,
  pickInsertIndex,
  pickQuestionToDuplicate,
} from "./consistencyCheck.js";

function choice(id: string, text = `Question ${id}`): Question {
  return { id, text, type: "single_choice", options: ["Yes", "No"] };
}

const survey: Question[] = [
  choice("q1"),
  choice("q2"),
  { id: "q3", text: "Tell us more", type: "text" },
  choice("q4"),
  choice("q5"),
  choice("q6"),
];

describe("pickQuestionToDuplicate", () => {
  it("returns nothing for a survey too short to hide a duplicate in", () => {
    expect(pickQuestionToDuplicate(survey.slice(0, 4))).toBeNull();
  });

  it("only picks from the questions before the insertion window", () => {
    for (let i = 0; i < 20; i += 1) {
      const picked = pickQuestionToDuplicate(survey, () => i / 20);
      expect(["q1", "q2", "q4"]).toContain(picked?.id);
    }
  });

  it("never picks a free-text question, whose answers legitimately differ", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(pickQuestionToDuplicate(survey, () => i / 20)?.type).not.toBe("text");
    }
  });

  it("returns nothing when no early question is a choice question", () => {
    const textOnly: Question[] = Array.from({ length: 6 }, (_, index) => ({
      id: `t${index}`,
      text: "Explain",
      type: "text",
    }));

    expect(pickQuestionToDuplicate(textOnly)).toBeNull();
  });

  it("handles random() returning exactly 1 without going out of bounds", () => {
    expect(pickQuestionToDuplicate(survey, () => 1)).not.toBeNull();
  });
});

describe("pickInsertIndex", () => {
  it("never places the duplicate before the fifth question", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(pickInsertIndex(6, () => i / 20)).toBeGreaterThanOrEqual(MIN_QUESTIONS_FOR_CHECK - 1);
    }
  });

  it("can place the duplicate last", () => {
    expect(pickInsertIndex(6, () => 1)).toBe(6);
  });

  it("varies the position across respondents", () => {
    const positions = new Set([0.0, 0.4, 0.9].map((r) => pickInsertIndex(10, () => r)));
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("buildConsistencyQuestion", () => {
  const original = choice("q1", "Do you use the library weekly?");
  const built = buildConsistencyQuestion(original, "Would you say you visit the library each week?");

  it("carries the options over unchanged so the answers stay comparable", () => {
    expect(built.options).toEqual(original.options);
    expect(built.type).toBe(original.type);
  });

  it("records which question it duplicates", () => {
    expect(built.consistencyCheck).toEqual({ duplicateOf: "q1" });
  });

  it("uses a namespaced id that cannot collide with a real question", () => {
    expect(built.id).toBe(consistencyCheckId("q1"));
    expect(isConsistencyCheckId(built.id)).toBe(true);
    expect(isConsistencyCheckId("q1")).toBe(false);
  });

  it("does not copy an options array by reference", () => {
    built.options?.push("Maybe");
    expect(original.options).toEqual(["Yes", "No"]);
  });
});

describe("evaluateConsistency", () => {
  const question = buildConsistencyQuestion(choice("q1"), "Rephrased?");

  it("passes when both answers agree", () => {
    expect(evaluateConsistency(question, { q1: "Yes", [question.id]: "Yes" })).toBe(true);
  });

  it("fails when the answers contradict each other", () => {
    expect(evaluateConsistency(question, { q1: "Yes", [question.id]: "No" })).toBe(false);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(evaluateConsistency(question, { q1: "Yes", [question.id]: " yes " })).toBe(true);
  });

  it("is inconclusive rather than failing when either answer is missing", () => {
    expect(evaluateConsistency(question, { q1: "Yes" })).toBeNull();
    expect(evaluateConsistency(question, { [question.id]: "Yes" })).toBeNull();
    expect(evaluateConsistency(question, { q1: "  ", [question.id]: "Yes" })).toBeNull();
  });

  it("compares multi-choice answers as sets, ignoring selection order", () => {
    const multi = buildConsistencyQuestion(
      { id: "q1", text: "Which?", type: "multi_choice", options: ["A", "B", "C"] },
      "Which ones?",
    );

    expect(evaluateConsistency(multi, { q1: "A|B", [multi.id]: "B|A" })).toBe(true);
    expect(evaluateConsistency(multi, { q1: "A|B", [multi.id]: "A|C" })).toBe(false);
    expect(evaluateConsistency(multi, { q1: "A|B", [multi.id]: "A" })).toBe(false);
  });

  it("is inconclusive for a question that is not a duplicate of anything", () => {
    expect(evaluateConsistency(choice("q1"), { q1: "Yes" })).toBeNull();
  });
});

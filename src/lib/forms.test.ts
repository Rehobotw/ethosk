import { describe, expect, it } from "vitest";
import { surveySchema } from "@shared/validation/schemas";
import { describeFormError } from "./forms";

/** Builds the exact failure the builder produced: a question with blank options. */
function failToParse(input: unknown): unknown {
  try {
    surveySchema.parse(input);
    throw new Error("expected the schema to reject this input");
  } catch (error) {
    return error;
  }
}

const validQuestion = {
  id: "q1",
  text: "Which approach do you rely on most?",
  type: "single_choice" as const,
  options: ["Reading notes", "Group study"],
  required: true,
};

describe("describeFormError", () => {
  it("names the question and option instead of dumping validator JSON", () => {
    const error = failToParse({
      title: "Learning approaches",
      questions: [validQuestion, { ...validQuestion, id: "q2", options: ["", ""] }],
      reward_etb: 20,
    });

    const message = describeFormError(error);

    expect(message).toContain("Question 2, option 1");
    expect(message).toContain("This answer option is still blank");
    // The symptom this replaced: raw issue objects rendered into the banner.
    expect(message).not.toContain("too_small");
    expect(message).not.toContain('"path"');
    expect(message).not.toContain("[");
  });

  it("uses 1-based positions, because nobody reads a form as index zero", () => {
    const error = failToParse({
      title: "Learning approaches",
      questions: [{ ...validQuestion, options: ["", "Group study"] }],
      reward_etb: 20,
    });

    expect(describeFormError(error)).toContain("Question 1, option 1");
  });

  it("summarizes the tail rather than listing every issue", () => {
    const error = failToParse({
      title: "Learning approaches",
      questions: [
        { ...validQuestion, options: ["", "", ""] },
        { ...validQuestion, id: "q2", options: ["", "", ""] },
      ],
      reward_etb: 20,
    });

    const message = describeFormError(error);
    expect(message).toContain("more problems to fix");
  });

  it("labels a top-level field by name", () => {
    const error = failToParse({ title: "no", questions: [validQuestion] });
    expect(describeFormError(error)).toContain("Title:");
  });

  it("passes a plain error through and falls back when there is nothing to show", () => {
    expect(describeFormError(new Error("Network request failed"))).toBe("Network request failed");
    expect(describeFormError(undefined, "Could not save.")).toBe("Could not save.");
  });
});

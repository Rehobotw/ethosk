import { describe, expect, it } from "vitest";
import { finalDraftSchema } from "./schemas.js";

describe("finalDraftSchema validation", () => {
  it("passes for a valid complete final draft", () => {
    const result = finalDraftSchema.safeParse({
      title: "Public Healthcare Access Survey",
      description: "Understanding medical specialist availability across regions.",
      questions: [
        {
          id: "q1",
          type: "single_choice",
          text: "What is your primary region?",
          options: ["Addis Ababa", "Oromia", "Amhara", "Other"],
          required: true,
        },
      ],
      reward_etb: 15,
      status: "final_draft",
    });

    expect(result.success).toBe(true);
  });

  it("fails if reward_etb is missing or 0", () => {
    const result = finalDraftSchema.safeParse({
      title: "Incomplete Survey",
      questions: [
        {
          id: "q1",
          type: "text",
          text: "Your feedback?",
        },
      ],
      reward_etb: 0,
    });

    expect(result.success).toBe(false);
  });

  it("fails if choice question has blank options", () => {
    const result = finalDraftSchema.safeParse({
      title: "Blank Choice Options Survey",
      questions: [
        {
          id: "q1",
          type: "single_choice",
          text: "Select option",
          options: ["Option A", "   "],
        },
      ],
      reward_etb: 10,
    });

    expect(result.success).toBe(false);
  });
});

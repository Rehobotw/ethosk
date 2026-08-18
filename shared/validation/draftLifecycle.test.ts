import { describe, expect, it } from "vitest";
import { finalDraftSchema, surveySchema } from "./schemas.js";
import { SURVEY_STATUSES, type SurveyRecord, type SurveyStatus } from "../types.js";

describe("v3 Draft Lifecycle and State Transitions (§4.3.5–4.3.6)", () => {
  it("defines all required distinct survey states per v3 spec", () => {
    expect(SURVEY_STATUSES).toContain("wip");
    expect(SURVEY_STATUSES).toContain("draft");
    expect(SURVEY_STATUSES).toContain("final_draft");
    expect(SURVEY_STATUSES).toContain("pending_review");
    expect(SURVEY_STATUSES).toContain("active");
    expect(SURVEY_STATUSES).toContain("rejected");
    expect(SURVEY_STATUSES).toContain("closed");
  });

  it("permits WIP draft creation with initial draft question", () => {
    const wipInput = {
      title: "Untitled WIP Survey",
      questions: [
        {
          id: "q1",
          type: "text" as const,
          text: "What is your primary occupation?",
        },
      ],
      status: "wip" as SurveyStatus,
    };

    const result = surveySchema.safeParse(wipInput);
    expect(result.success).toBe(true);
  });

  it("requires full validation before promoting WIP to Final Draft", () => {
    // Incomplete draft: choice question without required options or reward
    const incompleteDraft = {
      title: "Incomplete Survey",
      questions: [
        {
          id: "q1",
          type: "single_choice" as const,
          text: "Select one",
          options: [],
        },
      ],
      reward_etb: 0,
      status: "final_draft" as SurveyStatus,
    };

    const invalidResult = finalDraftSchema.safeParse(incompleteDraft);
    expect(invalidResult.success).toBe(false);

    // Complete valid draft
    const completeDraft = {
      title: "Addis Consumer Survey",
      description: "Evaluating digital banking preferences in Addis Ababa.",
      questions: [
        {
          id: "q1",
          type: "single_choice" as const,
          text: "Which payment method do you use most frequently?",
          options: ["Telebirr", "CBE Birr", "Cash", "Other"],
          required: true,
        },
      ],
      reward_etb: 25,
      status: "final_draft" as SurveyStatus,
    };

    const validResult = finalDraftSchema.safeParse(completeDraft);
    expect(validResult.success).toBe(true);
  });

  it("distinguishes WIP and Final Draft datasets correctly", () => {
    const mockSurveys: Partial<SurveyRecord>[] = [
      { id: "s1", title: "Survey 1", status: "wip" },
      { id: "s2", title: "Survey 2", status: "draft" },
      { id: "s3", title: "Survey 3", status: "final_draft" },
      { id: "s4", title: "Survey 4", status: "active" },
      { id: "s5", title: "Survey 5", status: "closed" },
    ];

    // WIP dataset (shared between Recent list and Dashboard WIP tab)
    const wipDataset = mockSurveys.filter((s) => s.status === "wip" || s.status === "draft");
    expect(wipDataset.map((s) => s.id)).toEqual(["s1", "s2"]);

    // Final Drafts dataset (Dashboard Final Drafts tab)
    const finalDraftDataset = mockSurveys.filter((s) => s.status === "final_draft");
    expect(finalDraftDataset.map((s) => s.id)).toEqual(["s3"]);

    // Active studies dataset
    const activeDataset = mockSurveys.filter((s) => s.status === "active");
    expect(activeDataset.map((s) => s.id)).toEqual(["s4"]);

    // Closed studies dataset
    const closedDataset = mockSurveys.filter((s) => s.status === "closed");
    expect(closedDataset.map((s) => s.id)).toEqual(["s5"]);
  });

  it("removes a survey from the WIP dataset upon transition to final_draft", () => {
    let survey: Partial<SurveyRecord> = {
      id: "s10",
      title: "Draft Study",
      status: "wip",
    };

    const isWip = (s: Partial<SurveyRecord>) => s.status === "wip" || s.status === "draft";
    const isFinalDraft = (s: Partial<SurveyRecord>) => s.status === "final_draft";

    // Initial state
    expect(isWip(survey)).toBe(true);
    expect(isFinalDraft(survey)).toBe(false);

    // Promote to final draft
    survey = {
      ...survey,
      status: "final_draft",
    };

    // New state
    expect(isWip(survey)).toBe(false);
    expect(isFinalDraft(survey)).toBe(true);
  });
});

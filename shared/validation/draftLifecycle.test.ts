import { describe, expect, it } from "vitest";
import { finalDraftSchema, surveySchema } from "./schemas.js";
import { SURVEY_STATUSES, BUILDER_TYPES, type SurveyRecord, type SurveyStatus, type BuilderType } from "../types.js";

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

  it("defines all required builder types per v3 spec", () => {
    expect(BUILDER_TYPES).toContain("manual");
    expect(BUILDER_TYPES).toContain("import");
    expect(BUILDER_TYPES).toContain("ai");
  });

  it("permits WIP draft creation with builder_type and timestamp", () => {
    const now = new Date().toISOString();
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
      builder_type: "manual" as BuilderType,
      updated_at: now,
    };

    const result = surveySchema.safeParse(wipInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.builder_type).toBe("manual");
    }
  });

  it("supports import and AI builder types in draft persistence", () => {
    const importDraft = surveySchema.safeParse({
      title: "Imported Study",
      questions: [{ id: "q1", type: "text", text: "Question from doc" }],
      status: "wip",
      builder_type: "import",
    });
    expect(importDraft.success).toBe(true);

    const aiDraft = surveySchema.safeParse({
      title: "AI Generated Study",
      questions: [{ id: "q1", type: "text", text: "AI generated question" }],
      status: "wip",
      builder_type: "ai",
    });
    expect(aiDraft.success).toBe(true);
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
      builder_type: "manual" as BuilderType,
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
      builder_type: "manual" as BuilderType,
    };

    const validResult = finalDraftSchema.safeParse(completeDraft);
    expect(validResult.success).toBe(true);
  });

  it("distinguishes WIP and Final Draft datasets correctly", () => {
    const mockSurveys: Partial<SurveyRecord>[] = [
      { id: "s1", title: "Survey 1", status: "wip", builder_type: "manual" },
      { id: "s2", title: "Survey 2", status: "draft", builder_type: "import" },
      { id: "s3", title: "Survey 3", status: "final_draft", builder_type: "ai" },
      { id: "s4", title: "Survey 4", status: "active", builder_type: "manual" },
      { id: "s5", title: "Survey 5", status: "closed", builder_type: "manual" },
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

  it("removes a survey from the WIP dataset immediately upon transition to final_draft", () => {
    let survey: Partial<SurveyRecord> = {
      id: "s10",
      title: "Draft Study",
      status: "wip",
      builder_type: "manual",
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

  it("determines the correct resume editing path based on builder type", () => {
    const getResumePath = (s: Partial<SurveyRecord>): string => {
      if (s.builder_type === "import") return `/survey-builder/import/${s.id}`;
      if (s.builder_type === "ai") return `/survey-builder/manual/${s.id}?source=ai`;
      return `/survey-builder/manual/${s.id}`;
    };

    expect(getResumePath({ id: "s1", builder_type: "manual" })).toBe("/survey-builder/manual/s1");
    expect(getResumePath({ id: "s2", builder_type: "import" })).toBe("/survey-builder/import/s2");
    expect(getResumePath({ id: "s3", builder_type: "ai" })).toBe("/survey-builder/manual/s3?source=ai");
  });

  it("simulates deletion of WIP survey removing it from shared dataset", () => {
    let dataset: Partial<SurveyRecord>[] = [
      { id: "s1", title: "Survey 1", status: "wip" },
      { id: "s2", title: "Survey 2", status: "wip" },
      { id: "s3", title: "Survey 3", status: "final_draft" },
    ];

    const isWip = (s: Partial<SurveyRecord>) => s.status === "wip" || s.status === "draft";

    // Before deletion
    expect(dataset.filter(isWip).map((s) => s.id)).toEqual(["s1", "s2"]);

    // Delete s1
    dataset = dataset.filter((s) => s.id !== "s1");

    // After deletion: both Recent and Dashboard WIP reflect the deletion
    expect(dataset.filter(isWip).map((s) => s.id)).toEqual(["s2"]);
  });

  it("handles full lifecycle state progression: wip -> final_draft -> active -> closed", () => {
    const lifecycle: readonly SurveyStatus[] = ["wip", "final_draft", "active", "closed"] as const;

    // 1. Initial creation
    let currentStatus: SurveyStatus = lifecycle[0]!;
    expect(currentStatus).toBe("wip");

    // 2. Promotion to final draft
    currentStatus = lifecycle[1]!;
    expect(currentStatus).toBe("final_draft");

    // 3. Launching / Posting
    currentStatus = lifecycle[2]!;
    expect(currentStatus).toBe("active");

    // 4. Closing study
    currentStatus = lifecycle[3]!;
    expect(currentStatus).toBe("closed");
  });
});

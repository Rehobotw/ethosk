import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import { respondentsRouter } from "./respondents.js";
import { errorHandler } from "../lib/http.js";
import type { Server } from "node:http";

const respondentId = "11111111-1111-1111-1111-111111111111";

vi.mock("../lib/auth.js", () => ({
  auth: () => ({
    userId: respondentId,
    role: "respondent",
    fullName: "Hiwot Tadesse",
    verificationTier: "2_attribute_verified",
    accessToken: "mock-token",
  }),
  requireAuth: () => (_req: any, _res: any, next: any) => next(),
  attachAuth: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../lib/consent.js", () => ({
  recordConsentEvent: vi.fn().mockResolvedValue(undefined),
  hashNationalId: (id: string) => `hashed_${id}`,
}));

const mockSurveyResponse = {
  id: "resp-12345",
  survey_id: "surv-999",
  respondent_id: respondentId,
  answers: {
    q1: "Social Media / Telegram",
    q2: ["Fair compensation", "Fast payout"],
    q3: "Ensure instructions are localized.",
  },
  time_per_question: {
    q1: 15,
    q2: 25,
    q3: 40,
  },
  total_time_seconds: 80,
  fraud_flag: "clean",
  completed_at: "2026-09-09T14:30:00.000Z",
  surveys: {
    id: "surv-999",
    title: "Understanding Research Participant Recruitment in Ethiopia",
    description: "A comprehensive assessment of participant motivation.",
    reward_etb: 25,
    questions: [
      {
        id: "q1",
        text: "How do you typically discover opportunities?",
        type: "single_choice",
        options: ["Social Media / Telegram", "Campus boards"],
      },
      {
        id: "sec1",
        text: "Section 2: Payment Experience",
        type: "text",
        isSectionHeader: true,
      },
      {
        id: "q2",
        text: "Which factors are most important?",
        type: "multi_choice",
        options: ["Fair compensation", "Fast payout"],
      },
      {
        id: "q3",
        text: "What recommendations do you have?",
        type: "text",
      },
    ],
  },
};

vi.mock("../lib/supabase.js", () => {
  const mockAdmin = {
    from: (table: string) => {
      if (table === "survey_responses") {
        return {
          select: (_cols?: string) => ({
            eq: (_col1: string, val1: any) => ({
              order: () => Promise.resolve({
                data: [mockSurveyResponse],
                error: null,
              }),
              eq: (_col2: string, val2: any) => ({
                maybeSingle: () => {
                  if (val1 === "resp-12345" && val2 === respondentId) {
                    return Promise.resolve({ data: mockSurveyResponse, error: null });
                  }
                  return Promise.resolve({ data: null, error: null });
                },
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      };
    },
  };

  return {
    admin: mockAdmin,
    userClient: () => mockAdmin,
    publicClient: mockAdmin,
  };
});

describe("GET /api/respondents/history and /history/:responseId", () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use("/api/respondents", respondentsRouter);
    app.use(errorHandler);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        if (typeof addr === "object" && addr !== null) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("returns participation history list with enriched fields", async () => {
    const res = await fetch(`${baseUrl}/api/respondents/history`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.history).toBeInstanceOf(Array);
    expect(data.history.length).toBe(1);

    const item = data.history[0];
    expect(item.id).toBe("resp-12345");
    expect(item.title).toBe("Understanding Research Participant Recruitment in Ethiopia");
    expect(item.reward_etb).toBe(25);
    expect(item.time_spent_seconds).toBe(80);
    expect(item.quality_status).toBe("passed");
    expect(item.payout_status).toBe("paid");
  });

  it("returns submission summary detail by response ID", async () => {
    const res = await fetch(`${baseUrl}/api/respondents/history/resp-12345`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.submission).toBeDefined();
    expect(data.submission.id).toBe("resp-12345");
    expect(data.submission.survey_title).toBe("Understanding Research Participant Recruitment in Ethiopia");
    expect(data.submission.reward_etb).toBe(25);
    expect(data.submission.quality_status).toBe("passed");
    expect(data.submission.total_time_seconds).toBe(80);

    // Questions and answers
    expect(data.submission.questions).toHaveLength(4);
    expect(data.submission.answers.q1).toBe("Social Media / Telegram");
    expect(data.submission.answers.q2).toEqual(["Fair compensation", "Fast payout"]);
  });

  it("returns 404 when submission does not exist or does not belong to respondent", async () => {
    const res = await fetch(`${baseUrl}/api/respondents/history/resp-not-found`);
    expect(res.status).toBe(404);
  });
});

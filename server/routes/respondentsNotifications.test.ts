import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import { respondentsRouter } from "./respondents.js";
import { errorHandler } from "../lib/http.js";
import type { Server } from "node:http";

const testRespondentId = "33333333-3333-4333-a333-333333333333";

vi.mock("../lib/auth.js", () => ({
  auth: () => ({
    userId: testRespondentId,
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

vi.mock("../lib/supabase.js", async () => {
  const { createMockSupabaseClient } = await import("../lib/mockSupabaseClient.js");
  const mockAdmin = createMockSupabaseClient();
  return {
    admin: mockAdmin,
    userClient: () => mockAdmin,
    publicClient: mockAdmin,
  };
});

describe("Respondent Notifications Routes (/api/respondents/notifications)", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use("/api/respondents", respondentsRouter);
    app.use(errorHandler);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === "object") {
          baseUrl = `http://localhost:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("GET /api/respondents/notifications returns real user-scoped notifications with survey, earnings, and withdrawal events", async () => {
    const res = await fetch(`${baseUrl}/api/respondents/notifications`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toBeDefined();
    expect(Array.isArray(data.notifications)).toBe(true);
    expect(data.notifications.length).toBeGreaterThan(0);
    expect(typeof data.unread_count).toBe("number");

    // Notifications must not contain old hardcoded dummy strings
    const allBodies = data.notifications.map((n: any) => n.body).join(" ");
    expect(allBodies).not.toContain("A new survey on Consumer Habits is waiting for you");
    expect(allBodies).not.toContain("Tech Adoption");

    // Must contain real user events:
    // 1. Available survey notification
    const surveyNotif = data.notifications.find((n: any) => n.type === "survey");
    expect(surveyNotif).toBeDefined();
    expect(surveyNotif.title).toBe("New Survey Available");
    expect(surveyNotif.action_url).toBe("/inbox");

    // 2. Earnings notification from real payout
    const earningsNotif = data.notifications.find((n: any) => n.type === "earnings");
    expect(earningsNotif).toBeDefined();
    expect(earningsNotif.title).toBe("Earnings Credited");
    expect(earningsNotif.body).toContain("25 ETB");
    expect(earningsNotif.action_url).toBe("/wallet");

    // 3. Withdrawal notification from real withdrawal
    const withdrawalNotif = data.notifications.find((n: any) => n.type === "withdrawal");
    expect(withdrawalNotif).toBeDefined();
    expect(withdrawalNotif.body).toContain("50 ETB");
    expect(withdrawalNotif.action_url).toBe("/wallet/history");

    // 4. Verification notification
    const verifyNotif = data.notifications.find((n: any) => n.type === "verification");
    expect(verifyNotif).toBeDefined();
    expect(verifyNotif.title).toBe("Account Verified");

    // 5. Structure & section grouping
    expect(["today", "yesterday", "older"]).toContain(data.notifications[0].section);
    expect(typeof data.notifications[0].timestamp).toBe("string");
  });

  it("PATCH /api/respondents/notifications/:id/read marks an individual notification as read", async () => {
    const getRes = await fetch(`${baseUrl}/api/respondents/notifications`);
    const initialData = await getRes.json();
    const unread = initialData.notifications.find((n: any) => !n.is_read);
    expect(unread).toBeDefined();

    const patchRes = await fetch(`${baseUrl}/api/respondents/notifications/${unread.id}/read`, {
      method: "PATCH",
    });
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.ok).toBe(true);

    // Verify read status updated
    const afterRes = await fetch(`${baseUrl}/api/respondents/notifications`);
    const afterData = await afterRes.json();
    const updated = afterData.notifications.find((n: any) => n.id === unread.id);
    expect(updated.is_read).toBe(true);
  });

  it("POST /api/respondents/notifications/mark-all-read marks all notifications as read", async () => {
    const markAllRes = await fetch(`${baseUrl}/api/respondents/notifications/mark-all-read`, {
      method: "POST",
    });
    expect(markAllRes.status).toBe(200);
    const body = await markAllRes.json();
    expect(body.ok).toBe(true);

    const afterRes = await fetch(`${baseUrl}/api/respondents/notifications`);
    const afterData = await afterRes.json();
    expect(afterData.unread_count).toBe(0);
    for (const notif of afterData.notifications) {
      expect(notif.is_read).toBe(true);
    }
  });
});

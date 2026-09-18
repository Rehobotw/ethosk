import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import { respondentsRouter } from "./respondents.js";
import { errorHandler } from "../lib/http.js";
import type { Server } from "node:http";

// Mock auth middleware so test requests have a valid respondent context
vi.mock("../lib/auth.js", () => ({
  auth: () => ({
    userId: "00000000-0000-0000-0000-000000000001",
    role: "respondent",
    fullName: "Abebe Bekele",
    verificationTier: "1_id_verified",
    accessToken: "mock-token",
  }),
  requireAuth: () => (_req: any, _res: any, next: any) => next(),
  attachAuth: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock("../lib/consent.js", () => ({
  recordConsentEvent: vi.fn().mockResolvedValue(undefined),
  hashNationalId: (id: string) => `hashed_${id}`,
}));

vi.mock("../lib/supabase.js", () => {
  const mockAdmin = {
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
    from: () => ({
      insert: () => ({
        select: () => ({
          single: vi.fn().mockResolvedValue({
            data: { id: "00000000-0000-0000-0000-000000000002", doc_type: "student_id", status: "processing" },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: { verification_tier: "1_id_verified" },
            error: null,
          }),
        }),
      }),
    }),
  };

  return {
    admin: mockAdmin,
    userClient: () => mockAdmin,
    publicClient: mockAdmin,
  };
});

describe("POST /api/respondents/verify-document and /documents", () => {
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

  it("POST /api/respondents/verify-document exists and accepts JSON payload", async () => {
    const res = await fetch(`${baseUrl}/api/respondents/verify-document`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_type: "student_id",
        file_name: "student_id_card.png",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.document_id).toBeDefined();
    expect(body.status).toBe("passed");
  });

  it("POST /api/respondents/documents exists and accepts JSON payload", async () => {
    const res = await fetch(`${baseUrl}/api/respondents/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doc_type: "employer_id",
        file_name: "work_badge.png",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.document_id).toBeDefined();
  });

  it("POST /api/respondents/verify-document accepts multipart/form-data with file", async () => {
    const formData = new FormData();
    const blob = new Blob(["fake image content"], { type: "image/png" });
    formData.append("file", blob, "student_id.png");
    formData.append("doc_type", "student_id");

    const res = await fetch(`${baseUrl}/api/respondents/verify-document`, {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.document_id).toBeDefined();
    expect(body.status).toBe("processing");
  });

  it("rejects unsupported file mime types", async () => {
    const formData = new FormData();
    const blob = new Blob(["malicious binary"], { type: "application/x-msdownload" });
    formData.append("file", blob, "virus.exe");
    formData.append("doc_type", "student_id");

    const res = await fetch(`${baseUrl}/api/respondents/verify-document`, {
      method: "POST",
      body: formData,
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error?.code || body.code).toBe("UNSUPPORTED_FILE_TYPE");
  });
});

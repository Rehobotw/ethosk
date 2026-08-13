import { describe, expect, it } from "vitest";
import { finalDraftSchema } from "./schemas.js";

describe("finalDraftSchema validation", () => {
  it("passes for a valid complete final draft with exemption attestation", () => {
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
      compliance_required: false,
      compliance_attested_at: "2026-08-13T12:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("passes for a valid final draft with clearance document attachment", () => {
    const result = finalDraftSchema.safeParse({
      title: "Clinical Trial Survey",
      questions: [
        {
          id: "q1",
          type: "text",
          text: "Health history details?",
        },
      ],
      reward_etb: 25,
      compliance_required: true,
      compliance_document_url: "compliance/res-123/irb-approval-certificate.pdf",
    });

    expect(result.success).toBe(true);
  });

  it("fails if compliance clearance document is missing when required", () => {
    const result = finalDraftSchema.safeParse({
      title: "Clinical Trial Survey",
      questions: [
        {
          id: "q1",
          type: "text",
          text: "Health history details?",
        },
      ],
      reward_etb: 25,
      compliance_required: true,
      compliance_document_url: null,
    });

    expect(result.success).toBe(false);
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
      compliance_required: false,
      compliance_attested_at: "2026-08-13T12:00:00.000Z",
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
      compliance_required: false,
      compliance_attested_at: "2026-08-13T12:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });
});

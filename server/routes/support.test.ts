import { describe, expect, it } from "vitest";
import { supportTicketSchema } from "@shared/validation/schemas.js";

describe("Support Ticket Endpoint & Validation (REH-133)", () => {
  it("validates a complete support ticket payload successfully", () => {
    const input = {
      name: "Solomon Tadesse",
      email: "solomon@example.com",
      category: "billing",
      subject: "Telebirr Deposit Verification Delay",
      message: "My Telebirr deposit of 500 ETB has not reflected in my wallet balance yet.",
    };

    const parsed = supportTicketSchema.parse(input);
    expect(parsed.name).toBe("Solomon Tadesse");
    expect(parsed.email).toBe("solomon@example.com");
    expect(parsed.category).toBe("billing");
    expect(parsed.subject).toBe("Telebirr Deposit Verification Delay");
    expect(parsed.message).toContain("Telebirr deposit");
  });

  it("defaults category to general when not specified", () => {
    const input = {
      email: "researcher@aau.edu.et",
      subject: "IRB ethical clearance question",
      message: "How do I upload an institutional IRB exemption letter for my master thesis study?",
    };

    const parsed = supportTicketSchema.parse(input);
    expect(parsed.category).toBe("general");
  });

  it("rejects invalid email and too-short message with descriptive zod errors", () => {
    const invalidEmailInput = {
      email: "not-an-email",
      subject: "Valid Subject",
      message: "Valid message content here.",
    };
    expect(() => supportTicketSchema.parse(invalidEmailInput)).toThrow();

    const shortMessageInput = {
      email: "test@example.com",
      subject: "Valid Subject",
      message: "tiny", // < 5 chars
    };
    expect(() => supportTicketSchema.parse(shortMessageInput)).toThrow();

    const shortSubjectInput = {
      email: "test@example.com",
      subject: "hi", // < 3 chars
      message: "Valid message content here.",
    };
    expect(() => supportTicketSchema.parse(shortSubjectInput)).toThrow();
  });
});

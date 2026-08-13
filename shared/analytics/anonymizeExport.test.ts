import { describe, expect, it } from "vitest";
import {
  generateAnonymizedCsv,
  getAgeBracket,
  redactPiiFromText,
  sanitizeDemographics,
} from "./anonymizeExport.js";
import type { Question } from "../types.js";

describe("anonymizeExport module", () => {
  describe("redactPiiFromText", () => {
    it("redacts Ethiopian mobile phone numbers", () => {
      expect(redactPiiFromText("Call me at 0911234567 please")).toBe(
        "Call me at [REDACTED_PHONE] please",
      );
      expect(redactPiiFromText("Direct line +251912345678")).toBe(
        "Direct line [REDACTED_PHONE]",
      );
    });

    it("redacts email addresses", () => {
      expect(redactPiiFromText("Contact sample@example.com for inquiries")).toBe(
        "Contact [REDACTED_EMAIL] for inquiries",
      );
    });

    it("redacts 16-digit Fayda national ID numbers", () => {
      expect(redactPiiFromText("My Fayda ID is 1234-5678-9012-3456")).toBe(
        "My Fayda ID is [REDACTED_FAYDA_ID]",
      );
      expect(redactPiiFromText("Fayda 1234567890123456")).toBe(
        "Fayda [REDACTED_FAYDA_ID]",
      );
    });

    it("leaves safe text unchanged", () => {
      expect(redactPiiFromText("I prefer mobile banking over branch visits.")).toBe(
        "I prefer mobile banking over branch visits.",
      );
    });
  });

  describe("getAgeBracket", () => {
    it("bins ages into statistical brackets", () => {
      expect(getAgeBracket(16)).toBe("<18");
      expect(getAgeBracket(21)).toBe("18-24");
      expect(getAgeBracket(29)).toBe("25-34");
      expect(getAgeBracket(40)).toBe("35-44");
      expect(getAgeBracket(50)).toBe("45-54");
      expect(getAgeBracket(60)).toBe("55-64");
      expect(getAgeBracket(70)).toBe("65+");
      expect(getAgeBracket(null)).toBe("Unspecified");
    });
  });

  describe("sanitizeDemographics", () => {
    it("retains high-level macro demographics and excludes street-level PII", () => {
      const sanitized = sanitizeDemographics({
        region: "Oromia",
        city: "Adama",
        age: 28,
        gender: "female",
        occupation: "Engineer",
        education_level: "bachelors",
        primary_language: "afan_oromo",
      });

      expect(sanitized.Region).toBe("Oromia");
      expect(sanitized.City).toBe("Adama");
      expect(sanitized["Age Bracket"]).toBe("25-34");
      expect(sanitized.Gender).toBe("female");
      expect(sanitized.Occupation).toBe("Engineer");
      expect(sanitized["Education Level"]).toBe("bachelors");
      expect(sanitized["Primary Language"]).toBe("afan_oromo");
    });

    it("handles missing or null demographics safely", () => {
      const sanitized = sanitizeDemographics(null);
      expect(sanitized.Region).toBe("Unspecified");
      expect(sanitized.City).toBe("Unspecified");
      expect(sanitized["Age Bracket"]).toBe("Unspecified");
    });
  });

  describe("generateAnonymizedCsv", () => {
    it("generates a complete compliant CSV with pseudonymized IDs and sanitized answers", () => {
      const questions: Question[] = [
        {
          id: "q1",
          type: "single_choice",
          text: "What service do you use?",
          options: ["Telebirr", "CBE Birr"],
        },
        {
          id: "q2",
          type: "text",
          text: "Additional feedback?",
        },
      ];

      const csv = generateAnonymizedCsv(
        { id: "srv-1", title: "Banking Adoption", questions },
        [
          {
            id: "resp-uuid-12345",
            completed_at: "2026-08-13T10:00:00Z",
            total_time_seconds: 45,
            fraud_flag: "clean",
            answers: {
              q1: "Telebirr",
              q2: "Call me back at 0911223344 or email me@test.com",
            },
            demographics: {
              region: "Addis Ababa",
              city: "Bole",
              age: 23,
              gender: "male",
              occupation: "Student",
              education_level: "bachelors",
              primary_language: "amharic",
            },
          },
        ],
      );

      // Check header includes demographics and questions
      expect(csv).toContain('"Response ID","Completed At","Time (Seconds)","Integrity Status","Region","City","Age Bracket","Gender","Occupation","Education Level","Primary Language","Q1: What service do you use?","Q2: Additional feedback?"');
      
      // Check PII is scrubbed in text
      expect(csv).toContain("[REDACTED_PHONE]");
      expect(csv).toContain("[REDACTED_EMAIL]");
      expect(csv).not.toContain("0911223344");
      expect(csv).not.toContain("me@test.com");

      // Check Pseudonymized response ID
      expect(csv).toContain('"RESP-0001-resp-uui"');
    });
  });
});

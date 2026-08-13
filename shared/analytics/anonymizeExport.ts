import type { Question } from "../types.js";

/** Regex to detect and sanitize Ethiopian phone numbers in free text (+2519..., 09...) */
const ETHIOPIAN_PHONE_PATTERN = /(?:\+251|0)9\d{8}\b/g;

/** Regex to detect standard email addresses in free text */
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

/** Regex to detect 16-digit Fayda / National ID numbers */
const FAYDA_ID_PATTERN = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;

/**
 * Scans free-text responses and replaces direct identifiable PII
 * (phone numbers, emails, Fayda numbers) with safe placeholder tags.
 */
export function redactPiiFromText(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(ETHIOPIAN_PHONE_PATTERN, "[REDACTED_PHONE]")
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
    .replace(FAYDA_ID_PATTERN, "[REDACTED_FAYDA_ID]");
}

export interface RespondentDemographics {
  region?: string | null;
  city?: string | null;
  gender?: string | null;
  age?: number | null;
  occupation?: string | null;
  education_level?: string | null;
  primary_language?: string | null;
}

/**
 * Converts exact age to statistical age bracket (e.g. "18-24", "25-34")
 * to prevent single-attribute deanonymization attacks.
 */
export function getAgeBracket(age: number | null | undefined): string {
  if (age == null || isNaN(age)) return "Unspecified";
  if (age < 18) return "<18";
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  if (age <= 44) return "35-44";
  if (age <= 54) return "45-54";
  if (age <= 64) return "55-64";
  return "65+";
}

/**
 * Normalizes and sanitizes demographic metadata for export:
 * Allows macro-level geography (Region/City), age bracket, gender,
 * occupation, education level, and primary language while strictly
 * blocking names, street addresses, national IDs, and contact info.
 */
export function sanitizeDemographics(demo: RespondentDemographics | null | undefined): Record<string, string> {
  if (!demo) {
    return {
      Region: "Unspecified",
      City: "Unspecified",
      "Age Bracket": "Unspecified",
      Gender: "Unspecified",
      Occupation: "Unspecified",
      "Education Level": "Unspecified",
      "Primary Language": "Unspecified",
    };
  }

  return {
    Region: demo.region?.trim() || "Unspecified",
    City: demo.city?.trim() || "Unspecified",
    "Age Bracket": getAgeBracket(demo.age),
    Gender: demo.gender?.trim() || "Unspecified",
    Occupation: demo.occupation?.trim() || "Unspecified",
    "Education Level": demo.education_level?.trim() || "Unspecified",
    "Primary Language": demo.primary_language?.trim() || "Unspecified",
  };
}

export interface ExportResponseItem {
  id: string;
  completed_at: string | null;
  total_time_seconds: number | null;
  fraud_flag: string | null;
  answers: Record<string, unknown>;
  demographics?: RespondentDemographics | null;
}

/**
 * Builds an anonymized CSV export string from survey metadata and response items.
 */
export function generateAnonymizedCsv(
  survey: { id: string; title: string; questions: Question[] },
  responses: ExportResponseItem[],
): string {
  const demographicKeys = [
    "Region",
    "City",
    "Age Bracket",
    "Gender",
    "Occupation",
    "Education Level",
    "Primary Language",
  ];

  const headers = [
    "Response ID",
    "Completed At",
    "Time (Seconds)",
    "Integrity Status",
    ...demographicKeys,
    ...survey.questions.map((q, i) => `Q${i + 1}: ${q.text.replace(/"/g, '""')}`),
  ];

  const rows = responses.map((resp, idx) => {
    // Generate a pseudonymized Response identifier (e.g. RESP-0001 or safe prefix)
    const pseudonym = `RESP-${String(idx + 1).padStart(4, "0")}-${resp.id.slice(0, 8)}`;
    const completedAt = resp.completed_at ? new Date(resp.completed_at).toISOString() : "";
    const timeSec = resp.total_time_seconds ?? 0;
    const status = resp.fraud_flag === "flagged" ? "Flagged" : "Clean";

    const sanitizedDemo = sanitizeDemographics(resp.demographics);
    const demoValues = demographicKeys.map((k) => `"${(sanitizedDemo[k] || "Unspecified").replace(/"/g, '""')}"`);

    const answersObj = resp.answers || {};
    const questionAnswers = survey.questions.map((q) => {
      const val = answersObj[q.id];
      let strVal = "";
      if (Array.isArray(val)) {
        strVal = val.join("; ");
      } else if (val != null) {
        strVal = String(val);
      }
      const redacted = redactPiiFromText(strVal);
      return `"${redacted.replace(/"/g, '""')}"`;
    });

    return [
      `"${pseudonym}"`,
      `"${completedAt}"`,
      timeSec,
      `"${status}"`,
      ...demoValues,
      ...questionAnswers,
    ].join(",");
  });

  return [`"${headers.join('","')}"`, ...rows].join("\n");
}

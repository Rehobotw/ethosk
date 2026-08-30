import { z } from "zod";
import {
  DEPOSIT_METHODS,
  DOC_TYPES,
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUSES,
  GENDERS,
  PRIMARY_LANGUAGES,
  QUESTION_TYPES,
  SURVEY_STATUSES,
  TARGET_LANGUAGES,
  USER_ROLES,
  VERIFICATION_TIERS,
} from "../types.js";

/**
 * One schema, two places it runs: these are imported by the React forms for
 * client-side validation and by the Express routes for request validation, so a
 * rule can never drift between the two.
 */

export const ETHIOPIAN_PHONE_REGEX = /^(?:\+251|0)9\d{8}$/;

export const phoneSchema = z
  .string()
  .trim()
  .regex(ETHIOPIAN_PHONE_REGEX, "Enter a valid Ethiopian mobile number (e.g. 0912345678)");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .email("Enter a valid email address (e.g. name@example.com)")
  .toLowerCase();

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  email: emailSchema,
  password: passwordSchema,
  /** Only respondent and researcher can self-register. Admin/super_admin are assigned. */
  role: z.enum(["respondent", "researcher"] as const).default("respondent"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
  role: z.enum(USER_ROLES).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().trim().min(4, "Enter the verification code").max(8),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendCodeSchema = z.object({
  email: emailSchema,
});
export type ResendCodeInput = z.infer<typeof resendCodeSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().trim().min(4, "Enter the 6-digit reset code").max(8),
  new_password: passwordSchema,
  confirm_password: z.string().min(1, "Please confirm your password").optional(),
}).refine((data) => !data.confirm_password || data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const deleteAccountRequestSchema = z.object({
  reason: z.string().trim().max(500).optional(),
  confirm_text: z.string().trim().optional(),
});
export type DeleteAccountRequestInput = z.infer<typeof deleteAccountRequestSchema>;

export const respondentProfileSchema = z.object({
  full_name: z.string().trim().min(2).max(160).nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  dob: z.string().nullable().optional(), // YYYY-MM-DD
  university: z.string().trim().min(2).max(160).nullable().optional(),
  department: z.string().trim().min(2).max(160).nullable().optional(),
  year: z
    .number({ invalid_type_error: "Year must be a number" })
    .int("Year must be a whole number")
    .min(1, "Year must be between 1 and 8")
    .max(8, "Year must be between 1 and 8")
    .nullable()
    .optional(),
  age: z
    .number({ invalid_type_error: "Age must be a number" })
    .int("Age must be a whole number")
    .min(15, "Age must be between 15 and 100")
    .max(100, "Age must be between 15 and 100")
    .nullable()
    .optional(),
  employer: z.string().trim().max(160).nullable().optional(),
  // General-population attributes. Every one is optional: a respondent who is not
  // a student still has a complete, matchable profile.
  gender: z.enum(GENDERS).nullable().optional(),
  region: z.string().trim().max(80).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  employment_status: z.enum(EMPLOYMENT_STATUSES).nullable().optional(),
  occupation: z.string().trim().max(120).nullable().optional(),
  education_level: z.enum(EDUCATION_LEVELS).nullable().optional(),
  primary_language: z.enum(PRIMARY_LANGUAGES).nullable().optional(),
  attributes: z.record(z.unknown()).default({}),
});
export type RespondentProfileInput = z.infer<typeof respondentProfileSchema>;

export const syncOAuthSchema = z.object({
  role: z.enum(USER_ROLES).optional(),
});

export const withdrawSchema = z.object({
  amount_etb: z.number().min(100, "Minimum payout is 100 ETB"),
  method: z.enum(["telebirr", "cbebirr"]),
  account_number: z.string().min(9, "Enter a valid mobile money account number"),
});

export const researcherProfileSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(1000, "Keep your bio under 1000 characters")
    .nullable()
    .optional(),
  institution: z.string().trim().max(160).nullable().optional(),
  dob: z.string().nullable().optional(), // YYYY-MM-DD
  phone: z.string().trim().nullable().optional(),
  institutional_email: z.string().trim().email().nullable().optional(),
  researcher_type: z.string().trim().nullable().optional(),
  years_experience: z.number().int().min(0).max(100).nullable().optional(),
  onboarding_completed: z.boolean().optional(),
  social_links: z.record(z.string()).default({}),
});
export type ResearcherProfileInput = z.infer<typeof researcherProfileSchema>;

export const questionSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(3, "A question needs at least a few words").max(500),
  type: z.enum(QUESTION_TYPES),
  options: z
    .array(z.string().trim().min(1, "This answer option is still blank").max(200))
    .max(12, "A question supports up to 12 answer options")
    .optional(),
  required: z.boolean().optional(),
  consistencyCheck: z.object({ duplicateOf: z.string().min(1) }).optional(),
});

export const surveySchema = z.object({
  title: z.string().trim().min(3, "Give the survey a title").max(200),
  /**
   * Shown to respondents under the title. Optional, because a short study does
   * not need one, but generous in length so a researcher can state the purpose,
   * who the study is for, and what taking part involves.
   */
  description: z
    .string()
    .trim()
    .max(2000, "Keep the description under 2000 characters")
    .nullable()
    .optional(),
  questions: z
    .array(questionSchema)
    .min(1, "Add at least one question")
    .max(30, "The MVP builder supports up to 30 questions"),
  reward_etb: z.number().min(0).max(10_000).nullable().optional(),
  research_category: z.string().nullable().optional(),
  compliance_required: z.boolean().nullable().optional(),
  compliance_rule_triggered: z.string().nullable().optional(),
  compliance_answer: z.boolean().nullable().optional(),
  compliance_document_path: z.string().nullable().optional(),
  status: z.enum(SURVEY_STATUSES).optional(),
  builder_type: z.enum(["manual", "import", "ai"]).nullable().optional(),
});
export type SurveyInput = z.infer<typeof surveySchema>;

export const finalDraftSchema = surveySchema.extend({
  title: z.string().trim().min(3, "Give the survey a title").max(200),
  questions: z
    .array(
      questionSchema.refine((q) => {
        if (q.type === "single_choice" || q.type === "multi_choice") {
          return Array.isArray(q.options) && q.options.length >= 2 && q.options.every((o) => o.trim().length > 0);
        }
        return true;
      }, "Choice questions must have at least 2 non-empty answer options"),
    )
    .min(1, "Add at least one question"),
  reward_etb: z.number({ required_error: "Set a reward amount per response" }).min(1, "Reward per response must be at least 1 ETB"),
});
export type FinalDraftInput = z.infer<typeof finalDraftSchema>;

export const improveQuestionSchema = z.object({
  question_id: z.string().min(1),
});

export const translateSchema = z.object({
  target_languages: z.array(z.enum(TARGET_LANGUAGES)).min(1),
});

/** Minimum tier a researcher may filter on — Tier 0 is deliberately excluded. */
export const minVerificationTierSchema = z.enum([
  "1_id_verified",
  "2_attribute_verified",
  "3_institution_attested",
]);

/**
 * Audience filters. The academic fields are one group among several — a study can
 * target by geography, gender, age, work, education, or language and never
 * mention a university at all.
 *
 * An omitted filter means "no constraint", so the default query reaches the whole
 * verified panel.
 */
export const matchFiltersSchema = z.object({
  // Who they are
  ageRange: z
    .tuple([z.number().int().min(15).max(100), z.number().int().min(15).max(100)])
    .optional(),
  gender: z.enum(GENDERS).optional(),
  primaryLanguage: z.enum(PRIMARY_LANGUAGES).optional(),

  // Where they are
  region: z.string().trim().min(1).max(80).optional(),
  city: z.string().trim().min(1).max(80).optional(),

  // Work and education
  employmentStatus: z.enum(EMPLOYMENT_STATUSES).optional(),
  occupation: z.string().trim().min(1).max(120).optional(),
  educationLevel: z.enum(EDUCATION_LEVELS).optional(),

  // Academic, for studies that are specifically about students
  university: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
  yearRange: z.tuple([z.number().int().min(1).max(8), z.number().int().min(1).max(8)]).optional(),

  minVerificationTier: minVerificationTierSchema.optional(),
}).passthrough();
export type MatchFiltersInput = z.infer<typeof matchFiltersSchema>;

export const matchRequestSchema = z.object({ filters: matchFiltersSchema });

export const sendRequestSchema = z.object({
  format: z.string().optional(),
  filters: z.record(z.unknown()).optional(),
  reward_etb: z.number().min(0).max(10_000).optional(),
  research_category: z.string().nullable().optional(),
  compliance_required: z.boolean().nullable().optional(),
  compliance_rule_triggered: z.string().nullable().optional(),
  compliance_answer: z.boolean().nullable().optional(),
  compliance_document_path: z.string().nullable().optional(),
});

/**
 * A researcher topping up their balance.
 *
 * `reference` is the transaction id from the payment provider. It is required and
 * unique per researcher, so confirming the same transfer twice credits once.
 */
export const depositSchema = z.object({
  amount_etb: z
    .number({ invalid_type_error: "Enter an amount" })
    .min(50, "The minimum deposit is 50 ETB")
    .max(1_000_000, "Contact us to deposit more than 1,000,000 ETB"),
  method: z.enum(DEPOSIT_METHODS),
  reference: z
    .string()
    .trim()
    .min(4, "Enter the transaction reference from your payment confirmation")
    .max(64),
  sender_detail: z.string().trim().max(50).optional(),
  idempotency_key: z.string().trim().max(128).optional(),
});
export type DepositInput = z.infer<typeof depositSchema>;

/**
 * Starting a telebirr checkout.
 *
 * No reference here: the order number is generated server-side, since a client
 * that chose its own could collide with, or overwrite, someone else's deposit.
 * Limits mirror `depositSchema` so the two funding routes cannot disagree about
 * what a permissible amount is.
 */
export const telebirrCheckoutSchema = depositSchema.pick({ amount_etb: true });
export type TelebirrCheckoutInput = z.infer<typeof telebirrCheckoutSchema>;

/** Client-reported typing telemetry for one free-text answer. */
export const textMetricsSchema = z.object({
  length: z.number().int().min(0).max(20_000),
  keystrokes: z.number().int().min(0).max(50_000),
  typingSeconds: z.number().min(0).max(86_400),
  pastes: z.number().int().min(0).max(1_000),
});

export const submitResponseSchema = z.object({
  answers: z.record(z.string()),
  time_per_question: z.record(z.number().min(0)),
  total_time_seconds: z.number().int().min(0),
  /** Keyed by question id; only present for free-text questions. */
  text_metrics: z.record(textMetricsSchema).default({}),
});
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

// ===========================================================================
// AI DRAFTING
// ===========================================================================
export const aiDraftRequestSchema = z.object({
  topic: z
    .string()
    .min(5, "Topic must be at least 5 characters.")
    .max(1000, "Topic must be less than 1000 characters."),
  description: z.string().max(2000).nullable().optional(),
  target_question_count: z.number().int().min(3).max(20).default(5).optional(),
});
export type AiDraftRequestInput = z.infer<typeof aiDraftRequestSchema>;

// ===========================================================================
// ANALYTICS
// ===========================================================================

/**
 * Fayda verification schema supporting both direct QR code payload (from fayda-decoder)
 * and manual/fallback 12-to-16 digit FIN/FAN.
 */
export const faydaVerifySchema = z
  .object({
    fayda_id: z
      .string()
      .trim()
      .transform((value) => value.replace(/[\s-]/g, ""))
      .refine((value) => value.length === 0 || /^\d{12,16}$/.test(value), {
        message: "Fayda ID number must be 12 to 16 digits",
      })
      .optional(),
    qr_payload: z.string().trim().optional(),
    full_name: z.string().trim().optional(),
    gender: z.enum(["M", "F", "Other"]).optional(),
    dob: z.string().trim().optional(),
    face_base64: z.string().optional(),
    signature_verified: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.fayda_id || data.qr_payload), {
    message: "Either a Fayda ID number or QR payload must be provided",
  });
export type FaydaVerifyInput = z.infer<typeof faydaVerifySchema>;

export const documentUploadSchema = z.object({
  doc_type: z.enum(DOC_TYPES),
});

export const institutionalDetailsSchema = z.object({
  institution_type: z.enum(["university", "corporate"]),
  institution_name: z.string().trim().min(2, "Institution name is required").max(160),
  department: z.string().trim().min(2, "Department or faculty is required").max(160),
  position_or_year: z.string().trim().min(1, "Academic year or position title is required").max(80),
});
export type InstitutionalDetailsInput = z.infer<typeof institutionalDetailsSchema>;

export const institutionalEmailOtpRequestSchema = z.object({
  email: emailSchema,
});
export type InstitutionalEmailOtpRequestInput = z.infer<typeof institutionalEmailOtpRequestSchema>;

export const institutionalEmailOtpConfirmSchema = z.object({
  email: emailSchema,
  code: z.string().trim().min(4, "Enter the verification code").max(8),
});
export type InstitutionalEmailOtpConfirmInput = z.infer<typeof institutionalEmailOtpConfirmSchema>;

export const chatTurnSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .max(60),
  language: z.enum(["en", "am", "om"]).optional().default("en"),
});

/** Schema for the JSON the document-check model is required to return (§7.3). */
export const documentCheckSchema = z.object({
  legible: z.boolean(),
  matches_claimed_type: z.boolean(),
  name_consistent: z.boolean(),
  notes: z.string().max(280),
});
export type DocumentCheck = z.infer<typeof documentCheckSchema>;

export const ACCEPTED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
] as const;

export const ACCEPTED_UPLOAD_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB (v4 §7.4 item 2, §5)

export function validateDocumentFile(file: { name?: string; size: number; type?: string }): {
  valid: boolean;
  error?: "UNSUPPORTED_FILE_TYPE" | "FILE_TOO_LARGE";
  message?: string;
} {
  const extension = file.name ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase() : "";
  const mimeType = file.type?.toLowerCase() ?? "";

  const isAcceptedMime = ACCEPTED_UPLOAD_MIME_TYPES.some((t) => t === mimeType);
  const isAcceptedExt = ACCEPTED_UPLOAD_EXTENSIONS.some((ext) => ext === extension);

  if (!isAcceptedMime && !isAcceptedExt) {
    return {
      valid: false,
      error: "UNSUPPORTED_FILE_TYPE",
      message: "Unsupported file type. Please upload a PDF, JPG, or PNG document.",
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      error: "FILE_TOO_LARGE",
      message: "File is too large. Maximum allowed size is 10MB.",
    };
  }

  return { valid: true };
}

export const VERIFICATION_TIER_VALUES = VERIFICATION_TIERS;

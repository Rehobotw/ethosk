/** Domain enums mirrored from the Postgres schema in supabase/migrations/0001_init.sql. */

export const USER_ROLES = ["respondent", "researcher", "admin", "super_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const VERIFICATION_TIERS = [
  "0_registered",
  "1_id_verified",
  "2_attribute_verified",
  "3_institution_attested",
] as const;
export type VerificationTier = (typeof VERIFICATION_TIERS)[number];

export const DOC_REVIEW_STATUSES = ["processing", "passed", "failed", "needs_review"] as const;
export type DocReviewStatus = (typeof DOC_REVIEW_STATUSES)[number];

/**
 * Binary by design: a response is either flagged as fraud or it is not. There is
 * no middle "needs review" state — an inconclusive signal is not fraud, so it
 * does not flag.
 */
export const FRAUD_FLAGS = ["clean", "flagged"] as const;
export type FraudFlag = (typeof FRAUD_FLAGS)[number];

export const SURVEY_STATUSES = ["draft", "final_draft", "active", "closed"] as const;
export type SurveyStatus = (typeof SURVEY_STATUSES)[number];

export const DOC_TYPES = ["student_id", "degree", "employer_id"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const QUESTION_TYPES = ["single_choice", "multi_choice", "text"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const TARGET_LANGUAGES = ["am", "om"] as const;
export type TargetLanguage = (typeof TARGET_LANGUAGES)[number];

// ---------------------------------------------------------------------------
// General-population attributes
//
// Targeting started out as university/department/year, which limited every study
// to a student panel. These attributes describe the wider public, so a study can
// reach traders, civil servants, farmers, or the unemployed without a university
// being part of the query.
// ---------------------------------------------------------------------------

export const GENDERS = ["female", "male", "other", "prefer_not_to_say"] as const;
export type Gender = (typeof GENDERS)[number];

export const EMPLOYMENT_STATUSES = [
  "student",
  "employed",
  "self_employed",
  "unemployed",
  "retired",
  "other",
] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const EDUCATION_LEVELS = [
  "none",
  "primary",
  "secondary",
  "tvet",
  "bachelors",
  "masters",
  "doctorate",
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const PRIMARY_LANGUAGES = [
  "amharic",
  "afan_oromo",
  "tigrinya",
  "somali",
  "afar",
  "sidama",
  "wolaytta",
  "english",
  "other",
] as const;
export type PrimaryLanguage = (typeof PRIMARY_LANGUAGES)[number];

/**
 * Ethiopia's regions and chartered cities, for geographic targeting.
 *
 * Stored as free text rather than an enum because the official list has changed
 * several times and a study should not break when it changes again.
 */
export const ETHIOPIAN_REGIONS = [
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul-Gumuz",
  "Central Ethiopia",
  "Dire Dawa",
  "Gambela",
  "Harari",
  "Oromia",
  "Sidama",
  "Somali",
  "South Ethiopia",
  "South West Ethiopia",
  "Tigray",
] as const;

export const GENDER_LABEL: Record<Gender, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

export const EMPLOYMENT_STATUS_LABEL: Record<EmploymentStatus, string> = {
  student: "Student",
  employed: "Employed",
  self_employed: "Self-employed",
  unemployed: "Unemployed",
  retired: "Retired",
  other: "Other",
};

export const EDUCATION_LEVEL_LABEL: Record<EducationLevel, string> = {
  none: "No formal schooling",
  primary: "Primary",
  secondary: "Secondary",
  tvet: "TVET / diploma",
  bachelors: "Bachelor's degree",
  masters: "Master's degree",
  doctorate: "Doctorate",
};

export const PRIMARY_LANGUAGE_LABEL: Record<PrimaryLanguage, string> = {
  amharic: "Amharic",
  afan_oromo: "Afan Oromo",
  tigrinya: "Tigrinya",
  somali: "Somali",
  afar: "Afar",
  sidama: "Sidama",
  wolaytta: "Wolaytta",
  english: "English",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const DEPOSIT_METHODS = ["telebirr", "cbe_birr", "bank_transfer"] as const;
export type DepositMethod = (typeof DEPOSIT_METHODS)[number];

export const DEPOSIT_METHOD_LABEL: Record<DepositMethod, string> = {
  telebirr: "Telebirr",
  cbe_birr: "CBE Birr",
  bank_transfer: "Bank transfer",
};

export const DEPOSIT_STATUSES = ["pending", "completed", "failed"] as const;
export type DepositStatus = (typeof DEPOSIT_STATUSES)[number];

export const DEPOSIT_STATUS_LABEL: Record<DepositStatus, string> = {
  pending: "Awaiting confirmation",
  completed: "Credited",
  failed: "Not completed",
};

/** Tier ordering, used for `min_verification_tier` comparisons. */
export const TIER_RANK: Record<VerificationTier, number> = {
  "0_registered": 0,
  "1_id_verified": 1,
  "2_attribute_verified": 2,
  "3_institution_attested": 3,
};

export const TIER_LABEL: Record<VerificationTier, string> = {
  "0_registered": "Tier 0: Registered",
  "1_id_verified": "Tier 1: ID Verified",
  "2_attribute_verified": "Tier 2: Attribute Verified",
  "3_institution_attested": "Tier 3: Institution Attested",
};

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  required?: boolean;
  /**
   * Marks an AI-rephrased duplicate of an earlier question, inserted at fill time
   * to check answer consistency. The pairing is re-derived server-side on
   * submission, so the client is never told which question it duplicates.
   */
  consistencyCheck?: {
    /** The `id` of the original question this rephrases. */
    duplicateOf: string;
  };
}

export interface SurveyRecord {
  id: string;
  researcher_id: string;
  title: string;
  /** Longer detail shown under the title: purpose, audience, what taking part involves. */
  description: string | null;
  questions: Question[];
  translations: Partial<Record<TargetLanguage, string[]>>;
  target_filters: unknown;
  status: SurveyStatus;
  reward_etb: number | null;
  /** Funds still committed to this survey's remaining responses. */
  escrow_etb: number;
  /** Legal & Ethical Compliance fields (REH-69) */
  compliance_required: boolean | null;
  compliance_document_url: string | null;
  compliance_attested_at: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface ResearcherProfileRecord {
  user_id: string;
  bio: string | null;
  dob: string | null;
  phone: string | null;
  phone_verified: boolean;
  institutional_email: string | null;
  institutional_email_verified: boolean;
  researcher_type: string | null;
  years_experience: number | null;
  onboarding_completed: boolean;
  institution: string | null;
  social_links: Record<string, string>;
  past_studies: Array<unknown>;
  rating: number | null;
  /** 
   * @deprecated Kept for backwards-compatibility; use `verification_level` instead.
   */
  verified: boolean;
  verification_level: import("./permissions.js").ResearcherVerificationLevel;
  verification_status: ResearcherVerificationStatus;
  verification_notes: string | null;
  subscription_tier: import("./permissions.js").SubscriptionTier;
  subscription_expires_at: string | null;
}

export interface RespondentProfileRecord {
  user_id: string;
  university: string | null;
  department: string | null;
  year: number | null;
  age: number | null;
  employer: string | null;
  gender: Gender | null;
  region: string | null;
  city: string | null;
  employment_status: EmploymentStatus | null;
  occupation: string | null;
  education_level: EducationLevel | null;
  primary_language: PrimaryLanguage | null;
  attributes: Record<string, unknown>;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Wallets
// ---------------------------------------------------------------------------

export interface ResearcherWallet {
  /** Everything ever deposited and confirmed. */
  deposited_etb: number;
  /** Committed to surveys that are still collecting responses. */
  reserved_etb: number;
  /** Already credited to respondents. */
  paid_etb: number;
  /** Platform fees paid (e.g. subscriptions). */
  fees_etb: number;
  /** What is left to fund a new study with. */
  available_etb: number;
}

export interface DepositRecord {
  id: string;
  amount_etb: number;
  method: DepositMethod;
  /** Our order number. Unique per researcher, so one payment credits once. */
  reference: string;
  status: DepositStatus;
  /** The gateway's own transaction number, once it has settled. */
  provider_ref?: string | null;
  created_at: string;
}

export interface RespondentWallet {
  available_etb: number;
  withdrawn_etb: number;
  lifetime_etb: number;
  paid_response_count: number;
}

export interface PayoutRecord {
  id: string;
  survey_id: string;
  amount_etb: number;
  status: "pending" | "available" | "withdrawn";
  created_at: string;
  survey_title: string | null;
}

export interface UserRecord {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  email_verified?: boolean;
  verification_tier: VerificationTier;
  /** Researcher-specific: whether their identity has been verified via Fayda. */
  researcher_verification_level?: import("./permissions.js").ResearcherVerificationLevel;
  /** Researcher-specific: approval queue status. */
  researcher_verification_status?: ResearcherVerificationStatus;
  /** Researcher-specific: free or subscribed. */
  subscription_tier?: import("./permissions.js").SubscriptionTier;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Researcher verification & subscription (re-exported from permissions for
// convenience, but the canonical definition lives in shared/permissions.ts)
// ---------------------------------------------------------------------------

export type ResearcherVerificationStatus = "unrequested" | "pending" | "approved" | "rejected";

export type { ResearcherVerificationLevel, SubscriptionTier } from "./permissions.js";

export interface SurveyResponseRecord {
  id: string;
  survey_id: string;
  respondent_id: string;
  answers: Record<string, string>;
  time_per_question: Record<string, number>;
  total_time_seconds: number;
  fraud_flag: FraudFlag;
  fraud_signals: FraudSignals | null;
  completed_at: string;
}

/**
 * Per-question typing telemetry for free-text answers, captured client-side.
 *
 * A long answer that arrives with no keystrokes was pasted; one that arrives at
 * an implausible characters-per-second rate was not typed by a person reading the
 * question.
 */
export interface TextMetrics {
  /** Final answer length in characters. */
  length: number;
  /** Keystrokes that produced visible input. */
  keystrokes: number;
  /** Seconds spent actively typing in the field. */
  typingSeconds: number;
  /** Number of paste events into the field. */
  pastes: number;
}

export interface FraudSignals {
  total_time_seconds: number;
  expected_min_seconds: number;
  straight_line_ratio: number;
  /**
   * `null` when the survey had too few questions for a consistency check to be
   * inserted, which is different from having failed one.
   */
  consistency_check_passed: boolean | null;
  /** Fastest sustained typing rate seen on any long free-text answer. */
  max_typing_chars_per_second: number | null;
  /** A long free-text answer arrived with no keystrokes behind it. */
  pasted_long_text: boolean;
  /** Names the checks that tripped, for the researcher-facing detail panel. */
  tripped: string[];
}

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    fields?: string[];
  };
}

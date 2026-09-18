import { ApiError } from "./http.js";

interface ConstraintMapping {
  field: string;
  message: string;
}

/**
 * Predefined mappings for specific database constraints across Ethosk tables.
 */
const KNOWN_CONSTRAINTS: Record<string, ConstraintMapping> = {
  // Respondent profiles
  respondent_profiles_age_check: {
    field: "age",
    message: "Age must be between 15 and 100.",
  },
  respondent_profiles_year_check: {
    field: "year",
    message: "Year of study must be between 1 and 8.",
  },
  respondent_profiles_gender_check: {
    field: "gender",
    message: "Please select a valid gender option.",
  },
  respondent_gender_valid: {
    field: "gender",
    message: "Please select a valid gender option.",
  },
  respondent_profiles_employment_status_check: {
    field: "employment_status",
    message: "Please select a valid employment status.",
  },
  respondent_employment_status_valid: {
    field: "employment_status",
    message: "Please select a valid employment status.",
  },
  respondent_profiles_education_level_check: {
    field: "education_level",
    message: "Please select a valid education level.",
  },
  respondent_education_level_valid: {
    field: "education_level",
    message: "Please select a valid education level.",
  },
  respondent_profiles_primary_language_check: {
    field: "primary_language",
    message: "Please select a valid primary language.",
  },
  respondent_primary_language_valid: {
    field: "primary_language",
    message: "Please select a valid primary language.",
  },

  // Users
  users_email_check: {
    field: "email",
    message: "Please enter a valid email address.",
  },
  users_email_key: {
    field: "email",
    message: "An account with this email address already exists.",
  },
  users_email_unique_idx: {
    field: "email",
    message: "An account with this email address already exists.",
  },
  idx_users_national_id_hash: {
    field: "national_id",
    message: "This national ID has already been registered.",
  },

  // Documents
  documents_doc_type_check: {
    field: "doc_type",
    message: "Document type must be student ID, degree, or employer ID.",
  },

  // Researcher profiles
  researcher_profiles_rating_check: {
    field: "rating",
    message: "Rating must be between 0 and 5.",
  },
  researcher_profiles_verification_level_check: {
    field: "verification_level",
    message: "Invalid researcher verification level.",
  },
  researcher_profiles_subscription_tier_check: {
    field: "subscription_tier",
    message: "Invalid subscription tier.",
  },

  // Withdrawals & Deposits
  respondent_withdrawals_amount_etb_check: {
    field: "amount_etb",
    message: "Withdrawal amount must be at least 100 ETB.",
  },
  withdrawals_amount_etb_check: {
    field: "amount_etb",
    message: "Withdrawal amount must be at least 100 ETB.",
  },
  researcher_deposits_amount_etb_check: {
    field: "amount_etb",
    message: "Deposit amount must be greater than zero.",
  },
  deposits_amount_etb_check: {
    field: "amount_etb",
    message: "Deposit amount must be greater than zero.",
  },

  // Surveys & Responses
  surveys_escrow_etb_check: {
    field: "escrow_etb",
    message: "Survey escrow budget must be zero or positive.",
  },
  surveys_total_time_seconds_check: {
    field: "total_time_seconds",
    message: "Survey completion time must be greater than zero.",
  },
  responses_total_time_seconds_check: {
    field: "total_time_seconds",
    message: "Response completion time must be greater than zero.",
  },
};

/**
 * Converts a database snake_case identifier to a readable label.
 * e.g. "employment_status" -> "Employment status"
 */
export function formatFieldLabel(fieldName: string): string {
  if (!fieldName) return "Field";
  const cleaned = fieldName.replace(/_/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Extracts raw error details from an unknown error object.
 */
function extractErrorDetails(error: unknown): {
  code?: string;
  message: string;
  details?: string;
  constraint?: string;
} {
  if (!error) return { message: "" };

  if (typeof error === "string") return { message: error };

  const errObj = error as Record<string, unknown>;
  const message = typeof errObj.message === "string" ? errObj.message : "";
  const code = typeof errObj.code === "string" ? errObj.code : undefined;
  const details = typeof errObj.details === "string" ? errObj.details : (typeof errObj.detail === "string" ? errObj.detail : undefined);
  const constraint = typeof errObj.constraint === "string" ? errObj.constraint : undefined;

  return { code, message, details, constraint };
}

/**
 * Maps PostgreSQL constraint errors to a friendly ApiError.
 * Returns `null` if the error does not represent a PostgreSQL constraint violation.
 */
export function mapPostgresError(error: unknown): ApiError | null {
  const { code, message, details, constraint } = extractErrorDetails(error);
  if (!message && !code) return null;

  const fullText = `${message} ${details || ""} ${constraint || ""}`;

  // 1. Check Constraint Violation (SQLSTATE 23514 or message pattern)
  const checkMatch =
    fullText.match(/violates check constraint "([^"]+)"/i) ||
    fullText.match(/check constraint "([^"]+)" .* is violated/i);

  const matchedConstraint = constraint || (checkMatch ? checkMatch[1] : undefined);

  if (matchedConstraint && (code === "23514" || checkMatch)) {
    if (KNOWN_CONSTRAINTS[matchedConstraint]) {
      const { field, message: friendlyMsg } = KNOWN_CONSTRAINTS[matchedConstraint];
      return new ApiError(400, "CONSTRAINT_VIOLATION", friendlyMsg, [field]);
    }

    // Dynamic extraction: e.g. "respondent_profiles_age_check" -> "age"
    const cleaned = matchedConstraint
      .replace(/^([a-z_]+_)?profiles_/, "")
      .replace(/^([a-z_]+_)?users_/, "")
      .replace(/^([a-z_]+_)?surveys_/, "")
      .replace(/^([a-z_]+_)?responses_/, "")
      .replace(/_check$/, "")
      .replace(/_valid$/, "");

    const label = formatFieldLabel(cleaned);
    return new ApiError(400, "CONSTRAINT_VIOLATION", `The value provided for ${label.toLowerCase()} is invalid.`, [cleaned]);
  }

  // 2. Not-Null Constraint Violation (SQLSTATE 23502 or message pattern)
  const notNullMatch =
    fullText.match(/null value in column "([^"]+)" (?:of relation "([^"]+)" )?violates not-null constraint/i) ||
    fullText.match(/column "([^"]+)" of relation "([^"]+)" violates not-null constraint/i);

  if (code === "23502" || notNullMatch) {
    const column = (notNullMatch && notNullMatch[1]) ? notNullMatch[1] : "field";
    const label = formatFieldLabel(column);
    return new ApiError(400, "VALIDATION_ERROR", `${label} is required.`, [column]);
  }

  // 3. Unique Constraint Violation (SQLSTATE 23505 or message pattern)
  const uniqueMatch =
    fullText.match(/duplicate key value violates unique constraint "([^"]+)"/i) ||
    fullText.match(/unique constraint "([^"]+)"/i);

  if (code === "23505" || uniqueMatch) {
    const constraintName = constraint || (uniqueMatch && uniqueMatch[1] ? uniqueMatch[1] : "");
    if (constraintName && KNOWN_CONSTRAINTS[constraintName]) {
      const { field, message: friendlyMsg } = KNOWN_CONSTRAINTS[constraintName];
      return new ApiError(400, "DUPLICATE_RESOURCE", friendlyMsg, [field]);
    }

    // Extract column from details like: Key (email)=(test@example.com) already exists.
    const keyMatch = fullText.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/i);
    const column = (keyMatch && keyMatch[1]) ? keyMatch[1] : "value";
    const label = formatFieldLabel(column);

    if (column.toLowerCase() === "email") {
      return new ApiError(400, "DUPLICATE_RESOURCE", "An account with this email address already exists.", ["email"]);
    }
    return new ApiError(400, "DUPLICATE_RESOURCE", `A record with this ${label.toLowerCase()} already exists.`, [column]);
  }

  // 4. Foreign Key Constraint Violation (SQLSTATE 23503 or message pattern)
  const fkMatch = fullText.match(/violates foreign key constraint "([^"]+)"/i);
  if (code === "23503" || fkMatch) {
    const keyMatch = fullText.match(/Key \(([^)]+)\)=\(([^)]+)\) is not present in table/i);
    const column = (keyMatch && keyMatch[1]) ? keyMatch[1] : "reference";
    const label = formatFieldLabel(column);
    return new ApiError(400, "INVALID_REFERENCE", `The selected ${label.toLowerCase()} does not exist.`, [column]);
  }

  // 5. String Data Truncation (SQLSTATE 22001)
  if (code === "22001" || fullText.includes("value too long for type")) {
    const lenMatch = fullText.match(/character varying\((\d+)\)/i);
    const limit = lenMatch ? ` (maximum ${lenMatch[1]} characters)` : "";
    return new ApiError(400, "VALIDATION_ERROR", `Provided text is too long${limit}.`);
  }

  // 6. Invalid Input Syntax / Type Mismatch (SQLSTATE 22P02)
  if (code === "22P02" || fullText.includes("invalid input syntax for type")) {
    const typeMatch = fullText.match(/invalid input syntax for type ([^:]+):/i);
    const typeName = typeMatch ? typeMatch[1] : "data";
    return new ApiError(400, "VALIDATION_ERROR", `Invalid input format. Expected a valid ${typeName}.`);
  }

  return null;
}

/**
 * Converts any unknown error into an ApiError.
 * If the error represents a database constraint violation, it is converted into a friendly 400 ApiError.
 */
export function toApiError(
  error: unknown,
  fallbackCode = "OPERATION_FAILED",
  fallbackMessage = "Something went wrong on our side.",
): ApiError {
  if (error instanceof ApiError) {
    // Even if it was wrapped in an ApiError (e.g. throw new ApiError(500, "...", error.message)),
    // check if the message itself is a Postgres constraint violation:
    const mapped = mapPostgresError(error.message);
    if (mapped) return mapped;
    return error;
  }

  const mapped = mapPostgresError(error);
  if (mapped) return mapped;

  if (error instanceof Error) {
    return new ApiError(500, fallbackCode, error.message || fallbackMessage);
  }

  return new ApiError(500, fallbackCode, fallbackMessage);
}

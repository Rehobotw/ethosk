import { describe, it, expect } from "vitest";
import { mapPostgresError } from "../lib/dbErrors.js";

describe("mapPostgresError", () => {
  // ── Check constraints ────────────────────────────────────────────────────

  it("maps respondent_profiles_age_check to field 'age' with a friendly message", () => {
    const err = {
      code: "23514",
      message: 'new row for relation "respondent_profiles" violates check constraint "respondent_profiles_age_check"',
      constraint: "respondent_profiles_age_check",
    };
    const result = mapPostgresError(err);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(400);
    expect(result!.code).toBe("CONSTRAINT_VIOLATION");
    expect(result!.message).toBe("Age must be between 15 and 100.");
    expect(result!.fields).toContain("age");
  });

  it("maps respondent_profiles_year_check to field 'year'", () => {
    const err = {
      code: "23514",
      message: 'new row violates check constraint "respondent_profiles_year_check"',
      constraint: "respondent_profiles_year_check",
    };
    const result = mapPostgresError(err);
    expect(result).not.toBeNull();
    expect(result!.message).toBe("Year of study must be between 1 and 8.");
    expect(result!.fields).toContain("year");
  });

  it("maps respondent_gender_valid to field 'gender'", () => {
    const err = {
      code: "23514",
      message: 'violates check constraint "respondent_gender_valid"',
      constraint: "respondent_gender_valid",
    };
    const result = mapPostgresError(err);
    expect(result).not.toBeNull();
    expect(result!.message).toBe("Please select a valid gender option.");
    expect(result!.fields).toContain("gender");
  });

  it("maps respondent_employment_status_valid to field 'employment_status'", () => {
    const err = {
      code: "23514",
      message: 'violates check constraint "respondent_employment_status_valid"',
      constraint: "respondent_employment_status_valid",
    };
    const result = mapPostgresError(err);
    expect(result).not.toBeNull();
    expect(result!.fields).toContain("employment_status");
  });

  it("maps respondent_education_level_valid to field 'education_level'", () => {
    const err = {
      code: "23514",
      message: 'violates check constraint "respondent_education_level_valid"',
      constraint: "respondent_education_level_valid",
    };
    const result = mapPostgresError(err);
    expect(result).not.toBeNull();
    expect(result!.fields).toContain("education_level");
  });

  it("dynamically extracts field from an unknown check constraint", () => {
    const err = {
      code: "23514",
      message: 'violates check constraint "respondent_profiles_custom_field_check"',
      constraint: "respondent_profiles_custom_field_check",
    };
    const result = mapPostgresError(err);
    expect(result).not.toBeNull();
    expect(result!.code).toBe("CONSTRAINT_VIOLATION");
    expect(result!.fields).toContain("custom_field");
  });

  // ── Not-null constraints ─────────────────────────────────────────────────

  it("maps a not-null constraint violation to the column name", () => {
    const err = {
      code: "23502",
      message: 'null value in column "user_id" of relation "respondent_profiles" violates not-null constraint',
    };
    const result = mapPostgresError(err);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(400);
    expect(result!.code).toBe("VALIDATION_ERROR");
    expect(result!.message).toBe("User id is required.");
    expect(result!.fields).toContain("user_id");
  });

  // ── Unique constraints ───────────────────────────────────────────────────

  it("maps email unique constraint to 'email' field with known message", () => {
    const err = {
      code: "23505",
      message: 'duplicate key value violates unique constraint "users_email_unique_idx"',
      detail: "Key (email)=(test@example.com) already exists.",
      constraint: "users_email_unique_idx",
    };
    const result = mapPostgresError(err);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(400);
    expect(result!.code).toBe("DUPLICATE_RESOURCE");
    expect(result!.fields).toContain("email");
    expect(result!.message).toBe("An account with this email address already exists.");
  });

  it("maps a generic unique violation and extracts column from detail", () => {
    const err = {
      code: "23505",
      message: 'duplicate key value violates unique constraint "some_unique_idx"',
      detail: "Key (phone)=(+251912345678) already exists.",
    };
    const result = mapPostgresError(err);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(400);
    expect(result!.code).toBe("DUPLICATE_RESOURCE");
    expect(result!.fields).toContain("phone");
  });

  // ── Foreign key constraints ──────────────────────────────────────────────

  it("maps a foreign key violation to INVALID_REFERENCE", () => {
    const err = {
      code: "23503",
      message: 'insert or update on table "documents" violates foreign key constraint "documents_user_id_fkey"',
      detail: "Key (user_id)=(non-existent-uuid) is not present in table \"users\".",
    };
    const result = mapPostgresError(err);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(400);
    expect(result!.fields).toContain("user_id");
    expect(result!.message).toContain("user id");
  });

  // ── String too long ──────────────────────────────────────────────────────

  it("maps value too long error to VALIDATION_ERROR", () => {
    const err = {
      code: "22001",
      message: "value too long for type character varying(80)",
    };
    const result = mapPostgresError(err);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(400);
    expect(result!.code).toBe("VALIDATION_ERROR");
    expect(result!.message).toContain("too long");
    expect(result!.message).toContain("80");
  });

  // ── Invalid syntax ───────────────────────────────────────────────────────

  it("maps invalid input syntax to VALIDATION_ERROR", () => {
    const err = {
      code: "22P02",
      message: "invalid input syntax for type integer: \"abc\"",
    };
    const result = mapPostgresError(err);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(400);
    expect(result!.code).toBe("VALIDATION_ERROR");
    expect(result!.message).toContain("integer");
  });

  // ── Non-postgres errors ──────────────────────────────────────────────────

  it("returns null for non-postgres errors", () => {
    expect(mapPostgresError(new Error("just a regular error"))).toBeNull();
    expect(mapPostgresError({ message: "network timeout" })).toBeNull();
    expect(mapPostgresError(null)).toBeNull();
    expect(mapPostgresError(undefined)).toBeNull();
  });

  it("returns null for an empty object", () => {
    expect(mapPostgresError({})).toBeNull();
  });
});

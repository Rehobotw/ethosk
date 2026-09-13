import { describe, expect, it } from "vitest";

// REH-133: Unit tests for researcher profile field validation logic.
// Mirrors the validateProfileFields() logic added to ResearcherProfilePage.

interface ProfileFields {
  bio: string;
  institution: string;
  institutionalEmail: string;
  phone: string;
  dob: string;
  yearsExperience: number | "";
}

function validateProfileFields(f: ProfileFields): Record<string, string> {
  const errors: Record<string, string> = {};

  if (f.bio.trim().length > 1000) {
    errors.bio = `Bio is too long (${f.bio.trim().length}/1000 characters)`;
  }

  if (f.institution.trim().length > 160) {
    errors.institution = `Institution name is too long (${f.institution.trim().length}/160 characters)`;
  }

  if (f.institutionalEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.institutionalEmail.trim())) {
    errors.institutional_email = "Please enter a valid email address";
  }

  if (f.phone.trim() && f.phone.trim().length < 7) {
    errors.phone = "Phone number seems too short";
  }

  if (f.dob) {
    const dobDate = new Date(f.dob);
    const today = new Date();
    const age = today.getFullYear() - dobDate.getFullYear();
    if (isNaN(dobDate.getTime())) {
      errors.dob = "Please enter a valid date";
    } else if (age < 18 || age > 100) {
      errors.dob = "You must be between 18 and 100 years old";
    }
  }

  const yearsNum = typeof f.yearsExperience === "number" ? f.yearsExperience : null;
  if (yearsNum !== null && (yearsNum < 0 || yearsNum > 100)) {
    errors.years_experience = "Years of experience must be between 0 and 100";
  }

  return errors;
}

const validBase: ProfileFields = {
  bio: "Research into Ethiopian agricultural markets.",
  institution: "Addis Ababa University",
  institutionalEmail: "researcher@aau.edu.et",
  phone: "+251911234567",
  dob: "1990-01-15",
  yearsExperience: 5,
};

describe("ResearcherProfilePage – client-side validation (REH-133)", () => {
  it("passes with all valid fields", () => {
    const errs = validateProfileFields(validBase);
    expect(Object.keys(errs)).toHaveLength(0);
  });

  it("rejects bio over 1000 characters", () => {
    const errs = validateProfileFields({ ...validBase, bio: "a".repeat(1001) });
    expect(errs.bio).toContain("too long");
  });

  it("accepts bio exactly at 1000 characters", () => {
    const errs = validateProfileFields({ ...validBase, bio: "a".repeat(1000) });
    expect(errs.bio).toBeUndefined();
  });

  it("rejects institution over 160 characters", () => {
    const errs = validateProfileFields({ ...validBase, institution: "x".repeat(161) });
    expect(errs.institution).toContain("too long");
  });

  it("rejects invalid institutional_email", () => {
    const errs = validateProfileFields({ ...validBase, institutionalEmail: "not-an-email" });
    expect(errs.institutional_email).toContain("valid email");
  });

  it("accepts empty institutional_email (field is optional)", () => {
    const errs = validateProfileFields({ ...validBase, institutionalEmail: "" });
    expect(errs.institutional_email).toBeUndefined();
  });

  it("rejects phone shorter than 7 digits", () => {
    const errs = validateProfileFields({ ...validBase, phone: "12345" });
    expect(errs.phone).toContain("too short");
  });

  it("accepts empty phone (field is optional)", () => {
    const errs = validateProfileFields({ ...validBase, phone: "" });
    expect(errs.phone).toBeUndefined();
  });

  it("rejects years_experience > 100", () => {
    const errs = validateProfileFields({ ...validBase, yearsExperience: 101 });
    expect(errs.years_experience).toContain("between 0 and 100");
  });

  it("accepts years_experience as empty string (optional)", () => {
    const errs = validateProfileFields({ ...validBase, yearsExperience: "" });
    expect(errs.years_experience).toBeUndefined();
  });

  it("collects multiple errors simultaneously", () => {
    const errs = validateProfileFields({
      ...validBase,
      bio: "b".repeat(1001),
      institutionalEmail: "bad-email",
    });
    expect(Object.keys(errs).length).toBeGreaterThanOrEqual(2);
    expect(errs.bio).toBeTruthy();
    expect(errs.institutional_email).toBeTruthy();
  });
});

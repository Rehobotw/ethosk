import { describe, expect, it } from "vitest";
import { normalizeMatchFilters } from "./surveys.js";

describe("normalizeMatchFilters", () => {
  it("defaults minVerificationTier to 1_id_verified when omitted", () => {
    const normalized = normalizeMatchFilters(undefined);
    expect(normalized.minVerificationTier).toBe("1_id_verified");
  });

  it("preserves specified minVerificationTier or min_verification_tier", () => {
    const n1 = normalizeMatchFilters({ minVerificationTier: "2_attribute_verified" });
    expect(n1.minVerificationTier).toBe("2_attribute_verified");

    const n2 = normalizeMatchFilters({ min_verification_tier: "3_institution_attested" });
    expect(n2.minVerificationTier).toBe("3_institution_attested");
  });

  it("maps age_min and age_max from UI into ageRange tuple", () => {
    const normalized = normalizeMatchFilters({
      age_min: 21,
      age_max: 45,
    });
    expect(normalized.ageRange).toEqual([21, 45]);
  });

  it("maps age_min alone to [age_min, 100] and age_max alone to [15, age_max]", () => {
    const n1 = normalizeMatchFilters({ age_min: 25 });
    expect(n1.ageRange).toEqual([25, 100]);

    const n2 = normalizeMatchFilters({ age_max: 60 });
    expect(n2.ageRange).toEqual([15, 60]);
  });

  it("preserves standard ageRange tuple if provided directly", () => {
    const normalized = normalizeMatchFilters({ ageRange: [18, 30] });
    expect(normalized.ageRange).toEqual([18, 30]);
  });

  it("maps education and education_level to educationLevel", () => {
    const n1 = normalizeMatchFilters({ education: "bachelors" });
    expect(n1.educationLevel).toBe("bachelors");

    const n2 = normalizeMatchFilters({ education_level: "masters" });
    expect(n2.educationLevel).toBe("masters");

    const n3 = normalizeMatchFilters({ educationLevel: "phd" });
    expect(n3.educationLevel).toBe("phd");
  });

  it("maps regions array and region string correctly", () => {
    const n1 = normalizeMatchFilters({ regions: ["Addis Ababa", "Oromia"] });
    expect(n1.regions).toEqual(["Addis Ababa", "Oromia"]);

    const n2 = normalizeMatchFilters({ region: "Dire Dawa" });
    expect(n2.region).toBe("Dire Dawa");
  });

  it("maps employment_status to employmentStatus", () => {
    const n1 = normalizeMatchFilters({ employment_status: "employed" });
    expect(n1.employmentStatus).toBe("employed");

    const n2 = normalizeMatchFilters({ employmentStatus: "student" });
    expect(n2.employmentStatus).toBe("student");
  });

  it("maps primary_language to primaryLanguage", () => {
    const n1 = normalizeMatchFilters({ primary_language: "amharic" });
    expect(n1.primaryLanguage).toBe("amharic");

    const n2 = normalizeMatchFilters({ primaryLanguage: "english" });
    expect(n2.primaryLanguage).toBe("english");
  });

  it("filters out any, __any, and all placeholder values from UI dropdowns", () => {
    const normalized = normalizeMatchFilters({
      gender: "any",
      education: "__any",
      employment_status: "all",
      region: "any",
      primary_language: "__any",
    });

    expect(normalized.gender).toBeUndefined();
    expect(normalized.educationLevel).toBeUndefined();
    expect(normalized.employmentStatus).toBeUndefined();
    expect(normalized.region).toBeUndefined();
    expect(normalized.primaryLanguage).toBeUndefined();
  });
});

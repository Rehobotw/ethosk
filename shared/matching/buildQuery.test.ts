import { describe, expect, it } from "vitest";
import {
  buildMatchCountQuery,
  buildMatchQuery,
  buildSupabaseMatchFilters,
  describeFilters,
  meetsMinimumTier,
  type MatchFilters,
} from "./buildQuery.js";

const base: MatchFilters = { minVerificationTier: "2_attribute_verified" };

describe("buildMatchQuery", () => {
  it("always queries the restricted view, never respondent_profiles", () => {
    const { sql } = buildMatchQuery(base);
    expect(sql).toContain("from respondent_match_view");
    expect(sql).not.toContain("respondent_profiles");
  });

  it("always constrains on the minimum tier even with no other filters", () => {
    const { sql, params } = buildMatchQuery(base);
    expect(sql).toBe("select user_id from respondent_match_view where tier_rank >= $1");
    expect(params).toEqual([2]);
  });

  it("binds every filter value as a placeholder rather than interpolating it", () => {
    const { sql, params } = buildMatchQuery({
      ...base,
      university: "Hawassa University",
      department: "Sociology",
      yearRange: [3, 4],
      ageRange: [18, 30],
    });

    expect(sql).toBe(
      "select user_id from respondent_match_view where tier_rank >= $1 and university = $2 " +
        "and department = $3 and age between $4 and $5 and year between $6 and $7",
    );
    expect(params).toEqual([2, "Hawassa University", "Sociology", 18, 30, 3, 4]);
  });

  it("targets a non-student audience without any academic filter", () => {
    const { sql, params } = buildMatchQuery({
      ...base,
      region: "Dire Dawa",
      employmentStatus: "self_employed",
      gender: "female",
      ageRange: [25, 45],
    });

    expect(sql).not.toContain("university");
    expect(sql).not.toContain("department");
    expect(sql).not.toContain("year between");
    expect(sql).toContain("gender = $2");
    expect(sql).toContain("region = $3");
    expect(sql).toContain("employment_status = $4");
    expect(params).toEqual([2, "female", "Dire Dawa", "self_employed", 25, 45]);
  });

  it("maps each general-population filter to its own column", () => {
    const { sql } = buildMatchQuery({
      ...base,
      primaryLanguage: "afan_oromo",
      city: "Adama",
      occupation: "Teacher",
      educationLevel: "bachelors",
    });

    expect(sql).toContain("primary_language = ");
    expect(sql).toContain("city = ");
    expect(sql).toContain("occupation = ");
    expect(sql).toContain("education_level = ");
  });

  it("does not let a quoted filter value break out into the SQL string", () => {
    const { sql, params } = buildMatchQuery({
      ...base,
      university: "'; drop table users; --",
    });

    expect(sql).not.toContain("drop table");
    expect(params).toContain("'; drop table users; --");
  });

  it("normalizes a backwards range", () => {
    const { params } = buildMatchQuery({ ...base, yearRange: [4, 2] });
    expect(params).toEqual([2, 2, 4]);
  });

  it("produces a count query with the same predicate and params", () => {
    const filters: MatchFilters = { ...base, department: "Sociology" };
    const rows = buildMatchQuery(filters);
    const count = buildMatchCountQuery(filters);

    expect(count.sql).toContain("select count(*)::int as matched_count from respondent_match_view");
    expect(count.params).toEqual(rows.params);
  });
});

describe("buildSupabaseMatchFilters", () => {
  it("mirrors the SQL predicate as builder operations", () => {
    expect(
      buildSupabaseMatchFilters({
        minVerificationTier: "1_id_verified",
        department: "Economics",
        yearRange: [1, 2],
      }),
    ).toEqual([
      { column: "tier_rank", op: "gte", value: 1 },
      { column: "department", op: "eq", value: "Economics" },
      { column: "year", op: "gte", value: 1 },
      { column: "year", op: "lte", value: 2 },
    ]);
  });

  it("mirrors the general-population filters too", () => {
    expect(
      buildSupabaseMatchFilters({
        minVerificationTier: "1_id_verified",
        region: "Amhara",
        employmentStatus: "unemployed",
        ageRange: [30, 40],
      }),
    ).toEqual([
      { column: "tier_rank", op: "gte", value: 1 },
      { column: "region", op: "eq", value: "Amhara" },
      { column: "employment_status", op: "eq", value: "unemployed" },
      { column: "age", op: "gte", value: 30 },
      { column: "age", op: "lte", value: 40 },
    ]);
  });

  it("stays in step with the SQL builder on which filters are applied", () => {
    const filters: MatchFilters = {
      minVerificationTier: "2_attribute_verified",
      gender: "male",
      region: "Oromia",
      university: "Jimma University",
      ageRange: [20, 29],
    };

    // Same values, both forms: the builder ops carry every bound SQL parameter.
    const { params } = buildMatchQuery(filters);
    const ops = buildSupabaseMatchFilters(filters);
    expect(ops.map((op) => op.value)).toEqual(params);
  });
});

describe("describeFilters", () => {
  it("summarizes an audience for display", () => {
    expect(
      describeFilters({
        minVerificationTier: "2_attribute_verified",
        region: "Addis Ababa",
        employmentStatus: "self_employed",
        ageRange: [25, 45],
      }),
    ).toEqual(["Age 25–45", "Addis Ababa", "self employed"]);
  });

  it("collapses a single-value range", () => {
    expect(
      describeFilters({ minVerificationTier: "1_id_verified", yearRange: [3, 3] }),
    ).toEqual(["Year 3"]);
  });

  it("returns nothing to show for an unfiltered panel-wide audience", () => {
    expect(describeFilters({ minVerificationTier: "1_id_verified" })).toEqual([]);
  });
});

describe("meetsMinimumTier", () => {
  it("compares tiers by rank, not string order", () => {
    expect(meetsMinimumTier("3_institution_attested", "2_attribute_verified")).toBe(true);
    expect(meetsMinimumTier("2_attribute_verified", "2_attribute_verified")).toBe(true);
    expect(meetsMinimumTier("1_id_verified", "2_attribute_verified")).toBe(false);
    expect(meetsMinimumTier("0_registered", "1_id_verified")).toBe(false);
  });
});
